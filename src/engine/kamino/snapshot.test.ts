import { describe, it, expect, vi } from 'vitest';
import { Address, getAddressDecoder, getAddressEncoder } from '@solana/kit';
import { Buffer } from 'buffer';

import { KLEND_PROGRAM_ID, SF_FRAC_BITS } from '../../constants';
import { Instrument } from '../../types';
import { InstrAccountHeaderModel, TokenFlag, TokenStateModel } from '../../structure_models';
import { decodeObligation } from './obligation';
import { decodeReserve } from './reserve';
import {
  cTokensToLamports,
  healthFactor,
  lamportsToUiAmount,
  loanToValueRatio,
  sfToRoundedUpRaw,
} from './math';
import { snapshotObligation } from './snapshot';

const ADDR = getAddressDecoder();
const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const SHIFT_64 = BigInt(64);
const MASK_64 = (ONE << SHIFT_64) - ONE;

const RESERVE_DISCRIMINATOR = Buffer.from([43, 242, 204, 202, 26, 247, 59, 127]);
const OBLIGATION_DISCRIMINATOR = Buffer.from([168, 206, 141, 106, 88, 76, 172, 167]);

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

const RESERVE_SIZE = 8 + RESERVE_OFF.pythPrice + 32;

const OBLIGATION_HEADER_BYTES = 8 + 16 + 32 + 32;
const DEPOSIT_SLOTS = 8;
const DEPOSIT_SIZE = 32 + 8 + 16 + 8 + 9 * 8;
const DEPOSITS_OFFSET = OBLIGATION_HEADER_BYTES;
const DEPOSITS_END = DEPOSITS_OFFSET + DEPOSIT_SLOTS * DEPOSIT_SIZE;
const BORROW_SLOTS = 5;
const BORROW_SIZE = 32 + 48 + 8 + 16 + 16 + 16 + 8 + 7 * 8;
const BORROWS_OFFSET = DEPOSITS_END + 8 + 16;
const REFERRER_OFFSET = BORROWS_OFFSET + BORROW_SLOTS * BORROW_SIZE + 16 + 16 + 16 + 16 + 13 + 1 + 1 + 1;
const OBLIGATION_SIZE = 8 + REFERRER_OFFSET + 32;

function writePubkey(buf: Buffer, offset: number, seed: number) {
  for (let i = 0; i < 32; i++) buf[offset + i] = (seed + i) & 0xff;
}

function pubkeyAt(buf: Buffer, offset: number): Address {
  return ADDR.decode(buf.subarray(offset, offset + 32));
}

function writeU128LE(buf: Buffer, offset: number, value: bigint) {
  buf.writeBigUInt64LE(value & MASK_64, offset);
  buf.writeBigUInt64LE(value >> SHIFT_64, offset + 8);
}

function buildReserveBuf(opts: {
  lastUpdateSlot: bigint;
  availableAmount: bigint;
  borrowedAmountSf: bigint;
  mintTotalSupply: bigint;
  mintDecimals: number;
  loanToValuePct: number;
  borrowFactorPct: bigint;
  mintSeed: number;
}): Buffer {
  const buf = Buffer.alloc(RESERVE_SIZE);
  RESERVE_DISCRIMINATOR.copy(buf, 0);
  const body = buf.subarray(8);

  body.writeBigUInt64LE(opts.lastUpdateSlot, RESERVE_OFF.lastUpdateSlot);
  writePubkey(body, RESERVE_OFF.lendingMarket, 1);
  writePubkey(body, RESERVE_OFF.liqMintPubkey, opts.mintSeed);
  writePubkey(body, RESERVE_OFF.liqSupplyVault, 4);
  writePubkey(body, RESERVE_OFF.liqFeeVault, 5);
  body.writeBigUInt64LE(opts.availableAmount, RESERVE_OFF.liqAvailableAmount);
  writeU128LE(body, RESERVE_OFF.liqBorrowedAmountSf, opts.borrowedAmountSf);
  body.writeBigUInt64LE(BigInt(opts.mintDecimals), RESERVE_OFF.liqMintDecimals);
  writeU128LE(body, RESERVE_OFF.liqAccumulatedProtocolFeesSf, ZERO);
  writeU128LE(body, RESERVE_OFF.liqAccumulatedReferrerFeesSf, ZERO);
  writePubkey(body, RESERVE_OFF.liqTokenProgram, 7);
  writePubkey(body, RESERVE_OFF.collMintPubkey, 8);
  body.writeBigUInt64LE(opts.mintTotalSupply, RESERVE_OFF.collMintTotalSupply);
  writePubkey(body, RESERVE_OFF.collSupplyVault, 9);
  body.writeUInt8(opts.loanToValuePct, RESERVE_OFF.cfgLoanToValuePct);
  body.writeBigUInt64LE(opts.borrowFactorPct, RESERVE_OFF.cfgBorrowFactorPct);
  return buf;
}

