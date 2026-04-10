import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Address } from '@solana/kit';
import { SpotInstructionContext } from './spot-instructions';
import { buildDepositInstruction, buildWithdrawInstruction } from './instructions';
import { TokenStateModel, InstrAccountHeaderModel } from '../structure_models';
import { Instrument, DepositArgs, WithdrawArgs } from '../types';

vi.mock('./account-helpers', () => ({
  getAccountByTag: vi.fn().mockResolvedValue('MockAccountByTag11111111111111' as Address),
  getInstrAccountByTag: vi.fn().mockResolvedValue('MockInstrAccount1111111111111' as Address),
  getTokenAccount: vi.fn().mockResolvedValue('MockTokenAccount111111111111111' as Address),
  getTokenId: vi.fn().mockResolvedValue(1),
  getInstrId: vi.fn().mockResolvedValue(1),
  findClientPrimaryAccount: vi.fn().mockResolvedValue('MockClientPrimary11111111111' as Address),
  findClientCommunityAccount: vi.fn().mockResolvedValue('MockClientCommunity111111111' as Address),
  requireClientPrimaryAccount: vi.fn().mockReturnValue('MockClientPrimary11111111111' as Address),
  requireClientCommunityAccount: vi.fn().mockReturnValue('MockClientCommunity111111111' as Address),
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

describe('instruction builders', () => {
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
});
