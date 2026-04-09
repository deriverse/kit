import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Address, AccountRole } from '@solana/kit';
import {
  PerpInstructionContext,
  buildPerpDepositInstruction,
  buildNewPerpOrderInstruction,
  buildPerpOrderCancelInstruction,
  buildPerpMassCancelInstruction,
  buildPerpChangeLeverageInstruction,
  buildPerpBuySeatInstruction,
  buildPerpSellSeatInstruction,
  buildPerpQuotesReplaceInstruction,
  buildPerpStatisticsResetInstruction,
} from './perp-instructions';
import { buildNewRefLinkInstruction } from './instructions';
import { TokenStateModel, InstrAccountHeaderModel, RootStateModel } from '../structure_models';
import {
  Instrument,
  PerpDepositArgs,
  NewPerpOrderArgs,
  PerpOrderCancelArgs,
  PerpMassCancelArgs,
  PerpChangeLeverageArgs,
  PerpBuySeatArgs,
  PerpSellSeatArgs,
  PerpQuotesReplaceArgs,
  PerpStatisticsResetArgs,
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
  getSpotContext: vi.fn().mockResolvedValue([]),
  getPerpContext: vi.fn().mockResolvedValue([
    { address: 'PerpCtx1111111111111111111111111' as Address, role: AccountRole.WRITABLE },
    { address: 'PerpCtx2222222222222222222222222' as Address, role: AccountRole.WRITABLE },
    { address: 'PerpCtx3333333333333333333333333' as Address, role: AccountRole.WRITABLE },
    { address: 'PerpCtx4444444444444444444444444' as Address, role: AccountRole.WRITABLE },
    { address: 'PerpCtx5555555555555555555555555' as Address, role: AccountRole.WRITABLE },
    { address: 'PerpCtx6666666666666666666666666' as Address, role: AccountRole.WRITABLE },
    { address: 'PerpCtx7777777777777777777777777' as Address, role: AccountRole.WRITABLE },
    { address: 'PerpCtx8888888888888888888888888' as Address, role: AccountRole.WRITABLE },
    { address: 'PerpCtx9999999999999999999999999' as Address, role: AccountRole.WRITABLE },
    { address: 'PerpCtxAAAAAAAAAAAAAAAAAAAAAAAAA' as Address, role: AccountRole.WRITABLE },
    { address: 'PerpCtxBBBBBBBBBBBBBBBBBBBBBBBBB' as Address, role: AccountRole.WRITABLE },
    { address: 'PerpCtxCCCCCCCCCCCCCCCCCCCCCCCCC' as Address, role: AccountRole.WRITABLE },
    { address: 'PerpCtxDDDDDDDDDDDDDDDDDDDDDDDDD' as Address, role: AccountRole.WRITABLE },
    { address: 'PerpCtxEEEEEEEEEEEEEEEEEEEEEEEEE' as Address, role: AccountRole.WRITABLE },
    { address: 'PerpCtxFFFFFFFFFFFFFFFFFFFFFFFFF' as Address, role: AccountRole.WRITABLE },
  ]),
}));

vi.mock('./utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./utils')>();
  return {
    ...actual,
    findAssociatedTokenAddress: vi.fn().mockResolvedValue('MockATA1111111111111111111111111' as Address),
    getLookupTableAddress: vi.fn().mockResolvedValue('MockLUT1111111111111111111111111' as Address),
    perpSeatReserve: vi.fn().mockReturnValue(100),
    tokenDec: vi.fn().mockReturnValue(1000000000), // 10^9
  };
});

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
  header.perpClientsCount = 10;
  header.mask = 0;
  return {
    address: `MockInstr${instrId}${'1'.repeat(32 - 9 - instrId.toString().length)}` as Address,
    header,
    spotBids: [],
    spotAsks: [],
    perpBids: [],
    perpAsks: [],
  };
}

// Helper to create a mock root state model
function createMockRootStateModel(): RootStateModel {
  const model = new RootStateModel();
  model.tokensCount = 5;
  model.instrCount = 3;
  return model;
}

// Helper to create a mock context
function createMockPerpContext(overrides: Partial<PerpInstructionContext> = {}): PerpInstructionContext {
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
    rootStateModel: createMockRootStateModel(),
    uiNumbers: true,
    signer: 'SignerAddress111111111111111111' as Address,
    rootAccount: 'RootAccount1111111111111111111111' as Address,
    clientPrimaryAccount: 'ClientPrimary11111111111111111' as Address,
    clientCommunityAccount: 'ClientCommunity111111111111111' as Address,
    refClientPrimaryAccount: null,
    refClientCommunityAccount: null,
    ...overrides,
  };
}

