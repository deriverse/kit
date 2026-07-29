import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Address, AccountRole } from '@solana/kit';
import {
  CachedSpotAccountMetas,
  SpotInstructionContext,
  buildNewSpotOrderInstruction,
  buildNewSpotOrderInstructionUnchecked,
  buildSpotLpInstruction,
  buildSpotQuotesReplaceInstructionUnchecked,
  buildSpotQuotesReplaceInstructionV2Unchecked,
  buildSpotOrderCancelInstruction,
  buildSpotOrderCancelInstructionUnchecked,
  buildSpotMassCancelInstruction,
  buildSpotMassCancelInstructionUnchecked,
} from './spot-instructions';
import { TokenStateModel, InstrAccountHeaderModel } from '../structure_models';
import {
  Instrument,
  NewSpotOrderArgs,
  SpotLpArgs,
  SpotQuotesReplaceArgs,
  SpotQuotesReplaceV2Args,
  SpotOrderCancelArgs,
  SpotMassCancelArgs,
} from '../types';

vi.mock('./account-helpers', () => ({
  getAccountByTag: vi.fn().mockResolvedValue('MockAccountByTag11111111111111' as Address),
  getInstrAccountByTag: vi.fn().mockResolvedValue('MockInstrAccount1111111111111' as Address),
  getTokenAccount: vi.fn().mockResolvedValue('MockTokenAccount111111111111111' as Address),
  getTokenId: vi.fn().mockResolvedValue(1),
  getInstrId: vi.fn().mockResolvedValue(1),
  findClientPrimaryAccount: vi.fn().mockResolvedValue('MockClientPrimary11111111111' as Address),
  findClientCommunityAccount: vi.fn().mockResolvedValue('MockClientCommunity111111111' as Address),
  requireClientPrimaryAccount: (ctx: any) => {
    if (ctx.clientPrimaryAccount === null) throw new Error('Client primary account not found');
    return ctx.clientPrimaryAccount;
  },
  requireClientCommunityAccount: (ctx: any) => {
    if (ctx.clientCommunityAccount === null) throw new Error('Client community account not found');
    return ctx.clientCommunityAccount;
  },
}));

vi.mock('./context-builders', () => ({
  getSpotContext: vi.fn().mockResolvedValue([
    { address: 'SpotCtx1111111111111111111111111' as Address, role: AccountRole.WRITABLE },
    { address: 'SpotCtx2222222222222222222222222' as Address, role: AccountRole.WRITABLE },
    { address: 'SpotCtx3333333333333333333333333' as Address, role: AccountRole.WRITABLE },
    { address: 'SpotCtx4444444444444444444444444' as Address, role: AccountRole.WRITABLE },
    { address: 'SpotCtx5555555555555555555555555' as Address, role: AccountRole.WRITABLE },
    { address: 'SpotCtx6666666666666666666666666' as Address, role: AccountRole.WRITABLE },
    { address: 'SpotCtx7777777777777777777777777' as Address, role: AccountRole.WRITABLE },
    { address: 'SpotCtx8888888888888888888888888' as Address, role: AccountRole.WRITABLE },
    { address: 'SpotCtx9999999999999999999999999' as Address, role: AccountRole.WRITABLE },
  ]),
  getSpotOneSidedContext: vi.fn().mockResolvedValue([
    { address: 'OneSided111111111111111111111111' as Address, role: AccountRole.WRITABLE },
    { address: 'OneSided222222222222222222222222' as Address, role: AccountRole.WRITABLE },
    { address: 'OneSided333333333333333333333333' as Address, role: AccountRole.WRITABLE },
    { address: 'OneSided444444444444444444444444' as Address, role: AccountRole.WRITABLE },
    { address: 'OneSided555555555555555555555555' as Address, role: AccountRole.WRITABLE },
    { address: 'OneSided666666666666666666666666' as Address, role: AccountRole.WRITABLE },
  ]),
  getPerpContext: vi.fn().mockResolvedValue([]),
}));

