import { describe, expect, it, vi } from 'vitest';
import { Address, getAddressEncoder } from '@solana/kit';
import { Buffer } from 'buffer';

import { KLEND_PROGRAM_ID, MAIN_KAMINO_MARKET, TOKEN_PROGRAM_ID } from '../constants';
import { InstrAccountHeaderModel, RootStateModel, TokenStateModel } from '../structure_models';
import { Instrument } from '../types';
import { Engine } from './index';

const encoder = getAddressEncoder();

const SIGNER = 'DRVStQsAKhF8gpz1xLzWyk2Q1HKKF3g21tknXtHpVLab' as Address;
const ROOT = '7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF' as Address;
const CLIENT_PRIMARY = '8opHzTAnfzRpPEx21XtnrVTX28YQuCpAjcn1PczScKh' as Address;
const CLIENT_LUT = '284iwGtA9X9aLy3KsyV8uT2pXLARhYbiSi5SiM2g47M2' as Address;
const INSTR_ACCOUNT = '2yNvt4CBXvZb3rQ4z5WR2f2YMxU8QnY6X4xWcKJ9nYzG' as Address;
const INSTR_LUT = '3yNvt4CBXvZb3rQ4z5WR2f2YMxU8QnY6X4xWcKJ9nYzG' as Address;
const ASSET_MINT = 'So11111111111111111111111111111111111111112' as Address;
const CRNCY_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as Address;
const COLL_RESERVE = '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E' as Address;
const DEBT_RESERVE = 'Es9vMFrzaCERmJfrF4H2FYD4KCoZTqtfQxXGCfCM8GgD' as Address;
const ALT_MARKET = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' as Address;
const OTHER_CLIENT_PRIMARY = '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM' as Address;
const OBLIGATION = 'SysvarRent111111111111111111111111111111111' as Address;

function dataResponse(buffer: Buffer): [string, 'base64'] {
  return [buffer.toString('base64'), 'base64'];
}

function writeAddress(buffer: Buffer, offset: number, value: Address): void {
  Buffer.from(encoder.encode(value)).copy(buffer, offset);
}

function writeU128(buffer: Buffer, offset: number, value: bigint): void {
  buffer.writeBigUInt64LE(value & ((BigInt(1) << BigInt(64)) - BigInt(1)), offset);
  buffer.writeBigUInt64LE(value >> BigInt(64), offset + 8);
}

function sf(value: number): bigint {
  return (BigInt(Math.floor(value * 1_000_000)) * (BigInt(1) << BigInt(60))) / BigInt(1_000_000);
}