function buildObligationBuf(opts: {
  lendingMarket: Address;
  owner: Address;
  deposits: { reserve: Address; depositedCTokens: bigint }[];
  borrows: { reserve: Address; borrowedAmountSf: bigint }[];
}): Buffer {
  const buf = Buffer.alloc(OBLIGATION_SIZE);
  OBLIGATION_DISCRIMINATOR.copy(buf, 0);
  const body = buf.subarray(8);

  const addrEncoder = getAddressEncoder();
  function writeAddressAt(at: number, addr: Address) {
    const bytes = addrEncoder.encode(addr);
    Buffer.from(bytes).copy(body, at);
  }

  writeAddressAt(8 + 16, opts.lendingMarket);
  writeAddressAt(8 + 16 + 32, opts.owner);

  opts.deposits.forEach((d, i) => {
    const slot = DEPOSITS_OFFSET + i * DEPOSIT_SIZE;
    writeAddressAt(slot, d.reserve);
    body.writeBigUInt64LE(d.depositedCTokens, slot + 32);
  });
  opts.borrows.forEach((b, i) => {
    const slot = BORROWS_OFFSET + i * BORROW_SIZE;
    writeAddressAt(slot, b.reserve);
    writeU128LE(body, slot + 88, b.borrowedAmountSf);
  });

  return buf;
}

describe('kamino account decoders', () => {
  it('decodes a reserve with deterministic fields', () => {
    const raw = buildReserveBuf({
      lastUpdateSlot: BigInt(100),
      availableAmount: BigInt(1000),
      borrowedAmountSf: BigInt(500) << SF_FRAC_BITS,
      mintTotalSupply: BigInt(2000),
      mintDecimals: 6,
      loanToValuePct: 75,
      borrowFactorPct: BigInt(110),
      mintSeed: 3,
    });
    const reserveAddr = pubkeyAt(raw.subarray(8), RESERVE_OFF.liqMintPubkey);
    const decoded = decodeReserve(reserveAddr, raw);

    expect(decoded.lastUpdateSlot).toBe(BigInt(100));
    expect(decoded.liquidity.availableAmount).toBe(BigInt(1000));
    expect(decoded.liquidity.borrowedAmountSf).toBe(BigInt(500) << SF_FRAC_BITS);
    expect(decoded.liquidity.mintDecimals).toBe(6);
    expect(decoded.collateral.mintTotalSupply).toBe(BigInt(2000));
    expect(decoded.config.loanToValuePct).toBe(75);
    expect(decoded.config.borrowFactorPct).toBe(BigInt(110));
    expect(decoded.oracles.pyth).toBeNull();
    expect(decoded.oracles.switchboardPrice).toBeNull();
  });

  it('throws on wrong discriminator', () => {
    const raw = Buffer.alloc(RESERVE_SIZE);
    expect(() => decodeReserve(pubkeyAt(raw, 0), raw)).toThrow(/wrong discriminator/);
  });
});

