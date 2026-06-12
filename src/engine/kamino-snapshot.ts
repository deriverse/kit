import { Address, Commitment, Rpc, SolanaRpcApiDevnet, SolanaRpcApiMainnet } from '@solana/kit';
import { Buffer } from 'buffer';

import { Scope } from '@kamino-finance/scope-sdk';

import { KaminoReserveInfo } from '../types';
import {
  DecodedObligation,
  ObligationBorrow,
  ObligationDeposit,
  ObligationSnapshot,
  PositionView,
  SnapshotTotals,
} from '../types/kamino';
import { KLEND_PROGRAM_ID } from '../constants';
import {
  OBLIGATION_BORROWED_AMOUNT_SF_OFFSET,
  OBLIGATION_BORROWS_OFFSET,
  OBLIGATION_COLLATERAL_DEPOSITED_AMOUNT_OFFSET,
  OBLIGATION_COLLATERAL_SIZE,
  OBLIGATION_DEPOSITS_OFFSET,
  OBLIGATION_DISCRIMINATOR,
  OBLIGATION_LIQUIDITY_SIZE,
  OBLIGATION_OWNER_OFFSET,
  accountOwner,
  dataToBuffer,
  loadKaminoReserve,
  readAddress,
  readU128,
  readU64,
} from './kamino-instructions';

const SF_FRAC_BITS = BigInt(60);
const ZERO = BigInt(0);
const ONE = BigInt(1);
const SF_ONE = ONE << SF_FRAC_BITS;
const OBLIGATION_LAST_UPDATE_SLOT_OFFSET = 16;
const OBLIGATION_LENDING_MARKET_OFFSET = 32;
const OBLIGATION_DEPOSITS_COUNT = 8;
const OBLIGATION_BORROWS_COUNT = 5;
const OBLIGATION_MIN_SIZE = OBLIGATION_BORROWS_OFFSET + OBLIGATION_BORROWS_COUNT * OBLIGATION_LIQUIDITY_SIZE;

type ScopeCluster = 'localnet' | 'devnet' | 'mainnet-beta';

interface SnapshotContext {
  rpc: Rpc<SolanaRpcApiDevnet> | Rpc<SolanaRpcApiMainnet>;
  commitment: Commitment;
}

interface SnapshotObligationArgs {
  obligation: Address;
  cluster?: ScopeCluster;
}

async function snapshotObligation(ctx: SnapshotContext, args: SnapshotObligationArgs): Promise<ObligationSnapshot> {
  const obligation = await loadKaminoObligation(ctx, args.obligation);
  const reserveAddresses = uniqueAddresses([...obligation.depositReserves, ...obligation.borrowReserves]);
  const reserveList = await Promise.all(reserveAddresses.map((address) => loadKaminoReserve(ctx, address)));
  const reserves = new Map(reserveList.map((reserve) => [reserve.address, reserve]));

  const [mintPrices, slotResp] = await Promise.all([
    fetchScopePrices(ctx, reserveList, args.cluster ?? 'devnet'),
    ctx.rpc.getSlot({ commitment: ctx.commitment }).send(),
  ]);
  const currentSlot = BigInt(slotResp);

  const deposits = obligation.deposits.map((deposit) => {
    const reserve = requireReserve(reserves, deposit.reserve);
    return buildPosition(reserve, cTokensToLamports(deposit.depositedCTokens, reserve), mintPrices, currentSlot);
  });
  const borrows = obligation.borrows.map((borrow) => {
    const reserve = requireReserve(reserves, borrow.reserve);
    return buildPosition(reserve, sfToRoundedUpRaw(borrow.borrowedAmountSf), mintPrices, currentSlot);
  });

  return {
    obligation,
    currentSlot,
    deposits,
    borrows,
    totals: computeTotals(deposits, borrows, reserves),
  };
}

