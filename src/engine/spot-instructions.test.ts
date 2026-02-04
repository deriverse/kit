import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Address, AccountRole } from '@solana/kit';
import {
  SpotInstructionContext,
  buildDepositInstruction,
  buildWithdrawInstruction,
  buildNewSpotOrderInstruction,
  buildSpotLpInstruction,
  buildSpotOrderCancelInstruction,
  buildSpotMassCancelInstruction,
} from './spot-instructions';
import { TokenStateModel, InstrAccountHeaderModel } from '../structure_models';
import {
  Instrument,
  DepositArgs,
  WithdrawArgs,
  NewSpotOrderArgs,
  SpotLpArgs,
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
  getSpotCandles: vi.fn().mockResolvedValue([
    { address: 'SpotCandles1111111111111111111' as Address, role: AccountRole.WRITABLE },
    { address: 'SpotCandles2222222222222222222' as Address, role: AccountRole.WRITABLE },
    { address: 'SpotCandles3333333333333333333' as Address, role: AccountRole.WRITABLE },
  ]),
  getPerpContext: vi.fn().mockResolvedValue([]),
}));

vi.mock('./utils', () => ({
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
    clientPrimaryAccount: 'ClientPrimary11111111111111111' as Address,
    clientCommunityAccount: 'ClientCommunity111111111111111' as Address,
    refClientPrimaryAccount: null,
    refClientCommunityAccount: null,
    privateMode: false,
    ...overrides,
  };
}

describe('spot instruction builders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildDepositInstruction', () => {
    it('builds deposit instruction for existing account', async () => {
      const ctx = createMockSpotContext();
      const args: DepositArgs = { tokenId: 1, amount: 100 };
      const rpcGetSlot = vi.fn().mockResolvedValue(BigInt(12345));

      const instruction = await buildDepositInstruction(ctx, args, true, rpcGetSlot);

      expect(instruction).toBeDefined();
      expect(instruction.programAddress).toBe(ctx.programId);
      expect(instruction.accounts).toBeDefined();
      expect(instruction.accounts!.length).toBeGreaterThan(0);
      expect(instruction.data).toBeInstanceOf(Uint8Array);
      expect(instruction.data![0]).toBe(7); // deposit instruction tag
    });

    it('builds deposit instruction for new account', async () => {
      const ctx = createMockSpotContext();
      const args: DepositArgs = { tokenId: 1, amount: 50 };
      const rpcGetSlot = vi.fn().mockResolvedValue(BigInt(12345));

      const instruction = await buildDepositInstruction(ctx, args, false, rpcGetSlot);

      expect(instruction).toBeDefined();
      expect(instruction.programAddress).toBe(ctx.programId);
      expect(instruction.accounts!.length).toBeGreaterThan(0);
      expect(rpcGetSlot).toHaveBeenCalled();
    });

    it('includes private mode account when enabled', async () => {
      const ctx = createMockSpotContext({ privateMode: true });
      const args: DepositArgs = { tokenId: 1, amount: 100 };
      const rpcGetSlot = vi.fn().mockResolvedValue(BigInt(12345));

      const instruction = await buildDepositInstruction(ctx, args, true, rpcGetSlot);

      expect(instruction.accounts!.length).toBeGreaterThan(9);
    });

    it('handles all_funds flag', async () => {
      const ctx = createMockSpotContext();
      const args: DepositArgs = { tokenId: 1, amount: 0, all_funds: true };
      const rpcGetSlot = vi.fn().mockResolvedValue(BigInt(12345));

      const instruction = await buildDepositInstruction(ctx, args, true, rpcGetSlot);

      expect(instruction).toBeDefined();
      expect(instruction.data![2]).toBe(1); // all_funds flag position
    });
  });

  describe('buildWithdrawInstruction', () => {
    it('builds withdraw instruction', async () => {
      const ctx = createMockSpotContext();
      const args: WithdrawArgs = { tokenId: 1, amount: 50 };

      const instruction = await buildWithdrawInstruction(ctx, args);

      expect(instruction).toBeDefined();
      expect(instruction.programAddress).toBe(ctx.programId);
      expect(instruction.accounts).toBeDefined();
      expect(instruction.accounts!.length).toBeGreaterThan(0);
      expect(instruction.data).toBeInstanceOf(Uint8Array);
      expect(instruction.data![0]).toBe(8); // withdraw instruction tag
    });

    it('includes spot instruments when provided', async () => {
      const ctx = createMockSpotContext();
      const args: WithdrawArgs = {
        tokenId: 1,
        amount: 50,
        spot: [{ instrId: 1 }],
      };

      const instruction = await buildWithdrawInstruction(ctx, args);

      expect(instruction.accounts!.length).toBeGreaterThan(11);
    });
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
});
