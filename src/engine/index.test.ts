import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Address } from '@solana/kit';
import { Engine } from './index';
import { PROGRAM_ID, VERSION } from '../constants';
import { TokenStateModel, InstrAccountHeaderModel, RootStateModel } from '../structure_models';

// Mock account-helpers
vi.mock('./account-helpers', () => ({
  getAccountByTag: vi.fn().mockResolvedValue('MockAccountByTag1111111111111111' as Address),
  getInstrAccountByTag: vi.fn().mockResolvedValue('MockInstrAccount111111111111111' as Address),
  getTokenAccount: vi.fn().mockResolvedValue('MockTokenAccount11111111111111111' as Address),
  getTokenId: vi.fn().mockResolvedValue(1),
  getInstrId: vi.fn().mockResolvedValue(1),
  findClientPrimaryAccount: vi.fn().mockResolvedValue('MockClientPrimary1111111111111111' as Address),
  findClientCommunityAccount: vi.fn().mockResolvedValue('MockClientCommunity11111111111111' as Address),
  findAccountsByTag: vi.fn().mockResolvedValue([]),
  AccountHelperContext: {},
}));

// Mock spot-instructions
vi.mock('./spot-instructions', () => ({
  buildDepositInstruction: vi.fn().mockResolvedValue({
    programAddress: 'MockProgram1111111111111111111111111' as Address,
    accounts: [],
    data: new Uint8Array([7]),
  }),
  buildWithdrawInstruction: vi.fn().mockResolvedValue({
    programAddress: 'MockProgram1111111111111111111111111' as Address,
    accounts: [],
    data: new Uint8Array([8]),
  }),
  buildSpotLpInstruction: vi.fn().mockResolvedValue({
    programAddress: 'MockProgram1111111111111111111111111' as Address,
    accounts: [],
    data: new Uint8Array([9]),
  }),
  buildNewSpotOrderInstruction: vi.fn().mockResolvedValue({
    programAddress: 'MockProgram1111111111111111111111111' as Address,
    accounts: [],
    data: new Uint8Array([10]),
  }),
  buildSpotQuotesReplaceInstruction: vi.fn().mockResolvedValue({
    programAddress: 'MockProgram1111111111111111111111111' as Address,
    accounts: [],
    data: new Uint8Array([11]),
  }),
  buildSpotOrderCancelInstruction: vi.fn().mockResolvedValue({
    programAddress: 'MockProgram1111111111111111111111111' as Address,
    accounts: [],
    data: new Uint8Array([12]),
  }),
  buildSpotMassCancelInstruction: vi.fn().mockResolvedValue({
    programAddress: 'MockProgram1111111111111111111111111' as Address,
    accounts: [],
    data: new Uint8Array([13]),
  }),
  buildSwapInstruction: vi.fn().mockResolvedValue({
    programAddress: 'MockProgram1111111111111111111111111' as Address,
    accounts: [],
    data: new Uint8Array([14]),
  }),
  SpotInstructionContext: {},
}));