describe('kamino math helpers', () => {
  it('cTokensToLamports applies the supplier-liquidity ratio', () => {
    const raw = buildReserveBuf({
      lastUpdateSlot: ZERO,
      availableAmount: BigInt(1000),
      borrowedAmountSf: ZERO,
      mintTotalSupply: BigInt(2000),
      mintDecimals: 6,
      loanToValuePct: 75,
      borrowFactorPct: BigInt(100),
      mintSeed: 3,
    });
    const reserve = decodeReserve(pubkeyAt(raw.subarray(8), RESERVE_OFF.liqMintPubkey), raw);
    // 1000 cTokens of 2000 minted against 1000 lamports of supplier liquidity → 500.
    expect(cTokensToLamports(BigInt(1000), reserve)).toBe(BigInt(500));
  });

  it('sfToRoundedUpRaw rounds up fractional parts', () => {
    expect(sfToRoundedUpRaw(ONE << SF_FRAC_BITS)).toBe(ONE);
    expect(sfToRoundedUpRaw((ONE << SF_FRAC_BITS) + ONE)).toBe(TWO);
  });

  it('lamportsToUiAmount honors decimals', () => {
    expect(lamportsToUiAmount(BigInt(1_000_000), 6)).toBeCloseTo(1.0);
    expect(lamportsToUiAmount(ZERO, 0)).toBe(0);
  });

  it('healthFactor returns Infinity when there is no debt', () => {
    expect(healthFactor(1000, 0)).toBe(Infinity);
    expect(healthFactor(1000, 500)).toBe(2);
  });

  it('loanToValueRatio scales the configured percentage', () => {
    const raw = buildReserveBuf({
      lastUpdateSlot: ZERO,
      availableAmount: ZERO,
      borrowedAmountSf: ZERO,
      mintTotalSupply: ZERO,
      mintDecimals: 0,
      loanToValuePct: 80,
      borrowFactorPct: BigInt(100),
      mintSeed: 3,
    });
    const reserve = decodeReserve(pubkeyAt(raw.subarray(8), RESERVE_OFF.liqMintPubkey), raw);
    expect(loanToValueRatio(reserve)).toBeCloseTo(0.8);
  });
});

describe('kamino obligation decoder', () => {
  it('walks deposits and borrows, skipping sentinels', () => {
    const reserveARaw = buildReserveBuf({
      lastUpdateSlot: ZERO,
      availableAmount: ZERO,
      borrowedAmountSf: ZERO,
      mintTotalSupply: ZERO,
      mintDecimals: 0,
      loanToValuePct: 50,
      borrowFactorPct: BigInt(100),
      mintSeed: 11,
    });
    const reserveAAddr = pubkeyAt(reserveARaw.subarray(8), RESERVE_OFF.liqMintPubkey);

    const reserveBRaw = buildReserveBuf({
      lastUpdateSlot: ZERO,
      availableAmount: ZERO,
      borrowedAmountSf: ZERO,
      mintTotalSupply: ZERO,
      mintDecimals: 0,
      loanToValuePct: 50,
      borrowFactorPct: BigInt(100),
      mintSeed: 22,
    });
    const reserveBAddr = pubkeyAt(reserveBRaw.subarray(8), RESERVE_OFF.liqMintPubkey);

    const lm = pubkeyAt(Buffer.from(new Array(64).fill(0).map((_, i) => i + 1)), 0);
    const owner = pubkeyAt(Buffer.from(new Array(64).fill(0).map((_, i) => i + 33)), 0);

    const obligationRaw = buildObligationBuf({
      lendingMarket: lm,
      owner,
      deposits: [{ reserve: reserveAAddr, depositedCTokens: BigInt(42) }],
      borrows: [{ reserve: reserveBAddr, borrowedAmountSf: BigInt(99) }],
    });

    const decoded = decodeObligation(reserveAAddr, obligationRaw);
    expect(decoded.lendingMarket).toBe(lm);
    expect(decoded.owner).toBe(owner);
    expect(decoded.deposits).toHaveLength(1);
    expect(decoded.deposits[0].depositedCTokens).toBe(BigInt(42));
    expect(decoded.borrows).toHaveLength(1);
    expect(decoded.borrows[0].borrowedAmountSf).toBe(BigInt(99));
  });
});

