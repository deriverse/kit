import { describe, it, expect, beforeEach } from 'vitest';
import { DF } from '../constants';
import { FillEstimateEngine, OrderSide } from './fill-estimate';
import { LineQuotesModel } from '../structure_models';

function makeLine(px: number, qty: number): LineQuotesModel {
  const line = new LineQuotesModel();
  line.px = px;
  line.qty = qty;
  return line;
}

const ASSET_DECIMALS = 6;
const CRNCY_DECIMALS = 6;

describe('FillEstimateEngine', () => {
  describe('constructor', () => {
    it('computes decimal factor correctly for equal decimals', () => {
      const engine = new FillEstimateEngine(1000, 1000, [], [], 6, 6);
      expect(engine.poolAssetTokens).toBe(1000);
      expect(engine.poolCrncyTokens).toBe(1000);
    });

    it('computes decimal factor correctly for different decimals', () => {
      const engine = new FillEstimateEngine(1000, 1000, [], [], 9, 6);
      expect(engine.poolAssetTokens).toBe(1000);
    });
  });

  describe('AMM-only fills (no order book lines)', () => {
    let engine: FillEstimateEngine;

    beforeEach(() => {
      // Pool: 1000 asset, 1000 crncy → k = 1_000_000, AMM mid price ~1.0*DF
      engine = new FillEstimateEngine(1000, 1000, [], [], ASSET_DECIMALS, CRNCY_DECIMALS);
    });

    it('fills a bid fully when max price is high enough', () => {
      // Bid 100 asset at max price 2*DF (well above AMM mid ~1.0)
      const result = engine.estimate(100, 2 * DF, OrderSide.Bid);
      // new pool = 900 asset, crncy in = 1e6/900 - 1000 ≈ 111.111
      expect(result.remainingQty).toBe(0);
      expect(result.sumCurrencyTokens).toBeCloseTo(111.111, 2);
      expect(result.px).not.toBeNull();
    });

    it('fills an ask fully when min price is low enough', () => {
      // Ask 100 asset at min price 0.5*DF (below AMM mid ~1.0)
      const result = engine.estimate(100, 0.5 * DF, OrderSide.Ask);
      // new pool = 1100 asset, crncy out = 1000 - 1e6/1100 ≈ 90.909
      expect(result.remainingQty).toBe(0);
      expect(result.sumCurrencyTokens).toBeCloseTo(90.909, 2);
      expect(result.px).not.toBeNull();
    });

    it('partially fills a bid when max price is near AMM mid', () => {
      // getAmmQty(1e6, 1.1*DF, Bid) = 1000 - sqrt(1e15/1.1e9) ≈ 46.537
      // getAmmSum(1e6, 46.537, Bid) = 1e6/953.463 - 1000 ≈ 48.809
      const result = engine.estimate(100, 1.1 * DF, OrderSide.Bid);
      expect(result.remainingQty).toBeCloseTo(53.463, 0);
      expect(result.sumCurrencyTokens).toBeCloseTo(48.809, 0);
    });

    it('partially fills an ask when min price is near AMM mid', () => {
      // getAmmQty(1e6, 0.9*DF, Ask) = sqrt(1e15/0.9e9) - 1000 ≈ 54.093
      // getAmmSum(1e6, 54.093, Ask) = 1000 - 1e6/1054.093 ≈ 51.317
      const result = engine.estimate(100, 0.9 * DF, OrderSide.Ask);
      expect(result.remainingQty).toBeCloseTo(45.907, 0);
      expect(result.sumCurrencyTokens).toBeCloseTo(51.317, 0);
    });

    it('returns null px when nothing is filled', () => {
      const result = engine.estimate(0, 1 * DF, OrderSide.Bid);
      expect(result.remainingQty).toBe(0);
      expect(result.px).toBeNull();
    });

    it('mutates pool state after bid', () => {
      engine.estimate(100, 2 * DF, OrderSide.Bid);
      expect(engine.poolAssetTokens).toBe(900);
      // k/newAsset = 1e6/900 ≈ 1111.111
      expect(engine.poolCrncyTokens).toBeCloseTo(1111.111, 2);
    });

    it('mutates pool state after ask', () => {
      engine.estimate(100, 0.5 * DF, OrderSide.Ask);
      expect(engine.poolAssetTokens).toBe(1100);
      // k/newAsset = 1e6/1100 ≈ 909.091
      expect(engine.poolCrncyTokens).toBeCloseTo(909.091, 2);
    });
  });

  describe('order book line fills (no AMM liquidity, k=0)', () => {
    it('fills a bid fully against a single ask line', () => {
      const askLines = [makeLine(1 * DF, 500)];
      const engine = new FillEstimateEngine(0, 0, [], askLines, ASSET_DECIMALS, CRNCY_DECIMALS);
      const result = engine.estimate(100, 2 * DF, OrderSide.Bid);
      expect(result.remainingQty).toBe(0);
      expect(result.sumCurrencyTokens).toBe(100); // 100 * 1*DF / DF
    });

    it('fills an ask fully against a single bid line', () => {
      const bidLines = [makeLine(1 * DF, 500)];
      const engine = new FillEstimateEngine(0, 0, bidLines, [], ASSET_DECIMALS, CRNCY_DECIMALS);
      const result = engine.estimate(100, 0.5 * DF, OrderSide.Ask);
      expect(result.remainingQty).toBe(0);
      expect(result.sumCurrencyTokens).toBe(100);
    });

    it('partially fills when line qty is insufficient', () => {
      const askLines = [makeLine(1 * DF, 50)];
      const engine = new FillEstimateEngine(0, 0, [], askLines, ASSET_DECIMALS, CRNCY_DECIMALS);
      const result = engine.estimate(100, 2 * DF, OrderSide.Bid);
      expect(result.remainingQty).toBe(50);
      expect(result.sumCurrencyTokens).toBe(50);
    });

    it('fills across multiple ask lines for a bid', () => {
      const askLines = [makeLine(1 * DF, 60), makeLine(1.1 * DF, 60)];
      const engine = new FillEstimateEngine(0, 0, [], askLines, ASSET_DECIMALS, CRNCY_DECIMALS);
      const result = engine.estimate(100, 2 * DF, OrderSide.Bid);
      // First line: 60 @ 1.0 = 60, Second line: 40 @ 1.1 = 44
      expect(result.remainingQty).toBe(0);
      expect(result.sumCurrencyTokens).toBeCloseTo(104, 5);
    });

    it('fills across multiple bid lines for an ask', () => {
      const bidLines = [makeLine(1 * DF, 60), makeLine(0.9 * DF, 60)];
      const engine = new FillEstimateEngine(0, 0, bidLines, [], ASSET_DECIMALS, CRNCY_DECIMALS);
      const result = engine.estimate(100, 0.5 * DF, OrderSide.Ask);
      // First line: 60 @ 1.0 = 60, Second line: 40 @ 0.9 = 36
      expect(result.remainingQty).toBe(0);
      expect(result.sumCurrencyTokens).toBeCloseTo(96, 5);
    });

    it('handles line with exact remaining qty', () => {
      const askLines = [makeLine(1 * DF, 100)];
      const engine = new FillEstimateEngine(0, 0, [], askLines, ASSET_DECIMALS, CRNCY_DECIMALS);
      const result = engine.estimate(100, 2 * DF, OrderSide.Bid);
      expect(result.remainingQty).toBe(0);
      expect(result.sumCurrencyTokens).toBe(100);
    });

    it('does not fill bid when max price is below ask line price', () => {
      const askLines = [makeLine(1 * DF, 500)];
      const engine = new FillEstimateEngine(0, 0, [], askLines, ASSET_DECIMALS, CRNCY_DECIMALS);
      const result = engine.estimate(100, 0.5 * DF, OrderSide.Bid);
      expect(result.remainingQty).toBe(100);
      expect(result.px).toBeNull();
    });

    it('does not fill ask when min price is above bid line price', () => {
      const bidLines = [makeLine(1 * DF, 500)];
      const engine = new FillEstimateEngine(0, 0, bidLines, [], ASSET_DECIMALS, CRNCY_DECIMALS);
      const result = engine.estimate(100, 2 * DF, OrderSide.Ask);
      expect(result.remainingQty).toBe(100);
      expect(result.px).toBeNull();
    });
  });

  describe('hybrid AMM + order book fills', () => {
    it('fills bid from AMM when AMM price is better than ask line', () => {
      // AMM mid ~1.0*DF, ask line at 1.2*DF → AMM is cheaper
      const askLines = [makeLine(1.2 * DF, 500)];
      const engine = new FillEstimateEngine(1000, 1000, [], askLines, ASSET_DECIMALS, CRNCY_DECIMALS);
      const result = engine.estimate(50, 2 * DF, OrderSide.Bid);
      expect(result.remainingQty).toBe(0);
      // AMM cost: k/(poolAsset-qty) - poolCrncy = 1e6/950 - 1000 ≈ 52.632
      // Line cost would be 50 * 1.2 = 60 → AMM is cheaper
      expect(result.sumCurrencyTokens).toBeCloseTo(52.632, 2);
    });

    it('fills ask from AMM when AMM price is better than bid line', () => {
      // AMM mid ~1.0*DF, bid line at 0.8*DF → AMM pays more
      const bidLines = [makeLine(0.8 * DF, 500)];
      const engine = new FillEstimateEngine(1000, 1000, bidLines, [], ASSET_DECIMALS, CRNCY_DECIMALS);
      const result = engine.estimate(50, 0.5 * DF, OrderSide.Ask);
      expect(result.remainingQty).toBe(0);
      // AMM received: poolCrncy - k/(poolAsset+qty) = 1000 - 1e6/1050 ≈ 47.619
      // Line received would be 50 * 0.8 = 40 → AMM pays more
      expect(result.sumCurrencyTokens).toBeCloseTo(47.619, 2);
    });

    it('interleaves AMM and line fills for large bid orders', () => {
      const askLines = [makeLine(1.05 * DF, 200), makeLine(1.1 * DF, 200)];
      const engine = new FillEstimateEngine(1000, 1000, [], askLines, ASSET_DECIMALS, CRNCY_DECIMALS);
      const result = engine.estimate(300, 2 * DF, OrderSide.Bid);
      expect(result.remainingQty).toBe(0);
      // Pure AMM cost: 1e6/700 - 1000 ≈ 428.571
      // Pure line cost: 200*1.05 + 100*1.1 = 320
      // Hybrid should be less than pure AMM
      expect(result.sumCurrencyTokens).toBeLessThan(428.571);
      expect(result.sumCurrencyTokens).toBeGreaterThan(0);
    });

    it('interleaves AMM and line fills for large ask orders', () => {
      const bidLines = [makeLine(0.95 * DF, 200), makeLine(0.9 * DF, 200)];
      const engine = new FillEstimateEngine(1000, 1000, bidLines, [], ASSET_DECIMALS, CRNCY_DECIMALS);
      const result = engine.estimate(300, 0.5 * DF, OrderSide.Ask);
      expect(result.remainingQty).toBe(0);
      // Pure AMM received: 1000 - 1e6/1300 ≈ 230.769
      // Pure line received: 200*0.95 + 100*0.9 = 280
      // Hybrid should be more than pure AMM
      expect(result.sumCurrencyTokens).toBeGreaterThan(230.769);
    });
  });

  describe('price impact tracking', () => {
    it('tracks worst price for bids (highest price)', () => {
      const askLines = [makeLine(1 * DF, 100), makeLine(1.2 * DF, 100)];
      const engine = new FillEstimateEngine(0, 0, [], askLines, ASSET_DECIMALS, CRNCY_DECIMALS);
      const result = engine.estimate(150, 2 * DF, OrderSide.Bid);
      expect(result.px).not.toBeNull();
      // Worst (highest) price for buyer should be 1.2*DF from second line
      expect(result.px!).toBe(1.2 * DF);
    });

    it('tracks worst price for asks (lowest price)', () => {
      const bidLines = [makeLine(1 * DF, 100), makeLine(0.8 * DF, 100)];
      const engine = new FillEstimateEngine(0, 0, bidLines, [], ASSET_DECIMALS, CRNCY_DECIMALS);
      const result = engine.estimate(150, 0.5 * DF, OrderSide.Ask);
      expect(result.px).not.toBeNull();
      // Worst (lowest) price for seller should be 0.8*DF from second line
      expect(result.px!).toBe(0.8 * DF);
    });
  });

  describe('edge cases', () => {
    it('handles zero quantity', () => {
      const engine = new FillEstimateEngine(1000, 1000, [], [], ASSET_DECIMALS, CRNCY_DECIMALS);
      const result = engine.estimate(0, 1 * DF, OrderSide.Bid);
      expect(result.remainingQty).toBe(0);
      expect(result.px).toBeNull();
    });

    it('handles empty pool and no lines', () => {
      const engine = new FillEstimateEngine(0, 0, [], [], ASSET_DECIMALS, CRNCY_DECIMALS);
      const result = engine.estimate(100, 1 * DF, OrderSide.Bid);
      expect(result.remainingQty).toBe(100);
      expect(result.px).toBeNull();
    });

    it('handles bid qty exceeding pool asset tokens via AMM', () => {
      // Pool: 50 asset, 1000 crncy, k=50000. Bid 100 at max 100*DF.
      const engine = new FillEstimateEngine(50, 1000, [], [], ASSET_DECIMALS, CRNCY_DECIMALS);
      const result = engine.estimate(100, 100 * DF, OrderSide.Bid);
      // getAmmQty(50000, 100*DF, Bid) = 50 - sqrt(50000*1e9/100e9) ≈ 27.639
      expect(result.remainingQty).toBeCloseTo(72.361, 0);
      expect(result.sumCurrencyTokens).toBeCloseTo(1236.068, 0);
      expect(result.px).not.toBeNull();
    });

    it('successive estimates accumulate pool state', () => {
      const engine = new FillEstimateEngine(1000, 1000, [], [], ASSET_DECIMALS, CRNCY_DECIMALS);
      // Bid 100 asset
      const r1 = engine.estimate(100, 2 * DF, OrderSide.Bid);
      expect(r1.remainingQty).toBe(0);
      expect(r1.sumCurrencyTokens).toBeCloseTo(111.111, 2);
      expect(engine.poolAssetTokens).toBe(900);

      // Ask 50 asset back into shifted pool (k is now 900 * 1111.111 = 1e6)
      const r2 = engine.estimate(50, 0.5 * DF, OrderSide.Ask);
      expect(r2.remainingQty).toBe(0);
      // received = 1111.111 - 1e6/950 ≈ 58.480
      expect(r2.sumCurrencyTokens).toBeCloseTo(58.480, 0);
      expect(engine.poolAssetTokens).toBe(950);
    });
  });

  describe('OrderSide enum', () => {
    it('has correct values', () => {
      expect(OrderSide.Bid).toBe(0);
      expect(OrderSide.Ask).toBe(1);
    });
  });
});