// Mock perp-instructions
vi.mock('./perp-instructions', () => ({
  buildUpgradeToPerpInstructions: vi.fn().mockResolvedValue([
    {
      programAddress: 'MockProgram1111111111111111111111111' as Address,
      accounts: [],
      data: new Uint8Array([20]),
    },
  ]),
  buildPerpDepositInstruction: vi.fn().mockResolvedValue({
    programAddress: 'MockProgram1111111111111111111111111' as Address,
    accounts: [],
    data: new Uint8Array([21]),
  }),
  buildPerpBuySeatInstruction: vi.fn().mockResolvedValue({
    programAddress: 'MockProgram1111111111111111111111111' as Address,
    accounts: [],
    data: new Uint8Array([22]),
  }),
  buildPerpSellSeatInstruction: vi.fn().mockResolvedValue({
    programAddress: 'MockProgram1111111111111111111111111' as Address,
    accounts: [],
    data: new Uint8Array([23]),
  }),
  buildNewPerpOrderInstruction: vi.fn().mockResolvedValue({
    programAddress: 'MockProgram1111111111111111111111111' as Address,
    accounts: [],
    data: new Uint8Array([24]),
  }),
  buildPerpQuotesReplaceInstruction: vi.fn().mockResolvedValue({
    programAddress: 'MockProgram1111111111111111111111111' as Address,
    accounts: [],
    data: new Uint8Array([25]),
  }),
  buildPerpOrderCancelInstruction: vi.fn().mockResolvedValue({
    programAddress: 'MockProgram1111111111111111111111111' as Address,
    accounts: [],
    data: new Uint8Array([26]),
  }),
  buildPerpMassCancelInstruction: vi.fn().mockResolvedValue({
    programAddress: 'MockProgram1111111111111111111111111' as Address,
    accounts: [],
    data: new Uint8Array([27]),
  }),
  buildPerpChangeLeverageInstruction: vi.fn().mockResolvedValue({
    programAddress: 'MockProgram1111111111111111111111111' as Address,
    accounts: [],
    data: new Uint8Array([28]),
  }),
  buildPerpStatisticsResetInstruction: vi.fn().mockResolvedValue({
    programAddress: 'MockProgram1111111111111111111111111' as Address,
    accounts: [],
    data: new Uint8Array([29]),
  }),
  buildNewRefLinkInstruction: vi.fn().mockResolvedValue({
    programAddress: 'MockProgram1111111111111111111111111' as Address,
    accounts: [],
    data: new Uint8Array([30]),
  }),
  buildNewInstrumentInstructions: vi.fn().mockResolvedValue([
    {
      programAddress: 'MockProgram1111111111111111111111111' as Address,
      accounts: [],
      data: new Uint8Array([31]),
    },
  ]),
  PerpInstructionContext: {},
}));

// Mock context-builders
vi.mock('./context-builders', () => ({
  getSpotContext: vi.fn().mockResolvedValue([]),
  getPerpContext: vi.fn().mockResolvedValue([]),
  getSpotCandles: vi.fn().mockResolvedValue([]),
}));

// Mock logs-decoder
vi.mock('./logs-decoder', () => ({
  decodeTransactionLogs: vi.fn().mockReturnValue([]),
}));

// Import mocked modules for assertions
import {
  buildDepositInstruction,
  buildWithdrawInstruction,
  buildSpotLpInstruction,
  buildNewSpotOrderInstruction,
  buildSpotQuotesReplaceInstruction,
  buildSpotOrderCancelInstruction,
  buildSpotMassCancelInstruction,
  buildSwapInstruction,
} from './spot-instructions';

import {
  buildUpgradeToPerpInstructions,
  buildPerpDepositInstruction,
  buildPerpBuySeatInstruction,
  buildPerpSellSeatInstruction,
  buildNewPerpOrderInstruction,
  buildPerpQuotesReplaceInstruction,
  buildPerpOrderCancelInstruction,
  buildPerpMassCancelInstruction,
  buildPerpChangeLeverageInstruction,
  buildPerpStatisticsResetInstruction,
  buildNewRefLinkInstruction,
  buildNewInstrumentInstructions,
} from './perp-instructions';

// Mock RPC for testing
const createMockRpc = () => ({
  getAccountInfo: vi.fn().mockReturnValue({ send: vi.fn() }),
  getMultipleAccounts: vi.fn().mockReturnValue({ send: vi.fn() }),
  getProgramAccounts: vi.fn().mockReturnValue({ send: vi.fn() }),
  getSlot: vi.fn().mockReturnValue({ send: vi.fn().mockResolvedValue(BigInt(12345)) }),
  getMinimumBalanceForRentExemption: vi.fn().mockReturnValue({ send: vi.fn().mockResolvedValue(BigInt(1000000)) }),
});

// Helper to create mock token
function createMockToken(id: number, decimals: number = 9): TokenStateModel {
  const token = new TokenStateModel();
  token.id = id;
  token.mask = decimals;
  return token;
}

