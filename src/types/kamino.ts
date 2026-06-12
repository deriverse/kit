import { Address } from '@solana/kit';

interface ObligationDeposit {
  reserve: Address;
  depositedCTokens: bigint;
}

interface ObligationBorrow {
  reserve: Address;
  borrowedAmountSf: bigint;
}

interface DecodedObligation {
  address: Address;
  lastUpdateSlot: bigint;
  lendingMarket: Address;
  owner: Address;
  depositReserves: Address[];
  borrowReserves: Address[];
  deposits: ObligationDeposit[];
  borrows: ObligationBorrow[];
}

interface PositionView {
  reserve: Address;
  mint: Address;
  decimals: number;
  rawLamports: bigint;
  uiAmount: number;
  usdValue: number;
  priceUsd: number;
  lastUpdateSlot: bigint;
  slotsSinceRefresh: bigint;
}

interface SnapshotTotals {
  collateralUsd: number;
  borrowUsd: number;
  weightedDebtUsd: number;
  maxBorrowUsd: number;
  healthFactor: number;
}

interface ObligationSnapshot {
  obligation: DecodedObligation;
  currentSlot: bigint;
  deposits: PositionView[];
  borrows: PositionView[];
  totals: SnapshotTotals;
}

export type {
  PositionView,
  SnapshotTotals,
  ObligationSnapshot,
  DecodedObligation,
  ObligationDeposit,
  ObligationBorrow,
};
