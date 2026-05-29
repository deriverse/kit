import { SF_FRAC_BITS } from '../../constants';
import { DecodedReserve } from './reserve';

const ZERO = BigInt(0);
const ONE = BigInt(1);
const SF_FRAC_MASK = (ONE << SF_FRAC_BITS) - ONE;

function sfToRaw(sf: bigint): bigint {
  return sf >> SF_FRAC_BITS;
}

function sfToRoundedUpRaw(sf: bigint): bigint {
  const integerPart = sf >> SF_FRAC_BITS;
  const fracPart = sf & SF_FRAC_MASK;
  return fracPart > ZERO ? integerPart + ONE : integerPart;
}

function reserveTotalSupplierLiquiditySf(reserve: DecodedReserve): bigint {
  const l = reserve.liquidity;
  return (
    (l.availableAmount << SF_FRAC_BITS) +
    l.borrowedAmountSf -
    l.accumulatedProtocolFeesSf -
    l.accumulatedReferrerFeesSf
  );
}

function cTokensToLamports(cTokens: bigint, reserve: DecodedReserve): bigint {
  if (reserve.collateral.mintTotalSupply === ZERO) return ZERO;
  const numeratorSf = cTokens * reserveTotalSupplierLiquiditySf(reserve);
  const denominatorSf = reserve.collateral.mintTotalSupply << SF_FRAC_BITS;
  return numeratorSf / denominatorSf;
}

function loanToValueRatio(reserve: DecodedReserve): number {
  return reserve.config.loanToValuePct / 100;
}

function borrowFactorRatio(reserve: DecodedReserve): number {
  return Number(reserve.config.borrowFactorPct) / 100;
}

function lamportsToUiAmount(amount: bigint, decimals: number): number {
  return Number(amount) / Math.pow(10, decimals);
}

function uiAmountToLamports(ui: number, decimals: number): bigint {
  return BigInt(Math.trunc(ui * Math.pow(10, decimals)));
}

function tokenAmountToUsd(amount: bigint, decimals: number, priceUsd: number): number {
  return lamportsToUiAmount(amount, decimals) * priceUsd;
}

function maxBorrowValueUsd(collateralReserve: DecodedReserve, collateralValueUsd: number): number {
  return collateralValueUsd * loanToValueRatio(collateralReserve);
}

function effectiveDebtValueUsd(borrowReserve: DecodedReserve, borrowValueUsd: number): number {
  return borrowValueUsd * borrowFactorRatio(borrowReserve);
}

function healthFactor(maxLtvBorrowValueUsd: number, currentBorrowValueUsd: number): number {
  if (currentBorrowValueUsd <= 0) return Infinity;
  return maxLtvBorrowValueUsd / currentBorrowValueUsd;
}

export {
  sfToRaw,
  sfToRoundedUpRaw,
  reserveTotalSupplierLiquiditySf,
  cTokensToLamports,
  loanToValueRatio,
  borrowFactorRatio,
  lamportsToUiAmount,
  uiAmountToLamports,
  tokenAmountToUsd,
  maxBorrowValueUsd,
  effectiveDebtValueUsd,
  healthFactor,
};
