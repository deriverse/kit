import {
  Address,
  Commitment,
  Rpc,
  SolanaRpcApiDevnet,
  SolanaRpcApiMainnet,
} from '@solana/kit';
import { Buffer } from 'buffer';

import { KLEND_PROGRAM_ID } from '../../constants';
import { Instrument } from '../../types';
import { TokenFlag, TokenStateModel } from '../../structure_models';
import { DecodedObligation, decodeObligation } from './obligation';
import { DecodedReserve, decodeReserve } from './reserve';
import {
  borrowFactorRatio,
  cTokensToLamports,
  healthFactor,
  lamportsToUiAmount,
  loanToValueRatio,
  sfToRoundedUpRaw,
  tokenAmountToUsd,
} from './math';

interface KaminoSnapshotContext {
  rpc: Rpc<SolanaRpcApiDevnet> | Rpc<SolanaRpcApiMainnet>;
  commitment: Commitment;
  tokens: Map<number, TokenStateModel>;
  instruments: Map<number, Instrument>;
  updateInstrData: (instrId: number) => Promise<void>;
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
  stalestReserveSlot: bigint | null;
  obligationLastUpdateSlot: bigint;
}

interface ObligationSnapshot {
  obligation: Address;
  lendingMarket: Address;
  owner: Address;
  currentSlot: bigint;
  deposits: PositionView[];
  borrows: PositionView[];
  totals: SnapshotTotals;
}

interface SnapshotObligationArgs {
  obligation: Address;
}

async function fetchObligationDecoded(
  ctx: KaminoSnapshotContext,
  obligationAddress: Address,
): Promise<DecodedObligation> {
  const info = await ctx.rpc
    .getAccountInfo(obligationAddress, { encoding: 'base64', commitment: ctx.commitment })
    .send();
  if (!info.value) {
    throw new Error(`Obligation ${obligationAddress} not found`);
  }
  if (info.value.owner !== KLEND_PROGRAM_ID) {
    throw new Error(`Obligation ${obligationAddress} not owned by Kamino lend`);
  }
  const [b64] = info.value.data as [string, 'base64'];
  return decodeObligation(obligationAddress, Buffer.from(b64, 'base64'));
}

async function fetchReservesDecoded(
  ctx: KaminoSnapshotContext,
  reserveAddresses: readonly Address[],
): Promise<Map<Address, DecodedReserve>> {
  const out = new Map<Address, DecodedReserve>();
  if (reserveAddresses.length === 0) return out;
  const infos = await ctx.rpc
    .getMultipleAccounts(reserveAddresses as Address[], {
      encoding: 'base64',
      commitment: ctx.commitment,
    })
    .send();
  infos.value.forEach((info, i) => {
    const addr = reserveAddresses[i];
    if (!info) throw new Error(`Reserve ${addr} not found`);
    if (info.owner !== KLEND_PROGRAM_ID) {
      throw new Error(`Reserve ${addr} not owned by Kamino lend`);
    }
    const [b64] = info.data as [string, 'base64'];
    out.set(addr, decodeReserve(addr, Buffer.from(b64, 'base64')));
  });
  return out;
}

function isBaseCrncy(token: TokenStateModel): boolean {
  return (token.mask & TokenFlag.baseCrncy) !== 0;
}

function indexTokensByMint(tokens: Map<number, TokenStateModel>): Map<Address, TokenStateModel> {
  const out = new Map<Address, TokenStateModel>();
  for (const t of tokens.values()) out.set(t.address, t);
  return out;
}

interface PriceSource {
  instrId: number;
  tokenSide: 'asset' | 'crncy';
}

function indexPriceSourcesByTokenId(
  tokens: Map<number, TokenStateModel>,
  instruments: Map<number, Instrument>,
): Map<number, PriceSource> {
  const out = new Map<number, PriceSource>();
  for (const instr of instruments.values()) {
    const asset = tokens.get(instr.header.assetTokenId);
    const crncy = tokens.get(instr.header.crncyTokenId);
    if (!asset || !crncy) continue;
    if (isBaseCrncy(crncy)) {
      const existing = out.get(asset.id);
      if (!existing || existing.tokenSide === 'crncy') {
        out.set(asset.id, { instrId: instr.header.instrId, tokenSide: 'asset' });
      }
    }
    if (isBaseCrncy(asset)) {
      if (!out.has(crncy.id)) {
        out.set(crncy.id, { instrId: instr.header.instrId, tokenSide: 'crncy' });
      }
    }
  }
  return out;
}

function requireTokenForMint(
  tokensByMint: Map<Address, TokenStateModel>,
  mint: Address,
): TokenStateModel {
  const token = tokensByMint.get(mint);
  if (!token) throw new Error(`Token not registered in Deriverse for mint ${mint}`);
  return token;
}

function requirePriceSource(
  priceSourcesByTokenId: Map<number, PriceSource>,
  tokenId: number,
): PriceSource {
  const src = priceSourcesByTokenId.get(tokenId);
  if (!src) {
    throw new Error(`No Deriverse instrument found pricing token ${tokenId} against a base currency`);
  }
  return src;
}

function priceFromInstr(instr: Instrument, tokenSide: 'asset' | 'crncy'): number {
  const lastPx = instr.header.lastPx;
  if (!lastPx) {
    throw new Error(`Instrument ${instr.header.instrId} has no lastPx (=${lastPx})`);
  }
  return tokenSide === 'asset' ? lastPx : 1 / lastPx;
}

