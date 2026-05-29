import { Address } from '@solana/kit';
import { Buffer } from 'buffer';

import { readAddress, readAddressOrNull, readU128LE } from './bin';

const RESERVE_DISCRIMINATOR = Buffer.from([43, 242, 204, 202, 26, 247, 59, 127]);

const RESERVE_OFF = {
  lastUpdateSlot: 8,
  lendingMarket: 24,
  farmCollateral: 56,
  farmDebt: 88,

  liqMintPubkey: 120,
  liqSupplyVault: 152,
  liqFeeVault: 184,
  liqAvailableAmount: 216,
  liqBorrowedAmountSf: 224,
  liqMintDecimals: 264,
  liqAccumulatedProtocolFeesSf: 336,
  liqAccumulatedReferrerFeesSf: 352,
  liqTokenProgram: 400,

  collMintPubkey: 2552,
  collMintTotalSupply: 2584,
  collSupplyVault: 2592,

  cfgLoanToValuePct: 4864,
  cfgBorrowFactorPct: 5000,

  scopePriceFeed: 5104,
  switchboardPriceAggregator: 5152,
  switchboardTwapAggregator: 5184,
  pythPrice: 5216,
} as const;

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
    pyth: Address | null;
    switchboardPrice: Address | null;
    switchboardTwap: Address | null;
    scope: Address | null;
  };
}

function decodeReserve(reserveAddress: Address, raw: Buffer): DecodedReserve {
  if (raw.length < 8 + RESERVE_OFF.pythPrice + 32) {
    throw new Error(`Reserve ${reserveAddress} too short: ${raw.length} bytes`);
  }
  if (!raw.subarray(0, 8).equals(RESERVE_DISCRIMINATOR)) {
    throw new Error(`Reserve ${reserveAddress} has wrong discriminator`);
  }
  const body = raw.subarray(8);

  return {
    address: reserveAddress,
    lastUpdateSlot: body.readBigUInt64LE(RESERVE_OFF.lastUpdateSlot),
    lendingMarket: readAddress(body, RESERVE_OFF.lendingMarket),
    farmCollateral: readAddress(body, RESERVE_OFF.farmCollateral),
    farmDebt: readAddress(body, RESERVE_OFF.farmDebt),
    liquidity: {
      mint: readAddress(body, RESERVE_OFF.liqMintPubkey),
      supplyVault: readAddress(body, RESERVE_OFF.liqSupplyVault),
      feeVault: readAddress(body, RESERVE_OFF.liqFeeVault),
      tokenProgram: readAddress(body, RESERVE_OFF.liqTokenProgram),
      mintDecimals: Number(body.readBigUInt64LE(RESERVE_OFF.liqMintDecimals)),
      availableAmount: body.readBigUInt64LE(RESERVE_OFF.liqAvailableAmount),
      borrowedAmountSf: readU128LE(body, RESERVE_OFF.liqBorrowedAmountSf),
      accumulatedProtocolFeesSf: readU128LE(body, RESERVE_OFF.liqAccumulatedProtocolFeesSf),
      accumulatedReferrerFeesSf: readU128LE(body, RESERVE_OFF.liqAccumulatedReferrerFeesSf),
    },
    collateral: {
      mint: readAddress(body, RESERVE_OFF.collMintPubkey),
      supplyVault: readAddress(body, RESERVE_OFF.collSupplyVault),
      mintTotalSupply: body.readBigUInt64LE(RESERVE_OFF.collMintTotalSupply),
    },
    config: {
      loanToValuePct: body.readUInt8(RESERVE_OFF.cfgLoanToValuePct),
      borrowFactorPct: body.readBigUInt64LE(RESERVE_OFF.cfgBorrowFactorPct),
    },
    oracles: {
      pyth: readAddressOrNull(body, RESERVE_OFF.pythPrice),
      switchboardPrice: readAddressOrNull(body, RESERVE_OFF.switchboardPriceAggregator),
      switchboardTwap: readAddressOrNull(body, RESERVE_OFF.switchboardTwapAggregator),
      scope: readAddressOrNull(body, RESERVE_OFF.scopePriceFeed),
    },
  };
}

export { decodeReserve };
export type { DecodedReserve };