// Helper to create mock instrument header
function createMockInstrHeader(instrId: number): InstrAccountHeaderModel {
  const header = new InstrAccountHeaderModel();
  header.instrId = instrId;
  header.assetTokenId = 1;
  header.crncyTokenId = 2;
  header.mask = 0;
  header.mapsAddress = 'MockMapsAddress111111111111111111111' as Address;
  header.perpMapsAddress = 'MockPerpMapsAddress1111111111111111' as Address;
  header.lutAddress = 'MockLutAddress1111111111111111111111' as Address;
  header.perpClientsCount = 10;
  return header;
}

// Helper to create mock instruments map
function createMockInstrumentsMap(): Map<number, any> {
  const map = new Map();
  map.set(1, {
    address: 'MockInstrAddress111111111111111111111' as Address,
    header: createMockInstrHeader(1),
    spotBids: [],
    spotAsks: [],
    perpBids: [],
    perpAsks: [],
  });
  return map;
}

// Helper to create mock tokens map
function createMockTokensMap(): Map<number, TokenStateModel> {
  const map = new Map();
  map.set(0, createMockToken(0, 9)); // DRVS token
  map.set(1, createMockToken(1, 9));
  map.set(2, createMockToken(2, 6));
  return map;
}

// Helper to setup engine with client connected
async function setupEngineWithClient(): Promise<{ engine: Engine; mockRpc: ReturnType<typeof createMockRpc> }> {
  const mockRpc = createMockRpc();
  const engine = new Engine(mockRpc as any);

  // Setup required state
  engine.tokens = createMockTokensMap();
  engine.instruments = createMockInstrumentsMap();
  engine.rootAccount = 'MockRootAccount11111111111111111111' as Address;
  engine.communityAccount = 'MockCommunityAccount111111111111111' as Address;
  (engine as any).drvsAuthority = 'MockDrvsAuthority11111111111111111' as Address;
  (engine as any).rootStateModel = new RootStateModel();
  (engine as any).rootStateModel.tokensCount = 3;
  (engine as any).rootStateModel.instrCount = 1;

  // Setup client state directly (bypass setSigner complexity)
  (engine as any).signer = 'MockSigner1111111111111111111111111111' as Address;
  (engine as any).clientPrimaryAccount = 'MockClientPrimary1111111111111111' as Address;
  (engine as any).clientCommunityAccount = 'MockClientCommunity11111111111111' as Address;
  (engine as any).originalClientId = 12345;

  // Mock updateInstrData to avoid RPC calls
  vi.spyOn(engine, 'updateInstrData').mockResolvedValue(undefined);

  return { engine, mockRpc };
}

