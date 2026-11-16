import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccountRole, Address, getAddressDecoder, getAddressEncoder, getProgramDerivedAddress } from '@solana/kit';
import { Buffer } from 'buffer';
import { Engine } from './index';
import * as orca from './orca-instructions';
import { SyncPdaCache } from './sync-pda';
import { ORCA_MAX_TICK, ORCA_MIN_TICK, orcaPriceToTick, orcaTickArrayStarts, orcaTickSqrtPrice } from './orca-math';
import { OrcaSwapArgs, OrcaSwapArgsSchema, PrepareOrcaSwapArgsSchema } from '../types';
import { ClientPrimaryAccountHeaderModel, InstrAccountHeaderModel, TokenStateModel, VmFlag } from '../structure_models';
import {
  MEMO_PROGRAM_ID,
  ORCA_WHIRLPOOL_PROGRAM_ID,
  SYSTEM_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '../constants';
import { findClientPrimaryAccount, findClientVmAccount, getTokenAccount } from './account-helpers';
import { orcaSwapData } from '../instruction_models';

const encoder = getAddressEncoder();
const addr = (n: number): Address => getAddressDecoder().decode(new Uint8Array(32).fill(n));
const POOL = addr(1);
const ASSET = addr(2);
const CRNCY = addr(3);
const VAULT_A = addr(4);
const VAULT_B = addr(5);
const SIGNER = addr(6);
const OTHER_SIGNER = addr(7);
const ROOT = addr(8);
const CLIENT = addr(9);
const INSTR = addr(10);
const ASSET_VAULT = addr(11);
const CRNCY_VAULT = addr(12);

function writeAddress(buffer: Buffer, offset: number, value: Address) {
  Buffer.from(encoder.encode(value)).copy(buffer, offset);
}

function poolBuffer(reverse = false, spacing = 64) {
  const buffer = Buffer.alloc(653);
  buffer.set([63, 149, 209, 12, 225, 128, 99, 9]);
  buffer.writeUInt16LE(spacing, 41);
  writeAddress(buffer, 101, reverse ? CRNCY : ASSET);
  writeAddress(buffer, 133, VAULT_A);
  writeAddress(buffer, 181, reverse ? ASSET : CRNCY);
  writeAddress(buffer, 213, VAULT_B);
  return buffer;
}

function token(id: number, mint: Address, vault: Address, decimals: number) {
  return Object.assign(new TokenStateModel(), { id, address: mint, programAddress: vault, mask: decimals });
}

function setup(
  options: {
    reverse?: boolean;
    spacing?: number;
    uiNumbers?: boolean;
    assetDecimals?: number;
    crncyDecimals?: number;
  } = {},
) {
  const state = {
    wallet: SIGNER,
    vmActive: false,
    pool: poolBuffer(options.reverse, options.spacing),
    owner: ORCA_WHIRLPOOL_PROGRAM_ID as Address,
    missing: false,
  };
  const send = vi.fn(async () => ({
    value: state.missing ? null : { owner: state.owner, data: [state.pool.toString('base64'), 'base64'] },
  }));
  const rpc = {
    getAccountInfo: vi.fn((address: Address) => {
      if (address === POOL) return { send };
      const buffer = Buffer.alloc(ClientPrimaryAccountHeaderModel.LENGTH);
      writeAddress(buffer, ClientPrimaryAccountHeaderModel.OFFSET_WALLET_ADDRESS, state.wallet);
      buffer.writeUInt32LE(state.vmActive ? VmFlag.active : 0, ClientPrimaryAccountHeaderModel.OFFSET_VM_MASK);
      return { send: async () => ({ value: { data: [buffer.toString('base64'), 'base64'] } }) };
    }),
  };
  const engine = new Engine(rpc as any, { uiNumbers: options.uiNumbers ?? true });
  engine.rootAccount = ROOT;
  engine.drvsAuthority = SIGNER;
  engine.tokens = new Map([
    [1, token(1, ASSET, ASSET_VAULT, options.assetDecimals ?? 9)],
    [2, token(2, CRNCY, CRNCY_VAULT, options.crncyDecimals ?? 6)],
  ]);
  const header = Object.assign(new InstrAccountHeaderModel(), { instrId: 1, assetTokenId: 1, crncyTokenId: 2 });
  engine.instruments = new Map([
    [1, { address: INSTR, header, spotBids: [], spotAsks: [], perpBids: [], perpAsks: [] }],
  ]);
  engine.clientPrimaryAccount = CLIENT;
  (engine as any).signer = SIGNER;
  const args: OrcaSwapArgs = {
    instrId: 1,
    whirlpool: POOL,
    price: 1000,
    crncyInput: false,
    amount: 1.25,
    minAmountOut: 1200,
    tickArrayCount: 3,
  };
  return { engine, args, rpc, send, state };
}

async function tickAddress(start: number) {
  return (
    await getProgramDerivedAddress({
      programAddress: ORCA_WHIRLPOOL_PROGRAM_ID,
      seeds: ['tick_array', encoder.encode(POOL), String(start)],
    })
  )[0];
}

afterEach(() => vi.restoreAllMocks());

describe('synchronous PDA derivation', () => {
  it('matches Kit addresses and bumps for varied programs, seeds and bump searches', async () => {
    const cache = new SyncPdaCache();
    const results = await Promise.all(
      Array.from({ length: 48 }, async (_, i) => {
        const programAddress = i % 2 ? ORCA_WHIRLPOOL_PROGRAM_ID : addr(20);
        const seeds = i % 3 === 0 ? [] : ['tick_array', encoder.encode(POOL), String((i - 24) * 88)];
        const expected = await getProgramDerivedAddress({ programAddress, seeds });
        const actual = cache.get(programAddress, seeds);
        expect(actual).toEqual(expected);
        expect(cache.get(programAddress, seeds)).toBe(actual);
        return actual[1];
      }),
    );
    expect(results.some((bump) => bump < 255)).toBe(true);
  });

  it('separates programs and seed boundaries and enforces seed limits', () => {
    const cache = new SyncPdaCache();
    expect(cache.get(addr(20), ['a', 'bc'])).not.toBe(cache.get(addr(20), ['ab', 'c']));
    expect(cache.get(addr(20), ['a'])).not.toEqual(cache.get(addr(21), ['a']));
    expect(() => cache.get(addr(20), ['x'.repeat(33)])).toThrow('32 bytes');
    expect(() => cache.get(addr(20), Array(16).fill('x'))).toThrow('15 seeds');
  });
});

describe('Orca price and tick arrays', () => {
  it.each([ORCA_MIN_TICK, -262144, -88, -1, 0, 1, 88, 262144, ORCA_MAX_TICK])(
    'maps prices within tick %i correctly',
    (tick) => {
      const next = tick === ORCA_MAX_TICK ? tick : tick + 1;
      const sqrt = (Number(orcaTickSqrtPrice(tick)) + Number(orcaTickSqrtPrice(next))) / 2;
      const rawPrice = (sqrt / 2 ** 64) ** 2;
      expect(orcaPriceToTick(rawPrice, 6, 6, true)).toBe(tick);
      expect(orcaPriceToTick(1 / rawPrice, 6, 6, false)).toBe(tick);
    },
  );

  it('matches canonical integer Whirlpool sqrt-price endpoints and tick zero', () => {
    expect(orcaTickSqrtPrice(ORCA_MIN_TICK)).toBe(BigInt('4295048016'));
    expect(orcaTickSqrtPrice(ORCA_MAX_TICK)).toBe(BigInt('79226673515401279992447579055'));
    expect(orcaTickSqrtPrice(0)).toBe(BigInt(1) << BigInt(64));
    expect(orcaPriceToTick(1000, 9, 6, true)).toBe(0);
    expect(orcaPriceToTick(1000, 9, 6, false)).toBe(0);
  });

  it.each([0, -1, NaN, Infinity, 1e-100, 1e100])('rejects invalid/out-of-range price %s', (price) => {
    expect(() => orcaPriceToTick(price, 6, 6, true)).toThrow();
  });

  it('selects directional arrays, including the B to A boundary shift and negative ticks', () => {
    expect(orcaTickArrayStarts(0, 64, true, 3)).toEqual([0, -5632, -11264]);
    expect(orcaTickArrayStarts(-1, 64, true, 3)).toEqual([-5632, -11264, -16896]);
    expect(orcaTickArrayStarts(5567, 64, false, 3)).toEqual([0, 5632, 11264]);
    expect(orcaTickArrayStarts(5568, 64, false, 3)).toEqual([5632, 11264, 16896]);
    expect(orcaTickArrayStarts(-1, 1, false, 3)).toEqual([0, 88, 176]);
  });

  it('uses the symmetric five-array layout and clamps at the range ends', () => {
    expect(orcaTickArrayStarts(0, 64, true, 5)).toEqual([0, 5632, 11264, -5632, -11264]);
    expect(orcaTickArrayStarts(-1, 64, false, 5)).toEqual([-5632, 0, 5632, -11264, -16896]);
    expect(orcaTickArrayStarts(ORCA_MIN_TICK, 64, true, 3)).toEqual([-444928, -444928, -444928]);
    expect(orcaTickArrayStarts(ORCA_MAX_TICK, 64, false, 3)).toEqual([439296, 439296, 439296]);
    expect(orcaTickArrayStarts(0, 32768, true, 5)).toEqual([0, 0, 0, -2883584, -2883584]);
  });
});

describe('Engine Orca preparation', () => {
  it('loads and decodes exactly once across concurrent and repeated preparations', async () => {
    const { engine, args, rpc } = setup();
    const decode = vi.spyOn(orca, 'decodeOrcaWhirlpool');
    (engine as any).signer = null;
    await Promise.all([engine.prepareOrcaSwap(args), engine.prepareOrcaSwap(args), engine.prepareOrcaSwap(args)]);
    await engine.prepareOrcaSwap(args);
    expect(rpc.getAccountInfo).toHaveBeenCalledExactlyOnceWith(POOL, { commitment: 'confirmed', encoding: 'base64' });
    expect(decode).toHaveBeenCalledTimes(1);
  });

  it.each(['rpc', 'missing', 'owner', 'size', 'discriminator', 'spacing'] as const)(
    'retries a failed %s load',
    async (failure) => {
      const { engine, args, state, send } = setup();
      const original = Buffer.from(state.pool);
      if (failure === 'rpc') send.mockRejectedValueOnce(new Error('RPC unavailable'));
      if (failure === 'missing') state.missing = true;
      if (failure === 'owner') state.owner = SYSTEM_PROGRAM_ID;
      if (failure === 'size') state.pool = Buffer.alloc(245);
      if (failure === 'discriminator') state.pool[0] = 0;
      if (failure === 'spacing') state.pool.writeUInt16LE(0, 41);
      const failed = await Promise.allSettled([engine.prepareOrcaSwap(args), engine.prepareOrcaSwap(args)]);
      expect(failed.every((result) => result.status === 'rejected')).toBe(true);
      expect(() => engine.orcaSwapInstruction(args)).toThrow('not prepared');
      state.pool = original;
      state.owner = ORCA_WHIRLPOOL_PROGRAM_ID;
      state.missing = false;
      await engine.prepareOrcaSwap(args);
      expect(send).toHaveBeenCalledTimes(2);
    },
  );

  it('validates the pair on every preparation and build without decoding again', async () => {
    const { engine, args, rpc } = setup();
    const asset = engine.tokens.get(1)!;
    asset.address = addr(30);
    await expect(engine.prepareOrcaSwap(args)).rejects.toThrow('mint pair');
    asset.address = ASSET;
    await engine.prepareOrcaSwap(args);
    asset.address = addr(30);
    await expect(engine.prepareOrcaSwap(args)).rejects.toThrow('mint pair');
    expect(() => engine.orcaSwapInstruction(args)).toThrow('mint pair');
    expect(rpc.getAccountInfo).toHaveBeenCalledTimes(1);
  });

  it('reuses pool metadata after setSigner and derives the current wallet VM account', async () => {
    const { engine, args, rpc, state, send } = setup();
    const decode = vi.spyOn(orca, 'decodeOrcaWhirlpool');
    await engine.prepareOrcaSwap(args);
    state.wallet = OTHER_SIGNER;
    state.vmActive = true;
    await engine.setSigner(OTHER_SIGNER);
    await engine.prepareOrcaSwap(args);
    const reads = rpc.getAccountInfo.mock.calls.length;
    const ix = engine.orcaSwapInstruction(args);
    const ctx = { programId: engine.programId, version: engine.version };
    expect(ix.accounts![0].address).toBe(OTHER_SIGNER);
    expect(ix.accounts![2].address).toBe(await findClientPrimaryAccount(ctx, OTHER_SIGNER));
    expect(ix.accounts![13]).toEqual({
      address: await findClientVmAccount(ctx, OTHER_SIGNER),
      role: AccountRole.READONLY,
    });
    expect(rpc.getAccountInfo).toHaveBeenCalledTimes(reads);
    expect(send).toHaveBeenCalledTimes(1);
    expect(decode).toHaveBeenCalledTimes(1);
  });

  it('rejects missing preparation, wallet, client, instrument or registered tokens', async () => {
    const { engine, args } = setup();
    expect(() => engine.orcaSwapInstruction(args)).toThrow('not prepared');
    await engine.prepareOrcaSwap(args);
    (engine as any).signer = null;
    expect(() => engine.orcaSwapInstruction(args)).toThrow('Wallet');
    (engine as any).signer = SIGNER;
    engine.clientPrimaryAccount = null;
    expect(() => engine.orcaSwapInstruction(args)).toThrow('Client primary');
    engine.clientPrimaryAccount = CLIENT;
    expect(() => engine.orcaSwapInstruction({ ...args, instrId: 2 })).toThrow('Instrument');
    await expect(engine.prepareOrcaSwap({ ...args, instrId: 2 })).rejects.toThrow('Instrument');
    engine.tokens.clear();
    expect(() => engine.orcaSwapInstruction(args)).toThrow('tokens');
  });
});

describe('Orca instruction layout', () => {
  it('matches the Rust account order, roles, token PDAs and raw bytes without async work', async () => {
    const { engine, args, rpc } = setup();
    await engine.prepareOrcaSwap(args);
    rpc.getAccountInfo.mockClear();
    const ix = engine.orcaSwapInstruction(args);
    expect(ix).not.toBeInstanceOf(Promise);
    expect(rpc.getAccountInfo).not.toHaveBeenCalled();
    const ctx = {
      programId: engine.programId,
      version: engine.version,
      drvsAuthority: engine.drvsAuthority,
      rpc: rpc as any,
      commitment: engine.commitment,
    };
    const oracle = (
      await getProgramDerivedAddress({
        programAddress: ORCA_WHIRLPOOL_PROGRAM_ID,
        seeds: ['oracle', encoder.encode(POOL)],
      })
    )[0];
    expect(ix.accounts!.map((account) => account.address)).toEqual([
      SIGNER,
      ROOT,
      CLIENT,
      INSTR,
      ASSET,
      ASSET_VAULT,
      await getTokenAccount(ctx, ASSET),
      TOKEN_PROGRAM_ID,
      CRNCY,
      CRNCY_VAULT,
      await getTokenAccount(ctx, CRNCY),
      TOKEN_PROGRAM_ID,
      SYSTEM_PROGRAM_ID,
      ORCA_WHIRLPOOL_PROGRAM_ID,
      MEMO_PROGRAM_ID,
      POOL,
      VAULT_A,
      VAULT_B,
      await tickAddress(0),
      await tickAddress(-5632),
      await tickAddress(-11264),
      oracle,
    ]);
    expect(ix.accounts!.map((account) => account.role)).toEqual([
      3, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1,
    ]);
    const expected = Buffer.alloc(24);
    expected.set([90, 0, 0, 0, 1, 0, 0, 0]);
    expected.writeBigInt64LE(BigInt(1_250_000_000), 8);
    expected.writeBigInt64LE(BigInt(1_200_000_000), 16);
    expect(Buffer.from(ix.data!)).toEqual(expected);
    expect(ix.programAddress).toBe(engine.programId);
  });

  it.each([false, true])('handles both swap directions with reversed mints = %s', async (reverse) => {
    const { engine, args } = setup({ reverse });
    await engine.prepareOrcaSwap(args);
    for (const crncyInput of [false, true]) {
      const ix = engine.orcaSwapInstruction({ ...args, crncyInput, amount: 2, minAmountOut: 3 });
      const aToB = !crncyInput === !reverse;
      expect(ix.accounts!.slice(18, 21).map((account) => account.address)).toEqual(
        await Promise.all((aToB ? [0, -5632, -11264] : [0, 5632, 11264]).map(tickAddress)),
      );
      const data = Buffer.from(ix.data!);
      expect(data[1]).toBe(crncyInput ? 1 : 0);
      expect(data.readBigInt64LE(8)).toBe(BigInt(crncyInput ? 2_000_000 : 2_000_000_000));
      expect(data.readBigInt64LE(16)).toBe(BigInt(crncyInput ? 3_000_000_000 : 3_000_000));
    }
  });

  it('adds exactly two supplemental arrays and their slice for five-array mode', async () => {
    const { engine, args } = setup();
    await engine.prepareOrcaSwap(args);
    const ix = engine.orcaSwapInstruction({ ...args, tickArrayCount: 5 });
    const data = Buffer.from(ix.data!);
    expect(data.length).toBe(26);
    expect([...data.subarray(0, 4)]).toEqual([90, 0, 1, 0]);
    expect([...data.subarray(24)]).toEqual([6, 2]);
    expect(ix.accounts!.length).toBe(24);
    expect(ix.accounts!.slice(18, 21).map((account) => account.address)).toEqual(
      await Promise.all([0, 5632, 11264].map(tickAddress)),
    );
    expect(ix.accounts!.slice(22)).toEqual(
      await Promise.all(
        [-5632, -11264].map(async (start) => ({ address: await tickAddress(start), role: AccountRole.WRITABLE })),
      ),
    );
  });

  it('keeps price in UI units with raw amounts, supports Token-2022 and reacts to price changes', async () => {
    const { engine, args, send } = setup({ uiNumbers: false });
    engine.tokens.get(1)!.mask |= 0x80000000;
    await engine.prepareOrcaSwap(args);
    const first = engine.orcaSwapInstruction({ ...args, amount: 2, minAmountOut: 1 });
    const second = engine.orcaSwapInstruction({
      ...args,
      price: 1000 * 1.0001 ** (5632 + 0.5),
      amount: 2,
      minAmountOut: 1,
    });
    expect(first.accounts![7].address).toBe(TOKEN_2022_PROGRAM_ID);
    expect(first.accounts![11].address).toBe(TOKEN_PROGRAM_ID);
    expect(first.accounts![18].address).toBe(await tickAddress(0));
    expect(second.accounts![18].address).toBe(await tickAddress(5632));
    expect(Buffer.from(first.data!).readBigInt64LE(8)).toBe(BigInt(2));
    expect(Buffer.from(first.data!).readBigInt64LE(16)).toBe(BigInt(1));
    expect(send).toHaveBeenCalledTimes(1);
  });

  it.each([
    { tick: -0.5, crncyInput: false, start: -5632 },
    { tick: 5567.5, crncyInput: true, start: 0 },
    { tick: 5568.5, crncyInput: true, start: 5632 },
    { tick: 5632.5, crncyInput: false, start: 5632 },
  ])('selects the first array from price near tick $tick', async ({ tick, crncyInput, start }) => {
    const { engine, args } = setup();
    await engine.prepareOrcaSwap(args);
    const ix = engine.orcaSwapInstruction({ ...args, price: 1000 * 1.0001 ** tick, crncyInput });
    expect(ix.accounts![18].address).toBe(await tickAddress(start));
  });

  it('rejects unsafe amounts and input that rounds to zero; permits zero minimum output', async () => {
    const { engine, args } = setup();
    await engine.prepareOrcaSwap(args);
    for (const patch of [
      { amount: 1e-12 },
      { amount: Number.MAX_SAFE_INTEGER },
      { minAmountOut: Number.MAX_SAFE_INTEGER },
    ]) {
      expect(() => engine.orcaSwapInstruction({ ...args, ...patch })).toThrow('safe integer');
    }
    expect(engine.orcaSwapInstruction({ ...args, minAmountOut: 0 })).toBeDefined();
  });

  it('validates public schemas and encodes both layouts through the exported serializer', () => {
    const { args } = setup();
    for (const patch of [
      { price: 0 },
      { price: Infinity },
      { amount: -1 },
      { minAmountOut: -1 },
      { tickArrayCount: 4 },
      { instrId: 2 ** 32 },
    ]) {
      expect(OrcaSwapArgsSchema.safeParse({ ...args, ...patch }).success).toBe(false);
    }
    expect(OrcaSwapArgsSchema.safeParse({ ...args, price: undefined }).success).toBe(false);
    expect(OrcaSwapArgsSchema.safeParse({ ...args, tickArrayCount: undefined }).success).toBe(false);
    expect(PrepareOrcaSwapArgsSchema.parse({ instrId: 1, whirlpool: POOL })).toEqual({ instrId: 1, whirlpool: POOL });
    expect(orcaSwapData(90, 1, 5, 100, 99, 3).toString('hex')).toBe('5a0100000500000064000000000000006300000000000000');
    expect(orcaSwapData(90, 1, 5, 100, 99, 5).toString('hex')).toBe(
      '5a01010005000000640000000000000063000000000000000602',
    );
  });
});