vi.mock('./utils', () => ({
  buildQuotesMask: vi.fn().mockReturnValue(0),
  findAssociatedTokenAddress: vi.fn().mockResolvedValue('MockATA1111111111111111111111111' as Address),
  getLookupTableAddress: vi.fn().mockResolvedValue('MockLUT1111111111111111111111111' as Address),
  perpSeatReserve: vi.fn().mockReturnValue(0),
  tokenDec: vi.fn().mockReturnValue(1000000000), // 10^9
}));

// Helper to create a mock token
function createMockToken(id: number, decimals: number = 9): TokenStateModel {
  const token = new TokenStateModel();
  token.id = id;
  token.mask = decimals; // decimals stored in lower byte
  token.address = `MockToken${id}${'1'.repeat(32 - 10 - id.toString().length)}` as Address;
  token.programAddress = `MockProgramAddress${id}${'1'.repeat(32 - 19 - id.toString().length)}` as Address;
  return token;
}

// Helper to create a mock instrument
function createMockInstrument(instrId: number, assetTokenId: number = 1, crncyTokenId: number = 0): Instrument {
  const header = new InstrAccountHeaderModel();
  header.instrId = instrId;
  header.assetTokenId = assetTokenId;
  header.crncyTokenId = crncyTokenId;
  header.mapsAddress = '11111111111111111111111111111111' as Address;
  header.perpMapsAddress = '22222222222222222222222222222222' as Address;
  return {
    address: `MockInstr${instrId}${'1'.repeat(32 - 9 - instrId.toString().length)}` as Address,
    header,
    spotBids: [],
    spotAsks: [],
    perpBids: [],
    perpAsks: [],
  };
}

// Helper to create a mock context
function createMockSpotContext(overrides: Partial<SpotInstructionContext> = {}): SpotInstructionContext {
  const tokens = new Map<number, TokenStateModel>();
  tokens.set(0, createMockToken(0, 9)); // DRVS token
  tokens.set(1, createMockToken(1, 9)); // SOL-like token

  const instruments = new Map<number, Instrument>();
  instruments.set(1, createMockInstrument(1, 1, 0));

  return {
    rpc: {} as any,
    programId: 'DRVSvY68xD69Zwwgj9N8hRBu2eXvEzy8eejiVLNYGLti' as Address,
    version: 1,
    commitment: 'confirmed',
    drvsAuthority: 'DRVStQsAKhF8gpz1xLzWyk2Q1HKKF3g21tknXtHpVLab' as Address,
    instruments,
    tokens,
    uiNumbers: true,
    signer: 'SignerAddress111111111111111111' as Address,
    rootAccount: 'RootAccount1111111111111111111111' as Address,
    communityAccount: 'CommunityAccount11111111111111111' as Address,
    clientPrimaryAccount: 'ClientPrimary11111111111111111' as Address,
    clientCommunityAccount: 'ClientCommunity111111111111111' as Address,
    refClientPrimaryAccount: null,
    refClientCommunityAccount: null,
    privateMode: false,
    ...overrides,
  };
}