describe('Engine class', () => {
  describe('constructor', () => {
    it('uses default PROGRAM_ID when not provided', () => {
      const mockRpc = createMockRpc();
      const engine = new Engine(mockRpc as any);
      expect(engine.programId).toBe(PROGRAM_ID);
    });

    it('uses default VERSION when not provided', () => {
      const mockRpc = createMockRpc();
      const engine = new Engine(mockRpc as any);
      expect(engine.version).toBe(VERSION);
    });

    it('uses default commitment (confirmed) when not provided', () => {
      const mockRpc = createMockRpc();
      const engine = new Engine(mockRpc as any);
      expect(engine.commitment).toBe('confirmed');
    });

    it('accepts custom programId', () => {
      const mockRpc = createMockRpc();
      const customProgramId = 'CustomProgramId11111111111111111111111111111' as any;
      const engine = new Engine(mockRpc as any, { programId: customProgramId });
      expect(engine.programId).toBe(customProgramId);
    });

    it('accepts custom version', () => {
      const mockRpc = createMockRpc();
      const engine = new Engine(mockRpc as any, { version: 2 });
      expect(engine.version).toBe(2);
    });

    it('accepts custom commitment', () => {
      const mockRpc = createMockRpc();
      const engine = new Engine(mockRpc as any, { commitment: 'finalized' });
      expect(engine.commitment).toBe('finalized');
    });

    it('accepts uiNumbers option', () => {
      const mockRpc = createMockRpc();
      // Default is true, test with false
      const engine = new Engine(mockRpc as any, { uiNumbers: false });
      // uiNumbers is private, so we can't directly test it
      // But it should not throw
      expect(engine).toBeDefined();
    });
  });

  describe('logsDecode', () => {
    it('returns empty array for error logs', () => {
      const mockRpc = createMockRpc();
      const engine = new Engine(mockRpc as any);
      // Initialize empty maps for the test
      (engine as any).instruments = new Map();
      (engine as any).tokens = new Map();

      const errorLogs = ['Program returned error: insufficient funds'];
      const result = engine.logsDecode(errorLogs);
      expect(result).toEqual([]);
    });

    it('returns empty array for logs starting with Error', () => {
      const mockRpc = createMockRpc();
      const engine = new Engine(mockRpc as any);
      (engine as any).instruments = new Map();
      (engine as any).tokens = new Map();

      const errorLogs = ['Program logged: "Error: some error"'];
      const result = engine.logsDecode(errorLogs);
      expect(result).toEqual([]);
    });

    it('returns empty array for non-program data logs', () => {
      const mockRpc = createMockRpc();
      const engine = new Engine(mockRpc as any);
      (engine as any).instruments = new Map();
      (engine as any).tokens = new Map();

      const otherLogs = ['Program invoke', 'Some other log'];
      const result = engine.logsDecode(otherLogs);
      expect(result).toEqual([]);
    });

    it('returns empty array for empty log array', () => {
      const mockRpc = createMockRpc();
      const engine = new Engine(mockRpc as any);
      (engine as any).instruments = new Map();
      (engine as any).tokens = new Map();

      const result = engine.logsDecode([]);
      expect(result).toEqual([]);
    });
  });

  describe('initial state', () => {
    it('has undefined rootAccount before initialization', () => {
      const mockRpc = createMockRpc();
      const engine = new Engine(mockRpc as any);
      expect(engine.rootAccount).toBeUndefined();
    });

    it('has undefined tokens and instruments before initialization', () => {
      const mockRpc = createMockRpc();
      const engine = new Engine(mockRpc as any);
      expect(engine.tokens).toBeUndefined();
      expect(engine.instruments).toBeUndefined();
    });
  });
});

// ============================================
// INSTRUCTION METHOD BEHAVIOR TESTS
// ============================================

