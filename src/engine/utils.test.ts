import { describe, it, expect } from 'vitest';
import { getSpotPriceStep, getPerpPriceStep } from './utils';

describe('getSpotPriceStep', () => {
  // All threshold boundaries from the implementation
  const spotTestCases: [number, number][] = [
    // price <= threshold → expected step
    [0.00001, 0.000000001],
    [0.00002, 0.000000002],
    [0.00005, 0.000000005],
    [0.0001, 0.00000001],
    [0.0002, 0.00000002],
    [0.0005, 0.00000005],
    [0.001, 0.0000001],
    [0.002, 0.0000002],
    [0.005, 0.0000005],
    [0.01, 0.000001],
    [0.02, 0.000002],
    [0.05, 0.000005],
    [0.1, 0.00001],
    [0.2, 0.00002],
    [0.5, 0.00005],
    [1, 0.0001],
    [2, 0.0002],
    [5, 0.0005],
    [10, 0.001],
    [20, 0.002],
    [50, 0.005],
    [100, 0.01],
    [200, 0.02],
    [500, 0.05],
    [1000, 0.1],
    [2000, 0.2],
    [5000, 0.5],
    [10000, 1],
    [20000, 2],
    [50000, 5],
    [100000, 10],
    [200000, 20],
    [500000, 50],
    [1000000, 100],
    [2000000, 200],
    [5000000, 500],
  ];

  it.each(spotTestCases)('price %d → step %d', (price, expectedStep) => {
    expect(getSpotPriceStep(price)).toBe(expectedStep);
  });

  it('returns 1000 for prices above 5000000', () => {
    expect(getSpotPriceStep(5000001)).toBe(1000);
    expect(getSpotPriceStep(10000000)).toBe(1000);
    expect(getSpotPriceStep(100000000)).toBe(1000);
  });

  it('handles boundary values correctly', () => {
    // Values between thresholds fall into the next bucket (price <= threshold)
    expect(getSpotPriceStep(0.000009)).toBe(0.000000001); // <= 0.00001
    expect(getSpotPriceStep(0.000019)).toBe(0.000000002); // <= 0.00002
    expect(getSpotPriceStep(0.9)).toBe(0.0001);           // <= 1
    expect(getSpotPriceStep(1.5)).toBe(0.0002);           // <= 2
    expect(getSpotPriceStep(99)).toBe(0.01);              // <= 100
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
