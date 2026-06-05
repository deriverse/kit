import { Address } from '@solana/kit';

interface AtaCheck {
  address: Address;
  exists: boolean;
}

interface KaminoInstrumentAtasStatus {
  assetAta: AtaCheck;
  crncyAta: AtaCheck;
}

interface KaminoObligationStatus {
  obligation: Address;
  exists: boolean;
}

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

interface DecodedReserve {
  address: Address;
  lastUpdateSlot: bigint;
  lendingMarket: Address;
  farmCollateral: Address;
  farmDebt: Address;
  liquidity: {
    mint: Address;
    supplyVault: Address;
    feeVault: Address;
    tokenProgram: Address;
    mintDecimals: number;
    availableAmount: bigint;
    borrowedAmountSf: bigint;
    accumulatedProtocolFeesSf: bigint;
    accumulatedReferrerFeesSf: bigint;
  };
  collateral: {
    mint: Address;
    supplyVault: Address;
    mintTotalSupply: bigint;
  };
  config: {
    loanToValuePct: number;
    borrowFactorPct: bigint;
  };
  oracles: {
    pyth: Address;
    switchboardPrice: Address;
    switchboardTwap: Address;
    scope: Address;
  };
}

export type {
  PositionView,
  SnapshotTotals,
  ObligationSnapshot,
  DecodedReserve,
  DecodedObligation,
  ObligationDeposit,
  ObligationBorrow,
  KaminoInstrumentAtasStatus,
  KaminoObligationStatus,
};
