import { Address, Commitment, Rpc, SolanaRpcApiDevnet, SolanaRpcApiMainnet } from '@solana/kit';

import { fetchObligationDecoded, fetchReservesDecoded } from './fetch';
import {
  borrowFactorRatio,
  cTokensToLamports,
  healthFactor,
  lamportsToUiAmount,
  loanToValueRatio,
  sfToRoundedUpRaw,
  tokenAmountToUsd,
} from './math';
import { DecodedReserve, ObligationSnapshot, PositionView } from '../../types/kamino';

interface KaminoSnapshotContext {
  rpc: Rpc<SolanaRpcApiDevnet> | Rpc<SolanaRpcApiMainnet>;
  commitment: Commitment;
}

function buildPosition(
  reserve: DecodedReserve,
  rawLamports: bigint,
  priceUsd: number,
  currentSlot: bigint,
): PositionView {
  const decimals = reserve.liquidity.mintDecimals;
  return {
    reserve: reserve.address,
    mint: reserve.liquidity.mint,
    decimals,
    rawLamports,
    uiAmount: lamportsToUiAmount(rawLamports, decimals),
    usdValue: tokenAmountToUsd(rawLamports, decimals, priceUsd),
    priceUsd,
    lastUpdateSlot: reserve.lastUpdateSlot,
    slotsSinceRefresh: currentSlot - reserve.lastUpdateSlot,
  };
}

async function snapshotObligation(ctx: KaminoSnapshotContext, obligationAddress: Address): Promise<ObligationSnapshot> {
  const obligation = await fetchObligationDecoded(ctx, obligationAddress);
  const allReservesAddresses = new Set<Address>([...obligation.depositReserves, ...obligation.borrowReserves]);

  const reserves = await fetchReservesDecoded(ctx, [...allReservesAddresses]);

  const slotResp = await ctx.rpc.getSlot({ commitment: ctx.commitment }).send();
  const currentSlot = BigInt(slotResp);

  const mintPrices = new Map<string, number>(); // TODO: Sergei

  let collateralUsd = 0;
  let borrowUsd = 0;
  let weightedDebtUsd = 0;
  let maxBorrowUsd = 0;

  const deposits: PositionView[] = obligation.deposits.map((deposit) => {
    const reserve = reserves.get(deposit.reserve);
    if (!reserve) throw new Error(`Reserve ${deposit.reserve} missing from batch fetch`);

    const lamports = cTokensToLamports(deposit.depositedCTokens, reserve);
    const view = buildPosition(reserve, lamports, mintPrices.get(reserve.liquidity.mint) ?? 0, currentSlot);

    collateralUsd += view.usdValue;
    maxBorrowUsd += view.usdValue * loanToValueRatio(reserve);

    return view;
  });

  const borrows: PositionView[] = obligation.borrows.map((borrow) => {
    const reserve = reserves.get(borrow.reserve);
    if (!reserve) throw new Error(`Reserve ${borrow.reserve} missing from batch fetch`);

    const lamports = sfToRoundedUpRaw(borrow.borrowedAmountSf);
    const view = buildPosition(reserve, lamports, mintPrices.get(reserve.liquidity.mint) ?? 0, currentSlot);

    borrowUsd += view.usdValue;
    weightedDebtUsd += view.usdValue * borrowFactorRatio(reserve);

    return view;
  });

  return {
    obligation,
    currentSlot,
    deposits,
    borrows,
    totals: {
      collateralUsd,
      borrowUsd,
      weightedDebtUsd,
      maxBorrowUsd,
      healthFactor: healthFactor(maxBorrowUsd, weightedDebtUsd),
    },
  };
}

export { snapshotObligation };