function makeToken(id: number, address: Address, mask: number = 0): TokenStateModel {
  const t = new TokenStateModel();
  t.tag = 0;
  t.version = 0;
  t.address = address;
  t.programAddress = pubkeyAt(Buffer.alloc(32), 0);
  t.id = id;
  t.mask = mask;
  t.reserved = 0;
  t.baseCrncyIndex = 0;
  return t;
}

function makeInstrument(opts: {
  instrId: number;
  assetTokenId: number;
  crncyTokenId: number;
  lastPx: number;
  addressSeed?: number;
}): Instrument {
  const header = new InstrAccountHeaderModel();
  header.instrId = opts.instrId;
  header.assetTokenId = opts.assetTokenId;
  header.crncyTokenId = opts.crncyTokenId;
  header.lastPx = opts.lastPx;
  const addrBuf = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) addrBuf[i] = ((opts.addressSeed ?? opts.instrId) + i) & 0xff;
  return {
    address: pubkeyAt(addrBuf, 0),
    header,
    spotBids: [],
    spotAsks: [],
    perpBids: [],
    perpAsks: [],
  };
}

function makeRpc(opts: {
  obligationAddress: Address;
  obligationBuf: Buffer;
  reservesByAddr: Map<Address, Buffer>;
  currentSlot: number;
}) {
  const b64 = (b: Buffer) => [b.toString('base64'), 'base64'] as [string, 'base64'];
  return {
    getAccountInfo: (addr: Address, _o: unknown) => ({
      send: async () => {
        if (addr !== opts.obligationAddress) {
          throw new Error(`unexpected getAccountInfo: ${addr}`);
        }
        return { value: { owner: KLEND_PROGRAM_ID, data: b64(opts.obligationBuf) } };
      },
    }),
    getMultipleAccounts: (addrs: Address[], _o: unknown) => ({
      send: async () => ({
        value: addrs.map((a) => {
          const buf = opts.reservesByAddr.get(a);
          if (!buf) return null;
          return { owner: KLEND_PROGRAM_ID, data: b64(buf) };
        }),
      }),
    }),
    getSlot: (_o: unknown) => ({
      send: async () => opts.currentSlot,
    }),
  };
}

