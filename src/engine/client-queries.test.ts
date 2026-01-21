import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Address } from '@solana/kit';
import { encode } from 'base64-arraybuffer';
import {
  ClientQueryContext,
  getClientData,
  getClientSpotOrdersInfo,
  getClientPerpOrdersInfo,
  getClientSpotOrders,
  getClientPerpOrders,
} from './client-queries';
import {
  TokenStateModel,
  InstrAccountHeaderModel,
  ClientPrimaryAccountHeaderModel,
  ClientCommunityAccountHeaderModel,
  SpotClientInfoModel,
  SpotClientInfo2Model,
  OrderModel,
} from '../structure_models';
import { Instrument } from '../types';

vi.mock('./account-helpers', () => ({
  getAccountByTag: vi.fn().mockResolvedValue('MockAccountByTag11111111111111' as Address),
  getInstrAccountByTag: vi.fn().mockResolvedValue('MockInstrAccount1111111111111' as Address),
  getTokenAccount: vi.fn().mockResolvedValue('MockTokenAccount111111111111111' as Address),
  findClientPrimaryAccount: vi.fn().mockResolvedValue('MockClientPrimary11111111111' as Address),
  findClientCommunityAccount: vi.fn().mockResolvedValue('MockClientCommunity111111111' as Address),
}));