function createCachedSpotAccountMetas(): CachedSpotAccountMetas {
  return {
    spotContext: [
      { address: 'CachedSpot0111111111111111111111' as Address, role: AccountRole.WRITABLE },
      { address: 'CachedSpot1111111111111111111111' as Address, role: AccountRole.WRITABLE },
      { address: 'CachedSpot2111111111111111111111' as Address, role: AccountRole.WRITABLE },
      { address: 'CachedSpot3111111111111111111111' as Address, role: AccountRole.WRITABLE },
      { address: 'CachedSpot4111111111111111111111' as Address, role: AccountRole.WRITABLE },
      { address: 'CachedSpot5111111111111111111111' as Address, role: AccountRole.WRITABLE },
      { address: 'CachedSpot6111111111111111111111' as Address, role: AccountRole.WRITABLE },
      { address: 'CachedSpot7111111111111111111111' as Address, role: AccountRole.WRITABLE },
    ],
    spotBidContext: [
      { address: 'CachedBid01111111111111111111111' as Address, role: AccountRole.WRITABLE },
      { address: 'CachedBid11111111111111111111111' as Address, role: AccountRole.WRITABLE },
      { address: 'CachedBid21111111111111111111111' as Address, role: AccountRole.WRITABLE },
      { address: 'CachedBid31111111111111111111111' as Address, role: AccountRole.WRITABLE },
      { address: 'CachedBid41111111111111111111111' as Address, role: AccountRole.WRITABLE },
      { address: 'CachedBid51111111111111111111111' as Address, role: AccountRole.WRITABLE },
    ],
    spotAskContext: [
      { address: 'CachedAsk01111111111111111111111' as Address, role: AccountRole.WRITABLE },
      { address: 'CachedAsk11111111111111111111111' as Address, role: AccountRole.WRITABLE },
      { address: 'CachedAsk21111111111111111111111' as Address, role: AccountRole.WRITABLE },
      { address: 'CachedAsk31111111111111111111111' as Address, role: AccountRole.WRITABLE },
      { address: 'CachedAsk41111111111111111111111' as Address, role: AccountRole.WRITABLE },
      { address: 'CachedAsk51111111111111111111111' as Address, role: AccountRole.WRITABLE },
    ],
  };
}