describe('perp instruction builders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildPerpDepositInstruction', () => {
    it('builds perp deposit instruction', async () => {
      const ctx = createMockPerpContext();
      const instr = ctx.instruments.get(1)!;
      const args: PerpDepositArgs = { instrId: 1, amount: 100 };

      const instruction = await buildPerpDepositInstruction(ctx, args, instr);

      expect(instruction).toBeDefined();
      expect(instruction.programAddress).toBe(ctx.programId);
      expect(instruction.accounts).toBeDefined();
      expect(instruction.accounts!.length).toBeGreaterThan(0);
      expect(instruction.data).toBeInstanceOf(Uint8Array);
      expect(instruction.data![0]).toBe(11); // perpDeposit instruction tag
    });

    it('converts amount with uiNumbers', async () => {
      const ctx = createMockPerpContext({ uiNumbers: true });
      const instr = ctx.instruments.get(1)!;
      const args: PerpDepositArgs = { instrId: 1, amount: 1 };

      const instruction = await buildPerpDepositInstruction(ctx, args, instr);

      expect(instruction).toBeDefined();
      // Amount should be multiplied by 10^9 for token with 9 decimals
    });
  });

  describe('buildNewPerpOrderInstruction', () => {
    it('builds new perp order instruction', async () => {
      const ctx = createMockPerpContext();
      const instr = ctx.instruments.get(1)!;
      const args: NewPerpOrderArgs = { instrId: 1, side: 0, price: 100, qty: 10 };

      const instruction = await buildNewPerpOrderInstruction(ctx, args, instr);

      expect(instruction).toBeDefined();
      expect(instruction.programAddress).toBe(ctx.programId);
      expect(instruction.data![0]).toBe(19); // newPerpOrder instruction tag
    });

    it('includes IOC flag when provided', async () => {
      const ctx = createMockPerpContext();
      const instr = ctx.instruments.get(1)!;
      const args: NewPerpOrderArgs = { instrId: 1, side: 1, price: 100, qty: 10, ioc: 1 };

      const instruction = await buildNewPerpOrderInstruction(ctx, args, instr);

      expect(instruction).toBeDefined();
      expect(instruction.data![1]).toBe(1); // ioc flag
    });

    it('includes leverage when provided', async () => {
      const ctx = createMockPerpContext();
      const instr = ctx.instruments.get(1)!;
      const args: NewPerpOrderArgs = { instrId: 1, side: 0, price: 100, qty: 10, leverage: 5 };

      const instruction = await buildNewPerpOrderInstruction(ctx, args, instr);

      expect(instruction).toBeDefined();
      expect(instruction.data![2]).toBe(5); // leverage
    });

    it('includes ref accounts when provided', async () => {
      const ctx = createMockPerpContext({
        refClientPrimaryAccount: 'RefPrimary1111111111111111111111' as Address,
        refClientCommunityAccount: 'RefCommunity11111111111111111111' as Address,
      });
      const instr = ctx.instruments.get(1)!;
      const args: NewPerpOrderArgs = { instrId: 1, side: 0, price: 100, qty: 10 };

      const instruction = await buildNewPerpOrderInstruction(ctx, args, instr);

      expect(instruction.accounts!.length).toBeGreaterThan(20);
    });
  });

  describe('buildPerpOrderCancelInstruction', () => {
    it('builds perp order cancel instruction', async () => {
      const ctx = createMockPerpContext();
      const instr = ctx.instruments.get(1)!;
      const args: PerpOrderCancelArgs = { instrId: 1, side: 0, orderId: 12345 };

      const instruction = await buildPerpOrderCancelInstruction(ctx, args, instr);

      expect(instruction).toBeDefined();
      expect(instruction.programAddress).toBe(ctx.programId);
      expect(instruction.data![0]).toBe(30); // perpOrderCancel instruction tag
    });
  });

  describe('buildPerpMassCancelInstruction', () => {
    it('builds perp mass cancel instruction', async () => {
      const ctx = createMockPerpContext();
      const instr = ctx.instruments.get(1)!;
      const args: PerpMassCancelArgs = { instrId: 1 };

      const instruction = await buildPerpMassCancelInstruction(ctx, args, instr);

      expect(instruction).toBeDefined();
      expect(instruction.programAddress).toBe(ctx.programId);
      expect(instruction.data![0]).toBe(36); // perpMassCancel instruction tag
    });
  });

  describe('buildPerpChangeLeverageInstruction', () => {
    it('builds perp change leverage instruction', async () => {
      const ctx = createMockPerpContext();
      const instr = ctx.instruments.get(1)!;
      const args: PerpChangeLeverageArgs = { instrId: 1, leverage: 10 };

      const instruction = await buildPerpChangeLeverageInstruction(ctx, args, instr);

      expect(instruction).toBeDefined();
      expect(instruction.programAddress).toBe(ctx.programId);
      expect(instruction.data![0]).toBe(37); // perpChangeLeverage instruction tag
    });
  });

  describe('buildNewRefLinkInstruction', () => {
    it('builds new ref link instruction', async () => {
      const ctx = createMockPerpContext();

      const instruction = await buildNewRefLinkInstruction(ctx);

      expect(instruction).toBeDefined();
      expect(instruction.programAddress).toBe(ctx.programId);
      expect(instruction.accounts!.length).toBe(3);
      expect(instruction.data![0]).toBe(45); // newRefLink instruction tag
    });
  });

  describe('buildPerpBuySeatInstruction', () => {
    it('builds perp buy seat instruction', async () => {
      const ctx = createMockPerpContext();
      const instr = ctx.instruments.get(1)!;
      const args: PerpBuySeatArgs = { instrId: 1, amount: 100 };

      const instruction = await buildPerpBuySeatInstruction(ctx, args, instr);

      expect(instruction).toBeDefined();
      expect(instruction.programAddress).toBe(ctx.programId);
      expect(instruction.data![0]).toBe(47); // buyMarketSeat instruction tag
    });

    it('handles slippage parameter', async () => {
      const ctx = createMockPerpContext();
      const instr = ctx.instruments.get(1)!;
      const args: PerpBuySeatArgs = { instrId: 1, amount: 100, slippage: 0.05 };

      const instruction = await buildPerpBuySeatInstruction(ctx, args, instr);

      expect(instruction).toBeDefined();
      expect(instruction.data![0]).toBe(47);
    });

    it('defaults slippage to 0 when not provided', async () => {
      const ctx = createMockPerpContext();
      const instr = ctx.instruments.get(1)!;
      const args: PerpBuySeatArgs = { instrId: 1, amount: 50 };

      const instruction = await buildPerpBuySeatInstruction(ctx, args, instr);

      expect(instruction).toBeDefined();
    });
  });

  describe('buildPerpSellSeatInstruction', () => {
    it('builds perp sell seat instruction', async () => {
      const ctx = createMockPerpContext();
      const instr = ctx.instruments.get(1)!;
      const args: PerpSellSeatArgs = { instrId: 1 };

      const instruction = await buildPerpSellSeatInstruction(ctx, args, instr);

      expect(instruction).toBeDefined();
      expect(instruction.programAddress).toBe(ctx.programId);
      expect(instruction.data![0]).toBe(48); // sellMarketSeat instruction tag
    });

    it('handles slippage parameter', async () => {
      const ctx = createMockPerpContext();
      const instr = ctx.instruments.get(1)!;
      const args: PerpSellSeatArgs = { instrId: 1, slippage: 0.1 };

      const instruction = await buildPerpSellSeatInstruction(ctx, args, instr);

      expect(instruction).toBeDefined();
      expect(instruction.data![0]).toBe(48);
    });
  });

  describe('buildPerpQuotesReplaceInstruction', () => {
    it('builds perp quotes replace instruction', async () => {
      const ctx = createMockPerpContext();
      const instr = ctx.instruments.get(1)!;
      const args: PerpQuotesReplaceArgs = {
        instrId: 1,
        orders: [
          { newPrice: 99, newQty: 10, oldId: 12345, side: 0 },
          { newPrice: 101, newQty: 10, oldId: 67890, side: 1 },
        ],
      };

      const instruction = await buildPerpQuotesReplaceInstruction(ctx, args, instr);

      expect(instruction).toBeDefined();
      expect(instruction.programAddress).toBe(ctx.programId);
      expect(instruction.data![0]).toBe(42); // perpQuotesReplace instruction tag
    });

    it('includes ref accounts when provided', async () => {
      const ctx = createMockPerpContext({
        refClientPrimaryAccount: 'RefPrimary1111111111111111111111' as Address,
        refClientCommunityAccount: 'RefCommunity11111111111111111111' as Address,
      });
      const instr = ctx.instruments.get(1)!;
      const args: PerpQuotesReplaceArgs = {
        instrId: 1,
        orders: [
          { newPrice: 99, newQty: 10, oldId: 12345, side: 0 },
          { newPrice: 101, newQty: 10, oldId: 67890, side: 1 },
        ],
      };

      const instruction = await buildPerpQuotesReplaceInstruction(ctx, args, instr);

      expect(instruction.accounts!.length).toBeGreaterThan(18);
    });
  });

  describe('buildPerpStatisticsResetInstruction', () => {
    it('builds perp statistics reset instruction', async () => {
      const ctx = createMockPerpContext();
      const instr = ctx.instruments.get(1)!;
      const args: PerpStatisticsResetArgs = { instrId: 1 };

      const instruction = await buildPerpStatisticsResetInstruction(ctx, args, instr);

      expect(instruction).toBeDefined();
      expect(instruction.programAddress).toBe(ctx.programId);
      expect(instruction.data![0]).toBe(46); // perpStatisticsReset instruction tag
    });
  });
});
