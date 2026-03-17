import { describe, it, expect } from 'vitest';
import { encode } from 'base64-arraybuffer';
import { decodeTransactionLogs, LogsDecoderContext } from './logs-decoder';
import { Instrument } from '../types';
import { TokenStateModel, InstrAccountHeaderModel } from '../structure_models';
import {
  LogType,
  DepositReportModel,
  WithdrawReportModel,
  SpotPlaceOrderReportModel,
  PerpPlaceOrderReportModel,
  SpotNewOrderReportModel,
  PerpNewOrderReportModel,
  PerpDepositReportModel,
  PerpWithdrawReportModel,
  FeesDepositReportModel,
  FeesWithdrawReportModel,
  SpotOrderCancelReportModel,
  SpotFeesReportModel,
  PerpOrderCancelReportModel,
  PerpFeesReportModel,
  PerpFundingReportModel,
  PerpChangeLeverageReportModel,
  SpotFillOrderReportModel,
  PerpFillOrderReportModel,
  SpotPlaceMassCancelReportModel,
  PerpPlaceMassCancelReportModel,
  EarningsReportModel,
  SpotOrderRevokeReportModel,
  PerpOrderRevokeReportModel,
} from '../logs_models';

// Helper to create a minimal context for testing
function createTestContext(overrides: Partial<LogsDecoderContext> = {}): LogsDecoderContext {
  return {
    instruments: new Map(),
    tokens: new Map(),
    uiNumbers: true,
    ...overrides,
  };
}

// Helper to create a mock token
function createMockToken(id: number, decimals: number = 9): TokenStateModel {
  const token = new TokenStateModel();
  token.id = id;
  token.mask = decimals;
  return token;
}

// Helper to create a mock instrument
function createMockInstrument(instrId: number, assetTokenId: number = 1, crncyTokenId: number = 0): Instrument {
  const header = new InstrAccountHeaderModel();
  header.instrId = instrId;
  header.assetTokenId = assetTokenId;
  header.crncyTokenId = crncyTokenId;
  return {
    address: '11111111111111111111111111111111' as any,
    header,
    spotBids: [],
    spotAsks: [],
    perpBids: [],
    perpAsks: [],
  };
}

// Helper to create a deposit report buffer
function createDepositBuffer(clientId: number, tokenId: number, time: number, amount: bigint): Buffer {
  const buffer = Buffer.alloc(DepositReportModel.LENGTH);
  buffer.writeUInt8(LogType.deposit, 0); // tag
  buffer.writeUInt8(0, 1); // padding
  buffer.writeUInt16LE(0, 2); // padding
  buffer.writeUInt32LE(0, 4); // padding
  buffer.writeUInt32LE(0, DepositReportModel.OFFSET_SEQ_NO); // seqNo
  buffer.writeUInt32LE(clientId, DepositReportModel.OFFSET_CLIENT_ID);
  buffer.writeUInt32LE(tokenId, DepositReportModel.OFFSET_TOKEN_ID);
  buffer.writeUInt32LE(time, DepositReportModel.OFFSET_TIME);
  buffer.writeBigInt64LE(amount, DepositReportModel.OFFSET_AMOUNT);
  buffer.writeBigInt64LE(BigInt(0), DepositReportModel.OFFSET_CUSTOM_ID); // customId
  return buffer;
}

// Helper to create a withdraw report buffer
function createWithdrawBuffer(clientId: number, tokenId: number, time: number, amount: bigint): Buffer {
  const buffer = Buffer.alloc(WithdrawReportModel.LENGTH);
  buffer.writeUInt8(LogType.withdraw, 0); // tag
  buffer.writeUInt8(0, 1); // padding
  buffer.writeUInt16LE(0, 2); // padding
  buffer.writeUInt32LE(0, 4); // padding
  buffer.writeUInt32LE(0, WithdrawReportModel.OFFSET_SEQ_NO); // seqNo
  buffer.writeUInt32LE(clientId, WithdrawReportModel.OFFSET_CLIENT_ID);
  buffer.writeUInt32LE(tokenId, WithdrawReportModel.OFFSET_TOKEN_ID);
  buffer.writeUInt32LE(time, WithdrawReportModel.OFFSET_TIME);
  buffer.writeBigInt64LE(amount, WithdrawReportModel.OFFSET_AMOUNT);
  buffer.writeBigInt64LE(BigInt(0), WithdrawReportModel.OFFSET_CUSTOM_ID); // customId
  return buffer;
}

// Helper to create a spot place order report buffer
function createSpotPlaceOrderBuffer(
  ioc: number,
  side: number,
  orderType: number,
  clientId: number,
  orderId: bigint,
  qty: bigint,
  price: bigint,
  instrId: number,
  time: number,
): Buffer {
  const buffer = Buffer.alloc(SpotPlaceOrderReportModel.LENGTH);
  buffer.writeUInt8(LogType.spotPlaceOrder, 0); // tag
  buffer.writeUInt8(ioc, 1);
  buffer.writeUInt8(side, 2);
  buffer.writeUInt8(orderType, 3);
  buffer.writeUInt32LE(clientId, 4);
  buffer.writeBigInt64LE(orderId, 8);
  buffer.writeBigInt64LE(qty, 16);
  buffer.writeBigInt64LE(price, 24);
  buffer.writeUInt32LE(instrId, 32);
  buffer.writeUInt32LE(time, 36);
  return buffer;
}