describe('spot instruction builders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildSpotLpInstruction', () => {
    it('builds spot LP instruction', async () => {
      const ctx = createMockSpotContext();
      const instr = ctx.instruments.get(1)!;
      const args: SpotLpArgs = { instrId: 1, side: 0, amount: 100 };

      const instruction = await buildSpotLpInstruction(ctx, args, instr);

      expect(instruction).toBeDefined();
      expect(instruction.programAddress).toBe(ctx.programId);
      expect(instruction.data![0]).toBe(14); // spotLp instruction tag
    });

    it('includes price bounds when provided', async () => {
      const ctx = createMockSpotContext();
      const instr = ctx.instruments.get(1)!;
      const args: SpotLpArgs = { instrId: 1, side: 1, amount: 100, minPrice: 0.9, maxPrice: 1.1 };

      const instruction = await buildSpotLpInstruction(ctx, args, instr);

      expect(instruction).toBeDefined();
    });
  });

  describe('buildNewSpotOrderInstruction', () => {
    it('builds new spot order instruction', async () => {
      const ctx = createMockSpotContext();
      const instr = ctx.instruments.get(1)!;
      const args: NewSpotOrderArgs = { instrId: 1, side: 0, price: 100, qty: 10 };

      const instruction = await buildNewSpotOrderInstruction(ctx, args, instr);

      expect(instruction).toBeDefined();
      expect(instruction.programAddress).toBe(ctx.programId);
      expect(instruction.data![0]).toBe(12); // newSpotOrder instruction tag
    });

    it('includes IOC flag when provided', async () => {
      const ctx = createMockSpotContext();
      const instr = ctx.instruments.get(1)!;
      const args: NewSpotOrderArgs = { instrId: 1, side: 1, price: 100, qty: 10, ioc: 1 };

      const instruction = await buildNewSpotOrderInstruction(ctx, args, instr);

      expect(instruction).toBeDefined();
      expect(instruction.data![1]).toBe(1); // ioc flag
    });

    it('includes ref accounts when provided', async () => {
      const ctx = createMockSpotContext({
        refClientPrimaryAccount: 'RefPrimary1111111111111111111111' as Address,
        refClientCommunityAccount: 'RefCommunity11111111111111111111' as Address,
      });
      const instr = ctx.instruments.get(1)!;
      const args: NewSpotOrderArgs = { instrId: 1, side: 0, price: 100, qty: 10 };

      const instruction = await buildNewSpotOrderInstruction(ctx, args, instr);

      expect(instruction.accounts!.length).toBeGreaterThan(15);
    });
  });

  describe('buildSpotOrderCancelInstruction', () => {
    it('builds spot order cancel instruction', async () => {
      const ctx = createMockSpotContext();
      const instr = ctx.instruments.get(1)!;
      const args: SpotOrderCancelArgs = { instrId: 1, side: 0, orderId: 12345 };

      const instruction = await buildSpotOrderCancelInstruction(ctx, args, instr);

      expect(instruction).toBeDefined();
      expect(instruction.programAddress).toBe(ctx.programId);
      expect(instruction.data![0]).toBe(13); // spotOrderCancel instruction tag
    });
  });

  describe('buildSpotMassCancelInstruction', () => {
    it('builds spot mass cancel instruction', async () => {
      const ctx = createMockSpotContext();
      const instr = ctx.instruments.get(1)!;
      const args: SpotMassCancelArgs = { instrId: 1 };

      const instruction = await buildSpotMassCancelInstruction(ctx, args, instr);

      expect(instruction).toBeDefined();
      expect(instruction.programAddress).toBe(ctx.programId);
      expect(instruction.data![0]).toBe(15); // spotMassCancel instruction tag
    });
  });

  describe('unchecked spot instruction builders', () => {
    it('builds unchecked new spot order with cached account ordering', () => {
      const ctx = createMockSpotContext();
      const instr = ctx.instruments.get(1)!;
      const cachedAccounts = createCachedSpotAccountMetas();
      const args: NewSpotOrderArgs = { instrId: 1, side: 0, price: 100, qty: 10 };

      const instruction = buildNewSpotOrderInstructionUnchecked(ctx, args, instr, cachedAccounts);

      expect(instruction.data![0]).toBe(12);
      expect(instruction.accounts![0].address).toBe(ctx.signer);
      expect(instruction.accounts![1].address).toBe(ctx.rootAccount);
      expect(instruction.accounts![2].address).toBe(ctx.clientPrimaryAccount);
      expect(instruction.accounts![3].address).toBe(ctx.clientCommunityAccount);
      expect(instruction.accounts![4].address).toBe(cachedAccounts.spotContext[0].address);
      expect(instruction.accounts![12].address).toBe(ctx.communityAccount);
    });

    it('builds unchecked spot quotes replace with cached account ordering', () => {
      const ctx = createMockSpotContext();
      const instr = ctx.instruments.get(1)!;
      const cachedAccounts = createCachedSpotAccountMetas();
      const args: SpotQuotesReplaceArgs = {
        instrId: 1,
        orders: [{ newPrice: 99, newQty: 10, oldId: 1, side: 0 }],
      };

      const instruction = buildSpotQuotesReplaceInstructionUnchecked(ctx, args, instr, cachedAccounts);

      expect(instruction.data![0]).toBe(34);
      expect(instruction.accounts![0].address).toBe(ctx.signer);
      expect(instruction.accounts![2].address).toBe(ctx.clientPrimaryAccount);
      expect(instruction.accounts![3].address).toBe(ctx.clientCommunityAccount);
      expect(instruction.accounts![4].address).toBe(cachedAccounts.spotContext[0].address);
      expect(instruction.accounts![12].address).toBe(ctx.communityAccount);
    });

    it('enforces the unchecked spot quotes replace order limit', () => {
      const ctx = createMockSpotContext();
      const instr = ctx.instruments.get(1)!;
      const cachedAccounts = createCachedSpotAccountMetas();
      const orders = Array.from({ length: 13 }, (_, index) => ({
        newPrice: 99 + index,
        newQty: 10,
        oldId: index,
        side: index % 2,
      }));

      expect(() =>
        buildSpotQuotesReplaceInstructionUnchecked(ctx, { instrId: 1, orders }, instr, cachedAccounts),
      ).toThrow('Exceeded orders limit of 12');
    });

    it('encodes unchecked spot quotes replace v2 ABI and old IDs', () => {
      const ctx = createMockSpotContext();
      const instr = ctx.instruments.get(1)!;
      const cachedAccounts = createCachedSpotAccountMetas();
      const args: SpotQuotesReplaceV2Args = {
        instrId: 0x01020304,
        bump: 7,
        orderType: 3,
        bailOnOrderNotFound: true,
        priceTick: 1000,
        quantityTick: 25,
        orders: [
          { newPrice: 11, newQty: 12, oldId: 101, side: 0 },
          { newPrice: 21, newQty: 22, oldId: 202, side: 1 },
        ],
      };

      const instruction = buildSpotQuotesReplaceInstructionV2Unchecked(ctx, args, instr, cachedAccounts);
      const data = Buffer.from(instruction.data!);

      expect(data.length).toBe(64);
      expect(data.readUInt8(0)).toBe(88);
      expect(data.readUInt8(1)).toBe(7);
      expect(data.readUInt8(2)).toBe(3);
      expect(data.readUInt8(3)).toBe(0x2);
      expect(data.readUInt32LE(4)).toBe(0b10);
      expect(data.readUInt32LE(8)).toBe(0x01020304);
      expect(data.readUInt8(12)).toBe(2);
      expect(data.readUInt8(13)).toBe(0);
      expect(data.readUInt16LE(14)).toBe(0);
      expect(data.readBigInt64LE(16)).toBe(BigInt(1000));
      expect(data.readBigInt64LE(24)).toBe(BigInt(25));
      expect(data.readUInt32LE(32)).toBe(11);
      expect(data.readUInt32LE(36)).toBe(12);
      expect(data.readUInt32LE(40)).toBe(21);
      expect(data.readUInt32LE(44)).toBe(22);
      expect(data.readBigInt64LE(48)).toBe(BigInt(101));
      expect(data.readBigInt64LE(56)).toBe(BigInt(202));
      expect(instruction.accounts![0].address).toBe(ctx.signer);
      expect(instruction.accounts![2].address).toBe(ctx.clientPrimaryAccount);
      expect(instruction.accounts![3].address).toBe(ctx.clientCommunityAccount);
      expect(instruction.accounts![4].address).toBe(cachedAccounts.spotContext[0].address);
      expect(instruction.accounts![12].address).toBe(ctx.communityAccount);
    });

    it('omits old IDs for unchecked spot quotes replace v2 mass cancel', () => {
      const ctx = createMockSpotContext();
      const instr = ctx.instruments.get(1)!;
      const cachedAccounts = createCachedSpotAccountMetas();
      const args: SpotQuotesReplaceV2Args = {
        instrId: 1,
        massCancel: true,
        priceTick: 1000,
        quantityTick: 25,
        orders: [
          { newPrice: 11, newQty: 12, oldId: 101, side: 0 },
          { newPrice: 21, newQty: 22, oldId: 202, side: 1 },
        ],
      };

      const instruction = buildSpotQuotesReplaceInstructionV2Unchecked(ctx, args, instr, cachedAccounts);
      const data = Buffer.from(instruction.data!);

      expect(data.length).toBe(48);
      expect(data.readUInt8(3)).toBe(0x1);
      expect(data.readUInt32LE(32)).toBe(11);
      expect(data.readUInt32LE(40)).toBe(21);
    });

    it('encodes zero price tick for maker price deviation orders', () => {
      const ctx = createMockSpotContext();
      const instr = ctx.instruments.get(1)!;
      const cachedAccounts = createCachedSpotAccountMetas();
      const args: SpotQuotesReplaceV2Args = {
        instrId: 1,
        orderType: 4,
        quantityTick: 25,
        orders: [{ newPrice: 50, newQty: 12, oldId: 0, side: 0 }],
      };

      const instruction = buildSpotQuotesReplaceInstructionV2Unchecked(ctx, args, instr, cachedAccounts);
      const data = Buffer.from(instruction.data!);

      expect(data.readUInt8(2)).toBe(4);
      expect(data.readUInt8(3)).toBe(0);
      expect(data.readBigInt64LE(16)).toBe(BigInt(0));
    });

    it('supports the 32nd ask bit in unchecked spot quotes replace v2', () => {
      const ctx = createMockSpotContext();
      const instr = ctx.instruments.get(1)!;
      const cachedAccounts = createCachedSpotAccountMetas();
      const args: SpotQuotesReplaceV2Args = {
        instrId: 1,
        priceTick: 1000,
        quantityTick: 25,
        orders: Array.from({ length: 32 }, (_, index) => ({
          newPrice: index,
          newQty: index,
          oldId: index,
          side: index === 31 ? 1 : 0,
        })),
      };

      const instruction = buildSpotQuotesReplaceInstructionV2Unchecked(ctx, args, instr, cachedAccounts);

      expect(Buffer.from(instruction.data!).readUInt32LE(4)).toBe(0x80000000);
    });

    it('enforces the unchecked spot quotes replace v2 order limit', () => {
      const ctx = createMockSpotContext();
      const instr = ctx.instruments.get(1)!;
      const cachedAccounts = createCachedSpotAccountMetas();
      const args = {
        instrId: 1,
        priceTick: 1000,
        quantityTick: 25,
        orders: Array.from({ length: 33 }, (_, index) => ({
          newPrice: index,
          newQty: index,
          oldId: index,
          side: 0,
        })),
      } as SpotQuotesReplaceV2Args;

      expect(() => buildSpotQuotesReplaceInstructionV2Unchecked(ctx, args, instr, cachedAccounts)).toThrow(
        'Exceeded orders limit of 32',
      );
    });

    it('rejects empty unchecked spot quotes replace v2 orders', () => {
      const ctx = createMockSpotContext();
      const instr = ctx.instruments.get(1)!;
      const cachedAccounts = createCachedSpotAccountMetas();
      const args = {
        instrId: 1,
        priceTick: 1000,
        quantityTick: 25,
        orders: [],
      } as SpotQuotesReplaceV2Args;

      expect(() => buildSpotQuotesReplaceInstructionV2Unchecked(ctx, args, instr, cachedAccounts)).toThrow(
        'At least one order is required',
      );
    });

    it('builds unchecked spot order cancel with side-specific cached context', () => {
      const ctx = createMockSpotContext();
      const instr = ctx.instruments.get(1)!;
      const cachedAccounts = createCachedSpotAccountMetas();
      const args: SpotOrderCancelArgs = { instrId: 1, side: 1, orderId: 12345 };

      const instruction = buildSpotOrderCancelInstructionUnchecked(ctx, args, instr, cachedAccounts);

      expect(instruction.data![0]).toBe(13);
      expect(instruction.accounts![0].address).toBe(ctx.signer);
      expect(instruction.accounts![2].address).toBe(ctx.clientPrimaryAccount);
      expect(instruction.accounts![3].address).toBe(cachedAccounts.spotAskContext[0].address);
    });

    it('builds unchecked spot mass cancel with cached account ordering', () => {
      const ctx = createMockSpotContext();
      const instr = ctx.instruments.get(1)!;
      const cachedAccounts = createCachedSpotAccountMetas();
      const args: SpotMassCancelArgs = { instrId: 1 };

      const instruction = buildSpotMassCancelInstructionUnchecked(ctx, args, instr, cachedAccounts);

      expect(instruction.data![0]).toBe(15);
      expect(instruction.accounts![0].address).toBe(ctx.signer);
      expect(instruction.accounts![2].address).toBe(ctx.clientPrimaryAccount);
      expect(instruction.accounts![3].address).toBe(cachedAccounts.spotContext[0].address);
      expect(instruction.accounts![11].address).toBe(ctx.communityAccount);
    });
  });
});