async function loadKaminoObligation(ctx: SnapshotContext, obligationAddress: Address): Promise<DecodedObligation> {
  const info = await ctx.rpc
    .getAccountInfo(obligationAddress, { commitment: ctx.commitment, encoding: 'base64' })
    .send();
  if (info.value == null) {
    throw new Error(`Kamino obligation not found: ${obligationAddress}`);
  }
  if (accountOwner(info.value) !== KLEND_PROGRAM_ID) {
    throw new Error(`Kamino obligation is not owned by KLend: ${obligationAddress}`);
  }
  const buffer = dataToBuffer(info.value.data);
  if (buffer.length < OBLIGATION_MIN_SIZE || !buffer.subarray(0, 8).equals(OBLIGATION_DISCRIMINATOR)) {
    throw new Error(`Invalid Kamino obligation layout: ${obligationAddress}`);
  }

  const deposits = decodeObligationDeposits(buffer);
  const borrows = decodeObligationBorrows(buffer);

  return {
    address: obligationAddress,
    lastUpdateSlot: BigInt(readU64(buffer, OBLIGATION_LAST_UPDATE_SLOT_OFFSET)),
    lendingMarket: readAddress(buffer, OBLIGATION_LENDING_MARKET_OFFSET),
    owner: readAddress(buffer, OBLIGATION_OWNER_OFFSET),
    depositReserves: uniqueAddresses(deposits.map((entry) => entry.reserve)),
    borrowReserves: uniqueAddresses(borrows.map((entry) => entry.reserve)),
    deposits,
    borrows,
  };
}

function decodeObligationDeposits(buffer: Buffer): ObligationDeposit[] {
  const deposits: ObligationDeposit[] = [];
  for (let i = 0; i < OBLIGATION_DEPOSITS_COUNT; i++) {
    const offset = OBLIGATION_DEPOSITS_OFFSET + i * OBLIGATION_COLLATERAL_SIZE;
    const depositedCTokens = BigInt(readU64(buffer, offset + OBLIGATION_COLLATERAL_DEPOSITED_AMOUNT_OFFSET));
    if (depositedCTokens === ZERO) continue;
    deposits.push({ reserve: readAddress(buffer, offset), depositedCTokens });
  }
  return deposits;
}

function decodeObligationBorrows(buffer: Buffer): ObligationBorrow[] {
  const borrows: ObligationBorrow[] = [];
  for (let i = 0; i < OBLIGATION_BORROWS_COUNT; i++) {
    const offset = OBLIGATION_BORROWS_OFFSET + i * OBLIGATION_LIQUIDITY_SIZE;
    const borrowedAmountSf = readU128(buffer, offset + OBLIGATION_BORROWED_AMOUNT_SF_OFFSET);
    if (borrowedAmountSf === ZERO) continue;
    borrows.push({ reserve: readAddress(buffer, offset), borrowedAmountSf });
  }
  return borrows;
}

async function fetchScopePrices(
  ctx: SnapshotContext,
  reserveList: KaminoReserveInfo[],
  cluster: ScopeCluster,
): Promise<Map<string, number>> {
  const mintPrices = new Map<string, number>();
  const scopeFeeds = uniqueAddresses(
    reserveList.map((reserve) => reserve.oracles.scope).filter((feed) => feed !== KLEND_PROGRAM_ID),
  );
  if (scopeFeeds.length === 0) {
    return mintPrices;
  }

  const scope = new Scope(cluster, ctx.rpc as any);
  const feedInfo = await ctx.rpc
    .getAccountInfo(scopeFeeds[0], { encoding: 'base64', commitment: ctx.commitment })
    .send();
  if (feedInfo.value) {
    (scope as any)._config = { ...scope.config, programId: feedInfo.value.owner };
  }
  const oraclePricesByFeed = new Map(
    (await scope.getOraclePrices(scopeFeeds as any)).map(([feed, prices]) => [feed as string, prices]),
  );

  for (const reserve of reserveList) {
    const prices = oraclePricesByFeed.get(reserve.oracles.scope as string);
    const chain = reserve.scopePriceChain;
    if (!prices || !Scope.isScopeChainValid(chain)) continue;
    const { price } = Scope.getPriceFromScopeChain(chain, prices);
    mintPrices.set(reserve.liquidityMint, price.toNumber());
  }
  return mintPrices;
}

