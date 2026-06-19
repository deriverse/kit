import { describe, it, expect } from 'vitest';
import {
  NewSpotOrderArgsSchema,
  NewPerpOrderArgsSchema,
  PerpQuotesReplaceArgsSchema,
  DepositArgsSchema,
  PerpChangeLeverageArgsSchema,
  PerpBuySeatArgsSchema,
  SpotQuotesReplaceArgsSchema,
  GetKaminoContextArgsSchema,
  KaminoChangePositionArgsSchema,
  KaminoInitObligationArgsSchema,
  KaminoInitInstrumentArgsSchema,
  KaminoObligationExistsArgsSchema,
  KaminoRefreshReservesArgsSchema,
  KaminoUpdateObligationsArgsSchema,
  GetKaminoClientStateArgsSchema,
} from './schemas';
import { OrderType } from '../structure_models';

const ADDRESS = 'So11111111111111111111111111111111111111112';

describe('Zod Schemas', () => {
  describe('common validators', () => {
    it('rejects negative integers', () => {
      const result = DepositArgsSchema.safeParse({ tokenId: -1 });
      expect(result.success).toBe(false);
    });

    it('rejects non-positive numbers', () => {
      const result = NewSpotOrderArgsSchema.safeParse({
        instrId: 1,
        price: 0,
        qty: 10,
        side: 0,
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid side values', () => {
      const result = NewSpotOrderArgsSchema.safeParse({
        instrId: 1,
        price: 100,
        qty: 10,
        side: 2,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Side must be 0 (Bid) or 1 (Ask)');
    });
  });

  describe('leverage validation', () => {
    it('accepts leverage between 1 and 100', () => {
      expect(PerpChangeLeverageArgsSchema.safeParse({ instrId: 1, leverage: 1 }).success).toBe(true);
      expect(PerpChangeLeverageArgsSchema.safeParse({ instrId: 1, leverage: 100 }).success).toBe(true);
    });

    it('rejects leverage outside 1-100', () => {
      expect(PerpChangeLeverageArgsSchema.safeParse({ instrId: 1, leverage: 0 }).success).toBe(false);
      expect(PerpChangeLeverageArgsSchema.safeParse({ instrId: 1, leverage: 101 }).success).toBe(false);
    });
  });

  describe('slippage validation', () => {
    it('accepts slippage between 0 and 1', () => {
      expect(PerpBuySeatArgsSchema.safeParse({ instrId: 1, amount: 100, slippage: 0 }).success).toBe(true);
      expect(PerpBuySeatArgsSchema.safeParse({ instrId: 1, amount: 100, slippage: 1 }).success).toBe(true);
      expect(PerpBuySeatArgsSchema.safeParse({ instrId: 1, amount: 100, slippage: 0.5 }).success).toBe(true);
    });

    it('rejects slippage outside 0-1', () => {
      expect(PerpBuySeatArgsSchema.safeParse({ instrId: 1, amount: 100, slippage: -0.1 }).success).toBe(false);
      expect(PerpBuySeatArgsSchema.safeParse({ instrId: 1, amount: 100, slippage: 1.1 }).success).toBe(false);
    });
  });

  describe('nonnegative number validation', () => {
    it('accepts zero for quote prices/quantities', () => {
      const result = SpotQuotesReplaceArgsSchema.safeParse({
        instrId: 1,
        orders: [{ newPrice: 0, newQty: 0, oldId: 0, side: 0 }],
      });
      expect(result.success).toBe(true);
    });

    it('rejects negative prices', () => {
      const result = SpotQuotesReplaceArgsSchema.safeParse({
        instrId: 1,
        orders: [{ newPrice: -1, newQty: 0, oldId: 0, side: 0 }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Price must be non-negative');
    });

    it('rejects more than 12 orders', () => {
      const orders = Array.from({ length: 13 }, () => ({ newPrice: 1, newQty: 1, oldId: 0, side: 0 }));
      const result = SpotQuotesReplaceArgsSchema.safeParse({ instrId: 1, orders });
      expect(result.success).toBe(false);
    });

    it('rejects empty orders array', () => {
      const result = SpotQuotesReplaceArgsSchema.safeParse({ instrId: 1, orders: [] });
      expect(result.success).toBe(false);
    });
  });

  describe('valid input acceptance', () => {
    it('accepts valid NewSpotOrderArgs', () => {
      const result = NewSpotOrderArgsSchema.safeParse({
        instrId: 1,
        price: 100.5,
        qty: 10,
        side: 1,
        ioc: 0,
        orderType: 1,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('orderType validation', () => {
    const orderTypeValues = Object.values(OrderType).filter((value): value is number => typeof value === 'number');
    const maxOrderType = Math.max(...orderTypeValues);

    it('accepts every OrderType enum value for new spot orders', () => {
      for (const orderType of orderTypeValues) {
        const result = NewSpotOrderArgsSchema.safeParse({ instrId: 1, price: 100, qty: 10, side: 0, orderType });
        expect(result.success).toBe(true);
      }
    });

    it('accepts every OrderType enum value for new perp orders', () => {
      for (const orderType of orderTypeValues) {
        const result = NewPerpOrderArgsSchema.safeParse({ instrId: 1, price: 100, qty: 10, side: 0, orderType });
        expect(result.success).toBe(true);
      }
    });

    it('accepts the makerOnly (post-only) order type that was previously rejected', () => {
      expect(
        NewSpotOrderArgsSchema.safeParse({
          instrId: 1,
          price: 100,
          qty: 10,
          side: 0,
          orderType: OrderType.makerOnly,
        }).success,
      ).toBe(true);
    });

    it('rejects order types above the OrderType enum range', () => {
      const result = NewSpotOrderArgsSchema.safeParse({
        instrId: 1,
        price: 100,
        qty: 10,
        side: 0,
        orderType: maxOrderType + 1,
      });
      expect(result.success).toBe(false);
    });

    it('validates quotes-replace order types against the same range', () => {
      const orders = [{ newPrice: 1, newQty: 1, oldId: 0, side: 0 }];
      expect(
        SpotQuotesReplaceArgsSchema.safeParse({ instrId: 1, orderType: OrderType.makerOnly, orders }).success,
      ).toBe(true);
      expect(PerpQuotesReplaceArgsSchema.safeParse({ instrId: 1, orderType: maxOrderType + 1, orders }).success).toBe(
        false,
      );
    });
  });

  describe('Kamino strict reserve inputs', () => {
    it('rejects removed manual reserve fields', () => {
      expect(GetKaminoContextArgsSchema.safeParse({ instrId: 1, collateralReserve: ADDRESS }).success).toBe(false);
      expect(GetKaminoContextArgsSchema.safeParse({ instrId: 1, debtReserve: ADDRESS }).success).toBe(false);
      expect(KaminoInitObligationArgsSchema.safeParse({ instrId: 1 }).success).toBe(false);
      expect(KaminoInitInstrumentArgsSchema.safeParse({ instrId: 1, side: 0, reserve: ADDRESS }).success).toBe(false);
      expect(KaminoObligationExistsArgsSchema.safeParse({ instrId: 1 }).success).toBe(false);
      expect(GetKaminoClientStateArgsSchema.safeParse({ instrId: 1, collateralReserve: ADDRESS }).success).toBe(false);
      expect(KaminoUpdateObligationsArgsSchema.safeParse({ instrId: 1 }).success).toBe(false);
      expect(KaminoUpdateObligationsArgsSchema.safeParse({ obligation: ADDRESS }).success).toBe(false);
      expect(KaminoUpdateObligationsArgsSchema.safeParse({ reserveAccounts: [ADDRESS] }).success).toBe(false);
      expect(KaminoRefreshReservesArgsSchema.safeParse({ instrId: 1 }).success).toBe(false);
      expect(KaminoRefreshReservesArgsSchema.safeParse({ obligation: ADDRESS }).success).toBe(false);
      expect(KaminoRefreshReservesArgsSchema.safeParse({ reserveAccounts: [ADDRESS] }).success).toBe(false);
    });

    it('accepts only optional lendingMarket for update-obligations args', () => {
      expect(KaminoUpdateObligationsArgsSchema.safeParse({}).success).toBe(true);
      expect(KaminoUpdateObligationsArgsSchema.safeParse({ lendingMarket: ADDRESS }).success).toBe(true);
    });

    it('accepts optional lendingMarket and skipPriceUpdates for refresh-reserves args', () => {
      expect(KaminoRefreshReservesArgsSchema.safeParse({}).success).toBe(true);
      expect(KaminoRefreshReservesArgsSchema.safeParse({ lendingMarket: ADDRESS }).success).toBe(true);
      expect(KaminoRefreshReservesArgsSchema.safeParse({ skipPriceUpdates: true }).success).toBe(true);
      expect(KaminoRefreshReservesArgsSchema.safeParse({ skipPriceUpdates: 1 }).success).toBe(false);
      expect(KaminoRefreshReservesArgsSchema.safeParse({ lendingMarket: ADDRESS, extra: true }).success).toBe(false);
    });

    it('rejects extraReserves in change-position args', () => {
      const result = KaminoChangePositionArgsSchema.safeParse({
        instrId: 1,
        assetIsCollateral: true,
        collateralDelta: 0,
        borrowDelta: 0,
        extraReserves: [ADDRESS],
      });

      expect(result.success).toBe(false);
    });

    it('requires explicit assetIsCollateral in change-position args', () => {
      expect(
        KaminoChangePositionArgsSchema.safeParse({
          instrId: 1,
          collateralDelta: 0,
          borrowDelta: 0,
        }).success,
      ).toBe(false);
      expect(
        KaminoChangePositionArgsSchema.safeParse({
          instrId: 1,
          assetIsCollateral: true,
          collateralDelta: 0,
          borrowDelta: 0,
        }).success,
      ).toBe(true);
      expect(
        KaminoChangePositionArgsSchema.safeParse({
          instrId: 1,
          assetIsCollateral: false,
          collateralDelta: 0,
          borrowDelta: 0,
        }).success,
      ).toBe(true);
    });

    it('accepts repayAll and withdrawAll change-position flags with zero deltas', () => {
      expect(
        KaminoChangePositionArgsSchema.safeParse({
          instrId: 1,
          assetIsCollateral: true,
          collateralDelta: 0,
          borrowDelta: 0,
          repayAll: true,
          withdrawAll: true,
        }).success,
      ).toBe(true);
    });

    it('rejects non-zero deltas for all-position Kamino flags', () => {
      expect(
        KaminoChangePositionArgsSchema.safeParse({
          instrId: 1,
          assetIsCollateral: true,
          collateralDelta: 0,
          borrowDelta: 1,
          repayAll: true,
        }).success,
      ).toBe(false);
      expect(
        KaminoChangePositionArgsSchema.safeParse({
          instrId: 1,
          assetIsCollateral: true,
          collateralDelta: 1,
          borrowDelta: 0,
          withdrawAll: true,
        }).success,
      ).toBe(false);
    });

    it('rejects removed keepObligationAlive change-position flag', () => {
      expect(
        KaminoChangePositionArgsSchema.safeParse({
          instrId: 1,
          assetIsCollateral: true,
          collateralDelta: 1,
          borrowDelta: 0,
          keepObligationAlive: true,
        }).success,
      ).toBe(false);
    });
  });
});