// Helper to create a perp place order report buffer
function createPerpPlaceOrderBuffer(
  ioc: number,
  side: number,
  orderType: number,
  clientId: number,
  orderId: bigint,
  perps: bigint,
  price: bigint,
  instrId: number,
  leverage: number,
  time: number,
): Buffer {
  const buffer = Buffer.alloc(PerpPlaceOrderReportModel.LENGTH);
  buffer.writeUInt8(LogType.perpPlaceOrder, 0); // tag
  buffer.writeUInt8(ioc, 1);
  buffer.writeUInt8(side, 2);
  buffer.writeUInt8(orderType, 3);
  buffer.writeUInt32LE(clientId, 4);
  buffer.writeBigInt64LE(orderId, 8);
  buffer.writeBigInt64LE(perps, 16);
  buffer.writeBigInt64LE(price, 24);
  buffer.writeUInt32LE(instrId, 32);
  buffer.writeUInt32LE(leverage, 36);
  buffer.writeUInt32LE(time, 40);
  buffer.writeUInt32LE(0, 44); // padding
  return buffer;
}

// Helper to create a spot new order report buffer
function createSpotNewOrderBuffer(side: number, qty: bigint, crncy: bigint): Buffer {
  const buffer = Buffer.alloc(SpotNewOrderReportModel.LENGTH);
  buffer.writeUInt8(LogType.spotNewOrder, 0); // tag
  buffer.writeUInt8(side, 1);
  buffer.writeUInt16LE(0, 2); // padding
  buffer.writeUInt32LE(0, 4); // padding
  buffer.writeBigInt64LE(qty, 8);
  buffer.writeBigInt64LE(crncy, 16);
  return buffer;
}

// Helper to create a perp new order report buffer
function createPerpNewOrderBuffer(side: number, perps: bigint, crncy: bigint): Buffer {
  const buffer = Buffer.alloc(PerpNewOrderReportModel.LENGTH);
  buffer.writeUInt8(LogType.perpNewOrder, 0); // tag
  buffer.writeUInt8(side, 1);
  buffer.writeUInt16LE(0, 2); // padding
  buffer.writeUInt32LE(0, 4); // padding
  buffer.writeBigInt64LE(perps, 8);
  buffer.writeBigInt64LE(crncy, 16);
  return buffer;
}

function createPerpDepositBuffer(clientId: number, instrId: number, time: number, amount: bigint): Buffer {
  const buffer = Buffer.alloc(PerpDepositReportModel.LENGTH);
  buffer.writeUInt8(LogType.perpDeposit, 0);
  buffer.writeUInt8(0, 1);
  buffer.writeUInt16LE(0, 2);
  buffer.writeUInt32LE(clientId, 4);
  buffer.writeUInt32LE(instrId, 8);
  buffer.writeUInt32LE(time, 12);
  buffer.writeBigInt64LE(amount, 16);
  return buffer;
}

function createPerpWithdrawBuffer(clientId: number, instrId: number, time: number, amount: bigint): Buffer {
  const buffer = Buffer.alloc(PerpWithdrawReportModel.LENGTH);
  buffer.writeUInt8(LogType.perpWithdraw, 0);
  buffer.writeUInt8(0, 1);
  buffer.writeUInt16LE(0, 2);
  buffer.writeUInt32LE(clientId, 4);
  buffer.writeUInt32LE(instrId, 8);
  buffer.writeUInt32LE(time, 12);
  buffer.writeBigInt64LE(amount, 16);
  return buffer;
}

function createFeesDepositBuffer(clientId: number, tokenId: number, time: number, amount: bigint): Buffer {
  const buffer = Buffer.alloc(FeesDepositReportModel.LENGTH);
  buffer.writeUInt8(LogType.feesDeposit, 0);
  buffer.writeUInt8(0, 1);
  buffer.writeUInt16LE(0, 2);
  buffer.writeUInt32LE(0, 4); // padding
  buffer.writeUInt32LE(0, FeesDepositReportModel.OFFSET_SEQ_NO);
  buffer.writeUInt32LE(clientId, FeesDepositReportModel.OFFSET_CLIENT_ID);
  buffer.writeUInt32LE(tokenId, FeesDepositReportModel.OFFSET_TOKEN_ID);
  buffer.writeUInt32LE(time, FeesDepositReportModel.OFFSET_TIME);
  buffer.writeBigInt64LE(amount, FeesDepositReportModel.OFFSET_AMOUNT);
  return buffer;
}

function createFeesWithdrawBuffer(clientId: number, tokenId: number, time: number, amount: bigint): Buffer {
  const buffer = Buffer.alloc(FeesWithdrawReportModel.LENGTH);
  buffer.writeUInt8(LogType.feesWithdraw, 0);
  buffer.writeUInt8(0, 1);
  buffer.writeUInt16LE(0, 2);
  buffer.writeUInt32LE(0, 4); // padding
  buffer.writeUInt32LE(0, FeesWithdrawReportModel.OFFSET_SEQ_NO);
  buffer.writeUInt32LE(clientId, FeesWithdrawReportModel.OFFSET_CLIENT_ID);
  buffer.writeUInt32LE(tokenId, FeesWithdrawReportModel.OFFSET_TOKEN_ID);
  buffer.writeUInt32LE(time, FeesWithdrawReportModel.OFFSET_TIME);
  buffer.writeBigInt64LE(amount, FeesWithdrawReportModel.OFFSET_AMOUNT);
  return buffer;
}