function reserveBuffer(args: { lendingMarket?: Address; liquidityMint: Address }): Buffer {
  const buffer = Buffer.alloc(6000);
  Buffer.from([43, 242, 204, 202, 26, 247, 59, 127]).copy(buffer, 0);
  writeAddress(buffer, 32, args.lendingMarket ?? MAIN_KAMINO_MARKET);
  writeAddress(buffer, 64, '11111111111111111111111111111111' as Address);
  writeAddress(buffer, 96, '11111111111111111111111111111111' as Address);
  writeAddress(buffer, 128, args.liquidityMint);
  writeAddress(buffer, 160, 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL' as Address);
  writeAddress(buffer, 192, 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address);
  writeU128(buffer, 248, sf(1.5));
  buffer.writeBigUInt64LE(BigInt(9), 272);
  writeAddress(buffer, 408, TOKEN_PROGRAM_ID);
  writeAddress(buffer, 2560, 'AddressLookupTab1e1111111111111111111111111' as Address);
  writeAddress(buffer, 2592, 'BPFLoaderUpgradeab1e11111111111111111111111' as Address);
  buffer.writeUint8(70, 4856 + 16);
  buffer.writeUint8(80, 4856 + 17);
  buffer.writeBigUInt64LE(BigInt(1_000_000), 4856 + 160);
  buffer.writeBigUInt64LE(BigInt(500_000), 4856 + 168);
  writeAddress(buffer, 4856 + 176 + 80, '11111111111111111111111111111111' as Address);
  writeAddress(buffer, 4856 + 176 + 128, '11111111111111111111111111111111' as Address);
  writeAddress(buffer, 4856 + 176 + 160, '11111111111111111111111111111111' as Address);
  writeAddress(buffer, 4856 + 176 + 192, '11111111111111111111111111111111' as Address);
  return buffer;
}

function reserveAccount(pubkey: Address, liquidityMint: Address, lendingMarket?: Address) {
  return {
    pubkey,
    account: { data: dataResponse(reserveBuffer({ liquidityMint, lendingMarket })) },
  };
}

function obligationBuffer(): Buffer {
  const buffer = Buffer.alloc(2400);
  Buffer.from([168, 206, 141, 106, 88, 76, 172, 167]).copy(buffer, 0);
  writeAddress(buffer, 64, CLIENT_PRIMARY);
  writeAddress(buffer, 96, COLL_RESERVE);
  buffer.writeBigUInt64LE(BigInt(100_000_000), 96 + 32);
  writeU128(buffer, 96 + 40, sf(150));
  writeAddress(buffer, 1208, DEBT_RESERVE);
  writeU128(buffer, 1208 + 88, BigInt(40_000_000) << BigInt(60));
  writeU128(buffer, 1208 + 104, sf(50));
  writeU128(buffer, 1192, sf(150));
  writeU128(buffer, 2208, sf(50));
  writeU128(buffer, 2224, sf(50));
  writeU128(buffer, 2240, sf(105));
  writeU128(buffer, 2256, sf(120));
  return buffer;
}

function token(id: number, mint: Address, decimals = 9): TokenStateModel {
  const result = new TokenStateModel();
  result.id = id;
  result.address = mint;
  result.mask = decimals;
  return result;
}

function instrument(): Instrument {
  const header = new InstrAccountHeaderModel();
  header.instrId = 1;
  header.assetTokenId = 1;
  header.crncyTokenId = 2;
  header.lutAddress = INSTR_LUT;
  return {
    address: INSTR_ACCOUNT,
    header,
    spotBids: [],
    spotAsks: [],
    perpBids: [],
    perpAsks: [],
  };
}

function mockRpc(
  args: {
    programAccounts?: Array<{ pubkey: Address; account: { data: [string, 'base64'] } }[]>;
    accountInfo?: Map<Address, { value: any }>;
    multipleAccounts?: { value: any };
  } = {},
) {
  const programAccounts = [...(args.programAccounts ?? [])];
  return {
    getProgramAccounts: vi.fn().mockReturnValue({
      send: vi.fn().mockImplementation(async () => programAccounts.shift() ?? []),
    }),
    getAccountInfo: vi.fn().mockImplementation((address: Address) => ({
      send: vi.fn().mockResolvedValue(args.accountInfo?.get(address) ?? { value: null }),
    })),
    getMultipleAccounts: vi.fn().mockReturnValue({
      send: vi.fn().mockResolvedValue(args.multipleAccounts ?? { value: null }),
    }),
  };
}

function setupEngine(rpc: any): Engine {
  const engine = new Engine(rpc);
  engine.tokens = new Map([
    [1, token(1, ASSET_MINT)],
    [2, token(2, CRNCY_MINT, 6)],
  ]);
  engine.instruments = new Map([[1, instrument()]]);
  engine.rootAccount = ROOT;
  engine.clientPrimaryAccount = CLIENT_PRIMARY;
  engine.clientLutAddress = CLIENT_LUT;
  engine.clientVmActive = false;
  (engine as any).signer = SIGNER;
  (engine as any).drvsAuthority = SIGNER;
  (engine as any).rootStateModel = new RootStateModel();
  return engine;
}

function reserveReads(rpc: ReturnType<typeof mockRpc>): number {
  return rpc.getAccountInfo.mock.calls.filter(([address]) => address === COLL_RESERVE || address === DEBT_RESERVE)
    .length;
}

function reserveAccountInfo(lendingMarket?: Address): Map<Address, { value: any }> {
  return new Map([
    [
      COLL_RESERVE,
      {
        value: {
          owner: KLEND_PROGRAM_ID,
          data: dataResponse(reserveBuffer({ liquidityMint: ASSET_MINT, lendingMarket })),
        },
      },
    ],
    [
      DEBT_RESERVE,
      {
        value: {
          owner: KLEND_PROGRAM_ID,
          data: dataResponse(reserveBuffer({ liquidityMint: CRNCY_MINT, lendingMarket })),
        },
      },
    ],
  ]);
}

describe('Engine Kamino reserve and context cache', () => {
  it('caches getKaminoReserveByMint by default market and mint', async () => {
    const rpc = mockRpc({
      programAccounts: [[reserveAccount(COLL_RESERVE, ASSET_MINT)]],
    });
    const engine = new Engine(rpc as any);

    await expect(engine.getKaminoReserveByMint({ mint: ASSET_MINT })).resolves.toBe(COLL_RESERVE);
    await expect(engine.getKaminoReserveByMint({ mint: ASSET_MINT })).resolves.toBe(COLL_RESERVE);

    expect(rpc.getProgramAccounts).toHaveBeenCalledTimes(1);
  });

  it('uses separate cache entries for different mints and markets', async () => {
    const rpc = mockRpc({
      programAccounts: [
        [reserveAccount(COLL_RESERVE, ASSET_MINT)],
        [reserveAccount(DEBT_RESERVE, CRNCY_MINT)],
        [reserveAccount(COLL_RESERVE, ASSET_MINT, ALT_MARKET)],
      ],
    });
    const engine = new Engine(rpc as any);

    await engine.getKaminoReserveByMint({ mint: ASSET_MINT });
    await engine.getKaminoReserveByMint({ mint: CRNCY_MINT });
    await engine.getKaminoReserveByMint({ mint: ASSET_MINT, lendingMarket: ALT_MARKET });
    await engine.getKaminoReserveByMint({ mint: ASSET_MINT });
    await engine.getKaminoReserveByMint({ mint: CRNCY_MINT });
    await engine.getKaminoReserveByMint({ mint: ASSET_MINT, lendingMarket: ALT_MARKET });

    expect(rpc.getProgramAccounts).toHaveBeenCalledTimes(3);
  });

  it('clears the reserve cache when initialize starts', async () => {
    const rpc = mockRpc({
      programAccounts: [[reserveAccount(COLL_RESERVE, ASSET_MINT)], [reserveAccount(COLL_RESERVE, ASSET_MINT)]],
    });
    const engine = new Engine(rpc as any);

    await engine.getKaminoReserveByMint({ mint: ASSET_MINT });
    await engine.initialize();
    await engine.getKaminoReserveByMint({ mint: ASSET_MINT });

    expect(rpc.getProgramAccounts).toHaveBeenCalledTimes(2);
  });

  it('renames getKaminoContext to refreshKaminoContext', async () => {
    const rpc = mockRpc({
      programAccounts: [[reserveAccount(COLL_RESERVE, ASSET_MINT)], [reserveAccount(DEBT_RESERVE, CRNCY_MINT)]],
    });
    const engine = setupEngine(rpc);

    expect(typeof engine.refreshKaminoContext).toBe('function');
    expect('getKaminoContext' in engine).toBe(false);
    await expect(engine.refreshKaminoContext({ instrId: 1 })).resolves.toMatchObject({
      instrId: 1,
      clientPrimaryAccount: CLIENT_PRIMARY,
    });
  });

  it('uses refreshed context for repeated change-position builds without rebuilding context', async () => {
    const rpc = mockRpc({
      programAccounts: [[reserveAccount(COLL_RESERVE, ASSET_MINT)], [reserveAccount(DEBT_RESERVE, CRNCY_MINT)]],
    });
    const engine = setupEngine(rpc);

    await engine.refreshKaminoContext({ instrId: 1 });
    await engine.kaminoChangePositionInstruction({ instrId: 1, collateralDelta: 1, borrowDelta: 0 });
    await engine.kaminoChangePositionInstruction({ instrId: 1, collateralDelta: 1, borrowDelta: 0 });

    expect(rpc.getProgramAccounts).toHaveBeenCalledTimes(2);
    expect(reserveReads(rpc)).toBe(0);
  });

  it('builds context once on instruction cache miss and reuses it', async () => {
    const rpc = mockRpc({
      programAccounts: [[reserveAccount(COLL_RESERVE, ASSET_MINT)], [reserveAccount(DEBT_RESERVE, CRNCY_MINT)]],
    });
    const engine = setupEngine(rpc);

    await engine.kaminoChangePositionInstruction({ instrId: 1, collateralDelta: 1, borrowDelta: 0 });
    await engine.kaminoInitTokenAccountsInstruction({ instrId: 1 });

    expect(rpc.getProgramAccounts).toHaveBeenCalledTimes(2);
    expect(reserveReads(rpc)).toBe(0);
  });

  it('refreshes context during getKaminoClientState even when context is cached', async () => {
    const accountInfo = reserveAccountInfo();
    accountInfo.set(OBLIGATION, {
      value: { owner: KLEND_PROGRAM_ID, data: dataResponse(obligationBuffer()) },
    });
    const rpc = mockRpc({
      programAccounts: [[reserveAccount(COLL_RESERVE, ASSET_MINT)], [reserveAccount(DEBT_RESERVE, CRNCY_MINT)]],
      accountInfo,
    });
    const engine = setupEngine(rpc);

    await engine.kaminoChangePositionInstruction({ instrId: 1, collateralDelta: 1, borrowDelta: 0 });
    await engine.getKaminoClientState({ instrId: 1, obligation: OBLIGATION });

    expect(rpc.getProgramAccounts).toHaveBeenCalledTimes(2);
    expect(reserveReads(rpc)).toBe(2);
  });

  it('uses separate context cache entries for different clients', async () => {
    const rpc = mockRpc({
      programAccounts: [[reserveAccount(COLL_RESERVE, ASSET_MINT)], [reserveAccount(DEBT_RESERVE, CRNCY_MINT)]],
      accountInfo: reserveAccountInfo(),
    });
    const engine = setupEngine(rpc);

    await engine.kaminoChangePositionInstruction({ instrId: 1, collateralDelta: 1, borrowDelta: 0 });
    engine.clientPrimaryAccount = OTHER_CLIENT_PRIMARY;
    await engine.kaminoChangePositionInstruction({ instrId: 1, collateralDelta: 1, borrowDelta: 0 });

    expect(rpc.getProgramAccounts).toHaveBeenCalledTimes(2);
    expect(reserveReads(rpc)).toBe(2);
  });

  it('uses separate context cache entries for different lending markets', async () => {
    const rpc = mockRpc({
      programAccounts: [
        [reserveAccount(COLL_RESERVE, ASSET_MINT)],
        [reserveAccount(DEBT_RESERVE, CRNCY_MINT)],
        [reserveAccount(COLL_RESERVE, ASSET_MINT, ALT_MARKET)],
        [reserveAccount(DEBT_RESERVE, CRNCY_MINT, ALT_MARKET)],
      ],
    });
    const engine = setupEngine(rpc);

    await engine.kaminoChangePositionInstruction({ instrId: 1, collateralDelta: 1, borrowDelta: 0 });
    await engine.kaminoChangePositionInstruction({
      instrId: 1,
      collateralDelta: 1,
      borrowDelta: 0,
      lendingMarket: ALT_MARKET,
    });
    await engine.kaminoChangePositionInstruction({ instrId: 1, collateralDelta: 1, borrowDelta: 0 });

    expect(rpc.getProgramAccounts).toHaveBeenCalledTimes(4);
    expect(reserveReads(rpc)).toBe(0);
  });

  it('clears context cache when initialize starts', async () => {
    const rpc = mockRpc({
      programAccounts: [
        [reserveAccount(COLL_RESERVE, ASSET_MINT)],
        [reserveAccount(DEBT_RESERVE, CRNCY_MINT)],
        [reserveAccount(COLL_RESERVE, ASSET_MINT)],
        [reserveAccount(DEBT_RESERVE, CRNCY_MINT)],
      ],
    });
    const engine = setupEngine(rpc);

    await engine.kaminoChangePositionInstruction({ instrId: 1, collateralDelta: 1, borrowDelta: 0 });
    await engine.initialize();
    await engine.kaminoChangePositionInstruction({ instrId: 1, collateralDelta: 1, borrowDelta: 0 });

    expect(rpc.getProgramAccounts).toHaveBeenCalledTimes(4);
  });

  it('clears context cache when setSigner starts', async () => {
    const rpc = mockRpc({
      programAccounts: [[reserveAccount(COLL_RESERVE, ASSET_MINT)], [reserveAccount(DEBT_RESERVE, CRNCY_MINT)]],
      accountInfo: reserveAccountInfo(),
    });
    const engine = setupEngine(rpc);

    await engine.kaminoChangePositionInstruction({ instrId: 1, collateralDelta: 1, borrowDelta: 0 });
    await engine.setSigner(SIGNER);
    engine.clientPrimaryAccount = CLIENT_PRIMARY;
    engine.clientLutAddress = CLIENT_LUT;
    await engine.kaminoChangePositionInstruction({ instrId: 1, collateralDelta: 1, borrowDelta: 0 });

    expect(rpc.getProgramAccounts).toHaveBeenCalledTimes(2);
    expect(reserveReads(rpc)).toBe(2);
  });

  it('validates reserve layout loaded from cached addresses', async () => {
    const rpc = mockRpc({
      programAccounts: [[reserveAccount(COLL_RESERVE, ASSET_MINT)]],
      accountInfo: new Map([
        [
          COLL_RESERVE,
          { value: { owner: KLEND_PROGRAM_ID, data: dataResponse(reserveBuffer({ liquidityMint: CRNCY_MINT })) } },
        ],
      ]),
    });
    const engine = setupEngine(rpc);

    await engine.getKaminoReserveByMint({ mint: ASSET_MINT });

    await expect(
      engine.kaminoChangePositionInstruction({ instrId: 1, collateralDelta: 1, borrowDelta: 0 }),
    ).rejects.toThrow(/Collateral reserve liquidity mint/);
    expect(rpc.getProgramAccounts).toHaveBeenCalledTimes(1);
  });
});