vi.mock('./utils', () => ({
  getMultipleSpotOrders: vi.fn().mockReturnValue([]),
  getMultiplePerpOrders: vi.fn().mockReturnValue([]),
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
function createMockClientQueryContext(overrides: Partial<ClientQueryContext> = {}): ClientQueryContext {
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
    clientPrimaryAccount: 'ClientPrimary11111111111111111' as Address,
    clientCommunityAccount: 'ClientCommunity111111111111111' as Address,
    originalClientId: 12345,
    ...overrides,
  };
}

function createClientPrimaryBuffer(): Buffer {
  const buffer = Buffer.alloc(ClientPrimaryAccountHeaderModel.LENGTH + 64);
  buffer.writeUInt32LE(1, ClientPrimaryAccountHeaderModel.OFFSET_TAG);
  buffer.writeUInt32LE(1, ClientPrimaryAccountHeaderModel.OFFSET_VERSION);
  buffer.writeUInt32LE(100, ClientPrimaryAccountHeaderModel.OFFSET_ID);
  buffer.writeUInt32LE(0, ClientPrimaryAccountHeaderModel.OFFSET_MASK);
  buffer.writeUInt32LE(1000, ClientPrimaryAccountHeaderModel.OFFSET_POINTS);
  buffer.writeUInt32LE(12345, ClientPrimaryAccountHeaderModel.OFFSET_SLOT);
  buffer.writeUInt32LE(50, ClientPrimaryAccountHeaderModel.OFFSET_SPOT_TRADES);
  buffer.writeUInt32LE(25, ClientPrimaryAccountHeaderModel.OFFSET_LP_TRADES);
  buffer.writeUInt32LE(30, ClientPrimaryAccountHeaderModel.OFFSET_PERP_TRADES);
  buffer.writeUInt32LE(1, ClientPrimaryAccountHeaderModel.OFFSET_ASSETS_COUNT);
  const assetOffset = ClientPrimaryAccountHeaderModel.LENGTH;
  buffer.writeUInt32LE((1 << 28) | 1, assetOffset); // tag=1 (token), id=1
  buffer.writeUInt32LE(0, assetOffset + 4);
  buffer.writeBigInt64LE(BigInt(5000000000), assetOffset + 8); // 5 tokens
  return buffer;
}

function createClientCommunityBuffer(): Buffer {
  const buffer = Buffer.alloc(ClientCommunityAccountHeaderModel.LENGTH + 64);
  buffer.writeUInt32LE(2, ClientCommunityAccountHeaderModel.OFFSET_TAG);
  buffer.writeUInt32LE(1, ClientCommunityAccountHeaderModel.OFFSET_VERSION);
  buffer.writeUInt32LE(0, ClientCommunityAccountHeaderModel.OFFSET_COUNT);
  buffer.writeBigInt64LE(BigInt(1000000000), ClientCommunityAccountHeaderModel.OFFSET_DRVS_TOKENS);
  buffer.writeBigInt64LE(BigInt(500000000), ClientCommunityAccountHeaderModel.OFFSET_CURRENT_VOTING_TOKENS);
  buffer.writeBigInt64LE(BigInt(500000000), ClientCommunityAccountHeaderModel.OFFSET_LAST_VOTING_TOKENS);
  return buffer;
}

function createSpotClientInfoBuffer(): Buffer {
  const buffer = Buffer.alloc(32);
  buffer.writeUInt16LE(0, SpotClientInfoModel.OFFSET_BIDS_ENTRY);
  buffer.writeUInt16LE(2, SpotClientInfoModel.OFFSET_BIDS_ENTRY + 2);
  buffer.writeUInt16LE(10, SpotClientInfoModel.OFFSET_ASKS_ENTRY);
  buffer.writeUInt16LE(3, SpotClientInfoModel.OFFSET_ASKS_ENTRY + 2);
  buffer.writeBigInt64LE(BigInt(1000000000), SpotClientInfoModel.OFFSET_AVAIL_ASSET_TOKENS);
  buffer.writeBigInt64LE(BigInt(500000000), SpotClientInfoModel.OFFSET_AVAIL_CRNCY_TOKENS);
  return buffer;
}

function createSpotClientInfo2Buffer(): Buffer {
  const buffer = Buffer.alloc(32);
  buffer.writeUInt32LE(100, SpotClientInfo2Model.OFFSET_BID_SLOT);
  buffer.writeUInt32LE(101, SpotClientInfo2Model.OFFSET_ASK_SLOT);
  buffer.writeBigInt64LE(BigInt(2000000000), SpotClientInfo2Model.OFFSET_IN_ORDERS_ASSET_TOKENS);
  buffer.writeBigInt64LE(BigInt(1000000000), SpotClientInfo2Model.OFFSET_IN_ORDERS_CRNCY_TOKENS);
  return buffer;
}

function bufferToBase64(buffer: Buffer): string {
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  return encode(arrayBuffer);
}

function createMockRpc(responses: { getMultipleAccounts?: any; getAccountInfo?: any }) {
  return {
    getMultipleAccounts: vi.fn().mockReturnValue({
      send: vi.fn().mockResolvedValue(responses.getMultipleAccounts || { value: [], context: { slot: BigInt(12345) } }),
    }),
    getAccountInfo: vi.fn().mockReturnValue({
      send: vi.fn().mockResolvedValue(responses.getAccountInfo || { value: null, context: { slot: BigInt(12345) } }),
    }),
  };
}

describe('client-queries functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getClientData', () => {
    it('fetches and parses client data', async () => {
      const primaryBuffer = createClientPrimaryBuffer();
      const communityBuffer = createClientCommunityBuffer();

      const mockRpc = createMockRpc({
        getMultipleAccounts: {
          value: [
            { data: [bufferToBase64(primaryBuffer), 'base64'] },
            { data: [bufferToBase64(communityBuffer), 'base64'] },
          ],
          context: { slot: BigInt(12345) },
        },
      });

      const ctx = createMockClientQueryContext({ rpc: mockRpc as any });

      const result = await getClientData(ctx);

      expect(result).toBeDefined();
      expect(result.clientId).toBe(100);
      expect(result.points).toBe(1000);
      expect(result.slot).toBe(12345);
      expect(result.spotTrades).toBe(50);
      expect(result.lpTrades).toBe(25);
      expect(result.perpTrades).toBe(30);
      expect(result.tokens).toBeInstanceOf(Map);
      expect(result.lp).toBeInstanceOf(Map);
      expect(result.spot).toBeInstanceOf(Map);
      expect(result.perp).toBeInstanceOf(Map);
    });

    it('throws error when getMultipleAccounts returns null', async () => {
      const mockRpc = createMockRpc({
        getMultipleAccounts: { value: null, context: { slot: BigInt(12345) } },
      });

      const ctx = createMockClientQueryContext({ rpc: mockRpc as any });

      await expect(getClientData(ctx)).rejects.toThrow('GetClientData: GetAccountInfo failed');
    });

    it('parses token assets correctly', async () => {
      const primaryBuffer = createClientPrimaryBuffer();
      const communityBuffer = createClientCommunityBuffer();

      const mockRpc = createMockRpc({
        getMultipleAccounts: {
          value: [
            { data: [bufferToBase64(primaryBuffer), 'base64'] },
            { data: [bufferToBase64(communityBuffer), 'base64'] },
          ],
          context: { slot: BigInt(12345) },
        },
      });

      const ctx = createMockClientQueryContext({ rpc: mockRpc as any, uiNumbers: true });

      const result = await getClientData(ctx);

      expect(result.tokens.size).toBe(1);
      expect(result.tokens.get(1)).toBeDefined();
      expect(result.tokens.get(1)!.amount).toBe(5); // 5000000000 / 10^9
    });
  });

  describe('getClientSpotOrdersInfo', () => {
    it('fetches spot orders info for valid instrument', async () => {
      const infoBuffer = createSpotClientInfoBuffer();
      const info2Buffer = createSpotClientInfo2Buffer();

      const mockRpc = createMockRpc({
        getMultipleAccounts: {
          value: [{ data: [bufferToBase64(infoBuffer), 'base64'] }, { data: [bufferToBase64(info2Buffer), 'base64'] }],
          context: { slot: BigInt(12345) },
        },
      });

      const ctx = createMockClientQueryContext({ rpc: mockRpc as any });

      const result = await getClientSpotOrdersInfo(ctx, { instrId: 1, clientId: 0 });

      expect(result).toBeDefined();
      expect(result.contextSlot).toBe(12345);
      expect(result.bidSlot).toBe(100);
      expect(result.askSlot).toBe(101);
      expect(result.bidsEntry).toBe(0);
      expect(result.bidsCount).toBe(2);
      expect(result.asksEntry).toBe(10);
      expect(result.asksCount).toBe(3);
    });

    it('throws error for invalid instrument ID', async () => {
      const mockRpc = createMockRpc({});
      const ctx = createMockClientQueryContext({ rpc: mockRpc as any });

      await expect(getClientSpotOrdersInfo(ctx, { instrId: 999, clientId: 0 })).rejects.toThrow(
        'Invalid Instrument ID',
      );
    });

    it('throws error when account info not found', async () => {
      const mockRpc = createMockRpc({
        getMultipleAccounts: {
          value: [null, null],
          context: { slot: BigInt(12345) },
        },
      });

      const ctx = createMockClientQueryContext({ rpc: mockRpc as any });

      await expect(getClientSpotOrdersInfo(ctx, { instrId: 1, clientId: 0 })).rejects.toThrow('Orders Info Not Found');
    });
  });

  describe('getClientPerpOrdersInfo', () => {
    it('throws error for invalid instrument ID', async () => {
      const mockRpc = createMockRpc({});
      const ctx = createMockClientQueryContext({ rpc: mockRpc as any });

      await expect(getClientPerpOrdersInfo(ctx, { instrId: 999, clientId: 0 })).rejects.toThrow(
        'Invalid Instrument ID',
      );
    });

    it('throws error when account info not found', async () => {
      const mockRpc = createMockRpc({
        getMultipleAccounts: {
          value: [null, null, null, null, null],
          context: { slot: BigInt(12345) },
        },
      });

      const ctx = createMockClientQueryContext({ rpc: mockRpc as any });

      await expect(getClientPerpOrdersInfo(ctx, { instrId: 1, clientId: 0 })).rejects.toThrow('Orders Info Not Found');
    });
  });

  describe('getClientSpotOrders', () => {
    it('returns empty orders when no bids or asks', async () => {
      const mockRpc = createMockRpc({});
      const ctx = createMockClientQueryContext({ rpc: mockRpc as any });

      const result = await getClientSpotOrders(ctx, {
        instrId: 1,
        bidsEntry: 0,
        bidsCount: 0,
        asksEntry: 0,
        asksCount: 0,
      });

      expect(result).toBeDefined();
      expect(result.bids).toEqual([]);
      expect(result.asks).toEqual([]);
      expect(result.contextSlot).toBe(0);
    });

    it('fetches single bid order', async () => {
      const orderBuffer = Buffer.alloc(64);
      orderBuffer.writeBigInt64LE(BigInt(1000000000), OrderModel.OFFSET_QTY);
      orderBuffer.writeBigInt64LE(BigInt(100000000000), OrderModel.OFFSET_SUM);
      orderBuffer.writeBigInt64LE(BigInt(12345), OrderModel.OFFSET_ORDER_ID);
      orderBuffer.writeUInt32LE(100, OrderModel.OFFSET_ORIG_CLIENT_ID);

      const mockRpc = createMockRpc({
        getAccountInfo: {
          value: { data: [bufferToBase64(orderBuffer), 'base64'] },
          context: { slot: BigInt(12345) },
        },
      });

      const ctx = createMockClientQueryContext({ rpc: mockRpc as any, originalClientId: 100 });

      const result = await getClientSpotOrders(ctx, {
        instrId: 1,
        bidsEntry: 0,
        bidsCount: 1,
        asksEntry: 0,
        asksCount: 0,
      });

      expect(result).toBeDefined();
      expect(result.contextSlot).toBe(12345);
      expect(result.bids.length).toBe(1);
    });

    it('fetches single ask order', async () => {
      const orderBuffer = Buffer.alloc(64);
      orderBuffer.writeBigInt64LE(BigInt(2000000000), OrderModel.OFFSET_QTY);
      orderBuffer.writeBigInt64LE(BigInt(150000000000), OrderModel.OFFSET_SUM);
      orderBuffer.writeBigInt64LE(BigInt(67890), OrderModel.OFFSET_ORDER_ID);
      orderBuffer.writeUInt32LE(100, OrderModel.OFFSET_ORIG_CLIENT_ID);

      const mockRpc = createMockRpc({
        getAccountInfo: {
          value: { data: [bufferToBase64(orderBuffer), 'base64'] },
          context: { slot: BigInt(12345) },
        },
      });

      const ctx = createMockClientQueryContext({ rpc: mockRpc as any, originalClientId: 100 });

      const result = await getClientSpotOrders(ctx, {
        instrId: 1,
        bidsEntry: 0,
        bidsCount: 0,
        asksEntry: 0,
        asksCount: 1,
      });

      expect(result).toBeDefined();
      expect(result.contextSlot).toBe(12345);
      expect(result.asks.length).toBe(1);
    });
  });

  describe('getClientPerpOrders', () => {
    it('returns empty orders when no bids or asks', async () => {
      const mockRpc = createMockRpc({});
      const ctx = createMockClientQueryContext({ rpc: mockRpc as any });

      const result = await getClientPerpOrders(ctx, {
        instrId: 1,
        bidsEntry: 0,
        bidsCount: 0,
        asksEntry: 0,
        asksCount: 0,
      });

      expect(result).toBeDefined();
      expect(result.bids).toEqual([]);
      expect(result.asks).toEqual([]);
      expect(result.contextSlot).toBe(0);
    });

    it('fetches single bid order', async () => {
      const orderBuffer = Buffer.alloc(64);
      orderBuffer.writeBigInt64LE(BigInt(500000000), OrderModel.OFFSET_QTY);
      orderBuffer.writeBigInt64LE(BigInt(50000000000), OrderModel.OFFSET_SUM);
      orderBuffer.writeBigInt64LE(BigInt(11111), OrderModel.OFFSET_ORDER_ID);
      orderBuffer.writeUInt32LE(100, OrderModel.OFFSET_ORIG_CLIENT_ID);

      const mockRpc = createMockRpc({
        getAccountInfo: {
          value: { data: [bufferToBase64(orderBuffer), 'base64'] },
          context: { slot: BigInt(54321) },
        },
      });

      const ctx = createMockClientQueryContext({ rpc: mockRpc as any, originalClientId: 100 });

      const result = await getClientPerpOrders(ctx, {
        instrId: 1,
        bidsEntry: 0,
        bidsCount: 1,
        asksEntry: 0,
        asksCount: 0,
      });

      expect(result).toBeDefined();
      expect(result.contextSlot).toBe(54321);
      expect(result.bids.length).toBe(1);
    });
  });
});