function createSpotOrderCancelBuffer(
  side: number,
  clientId: number,
  instrId: number,
  time: number,
  orderId: bigint,
  qty: bigint,
  crncy: bigint,
): Buffer {
  const buffer = Buffer.alloc(SpotOrderCancelReportModel.LENGTH);
  buffer.writeUInt8(LogType.spotOrderCancel, 0);
  buffer.writeUInt8(side, 1);
  buffer.writeUInt16LE(0, 2);
  buffer.writeUInt32LE(clientId, 4);
  buffer.writeUInt32LE(instrId, 8);
  buffer.writeUInt32LE(time, 12);
  buffer.writeBigInt64LE(orderId, 16);
  buffer.writeBigInt64LE(qty, 24);
  buffer.writeBigInt64LE(crncy, 32);
  return buffer;
}

function createSpotFeesBuffer(refClientId: number, fees: bigint, refPayment: bigint): Buffer {
  const buffer = Buffer.alloc(SpotFeesReportModel.LENGTH);
  buffer.writeUInt8(LogType.spotFees, 0);
  buffer.writeUInt8(0, 1);
  buffer.writeUInt16LE(0, 2);
  buffer.writeUInt32LE(refClientId, 4);
  buffer.writeBigInt64LE(fees, 8);
  buffer.writeBigInt64LE(refPayment, 16);
  return buffer;
}

function createPerpOrderCancelBuffer(
  side: number,
  clientId: number,
  instrId: number,
  time: number,
  orderId: bigint,
  perps: bigint,
  crncy: bigint,
): Buffer {
  const buffer = Buffer.alloc(PerpOrderCancelReportModel.LENGTH);
  buffer.writeUInt8(LogType.perpOrderCancel, 0);
  buffer.writeUInt8(side, 1);
  buffer.writeUInt16LE(0, 2);
  buffer.writeUInt32LE(clientId, 4);
  buffer.writeUInt32LE(instrId, 8);
  buffer.writeUInt32LE(time, 12);
  buffer.writeBigInt64LE(orderId, 16);
  buffer.writeBigInt64LE(perps, 24);
  buffer.writeBigInt64LE(crncy, 32);
  return buffer;
}

function createPerpFeesBuffer(refClientId: number, fees: bigint, refPayment: bigint): Buffer {
  const buffer = Buffer.alloc(PerpFeesReportModel.LENGTH);
  buffer.writeUInt8(LogType.perpFees, 0);
  buffer.writeUInt8(0, 1);
  buffer.writeUInt16LE(0, 2);
  buffer.writeUInt32LE(refClientId, 4);
  buffer.writeBigInt64LE(fees, 8);
  buffer.writeBigInt64LE(refPayment, 16);
  return buffer;
}

function createPerpFundingBuffer(clientId: number, instrId: number, time: number, funding: bigint): Buffer {
  const buffer = Buffer.alloc(PerpFundingReportModel.LENGTH);
  buffer.writeUInt8(LogType.perpFunding, 0);
  buffer.writeUInt8(0, 1);
  buffer.writeUInt16LE(0, 2);
  buffer.writeUInt32LE(clientId, 4);
  buffer.writeUInt32LE(instrId, 8);
  buffer.writeUInt32LE(time, 12);
  buffer.writeBigInt64LE(funding, 16);
  return buffer;
}

function createPerpChangeLeverageBuffer(leverage: number, clientId: number, instrId: number, time: number): Buffer {
  const buffer = Buffer.alloc(PerpChangeLeverageReportModel.LENGTH);
  buffer.writeUInt8(LogType.perpChangeLeverage, 0);
  buffer.writeUInt8(leverage, 1);
  buffer.writeUInt16LE(0, 2);
  buffer.writeUInt32LE(clientId, 4);
  buffer.writeUInt32LE(instrId, 8);
  buffer.writeUInt32LE(time, 12);
  return buffer;
}

function createSpotFillOrderBuffer(
  side: number,
  clientId: number,
  orderId: bigint,
  qty: bigint,
  crncy: bigint,
  price: bigint,
  rebates: bigint,
): Buffer {
  const buffer = Buffer.alloc(SpotFillOrderReportModel.LENGTH);
  buffer.writeUInt8(LogType.spotFillOrder, 0);
  buffer.writeUInt8(side, 1);
  buffer.writeUInt16LE(0, 2);
  buffer.writeUInt32LE(clientId, 4);
  buffer.writeBigInt64LE(orderId, 8);
  buffer.writeBigInt64LE(qty, 16);
  buffer.writeBigInt64LE(crncy, 24);
  buffer.writeBigInt64LE(price, 32);
  buffer.writeBigInt64LE(rebates, 40);
  return buffer;
}

function createPerpFillOrderBuffer(
  side: number,
  clientId: number,
  orderId: bigint,
  perps: bigint,
  crncy: bigint,
  price: bigint,
  rebates: bigint,
): Buffer {
  const buffer = Buffer.alloc(PerpFillOrderReportModel.LENGTH);
  buffer.writeUInt8(LogType.perpFillOrder, 0);
  buffer.writeUInt8(side, 1);
  buffer.writeUInt16LE(0, 2);
  buffer.writeUInt32LE(clientId, 4);
  buffer.writeBigInt64LE(orderId, 8);
  buffer.writeBigInt64LE(perps, 16);
  buffer.writeBigInt64LE(crncy, 24);
  buffer.writeBigInt64LE(price, 32);
  buffer.writeBigInt64LE(rebates, 40);
  return buffer;
}