describe('Engine instruction methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('depositInstruction', () => {
    it('throws when wallet not connected', async () => {
      const mockRpc = createMockRpc();
      const engine = new Engine(mockRpc as any);

      await expect(engine.depositInstruction({ tokenId: 1, amount: 100 })).rejects.toThrow('Wallet');
    });

    it('calls buildDepositInstruction with correct args', async () => {
      const { engine } = await setupEngineWithClient();

      await engine.depositInstruction({ tokenId: 1, amount: 100 });

      expect(buildDepositInstruction).toHaveBeenCalledWith(
        expect.objectContaining({
          programId: engine.programId,
          tokens: engine.tokens,
          instruments: engine.instruments,
        }),
        { tokenId: 1, amount: 100 },
        expect.any(Boolean),
        expect.any(Function),
      );
    });

    it('returns instruction from builder', async () => {
      const { engine } = await setupEngineWithClient();

      const result = await engine.depositInstruction({ tokenId: 1, amount: 100 });

      expect(result).toBeDefined();
      expect(result.data![0]).toBe(7); // deposit tag
    });
  });

  describe('withdrawInstruction', () => {
    it('throws when client account not found', async () => {
      const mockRpc = createMockRpc();
      const engine = new Engine(mockRpc as any);
      engine.tokens = createMockTokensMap();
      engine.instruments = createMockInstrumentsMap();

      // Set signer but no client account
      (engine as any).signer = 'MockSigner1111111111111111111111111111' as Address;
      (engine as any).clientPrimaryAccount = null;

      await expect(engine.withdrawInstruction({ tokenId: 1, amount: 50 })).rejects.toThrow('Client account not found');
    });

    it('calls buildWithdrawInstruction with correct args', async () => {
      const { engine } = await setupEngineWithClient();

      await engine.withdrawInstruction({ tokenId: 1, amount: 50 });

      expect(buildWithdrawInstruction).toHaveBeenCalledWith(
        expect.objectContaining({
          programId: engine.programId,
          tokens: engine.tokens,
        }),
        { tokenId: 1, amount: 50 },
      );
    });
  });

  describe('spotLpInstruction', () => {
    it('throws when client account not found', async () => {
      const mockRpc = createMockRpc();
      const engine = new Engine(mockRpc as any);
      engine.tokens = createMockTokensMap();
      engine.instruments = createMockInstrumentsMap();

      // Set signer but no client account
      (engine as any).signer = 'MockSigner1111111111111111111111111111' as Address;
      (engine as any).clientPrimaryAccount = null;

      await expect(engine.spotLpInstruction({ instrId: 1, side: 0, amount: 100 })).rejects.toThrow(
        'Client account not found',
      );
    });

    it('calls buildSpotLpInstruction with correct args', async () => {
      const { engine } = await setupEngineWithClient();

      await engine.spotLpInstruction({ instrId: 1, side: 0, amount: 100 });

      expect(buildSpotLpInstruction).toHaveBeenCalledWith(
        expect.objectContaining({
          programId: engine.programId,
        }),
        { instrId: 1, side: 0, amount: 100 },
        expect.any(Object),
      );
    });
  });

  describe('newSpotOrderInstruction', () => {
    it('throws when client account not found', async () => {
      const mockRpc = createMockRpc();
      const engine = new Engine(mockRpc as any);
      engine.tokens = createMockTokensMap();
      engine.instruments = createMockInstrumentsMap();

      // Set signer but no client account
      (engine as any).signer = 'MockSigner1111111111111111111111111111' as Address;
      (engine as any).clientPrimaryAccount = null;

      await expect(engine.newSpotOrderInstruction({ instrId: 1, side: 0, price: 100, qty: 10 })).rejects.toThrow(
        'Client account not found',
      );
    });

    it('calls buildNewSpotOrderInstruction', async () => {
      const { engine } = await setupEngineWithClient();

      await engine.newSpotOrderInstruction({ instrId: 1, side: 0, price: 100, qty: 10 });

      expect(buildNewSpotOrderInstruction).toHaveBeenCalled();
    });
  });

  describe('spotQuotesReplaceInstruction', () => {
    it('calls buildSpotQuotesReplaceInstruction', async () => {
      const { engine } = await setupEngineWithClient();

      await engine.spotQuotesReplaceInstruction({
        instrId: 1,
        orders: [
          { newPrice: 99, newQty: 10, oldId: 1, side: 0 },
          { newPrice: 101, newQty: 10, oldId: 2, side: 1 },
        ],
      });

      expect(buildSpotQuotesReplaceInstruction).toHaveBeenCalled();
    });
  });

  describe('spotOrderCancelInstruction', () => {
    it('calls buildSpotOrderCancelInstruction', async () => {
      const { engine } = await setupEngineWithClient();

      await engine.spotOrderCancelInstruction({ instrId: 1, orderId: 12345, side: 0 });

      expect(buildSpotOrderCancelInstruction).toHaveBeenCalled();
    });
  });

  describe('spotMassCancelInstruction', () => {
    it('calls buildSpotMassCancelInstruction', async () => {
      const { engine } = await setupEngineWithClient();

      await engine.spotMassCancelInstruction({ instrId: 1 });

      expect(buildSpotMassCancelInstruction).toHaveBeenCalled();
    });
  });

  describe('swapInstruction', () => {
    it('calls buildSwapInstruction', async () => {
      const { engine } = await setupEngineWithClient();

      await engine.swapInstruction({
        assetMint: 'AssetMint1111111111111111111111111111' as Address,
        crncyMint: 'CrncyMint1111111111111111111111111111' as Address,
        amount: 100,
        limitPrice: 100,
        crncyInput: true,
        refFeeRate: 0,
        minAmountOut: 0,
      });

      expect(buildSwapInstruction).toHaveBeenCalled();
    });

    it('should not call buildSwapInstruction because refFeeRate out of maximum', async () => {
      const { engine } = await setupEngineWithClient();

      await expect(
        engine.swapInstruction({
          assetMint: 'AssetMint1111111111111111111111111111' as Address,
          crncyMint: 'CrncyMint1111111111111111111111111111' as Address,
          amount: 100,
          limitPrice: 100,
          crncyInput: true,
          refFeeRate: 0.0003,
          minAmountOut: 0,
        }),
      ).rejects.toThrow();
    });

    it('should not call buildSwapInstruction because minAmountOut below 0', async () => {
      const { engine } = await setupEngineWithClient();

      await expect(
        engine.swapInstruction({
          assetMint: 'AssetMint1111111111111111111111111111' as Address,
          crncyMint: 'CrncyMint1111111111111111111111111111' as Address,
          amount: 100,
          limitPrice: 100,
          crncyInput: true,
          refFeeRate: 0.0002,
          minAmountOut: -0.005,
        }),
      ).rejects.toThrow();
    });
  });

  // Perp instructions
  describe('upgradeToPerpInstructions', () => {
    it('throws when wallet not connected', async () => {
      const mockRpc = createMockRpc();
      const engine = new Engine(mockRpc as any);
      engine.instruments = createMockInstrumentsMap();

      await expect(engine.upgradeToPerpInstructions({ instrId: 1 })).rejects.toThrow('Wallet is not connected');
    });

    it('calls buildUpgradeToPerpInstructions', async () => {
      const { engine } = await setupEngineWithClient();

      await engine.upgradeToPerpInstructions({ instrId: 1 });

      expect(buildUpgradeToPerpInstructions).toHaveBeenCalled();
    });
  });

  describe('perpDepositInstruction', () => {
    it('throws when client account not found', async () => {
      const mockRpc = createMockRpc();
      const engine = new Engine(mockRpc as any);
      engine.tokens = createMockTokensMap();
      engine.instruments = createMockInstrumentsMap();

      // Set signer but no client account
      (engine as any).signer = 'MockSigner1111111111111111111111111111' as Address;
      (engine as any).clientPrimaryAccount = null;

      await expect(engine.perpDepositInstruction({ instrId: 1, amount: 100 })).rejects.toThrow(
        'Client account not found',
      );
    });

    it('calls buildPerpDepositInstruction', async () => {
      const { engine } = await setupEngineWithClient();

      await engine.perpDepositInstruction({ instrId: 1, amount: 100 });

      expect(buildPerpDepositInstruction).toHaveBeenCalled();
    });
  });

  describe('perpBuySeatInstruction', () => {
    it('calls buildPerpBuySeatInstruction', async () => {
      const { engine } = await setupEngineWithClient();

      await engine.perpBuySeatInstruction({ instrId: 1, amount: 50 });

      expect(buildPerpBuySeatInstruction).toHaveBeenCalled();
    });
  });

  describe('perpSellSeatInstruction', () => {
    it('calls buildPerpSellSeatInstruction', async () => {
      const { engine } = await setupEngineWithClient();

      await engine.perpSellSeatInstruction({ instrId: 1 });

      expect(buildPerpSellSeatInstruction).toHaveBeenCalled();
    });
  });

  describe('newPerpOrderInstruction', () => {
    it('calls buildNewPerpOrderInstruction', async () => {
      const { engine } = await setupEngineWithClient();

      await engine.newPerpOrderInstruction({ instrId: 1, side: 0, price: 100, qty: 10 });

      expect(buildNewPerpOrderInstruction).toHaveBeenCalled();
    });
  });

  describe('perpQuotesReplaceInstruction', () => {
    it('calls buildPerpQuotesReplaceInstruction', async () => {
      const { engine } = await setupEngineWithClient();

      await engine.perpQuotesReplaceInstruction({
        instrId: 1,
        orders: [
          { newPrice: 99, newQty: 10, oldId: 1, side: 0 },
          { newPrice: 101, newQty: 10, oldId: 2, side: 1 },
        ],
      });

      expect(buildPerpQuotesReplaceInstruction).toHaveBeenCalled();
    });
  });

  describe('perpOrderCancelInstruction', () => {
    it('calls buildPerpOrderCancelInstruction', async () => {
      const { engine } = await setupEngineWithClient();

      await engine.perpOrderCancelInstruction({ instrId: 1, orderId: 12345, side: 0 });

      expect(buildPerpOrderCancelInstruction).toHaveBeenCalled();
    });
  });

  describe('perpMassCancelInstruction', () => {
    it('calls buildPerpMassCancelInstruction', async () => {
      const { engine } = await setupEngineWithClient();

      await engine.perpMassCancelInstruction({ instrId: 1 });

      expect(buildPerpMassCancelInstruction).toHaveBeenCalled();
    });
  });

  describe('perpChangeLeverageInstruction', () => {
    it('calls buildPerpChangeLeverageInstruction', async () => {
      const { engine } = await setupEngineWithClient();

      await engine.perpChangeLeverageInstruction({ instrId: 1, leverage: 5 });

      expect(buildPerpChangeLeverageInstruction).toHaveBeenCalled();
    });
  });

  describe('perpStatisticsResetInstruction', () => {
    it('calls buildPerpStatisticsResetInstruction', async () => {
      const { engine } = await setupEngineWithClient();

      await engine.perpStatisticsResetInstruction({ instrId: 1 });

      expect(buildPerpStatisticsResetInstruction).toHaveBeenCalled();
    });
  });

  describe('newRefLinkInstruction', () => {
    it('calls buildNewRefLinkInstruction', async () => {
      const { engine } = await setupEngineWithClient();

      await engine.newRefLinkInstruction();

      expect(buildNewRefLinkInstruction).toHaveBeenCalled();
    });
  });

  describe('newInstrumentInstructions', () => {
    it('throws when wallet not connected', async () => {
      const mockRpc = createMockRpc();
      const engine = new Engine(mockRpc as any);

      await expect(
        engine.newInstrumentInstructions({
          assetMint: 'AssetMint1111111111111111111111111111' as Address,
          crncyMint: 'CrncyMint1111111111111111111111111111' as Address,
          initialPrice: 100,
          mask: 0,
          minQty: 0,
          fixedFeeRate: 0,
        }),
      ).rejects.toThrow('Wallet is not connected');
    });

    it('calls buildNewInstrumentInstructions', async () => {
      const { engine } = await setupEngineWithClient();

      await engine.newInstrumentInstructions({
        assetMint: 'AssetMint1111111111111111111111111111' as Address,
        crncyMint: 'CrncyMint1111111111111111111111111111' as Address,
        initialPrice: 100,
        mask: 0,
        minQty: 0,
        fixedFeeRate: 0,
      });

      expect(buildNewInstrumentInstructions).toHaveBeenCalled();
    });

    it('applies default values for mask, minQty, and fixedFeeRate when omitted', async () => {
      const { engine } = await setupEngineWithClient();

      await engine.newInstrumentInstructions({
        assetMint: 'AssetMint1111111111111111111111111111' as Address,
        crncyMint: 'CrncyMint1111111111111111111111111111' as Address,
        initialPrice: 100,
      });

      expect(buildNewInstrumentInstructions).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          mask: 0,
          minQty: 0,
          fixedFeeRate: 0,
        }),
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
      );
    });
  });

  describe('getClientData', () => {
    it('throws when client not found', async () => {
      const mockRpc = createMockRpc();
      const engine = new Engine(mockRpc as any);
      (engine as any).signer = 'MockSigner1111111111111111111111111111' as Address;
      (engine as any).clientPrimaryAccount = null;

      await expect(engine.getClientData()).rejects.toThrow('Client account not found');
    });
  });

  describe('getClientSpotOrdersInfo', () => {
    it('throws for invalid instrument', async () => {
      const { engine } = await setupEngineWithClient();

      await expect(engine.getClientSpotOrdersInfo({ instrId: 999, clientId: 1 })).rejects.toThrow(
        'Invalid Instrument ID',
      );
    });
  });

  describe('getClientPerpOrdersInfo', () => {
    it('throws for invalid instrument', async () => {
      const { engine } = await setupEngineWithClient();

      await expect(engine.getClientPerpOrdersInfo({ instrId: 999, clientId: 1 })).rejects.toThrow(
        'Invalid Instrument ID',
      );
    });
  });

  describe('getClientSpotOrders', () => {
    it('throws when originalClientId is null', async () => {
      const { engine } = await setupEngineWithClient();
      (engine as any).originalClientId = null;

      await expect(
        engine.getClientSpotOrders({ instrId: 1, bidsEntry: 0, bidsCount: 0, asksEntry: 0, asksCount: 0 }),
      ).rejects.toThrow('Original client ID not found');
    });
  });

  describe('getClientPerpOrders', () => {
    it('throws when originalClientId is null', async () => {
      const { engine } = await setupEngineWithClient();
      (engine as any).originalClientId = null;

      await expect(
        engine.getClientPerpOrders({ instrId: 1, bidsEntry: 0, bidsCount: 0, asksEntry: 0, asksCount: 0 }),
      ).rejects.toThrow('Original client ID not found');
    });
  });
});