describe('snapshotObligation', () => {
  const USDC_TOKEN_ID = 0;
  const ASSET_TOKEN_ID = 1;
  const OTHER_TOKEN_ID = 2;
  const ASSET_INSTR_ID = 100;
  const OTHER_INSTR_ID = 101;
  const ASSET_LAST_PX = 50;
  const OTHER_LAST_PX = 4; // For inverse case: USDC/OTHER means OTHER price = 1/4 = 0.25

  // Builds a Deriverse stub: USDC base + ASSET token + OTHER token, with an
  // ASSET/USDC instrument (direct) and a USDC/OTHER instrument (inverse).
  function makeStubMaps(opts: { assetMint: Address; otherMint?: Address }) {
    const usdcMint = pubkeyAt(Buffer.from(new Array(32).fill(7)), 0);
    const tokens = new Map<number, TokenStateModel>();
    tokens.set(USDC_TOKEN_ID, makeToken(USDC_TOKEN_ID, usdcMint, TokenFlag.baseCrncy));
    tokens.set(ASSET_TOKEN_ID, makeToken(ASSET_TOKEN_ID, opts.assetMint));
    if (opts.otherMint) {
      tokens.set(OTHER_TOKEN_ID, makeToken(OTHER_TOKEN_ID, opts.otherMint));
    }

    const instruments = new Map<number, Instrument>();
    instruments.set(
      ASSET_INSTR_ID,
      makeInstrument({
        instrId: ASSET_INSTR_ID,
        assetTokenId: ASSET_TOKEN_ID,
        crncyTokenId: USDC_TOKEN_ID,
        lastPx: ASSET_LAST_PX,
      }),
    );
    if (opts.otherMint) {
      instruments.set(
        OTHER_INSTR_ID,
        makeInstrument({
          instrId: OTHER_INSTR_ID,
          assetTokenId: USDC_TOKEN_ID,
          crncyTokenId: OTHER_TOKEN_ID,
          lastPx: OTHER_LAST_PX,
        }),
      );
    }
    return { tokens, instruments, usdcMint };
  }

  // Pre-built reserve+obligation for the happy-path case.
  function buildHappyFixture() {
    const reserveBuf = buildReserveBuf({
      lastUpdateSlot: BigInt(900),
      availableAmount: BigInt(1000),
      borrowedAmountSf: ZERO,
      mintTotalSupply: BigInt(2000),
      mintDecimals: 6,
      loanToValuePct: 80,
      borrowFactorPct: BigInt(100),
      mintSeed: 42,
    });
    const reserveAddr = pubkeyAt(Buffer.from(new Array(32).fill(11)), 0);
    const assetMint = pubkeyAt(reserveBuf.subarray(8), RESERVE_OFF.liqMintPubkey);

    const obligationAddr = pubkeyAt(Buffer.from(new Array(32).fill(99)), 0);
    const lm = pubkeyAt(Buffer.from(new Array(32).fill(50)), 0);
    const owner = pubkeyAt(Buffer.from(new Array(32).fill(60)), 0);
    const obligationBuf = buildObligationBuf({
      lendingMarket: lm,
      owner,
      deposits: [{ reserve: reserveAddr, depositedCTokens: BigInt(1000) }],
      borrows: [],
    });

    return { reserveBuf, reserveAddr, assetMint, obligationAddr, obligationBuf, lm, owner };
  }

  it('values a direct-pricing deposit and reports stalest slot', async () => {
    const { reserveBuf, reserveAddr, assetMint, obligationAddr, obligationBuf } = buildHappyFixture();
    const { tokens, instruments } = makeStubMaps({ assetMint });
    const updateInstrData = vi.fn().mockResolvedValue(undefined);

    const ctx = {
      rpc: makeRpc({
        obligationAddress: obligationAddr,
        obligationBuf,
        reservesByAddr: new Map([[reserveAddr, reserveBuf]]),
        currentSlot: 1000,
      }),
      commitment: 'confirmed' as const,
      tokens,
      instruments,
      updateInstrData,
    } as any;

    const snap = await snapshotObligation(ctx, { obligation: obligationAddr });

    // 1000 cTokens / 2000 mintTotalSupply * 1000 lamports of supplier liq = 500 lamports.
    expect(snap.deposits).toHaveLength(1);
    expect(snap.deposits[0].rawLamports).toBe(BigInt(500));
    expect(snap.deposits[0].uiAmount).toBeCloseTo(0.0005); // 500 / 10^6
    expect(snap.deposits[0].priceUsd).toBe(ASSET_LAST_PX);
    expect(snap.deposits[0].usdValue).toBeCloseTo(0.0005 * ASSET_LAST_PX);

    expect(snap.totals.collateralUsd).toBeCloseTo(0.0005 * ASSET_LAST_PX);
    expect(snap.totals.borrowUsd).toBe(0);
    expect(snap.totals.maxBorrowUsd).toBeCloseTo(snap.totals.collateralUsd * 0.8);
    expect(snap.totals.healthFactor).toBe(Infinity); // no debt
    expect(snap.totals.stalestReserveSlot).toBe(BigInt(900));
    expect(snap.currentSlot).toBe(BigInt(1000));

    // Refreshed the ASSET/USDC instrument exactly once.
    expect(updateInstrData).toHaveBeenCalledTimes(1);
    expect(updateInstrData).toHaveBeenCalledWith(ASSET_INSTR_ID);
  });

  it('prices a base-currency mint at 1.0 without refreshing any instrument', async () => {
    const usdcReserve = buildReserveBuf({
      lastUpdateSlot: BigInt(500),
      availableAmount: BigInt(2000),
      borrowedAmountSf: ZERO,
      mintTotalSupply: BigInt(2000),
      mintDecimals: 6,
      loanToValuePct: 90,
      borrowFactorPct: BigInt(100),
      mintSeed: 7,
    });
    const usdcReserveAddr = pubkeyAt(Buffer.from(new Array(32).fill(31)), 0);
    const assetMintUnused = pubkeyAt(Buffer.from(new Array(32).fill(15)), 0);
    const { tokens, instruments, usdcMint } = makeStubMaps({ assetMint: assetMintUnused });
    // Override the USDC reserve buf so its mint pubkey matches the base-currency token.
    Buffer.from(getAddressEncoder().encode(usdcMint)).copy(
      usdcReserve.subarray(8),
      RESERVE_OFF.liqMintPubkey,
    );

    const obligationAddr = pubkeyAt(Buffer.from(new Array(32).fill(98)), 0);
    const obligationBuf = buildObligationBuf({
      lendingMarket: pubkeyAt(Buffer.from(new Array(32).fill(50)), 0),
      owner: pubkeyAt(Buffer.from(new Array(32).fill(60)), 0),
      deposits: [{ reserve: usdcReserveAddr, depositedCTokens: BigInt(1000) }],
      borrows: [],
    });

    const updateInstrData = vi.fn().mockResolvedValue(undefined);
    const ctx = {
      rpc: makeRpc({
        obligationAddress: obligationAddr,
        obligationBuf,
        reservesByAddr: new Map([[usdcReserveAddr, usdcReserve]]),
        currentSlot: 1000,
      }),
      commitment: 'confirmed' as const,
      tokens,
      instruments,
      updateInstrData,
    } as any;

    const snap = await snapshotObligation(ctx, { obligation: obligationAddr });

    expect(snap.deposits[0].priceUsd).toBe(1.0);
    expect(updateInstrData).not.toHaveBeenCalled();
  });

  it('applies inverse pricing when the mint is the crncy side of a base-asset instrument', async () => {
    // OTHER lives on the crncy side of a USDC/OTHER instrument → priceUsd = 1/lastPx.
    const reserveBuf = buildReserveBuf({
      lastUpdateSlot: BigInt(900),
      availableAmount: BigInt(1000),
      borrowedAmountSf: ZERO,
      mintTotalSupply: BigInt(1000),
      mintDecimals: 0,
      loanToValuePct: 50,
      borrowFactorPct: BigInt(100),
      mintSeed: 77,
    });
    const reserveAddr = pubkeyAt(Buffer.from(new Array(32).fill(22)), 0);
    const otherMint = pubkeyAt(reserveBuf.subarray(8), RESERVE_OFF.liqMintPubkey);
    const assetMintUnused = pubkeyAt(Buffer.from(new Array(32).fill(15)), 0);

    const { tokens, instruments } = makeStubMaps({ assetMint: assetMintUnused, otherMint });

    const obligationAddr = pubkeyAt(Buffer.from(new Array(32).fill(97)), 0);
    const obligationBuf = buildObligationBuf({
      lendingMarket: pubkeyAt(Buffer.from(new Array(32).fill(50)), 0),
      owner: pubkeyAt(Buffer.from(new Array(32).fill(60)), 0),
      deposits: [{ reserve: reserveAddr, depositedCTokens: BigInt(1000) }],
      borrows: [],
    });

    const ctx = {
      rpc: makeRpc({
        obligationAddress: obligationAddr,
        obligationBuf,
        reservesByAddr: new Map([[reserveAddr, reserveBuf]]),
        currentSlot: 1000,
      }),
      commitment: 'confirmed' as const,
      tokens,
      instruments,
      updateInstrData: vi.fn().mockResolvedValue(undefined),
    } as any;

    const snap = await snapshotObligation(ctx, { obligation: obligationAddr });
    expect(snap.deposits[0].priceUsd).toBeCloseTo(1 / OTHER_LAST_PX);
  });

  it('returns empty positions, null stalestReserveSlot, and Infinity health on an empty obligation', async () => {
    const obligationAddr = pubkeyAt(Buffer.from(new Array(32).fill(96)), 0);
    const obligationBuf = buildObligationBuf({
      lendingMarket: pubkeyAt(Buffer.from(new Array(32).fill(50)), 0),
      owner: pubkeyAt(Buffer.from(new Array(32).fill(60)), 0),
      deposits: [],
      borrows: [],
    });

    const { tokens, instruments } = makeStubMaps({
      assetMint: pubkeyAt(Buffer.from(new Array(32).fill(15)), 0),
    });

    const ctx = {
      rpc: makeRpc({
        obligationAddress: obligationAddr,
        obligationBuf,
        reservesByAddr: new Map(),
        currentSlot: 1000,
      }),
      commitment: 'confirmed' as const,
      tokens,
      instruments,
      updateInstrData: vi.fn().mockResolvedValue(undefined),
    } as any;

    const snap = await snapshotObligation(ctx, { obligation: obligationAddr });
    expect(snap.deposits).toHaveLength(0);
    expect(snap.borrows).toHaveLength(0);
    expect(snap.totals.collateralUsd).toBe(0);
    expect(snap.totals.borrowUsd).toBe(0);
    expect(snap.totals.healthFactor).toBe(Infinity);
    expect(snap.totals.stalestReserveSlot).toBeNull();
  });

  it('throws when a non-base mint has no base-currency pricing instrument', async () => {
    const reserveBuf = buildReserveBuf({
      lastUpdateSlot: BigInt(900),
      availableAmount: BigInt(1000),
      borrowedAmountSf: ZERO,
      mintTotalSupply: BigInt(2000),
      mintDecimals: 6,
      loanToValuePct: 80,
      borrowFactorPct: BigInt(100),
      mintSeed: 88,
    });
    const reserveAddr = pubkeyAt(Buffer.from(new Array(32).fill(33)), 0);
    const orphanMint = pubkeyAt(reserveBuf.subarray(8), RESERVE_OFF.liqMintPubkey);

    const tokens = new Map<number, TokenStateModel>();
    // Token registered, but no instrument quotes it.
    tokens.set(3, makeToken(3, orphanMint));

    const obligationAddr = pubkeyAt(Buffer.from(new Array(32).fill(95)), 0);
    const obligationBuf = buildObligationBuf({
      lendingMarket: pubkeyAt(Buffer.from(new Array(32).fill(50)), 0),
      owner: pubkeyAt(Buffer.from(new Array(32).fill(60)), 0),
      deposits: [{ reserve: reserveAddr, depositedCTokens: BigInt(1000) }],
      borrows: [],
    });

    const ctx = {
      rpc: makeRpc({
        obligationAddress: obligationAddr,
        obligationBuf,
        reservesByAddr: new Map([[reserveAddr, reserveBuf]]),
        currentSlot: 1000,
      }),
      commitment: 'confirmed' as const,
      tokens,
      instruments: new Map<number, Instrument>(),
      updateInstrData: vi.fn().mockResolvedValue(undefined),
    } as any;

    await expect(snapshotObligation(ctx, { obligation: obligationAddr })).rejects.toThrow(
      /No Deriverse instrument found pricing token/,
    );
  });
});