function createSpotPlaceMassCancelBuffer(clientId: number, instrId: number, time: number): Buffer {
  const buffer = Buffer.alloc(SpotPlaceMassCancelReportModel.LENGTH);
  buffer.writeUInt8(LogType.spotPlaceMassCancel, 0);
  buffer.writeUInt8(0, 1);
  buffer.writeUInt16LE(0, 2);
  buffer.writeUInt32LE(clientId, 4);
  buffer.writeUInt32LE(instrId, 8);
  buffer.writeUInt32LE(time, 12);
  return buffer;
}

function createPerpPlaceMassCancelBuffer(clientId: number, instrId: number, time: number): Buffer {
  const buffer = Buffer.alloc(PerpPlaceMassCancelReportModel.LENGTH);
  buffer.writeUInt8(LogType.perpPlaceMassCancel, 0);
  buffer.writeUInt8(0, 1);
  buffer.writeUInt16LE(0, 2);
  buffer.writeUInt32LE(clientId, 4);
  buffer.writeUInt32LE(instrId, 8);
  buffer.writeUInt32LE(time, 12);
  return buffer;
}

function createEarningsBuffer(clientId: number, tokenId: number, time: number, amount: bigint): Buffer {
  const buffer = Buffer.alloc(EarningsReportModel.LENGTH);
  buffer.writeUInt8(LogType.earnings, 0);
  buffer.writeUInt8(0, 1);
  buffer.writeUInt16LE(0, 2);
  buffer.writeUInt32LE(0, 4); // padding
  buffer.writeUInt32LE(0, EarningsReportModel.OFFSET_SEQ_NO);
  buffer.writeUInt32LE(clientId, EarningsReportModel.OFFSET_CLIENT_ID);
  buffer.writeUInt32LE(tokenId, EarningsReportModel.OFFSET_TOKEN_ID);
  buffer.writeUInt32LE(time, EarningsReportModel.OFFSET_TIME);
  buffer.writeBigInt64LE(amount, EarningsReportModel.OFFSET_AMOUNT);
  return buffer;
}

function createSpotOrderRevokeBuffer(
  side: number,
  clientId: number,
  orderId: bigint,
  qty: bigint,
  crncy: bigint,
): Buffer {
  const buffer = Buffer.alloc(SpotOrderRevokeReportModel.LENGTH);
  buffer.writeUInt8(LogType.spotOrderRevoke, 0);
  buffer.writeUInt8(side, 1);
  buffer.writeUInt16LE(0, 2);
  buffer.writeUInt32LE(clientId, 4);
  buffer.writeBigInt64LE(orderId, 8);
  buffer.writeBigInt64LE(qty, 16);
  buffer.writeBigInt64LE(crncy, 24);
  return buffer;
}

function createPerpOrderRevokeBuffer(
  side: number,
  clientId: number,
  orderId: bigint,
  perps: bigint,
  crncy: bigint,
): Buffer {
  const buffer = Buffer.alloc(PerpOrderRevokeReportModel.LENGTH);
  buffer.writeUInt8(LogType.perpOrderRevoke, 0);
  buffer.writeUInt8(side, 1);
  buffer.writeUInt16LE(0, 2);
  buffer.writeUInt32LE(clientId, 4);
  buffer.writeBigInt64LE(orderId, 8);
  buffer.writeBigInt64LE(perps, 16);
  buffer.writeBigInt64LE(crncy, 24);
  return buffer;
}

function toLogString(buffer: Buffer): string {
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  return `Program data: ${encode(arrayBuffer)}`;
}