// ============================================
// DATA UPDATE METHOD TESTS
// ============================================

describe('Engine data update methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addToken', () => {
    it('throws when getAccountInfo returns null', async () => {
      const mockRpc = createMockRpc();
      mockRpc.getAccountInfo = vi.fn().mockReturnValue({
        send: vi.fn().mockResolvedValue({ value: null }),
      });
      const engine = new Engine(mockRpc as any);
      (engine as any).rootStateModel = { tokensCount: 10 };

      await expect(engine.addToken('TokenAccount111111111111111111111' as Address)).rejects.toThrow(
        'Add Token Failed: getAccountInfo',
      );
    });
  });

  describe('addInstr', () => {
    it('throws when getAccountInfo returns null', async () => {
      const mockRpc = createMockRpc();
      mockRpc.getAccountInfo = vi.fn().mockReturnValue({
        send: vi.fn().mockResolvedValue({ value: null }),
      });
      const engine = new Engine(mockRpc as any);
      (engine as any).rootStateModel = { instrCount: 10 };

      await expect(engine.addInstr('InstrAccount111111111111111111111' as Address)).rejects.toThrow(
        'Add Instrument Failed: getAccountInfo',
      );
    });
  });

  describe('updateCommunity', () => {
    it('throws when getAccountInfo returns null', async () => {
      const mockRpc = createMockRpc();
      mockRpc.getAccountInfo = vi.fn().mockReturnValue({
        send: vi.fn().mockResolvedValue({ value: null }),
      });
      const engine = new Engine(mockRpc as any);
      engine.communityAccount = 'CommunityAccount1111111111111111111' as Address;

      await expect(engine.updateCommunity()).rejects.toThrow('Community Account: GetAccountInfo Failed');
    });
  });

  describe('updateRoot', () => {
    it('throws when getAccountInfo returns null', async () => {
      const mockRpc = createMockRpc();
      mockRpc.getAccountInfo = vi.fn().mockReturnValue({
        send: vi.fn().mockResolvedValue({ value: null }),
      });
      const engine = new Engine(mockRpc as any);
      engine.rootAccount = 'RootAccount11111111111111111111111' as Address;

      await expect(engine.updateRoot()).rejects.toThrow('Root Account: GetAccountInfo Failed');
    });
  });

  describe('updateInstrData', () => {
    it('throws when instrument not found', async () => {
      const { engine } = await setupEngineWithClient();
      vi.mocked(engine.updateInstrData).mockRestore();

      await expect(engine.updateInstrData({ instrId: 999 })).rejects.toThrow('Instrument not found');
    });
  });
});