function buildPriceTable(
  ctx: KaminoSnapshotContext,
  uniqueMints: readonly Address[],
  tokensByMint: Map<Address, TokenStateModel>,
  priceSourcesByTokenId: Map<number, PriceSource>,
): Map<Address, number> {
  const out = new Map<Address, number>();
  for (const mint of uniqueMints) {
    const token = requireTokenForMint(tokensByMint, mint);
    if (isBaseCrncy(token)) {
      out.set(mint, 1.0);
      continue;
    }
    const src = requirePriceSource(priceSourcesByTokenId, token.id);
    const instr = ctx.instruments.get(src.instrId);
    if (!instr) throw new Error(`Instrument ${src.instrId} missing after refresh`);
    out.set(mint, priceFromInstr(instr, src.tokenSide));
  }
  return out;
}

function computeStalestReserveSlot(reserves: Iterable<DecodedReserve>): bigint | null {
  let stalest: bigint | null = null;
  for (const r of reserves) {
    if (stalest === null || r.lastUpdateSlot < stalest) stalest = r.lastUpdateSlot;
  }
  return stalest;
}

function buildPosition(
  reserve: DecodedReserve,
  rawLamports: bigint,
  priceUsd: number,
  currentSlot: bigint,
): PositionView {
  const mint = reserve.liquidity.mint;
  const decimals = reserve.liquidity.mintDecimals;
  return {
    reserve: reserve.address,
    mint,
    decimals,
    rawLamports,
    uiAmount: lamportsToUiAmount(rawLamports, decimals),
    usdValue: tokenAmountToUsd(rawLamports, decimals, priceUsd),
    priceUsd,
    lastUpdateSlot: reserve.lastUpdateSlot,
    slotsSinceRefresh:
      currentSlot >= reserve.lastUpdateSlot ? currentSlot - reserve.lastUpdateSlot : BigInt(0),
  };
}

async function snapshotObligation(
  ctx: KaminoSnapshotContext,
  args: SnapshotObligationArgs,
): Promise<ObligationSnapshot> {
  const obligation = await fetchObligationDecoded(ctx, args.obligation);

  const uniqueReserves = new Set<Address>([...obligation.depositReserves, ...obligation.borrowReserves]);
  const reserveList = [...uniqueReserves];

  const [reserves, slotResp] = await Promise.all([
    fetchReservesDecoded(ctx, reserveList),
    ctx.rpc.getSlot({ commitment: ctx.commitment }).send(),
  ]);
  const currentSlot = BigInt(slotResp);

  const uniqueMints = new Set<Address>();
  for (const r of reserves.values()) uniqueMints.add(r.liquidity.mint);

  const tokensByMint = indexTokensByMint(ctx.tokens);
  const priceSourcesByTokenId = indexPriceSourcesByTokenId(ctx.tokens, ctx.instruments);

  const instrIdsToRefresh = new Set<number>();
  for (const mint of uniqueMints) {
    const token = requireTokenForMint(tokensByMint, mint);
    if (isBaseCrncy(token)) continue;
    instrIdsToRefresh.add(requirePriceSource(priceSourcesByTokenId, token.id).instrId);
  }
  await Promise.all([...instrIdsToRefresh].map((id) => ctx.updateInstrData(id)));

  const mintPrices = buildPriceTable(ctx, [...uniqueMints], tokensByMint, priceSourcesByTokenId);

  let collateralUsd = 0;
  let borrowUsd = 0;
  let weightedDebtUsd = 0;
  let maxBorrowUsd = 0;

  const deposits: PositionView[] = obligation.deposits.map((d) => {
    const reserve = reserves.get(d.reserve);
    if (!reserve) throw new Error(`Reserve ${d.reserve} missing from batch fetch`);
    const lamports = cTokensToLamports(d.depositedCTokens, reserve);
    const view = buildPosition(reserve, lamports, mintPrices.get(reserve.liquidity.mint)!, currentSlot);
    collateralUsd += view.usdValue;
    maxBorrowUsd += view.usdValue * loanToValueRatio(reserve);
    return view;
  });

  const borrows: PositionView[] = obligation.borrows.map((b) => {
    const reserve = reserves.get(b.reserve);
    if (!reserve) throw new Error(`Reserve ${b.reserve} missing from batch fetch`);
    const lamports = sfToRoundedUpRaw(b.borrowedAmountSf);
    const view = buildPosition(reserve, lamports, mintPrices.get(reserve.liquidity.mint)!, currentSlot);
    borrowUsd += view.usdValue;
    weightedDebtUsd += view.usdValue * borrowFactorRatio(reserve);
    return view;
  });

  const stalestReserveSlot = computeStalestReserveSlot(reserves.values());

  return {
    obligation: obligation.address,
    lendingMarket: obligation.lendingMarket,
    owner: obligation.owner,
    currentSlot,
    deposits,
    borrows,
    totals: {
      collateralUsd,
      borrowUsd,
      weightedDebtUsd,
      maxBorrowUsd,
      healthFactor: healthFactor(maxBorrowUsd, weightedDebtUsd),
      stalestReserveSlot,
      obligationLastUpdateSlot: obligation.lastUpdateSlot,
    },
  };
}

export { snapshotObligation };
export type {
  KaminoSnapshotContext,
  SnapshotObligationArgs,
  PositionView,
  SnapshotTotals,
  ObligationSnapshot,
};