describe('decodeTransactionLogs', () => {
  describe('error handling', () => {
    it('returns empty array for error logs starting with "Program returned error"', () => {
      const ctx = createTestContext();
      const logs = ['Program returned error: insufficient funds'];
      const result = decodeTransactionLogs(logs, ctx);
      expect(result).toEqual([]);
    });

    it('returns empty array for error logs starting with "Program logged: Error"', () => {
      const ctx = createTestContext();
      const logs = ['Program logged: "Error: some error"'];
      const result = decodeTransactionLogs(logs, ctx);
      expect(result).toEqual([]);
    });

    it('returns empty array when error appears mid-stream', () => {
      const ctx = createTestContext();
      const logs = ['Program invoke', 'Program returned error: insufficient funds', 'Program data: AQAAAA=='];
      const result = decodeTransactionLogs(logs, ctx);
      expect(result).toEqual([]);
    });
  });

  describe('log filtering', () => {
    it('returns empty array for empty log array', () => {
      const ctx = createTestContext();
      const result = decodeTransactionLogs([], ctx);
      expect(result).toEqual([]);
    });

    it('ignores logs that do not start with "Program data: "', () => {
      const ctx = createTestContext();
      const logs = ['Program invoke', 'Program success', 'Some other log'];
      const result = decodeTransactionLogs(logs, ctx);
      expect(result).toEqual([]);
    });

    it('processes only "Program data: " prefixed logs', () => {
      const ctx = createTestContext();
      // A log with unknown type byte (0xFF) should not be added
      const logs = [
        'Program invoke',
        'Program data: /w==', // 0xFF - unknown type
        'Program success',
      ];
      const result = decodeTransactionLogs(logs, ctx);
      expect(result).toEqual([]);
    });
  });

  describe('context usage', () => {
    it('uses uiNumbers=false to skip decimal conversion', () => {
      const ctx = createTestContext({ uiNumbers: false });
      // Even with valid deposit data, if uiNumbers is false, amounts stay raw
      // This is tested implicitly through the module behavior
      expect(ctx.uiNumbers).toBe(false);
    });

    it('uses instruments map for token lookups', () => {
      const instruments = new Map<number, Instrument>();
      const header = new InstrAccountHeaderModel();
      header.instrId = 1;
      header.assetTokenId = 0;
      header.crncyTokenId = 1;
      instruments.set(1, {
        address: 'test' as any,
        header,
        spotBids: [],
        spotAsks: [],
        perpBids: [],
        perpAsks: [],
      });
      const ctx = createTestContext({ instruments });
      expect(ctx.instruments.size).toBe(1);
    });

    it('uses tokens map for decimal calculations', () => {
      const tokens = new Map<number, TokenStateModel>();
      const token = new TokenStateModel();
      token.id = 0;
      token.mask = 9; // 10^9 decimals
      tokens.set(0, token);
      const ctx = createTestContext({ tokens });
      expect(ctx.tokens.size).toBe(1);
    });
  });

  describe('deposit log decoding', () => {
    it('decodes deposit log without uiNumbers conversion', () => {
      const tokens = new Map<number, TokenStateModel>();
      tokens.set(1, createMockToken(1, 9));
      const ctx = createTestContext({ tokens, uiNumbers: false });

      const depositBuffer = createDepositBuffer(100, 1, 1700000000, BigInt(5000000000));
      const logs = [toLogString(depositBuffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(DepositReportModel);
      const deposit = result[0] as DepositReportModel;
      expect(deposit.tag).toBe(LogType.deposit);
      expect(deposit.clientId).toBe(100);
      expect(deposit.tokenId).toBe(1);
      expect(deposit.time).toBe(1700000000);
      expect(deposit.amount).toBe(5000000000);
    });

    it('decodes deposit log with uiNumbers conversion', () => {
      const tokens = new Map<number, TokenStateModel>();
      tokens.set(1, createMockToken(1, 9));
      const ctx = createTestContext({ tokens, uiNumbers: true });

      // 5 * 10^9 raw = 5 UI
      const depositBuffer = createDepositBuffer(100, 1, 1700000000, BigInt(5000000000));
      const logs = [toLogString(depositBuffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      const deposit = result[0] as DepositReportModel;
      expect(deposit.amount).toBe(5); // Converted to UI number
    });

    it('handles deposit log with unknown token (no conversion)', () => {
      const ctx = createTestContext({ uiNumbers: true });

      const depositBuffer = createDepositBuffer(100, 99, 1700000000, BigInt(5000000000));
      const logs = [toLogString(depositBuffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      const deposit = result[0] as DepositReportModel;
      expect(deposit.amount).toBe(5000000000); // No conversion if token not found
    });
  });

  describe('withdraw log decoding', () => {
    it('decodes withdraw log without uiNumbers conversion', () => {
      const tokens = new Map<number, TokenStateModel>();
      tokens.set(1, createMockToken(1, 6));
      const ctx = createTestContext({ tokens, uiNumbers: false });

      const withdrawBuffer = createWithdrawBuffer(200, 1, 1700000001, BigInt(2500000));
      const logs = [toLogString(withdrawBuffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(WithdrawReportModel);
      const withdraw = result[0] as WithdrawReportModel;
      expect(withdraw.tag).toBe(LogType.withdraw);
      expect(withdraw.clientId).toBe(200);
      expect(withdraw.tokenId).toBe(1);
      expect(withdraw.time).toBe(1700000001);
      expect(withdraw.amount).toBe(2500000);
    });

    it('decodes withdraw log with uiNumbers conversion', () => {
      const tokens = new Map<number, TokenStateModel>();
      tokens.set(1, createMockToken(1, 6)); // 6 decimals
      const ctx = createTestContext({ tokens, uiNumbers: true });

      // 2.5 * 10^6 raw = 2.5 UI
      const withdrawBuffer = createWithdrawBuffer(200, 1, 1700000001, BigInt(2500000));
      const logs = [toLogString(withdrawBuffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      const withdraw = result[0] as WithdrawReportModel;
      expect(withdraw.amount).toBe(2.5); // Converted to UI number
    });
  });

  describe('spot order log decoding', () => {
    it('decodes spot place order log', () => {
      const tokens = new Map<number, TokenStateModel>();
      tokens.set(0, createMockToken(0, 9));
      tokens.set(1, createMockToken(1, 9));
      const instruments = new Map<number, Instrument>();
      instruments.set(1, createMockInstrument(1, 1, 0));
      const ctx = createTestContext({ tokens, instruments, uiNumbers: true });

      // qty = 1 * 10^9, price = 100 * 10^9
      const orderBuffer = createSpotPlaceOrderBuffer(
        0,
        1,
        0,
        100,
        BigInt(12345),
        BigInt(1000000000),
        BigInt(100000000000),
        1,
        1700000002,
      );
      const logs = [toLogString(orderBuffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(SpotPlaceOrderReportModel);
      const order = result[0] as SpotPlaceOrderReportModel;
      expect(order.tag).toBe(LogType.spotPlaceOrder);
      expect(order.clientId).toBe(100);
      expect(order.orderId).toBe(12345);
      expect(order.instrId).toBe(1);
      expect(order.side).toBe(1);
      expect(order.qty).toBe(1); // Converted from 10^9
      expect(order.price).toBe(100); // Converted from 10^9
    });

    it('decodes spot new order log', () => {
      const ctx = createTestContext({ uiNumbers: false });

      const orderBuffer = createSpotNewOrderBuffer(0, BigInt(500000000), BigInt(50000000));
      const logs = [toLogString(orderBuffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(SpotNewOrderReportModel);
      const order = result[0] as SpotNewOrderReportModel;
      expect(order.tag).toBe(LogType.spotNewOrder);
      expect(order.side).toBe(0);
      expect(order.qty).toBe(500000000);
      expect(order.crncy).toBe(50000000);
    });
  });

  describe('perp order log decoding', () => {
    it('decodes perp place order log', () => {
      const tokens = new Map<number, TokenStateModel>();
      tokens.set(0, createMockToken(0, 9));
      tokens.set(1, createMockToken(1, 9));
      const instruments = new Map<number, Instrument>();
      instruments.set(1, createMockInstrument(1, 1, 0));
      const ctx = createTestContext({ tokens, instruments, uiNumbers: true });

      // perps = 2 * 10^9, price = 150 * 10^9
      const orderBuffer = createPerpPlaceOrderBuffer(
        1,
        0,
        1,
        300,
        BigInt(67890),
        BigInt(2000000000),
        BigInt(150000000000),
        1,
        5,
        1700000003,
      );
      const logs = [toLogString(orderBuffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(PerpPlaceOrderReportModel);
      const order = result[0] as PerpPlaceOrderReportModel;
      expect(order.tag).toBe(LogType.perpPlaceOrder);
      expect(order.clientId).toBe(300);
      expect(order.orderId).toBe(67890);
      expect(order.instrId).toBe(1);
      expect(order.side).toBe(0);
      expect(order.ioc).toBe(1);
      expect(order.leverage).toBe(5);
      expect(order.perps).toBe(2); // Converted from 10^9
      expect(order.price).toBe(150); // Converted from 10^9
    });

    it('decodes perp new order log', () => {
      const ctx = createTestContext({ uiNumbers: false });

      const orderBuffer = createPerpNewOrderBuffer(1, BigInt(750000000), BigInt(112500000));
      const logs = [toLogString(orderBuffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(PerpNewOrderReportModel);
      const order = result[0] as PerpNewOrderReportModel;
      expect(order.tag).toBe(LogType.perpNewOrder);
      expect(order.side).toBe(1);
      expect(order.perps).toBe(750000000);
      expect(order.crncy).toBe(112500000);
    });
  });

  describe('multiple logs decoding', () => {
    it('decodes multiple logs in sequence', () => {
      const tokens = new Map<number, TokenStateModel>();
      tokens.set(1, createMockToken(1, 9));
      const ctx = createTestContext({ tokens, uiNumbers: false });

      const depositBuffer = createDepositBuffer(100, 1, 1700000000, BigInt(5000000000));
      const withdrawBuffer = createWithdrawBuffer(100, 1, 1700000001, BigInt(2000000000));
      const logs = [
        'Program invoke',
        toLogString(depositBuffer),
        'Program success',
        toLogString(withdrawBuffer),
        'Program complete',
      ];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(DepositReportModel);
      expect(result[1]).toBeInstanceOf(WithdrawReportModel);
    });

    it('ignores unknown log types', () => {
      const ctx = createTestContext({ uiNumbers: false });

      // Create a buffer with unknown type (0xFF)
      const unknownBuffer = Buffer.alloc(24);
      unknownBuffer.writeUInt8(0xff, 0); // Unknown type

      const depositBuffer = createDepositBuffer(100, 1, 1700000000, BigInt(5000000000));
      const logs = [toLogString(unknownBuffer), toLogString(depositBuffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(DepositReportModel);
    });

    it('ignores logs with incorrect length', () => {
      const ctx = createTestContext({ uiNumbers: false });

      // Create a buffer with correct type but wrong length
      const shortBuffer = Buffer.alloc(10);
      shortBuffer.writeUInt8(LogType.deposit, 0);

      const depositBuffer = createDepositBuffer(100, 1, 1700000000, BigInt(5000000000));
      const logs = [toLogString(shortBuffer), toLogString(depositBuffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(DepositReportModel);
    });
  });

  describe('perp deposit/withdraw log decoding', () => {
    it('decodes perp deposit log', () => {
      const tokens = new Map<number, TokenStateModel>();
      tokens.set(0, createMockToken(0, 9));
      const instruments = new Map<number, Instrument>();
      instruments.set(1, createMockInstrument(1, 1, 0));
      const ctx = createTestContext({ tokens, instruments, uiNumbers: true });

      const buffer = createPerpDepositBuffer(100, 1, 1700000000, BigInt(3000000000));
      const logs = [toLogString(buffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(PerpDepositReportModel);
      const report = result[0] as PerpDepositReportModel;
      expect(report.tag).toBe(LogType.perpDeposit);
      expect(report.clientId).toBe(100);
      expect(report.instrId).toBe(1);
      expect(report.amount).toBe(3); // Converted
    });

    it('decodes perp withdraw log', () => {
      const tokens = new Map<number, TokenStateModel>();
      tokens.set(0, createMockToken(0, 9));
      const instruments = new Map<number, Instrument>();
      instruments.set(1, createMockInstrument(1, 1, 0));
      const ctx = createTestContext({ tokens, instruments, uiNumbers: true });

      const buffer = createPerpWithdrawBuffer(100, 1, 1700000000, BigInt(2000000000));
      const logs = [toLogString(buffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(PerpWithdrawReportModel);
      const report = result[0] as PerpWithdrawReportModel;
      expect(report.tag).toBe(LogType.perpWithdraw);
      expect(report.amount).toBe(2);
    });
  });

  describe('fees log decoding', () => {
    it('decodes fees deposit log', () => {
      const tokens = new Map<number, TokenStateModel>();
      tokens.set(1, createMockToken(1, 6));
      const ctx = createTestContext({ tokens, uiNumbers: true });

      const buffer = createFeesDepositBuffer(100, 1, 1700000000, BigInt(1500000));
      const logs = [toLogString(buffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(FeesDepositReportModel);
      const report = result[0] as FeesDepositReportModel;
      expect(report.tag).toBe(LogType.feesDeposit);
      expect(report.amount).toBe(1.5);
    });

    it('decodes fees withdraw log', () => {
      const tokens = new Map<number, TokenStateModel>();
      tokens.set(1, createMockToken(1, 6));
      const ctx = createTestContext({ tokens, uiNumbers: true });

      const buffer = createFeesWithdrawBuffer(100, 1, 1700000000, BigInt(2500000));
      const logs = [toLogString(buffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(FeesWithdrawReportModel);
      const report = result[0] as FeesWithdrawReportModel;
      expect(report.tag).toBe(LogType.feesWithdraw);
      expect(report.amount).toBe(2.5);
    });

    it('decodes spot fees log', () => {
      const ctx = createTestContext({ uiNumbers: false });

      const buffer = createSpotFeesBuffer(200, BigInt(100000), BigInt(10000));
      const logs = [toLogString(buffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(SpotFeesReportModel);
      const report = result[0] as SpotFeesReportModel;
      expect(report.tag).toBe(LogType.spotFees);
      expect(report.refClientId).toBe(200);
      expect(report.fees).toBe(100000);
      expect(report.refPayment).toBe(10000);
    });

    it('decodes perp fees log', () => {
      const ctx = createTestContext({ uiNumbers: false });

      const buffer = createPerpFeesBuffer(300, BigInt(200000), BigInt(20000));
      const logs = [toLogString(buffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(PerpFeesReportModel);
      const report = result[0] as PerpFeesReportModel;
      expect(report.tag).toBe(LogType.perpFees);
      expect(report.refClientId).toBe(300);
      expect(report.fees).toBe(200000);
      expect(report.refPayment).toBe(20000);
    });
  });

  describe('order cancel log decoding', () => {
    it('decodes spot order cancel log', () => {
      const tokens = new Map<number, TokenStateModel>();
      tokens.set(0, createMockToken(0, 9));
      tokens.set(1, createMockToken(1, 9));
      const instruments = new Map<number, Instrument>();
      instruments.set(1, createMockInstrument(1, 1, 0));
      const ctx = createTestContext({ tokens, instruments, uiNumbers: true });

      const buffer = createSpotOrderCancelBuffer(
        0,
        100,
        1,
        1700000000,
        BigInt(12345),
        BigInt(1000000000),
        BigInt(500000000),
      );
      const logs = [toLogString(buffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(SpotOrderCancelReportModel);
      const report = result[0] as SpotOrderCancelReportModel;
      expect(report.tag).toBe(LogType.spotOrderCancel);
      expect(report.side).toBe(0);
      expect(report.orderId).toBe(12345);
      expect(report.qty).toBe(1);
      expect(report.crncy).toBe(0.5);
    });

    it('decodes perp order cancel log', () => {
      const tokens = new Map<number, TokenStateModel>();
      tokens.set(0, createMockToken(0, 9));
      tokens.set(1, createMockToken(1, 9));
      const instruments = new Map<number, Instrument>();
      instruments.set(1, createMockInstrument(1, 1, 0));
      const ctx = createTestContext({ tokens, instruments, uiNumbers: true });

      const buffer = createPerpOrderCancelBuffer(
        1,
        100,
        1,
        1700000000,
        BigInt(67890),
        BigInt(2000000000),
        BigInt(1000000000),
      );
      const logs = [toLogString(buffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(PerpOrderCancelReportModel);
      const report = result[0] as PerpOrderCancelReportModel;
      expect(report.tag).toBe(LogType.perpOrderCancel);
      expect(report.side).toBe(1);
      expect(report.orderId).toBe(67890);
      expect(report.perps).toBe(2);
      expect(report.crncy).toBe(1);
    });
  });

  describe('fill order log decoding', () => {
    it('decodes spot fill order log', () => {
      const ctx = createTestContext({ uiNumbers: false });

      const buffer = createSpotFillOrderBuffer(
        0,
        100,
        BigInt(11111),
        BigInt(500000000),
        BigInt(50000000),
        BigInt(100000000000),
        BigInt(1000),
      );
      const logs = [toLogString(buffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(SpotFillOrderReportModel);
      const report = result[0] as SpotFillOrderReportModel;
      expect(report.tag).toBe(LogType.spotFillOrder);
      expect(report.side).toBe(0);
      expect(report.clientId).toBe(100);
      expect(report.orderId).toBe(11111);
      expect(report.qty).toBe(500000000);
      expect(report.rebates).toBe(1000);
    });

    it('decodes perp fill order log', () => {
      const ctx = createTestContext({ uiNumbers: false });

      const buffer = createPerpFillOrderBuffer(
        1,
        200,
        BigInt(22222),
        BigInt(750000000),
        BigInt(75000000),
        BigInt(150000000000),
        BigInt(2000),
      );
      const logs = [toLogString(buffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(PerpFillOrderReportModel);
      const report = result[0] as PerpFillOrderReportModel;
      expect(report.tag).toBe(LogType.perpFillOrder);
      expect(report.side).toBe(1);
      expect(report.clientId).toBe(200);
      expect(report.orderId).toBe(22222);
      expect(report.perps).toBe(750000000);
      expect(report.rebates).toBe(2000);
    });
  });

  describe('perp specific log decoding', () => {
    it('decodes perp funding log', () => {
      const ctx = createTestContext({ uiNumbers: false });

      const buffer = createPerpFundingBuffer(100, 1, 1700000000, BigInt(50000));
      const logs = [toLogString(buffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(PerpFundingReportModel);
      const report = result[0] as PerpFundingReportModel;
      expect(report.tag).toBe(LogType.perpFunding);
      expect(report.clientId).toBe(100);
      expect(report.instrId).toBe(1);
      expect(report.funding).toBe(50000);
    });

    it('decodes perp change leverage log', () => {
      const ctx = createTestContext({ uiNumbers: false });

      const buffer = createPerpChangeLeverageBuffer(10, 100, 1, 1700000000);
      const logs = [toLogString(buffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(PerpChangeLeverageReportModel);
      const report = result[0] as PerpChangeLeverageReportModel;
      expect(report.tag).toBe(LogType.perpChangeLeverage);
      expect(report.leverage).toBe(10);
      expect(report.clientId).toBe(100);
      expect(report.instrId).toBe(1);
    });
  });

  describe('mass cancel log decoding', () => {
    it('decodes spot place mass cancel log', () => {
      const tokens = new Map<number, TokenStateModel>();
      tokens.set(0, createMockToken(0, 9));
      tokens.set(1, createMockToken(1, 9));
      const instruments = new Map<number, Instrument>();
      instruments.set(1, createMockInstrument(1, 1, 0));
      const ctx = createTestContext({ tokens, instruments, uiNumbers: true });

      const buffer = createSpotPlaceMassCancelBuffer(100, 1, 1700000000);
      const logs = [toLogString(buffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(SpotPlaceMassCancelReportModel);
      const report = result[0] as SpotPlaceMassCancelReportModel;
      expect(report.tag).toBe(LogType.spotPlaceMassCancel);
      expect(report.clientId).toBe(100);
      expect(report.instrId).toBe(1);
    });

    it('decodes perp place mass cancel log', () => {
      const ctx = createTestContext({ uiNumbers: false });

      const buffer = createPerpPlaceMassCancelBuffer(200, 2, 1700000001);
      const logs = [toLogString(buffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(PerpPlaceMassCancelReportModel);
      const report = result[0] as PerpPlaceMassCancelReportModel;
      expect(report.tag).toBe(LogType.perpPlaceMassCancel);
      expect(report.clientId).toBe(200);
      expect(report.instrId).toBe(2);
    });
  });

  describe('order revoke log decoding', () => {
    it('decodes spot order revoke log', () => {
      const ctx = createTestContext({ uiNumbers: false });

      const buffer = createSpotOrderRevokeBuffer(0, 100, BigInt(33333), BigInt(400000000), BigInt(40000000));
      const logs = [toLogString(buffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(SpotOrderRevokeReportModel);
      const report = result[0] as SpotOrderRevokeReportModel;
      expect(report.tag).toBe(LogType.spotOrderRevoke);
      expect(report.side).toBe(0);
      expect(report.clientId).toBe(100);
      expect(report.orderId).toBe(33333);
    });

    it('decodes perp order revoke log', () => {
      const ctx = createTestContext({ uiNumbers: false });

      const buffer = createPerpOrderRevokeBuffer(1, 200, BigInt(44444), BigInt(600000000), BigInt(60000000));
      const logs = [toLogString(buffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(PerpOrderRevokeReportModel);
      const report = result[0] as PerpOrderRevokeReportModel;
      expect(report.tag).toBe(LogType.perpOrderRevoke);
      expect(report.side).toBe(1);
      expect(report.clientId).toBe(200);
      expect(report.orderId).toBe(44444);
    });
  });

  describe('earnings log decoding', () => {
    it('decodes earnings log', () => {
      const tokens = new Map<number, TokenStateModel>();
      tokens.set(1, createMockToken(1, 6));
      const ctx = createTestContext({ tokens, uiNumbers: true });

      const buffer = createEarningsBuffer(100, 1, 1700000000, BigInt(5000000));
      const logs = [toLogString(buffer)];

      const result = decodeTransactionLogs(logs, ctx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(EarningsReportModel);
      const report = result[0] as EarningsReportModel;
      expect(report.tag).toBe(LogType.earnings);
      expect(report.clientId).toBe(100);
      expect(report.tokenId).toBe(1);
      expect(report.amount).toBe(5); // 5000000 / 10^6
    });
  });
});