function requireReserve(reserves: Map<Address, KaminoReserveInfo>, address: Address): KaminoReserveInfo {
  const reserve = reserves.get(address);
  if (!reserve) {
    throw new Error(`Reserve ${address} missing from batch fetch`);
  }
  return reserve;
}

function buildPosition(
  reserve: KaminoReserveInfo,
  rawLamports: bigint,
  mintPrices: Map<string, number>,
  currentSlot: bigint,
): PositionView {
  const decimals = reserve.mintDecimals;
  const priceUsd = mintPrices.get(reserve.liquidityMint) ?? 0;
  return {
    reserve: reserve.address,
    mint: reserve.liquidityMint,
    decimals,
    rawLamports,
    uiAmount: lamportsToUiAmount(rawLamports, decimals),
    usdValue: tokenAmountToUsd(rawLamports, decimals, priceUsd),
    priceUsd,
    lastUpdateSlot: reserve.lastUpdateSlot,
    slotsSinceRefresh: currentSlot - reserve.lastUpdateSlot,
  };
}

function computeTotals(
  deposits: PositionView[],
  borrows: PositionView[],
  reserves: Map<Address, KaminoReserveInfo>,
): SnapshotTotals {
  let collateralUsd = 0;
  let maxBorrowUsd = 0;
  for (const view of deposits) {
    collateralUsd += view.usdValue;
    maxBorrowUsd += view.usdValue * loanToValueRatio(requireReserve(reserves, view.reserve));
  }

  let borrowUsd = 0;
  let weightedDebtUsd = 0;
  for (const view of borrows) {
    borrowUsd += view.usdValue;
    weightedDebtUsd += view.usdValue * borrowFactorRatio(requireReserve(reserves, view.reserve));
  }

  return {
    collateralUsd,
    borrowUsd,
    weightedDebtUsd,
    maxBorrowUsd,
    healthFactor: healthFactor(maxBorrowUsd, weightedDebtUsd),
  };
}

function uniqueAddresses(addresses: Address[]): Address[] {
  return [...new Set(addresses)];
}

function sfToRoundedUpRaw(sf: bigint): bigint {
  return (sf + (SF_ONE - ONE)) >> SF_FRAC_BITS;
}

function reserveTotalSupplierLiquiditySf(reserve: KaminoReserveInfo): bigint {
  return (
    (BigInt(reserve.raw.totalAvailableAmount) << SF_FRAC_BITS) +
    reserve.raw.borrowedAmountSfRaw -
    reserve.raw.accumulatedProtocolFeesSfRaw -
    reserve.raw.accumulatedReferrerFeesSfRaw
  );
}

function cTokensToLamports(cTokens: bigint, reserve: KaminoReserveInfo): bigint {
  const totalSupply = BigInt(reserve.raw.collateralMintTotalSupply);
  if (totalSupply === ZERO) return ZERO;
  const numeratorSf = cTokens * reserveTotalSupplierLiquiditySf(reserve);
  const denominatorSf = totalSupply << SF_FRAC_BITS;
  return numeratorSf / denominatorSf;
}

function loanToValueRatio(reserve: KaminoReserveInfo): number {
  return reserve.loanToValuePct / 100;
}

function borrowFactorRatio(reserve: KaminoReserveInfo): number {
  return Number(reserve.borrowFactorPct) / 100;
}

function lamportsToUiAmount(amount: bigint, decimals: number): number {
  return Number(amount) / Math.pow(10, decimals);
}

function tokenAmountToUsd(amount: bigint, decimals: number, priceUsd: number): number {
  return lamportsToUiAmount(amount, decimals) * priceUsd;
}

function healthFactor(maxLtvBorrowValueUsd: number, currentBorrowValueUsd: number): number {
  if (currentBorrowValueUsd <= 0) return Infinity;
  return maxLtvBorrowValueUsd / currentBorrowValueUsd;
}

export { snapshotObligation };
export type { ScopeCluster, SnapshotContext, SnapshotObligationArgs };
