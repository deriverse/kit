import { describe, it, expect } from 'vitest';
import { getSpotPriceStep, getPerpPriceStep, buildQuotesMask, SAM_PRICE_STEP } from './utils';

describe('getSpotPriceStep', () => {
  // All threshold boundaries from the implementation
  const spotTestCases: [number, number][] = [
    // price <= threshold → expected step
    [0.00002, 0.000000001],
    [0.00005, 0.000000002],
    [0.0001, 0.000000005],
    [0.0002, 0.00000001],
    [0.0005, 0.00000002],
    [0.001, 0.00000005],
    [0.002, 0.0000001],
    [0.005, 0.0000002],
    [0.01, 0.0000005],
    [0.02, 0.000001],
    [0.05, 0.000002],
    [0.1, 0.000005],
    [0.2, 0.00001],
    [0.5, 0.00002],
    [1, 0.00005],
    [2, 0.0001],
    [5, 0.0002],
    [10, 0.0005],
    [20, 0.001],
    [50, 0.002],
    [100, 0.005],
    [200, 0.01],
    [500, 0.02],
    [1000, 0.05],
    [2000, 0.1],
    [5000, 0.2],
    [10000, 0.5],
    [20000, 1],
    [50000, 2],
    [100000, 5],
    [200000, 10],
    [500000, 20],
    [1000000, 50],
    [2000000, 100],
    [5000000, 200],
  ];

  it.each(spotTestCases)('price %d → step %d', (price, expectedStep) => {
    expect(getSpotPriceStep(price)).toBe(expectedStep);
  });

  it('returns 500 for prices above 5000000', () => {
    expect(getSpotPriceStep(5000001)).toBe(500);
    expect(getSpotPriceStep(10000000)).toBe(500);
    expect(getSpotPriceStep(100000000)).toBe(500);
  });

  it('handles boundary values correctly', () => {
    // Values between thresholds fall into the next bucket (price <= threshold)
    expect(getSpotPriceStep(0.000019)).toBe(0.000000001); // <= 0.00002
    expect(getSpotPriceStep(0.000049)).toBe(0.000000002); // <= 0.00005
    expect(getSpotPriceStep(0.9)).toBe(0.00005);          // <= 1
    expect(getSpotPriceStep(1.5)).toBe(0.0001);           // <= 2
    expect(getSpotPriceStep(87)).toBe(0.005);             // <= 100
    expect(getSpotPriceStep(99)).toBe(0.005);             // <= 100
  });

  it('returns flat SAM step when isSimilarAssets=true', () => {
    expect(getSpotPriceStep(0.001, true)).toBe(SAM_PRICE_STEP);
    expect(getSpotPriceStep(1, true)).toBe(SAM_PRICE_STEP);
    expect(getSpotPriceStep(87, true)).toBe(SAM_PRICE_STEP);
    expect(getSpotPriceStep(1_000_000, true)).toBe(SAM_PRICE_STEP);
  });
});

describe('getPerpPriceStep', () => {
  // All threshold boundaries from the implementation
  const perpTestCases: [number, number][] = [
    // price <= threshold → expected step
    [0.00005, 0.000000001],
    [0.0001, 0.000000002],
    [0.0002, 0.000000005],
    [0.0005, 0.00000001],
    [0.001, 0.00000002],
    [0.002, 0.00000005],
    [0.005, 0.0000001],
    [0.01, 0.0000002],
    [0.02, 0.0000005],
    [0.05, 0.000001],
    [0.1, 0.000002],
    [0.2, 0.000005],
    [0.5, 0.00001],
    [1, 0.00002],
    [2, 0.00005],
    [5, 0.0001],
    [10, 0.0002],
    [20, 0.0005],
    [50, 0.001],
    [100, 0.002],
    [200, 0.005],
    [500, 0.01],
    [1000, 0.02],
    [2000, 0.05],
    [5000, 0.1],
    [10000, 0.2],
    [20000, 0.5],
    [50000, 1],
    [100000, 2],
    [200000, 5],
    [500000, 10],
    [1000000, 20],
    [2000000, 50],
    [5000000, 100],
    [10000000, 200],
    [20000000, 500],
  ];

  it.each(perpTestCases)('price %d → step %d', (price, expectedStep) => {
    expect(getPerpPriceStep(price)).toBe(expectedStep);
  });

  it('returns 1000 for prices above 20000000', () => {
    expect(getPerpPriceStep(20000001)).toBe(1000);
    expect(getPerpPriceStep(50000000)).toBe(1000);
    expect(getPerpPriceStep(100000000)).toBe(1000);
  });

  it('handles boundary values correctly', () => {
    // Values between thresholds fall into the next bucket (price <= threshold)
    expect(getPerpPriceStep(0.00004)).toBe(0.000000001); // <= 0.00005
    expect(getPerpPriceStep(0.00009)).toBe(0.000000002); // <= 0.0001
    expect(getPerpPriceStep(0.9)).toBe(0.00002);         // <= 1
    expect(getPerpPriceStep(1.5)).toBe(0.00005);         // <= 2
    expect(getPerpPriceStep(99)).toBe(0.002);            // <= 100
  });
});

describe('buildQuotesMask', () => {
  it('single bid order: bit 4 stays 0', () => {
    const mask = buildQuotesMask([{ side: 0 }]);
    expect(mask).toBe(0b0_0001); // length=1, no side bits
  });

  it('single ask order: bit 4 set to 1', () => {
    const mask = buildQuotesMask([{ side: 1 }]);
    expect(mask).toBe(0b1_0001); // length=1, bit4=1
  });

  it('mixed orders: bid, ask, bid', () => {
    const mask = buildQuotesMask([{ side: 0 }, { side: 1 }, { side: 0 }]);
    // length=3 (0b0011), bit5=1 (second order is ask)
    expect(mask).toBe(0b010_0011);
  });

  it('all bids: no side bits set', () => {
    const mask = buildQuotesMask([{ side: 0 }, { side: 0 }, { side: 0 }, { side: 0 }]);
    expect(mask).toBe(4); // just the length
  });

  it('all asks: all side bits set', () => {
    const mask = buildQuotesMask([{ side: 1 }, { side: 1 }, { side: 1 }]);
    // length=3 (0b0011), bits 4,5,6 set
    expect(mask).toBe(3 | (1 << 4) | (1 << 5) | (1 << 6));
  });

  it('12 orders max with mixed sides', () => {
    const orders = Array.from({ length: 12 }, (_, i) => ({ side: i % 2 as number }));
    const mask = buildQuotesMask(orders);
    // length = 12 (0b1100)
    expect(mask & 0b1111).toBe(12);
    // even indices (0,2,4,6,8,10) are bid=0, odd indices (1,3,5,7,9,11) are ask=1
    for (let i = 0; i < 12; i++) {
      const bit = (mask >> (4 + i)) & 1;
      expect(bit).toBe(i % 2);
    }
  });

  it('empty orders array', () => {
    const mask = buildQuotesMask([]);
    expect(mask).toBe(0);
  });
});
