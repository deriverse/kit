import { describe, it, expect, vi } from 'vitest';
import { AccountRole, Address, getAddressEncoder } from '@solana/kit';
import { Buffer } from 'buffer';
import fs from 'fs';
import path from 'path';

import {
  KLEND_PROGRAM_ID,
  MAIN_KAMINO_MARKET,
  MAIN_KAMINO_MARKET_LUT,
  PROGRAM_ID,
  SYSTEM_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '../constants';
import {
  kaminoChangePositionData,
  kaminoInitObligationData,
  kaminoInitObligationFarmsData,
  kaminoInitTokenAccountsData,
} from '../instruction_models';
import { InstrAccountHeaderModel, TokenStateModel } from '../structure_models';
import { Instrument } from '../types';
import {
  buildKaminoChangePositionInstruction,
  buildKaminoContext,
  buildKaminoInitObligationFarmsInstruction,
  buildKaminoInitObligationInstruction,
  buildKaminoInitTokenAccountsInstruction,
  buildVmAddKaminoInstruction,
  buildVmRemoveKaminoInstruction,
  getKaminoClientState,
  kaminoAtaExists,
  kaminoInstrumentAtasExist,
  kaminoLookupTableAddresses,
  kaminoMarketLut,
  kaminoObligationExists,
  KaminoInstructionContext,
} from './kamino-instructions';

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
const FARM_COLL = 'FarmsPZpWu9i7Kky8tPN37rs2TpmMrAZrC7S7vJa91Hr' as Address;
const FARM_DEBT = 'Sysvar1nstructions1111111111111111111111111' as Address;
const USER_METADATA = '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM' as Address;
const OBLIGATION = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' as Address;
const VM_ACCOUNT = 'SysvarRent111111111111111111111111111111111' as Address;

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
  return BigInt(Math.floor(value * 1_000_000)) * (BigInt(1) << BigInt(60)) / BigInt(1_000_000);
}

function reserveBuffer(args: {
  lendingMarket?: Address;
  liquidityMint: Address;
  farmCollateral?: Address;
  farmDebt?: Address;
  tokenProgram?: Address;
  loanToValuePct?: number;
  liquidationThresholdPct?: number;
  mintDecimals?: number;
}): Buffer {
  const buffer = Buffer.alloc(6000);
  Buffer.from([43, 242, 204, 202, 26, 247, 59, 127]).copy(buffer, 0);
  writeAddress(buffer, 32, args.lendingMarket ?? MAIN_KAMINO_MARKET);
  writeAddress(buffer, 64, args.farmCollateral ?? '11111111111111111111111111111111' as Address);
  writeAddress(buffer, 96, args.farmDebt ?? '11111111111111111111111111111111' as Address);
  writeAddress(buffer, 128, args.liquidityMint);
  writeAddress(buffer, 160, 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL' as Address);
  writeAddress(buffer, 192, 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address);
  writeU128(buffer, 248, sf(1.5));
  buffer.writeBigUInt64LE(BigInt(args.mintDecimals ?? 9), 272);
  writeAddress(buffer, 408, args.tokenProgram ?? TOKEN_PROGRAM_ID);
  writeAddress(buffer, 2560, 'AddressLookupTab1e1111111111111111111111111' as Address);
  writeAddress(buffer, 2592, 'BPFLoaderUpgradeab1e11111111111111111111111' as Address);
  buffer.writeUint8(args.loanToValuePct ?? 70, 4856 + 16);
  buffer.writeUint8(args.liquidationThresholdPct ?? 80, 4856 + 17);
  buffer.writeBigUInt64LE(BigInt(1_000_000), 4856 + 160);
  buffer.writeBigUInt64LE(BigInt(500_000), 4856 + 168);
  writeAddress(buffer, 4856 + 176 + 80, '11111111111111111111111111111111' as Address);
  writeAddress(buffer, 4856 + 176 + 128, '11111111111111111111111111111111' as Address);
  writeAddress(buffer, 4856 + 176 + 160, '11111111111111111111111111111111' as Address);
  writeAddress(buffer, 4856 + 176 + 192, '11111111111111111111111111111111' as Address);
  return buffer;
}

function userMetadataBuffer(lut: Address): Buffer {
  const buffer = Buffer.alloc(1024);
  Buffer.from([157, 214, 220, 235, 98, 135, 171, 28]).copy(buffer, 0);
  writeAddress(buffer, 48, lut);
  return buffer;
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

function mockRpc(args: {
  programAccounts?: Array<{ pubkey: Address; account: { data: [string, 'base64'] } }[]>;
  accountInfo?: Map<Address, { value: any }>;
} = {}) {
  const programAccounts = [...(args.programAccounts ?? [])];
  return {
    getProgramAccounts: vi.fn().mockReturnValue({
      send: vi.fn().mockImplementation(async () => programAccounts.shift() ?? []),
    }),
    getAccountInfo: vi.fn().mockImplementation((address: Address) => ({
      send: vi.fn().mockResolvedValue(args.accountInfo?.get(address) ?? { value: null }),
    })),
  };
}

function context(rpc: any = mockRpc()): KaminoInstructionContext {
  const instruments = new Map<number, Instrument>([[1, instrument()]]);
  const tokens = new Map<number, TokenStateModel>([
    [1, token(1, ASSET_MINT)],
    [2, token(2, CRNCY_MINT, 6)],
  ]);
  return {
    rpc,
    programId: PROGRAM_ID,
    version: 1,
    commitment: 'confirmed',
    drvsAuthority: SIGNER,
    instruments,
    tokens,
    uiNumbers: true,
    signer: SIGNER,
    rootAccount: ROOT,
    clientPrimaryAccount: CLIENT_PRIMARY,
    clientLutAddress: CLIENT_LUT,
    clientVmActive: false,
  };
}

function fakeKaminoContext(clientVmAccount: Address | null = null) {
  const reserve = (address: Address, mint: Address, farm: Address) => ({
    address,
    lendingMarket: MAIN_KAMINO_MARKET,
    liquidityMint: mint,
    liquiditySupply: `${address}Supply` as Address,
    collateralMint: `${address}CMint` as Address,
    collateralSupply: `${address}CSupply` as Address,
    feeVault: `${address}Fee` as Address,
    tokenProgram: TOKEN_PROGRAM_ID,
    farmCollateral: farm,
    farmDebt: farm,
    oracles: {
      pyth: KLEND_PROGRAM_ID,
      switchboardPrice: KLEND_PROGRAM_ID,
      switchboardTwap: KLEND_PROGRAM_ID,
      scope: KLEND_PROGRAM_ID,
    },
    loanToValuePct: 70,
    liquidationThresholdPct: 80,
    mintDecimals: 9,
    raw: { marketPriceSf: 1, borrowLimit: 1, depositLimit: 1 },
    vault: `${address}Vault` as Address,
    clientAta: `${address}Ata` as Address,
    obligationFarm: `${address}OblFarm` as Address,
    reserveFarmState: farm,
    hasFarm: true,
  });
  return {
    instrId: 1,
    lendingMarket: MAIN_KAMINO_MARKET,
    lendingMarketAuthority: '7XSxc3v9Q2zQHjNBJHVpH9mMLL4h5jz5s4Lk3QGTo1Hi' as Address,
    instrAccount: INSTR_ACCOUNT,
    clientPrimaryAccount: CLIENT_PRIMARY,
    clientVmAccount,
    userMetadata: USER_METADATA,
    obligation: OBLIGATION,
    collateralReserve: reserve(COLL_RESERVE, ASSET_MINT, FARM_COLL),
    debtReserve: reserve(DEBT_RESERVE, CRNCY_MINT, FARM_DEBT),
    extraReserves: [],
  };
}

describe('Kamino instruction data', () => {
  it('builds byte layouts for tags 81..86', async () => {
    const ctx = context();
    expect((await buildVmAddKaminoInstruction(ctx, { vmAuthority: SIGNER })).data![0]).toBe(81);
    expect((await buildVmRemoveKaminoInstruction(ctx, { vmAuthority: SIGNER })).data![0]).toBe(82);
    expect(kaminoInitObligationData(83, 7)).toEqual(Buffer.from([83, 0, 0, 0, 7, 0, 0, 0]));
    expect(kaminoInitTokenAccountsData(84, 7)).toEqual(Buffer.from([84, 0, 0, 0, 7, 0, 0, 0]));
    expect(kaminoInitObligationFarmsData(86, 1, 7)).toEqual(Buffer.from([86, 1, 0, 0, 7, 0, 0, 0]));
  });

  it('keeps KaminoChangePositionData at 32 bytes with flags in the second byte', () => {
    const data = kaminoChangePositionData(85, 7, 9, -11, 13, 17);
    expect(data.length).toBe(32);
    expect(data[0]).toBe(85);
    expect(data[1]).toBe(7);
    expect(data.readUInt32LE(4)).toBe(9);
    expect(data.readBigInt64LE(8)).toBe(BigInt(-11));
    expect(data.readBigInt64LE(16)).toBe(BigInt(13));
    expect(data.readBigInt64LE(24)).toBe(BigInt(17));
  });

  it('uses the main market LUT by default', () => {
    expect(kaminoMarketLut()).toBe(MAIN_KAMINO_MARKET_LUT);
    expect(kaminoMarketLut(MAIN_KAMINO_MARKET)).toBe(MAIN_KAMINO_MARKET_LUT);
  });
});

describe('Kamino context and services', () => {
  it('autoderives collateral and debt reserves from instrument mints', async () => {
    const rpc = mockRpc({
      programAccounts: [
        [{ pubkey: COLL_RESERVE, account: { data: dataResponse(reserveBuffer({ liquidityMint: ASSET_MINT })) } }],
        [{ pubkey: DEBT_RESERVE, account: { data: dataResponse(reserveBuffer({ liquidityMint: CRNCY_MINT })) } }],
      ],
    });

    const result = await buildKaminoContext(context(rpc), { instrId: 1 });

    expect(result.lendingMarket).toBe(MAIN_KAMINO_MARKET);
    expect(result.collateralReserve.address).toBe(COLL_RESERVE);
    expect(result.debtReserve.address).toBe(DEBT_RESERVE);
  });

  it('validates explicit reserve override mints', async () => {
    const rpc = mockRpc({
      accountInfo: new Map([
        [
          COLL_RESERVE,
          {
            value: {
              owner: KLEND_PROGRAM_ID,
              data: dataResponse(reserveBuffer({ liquidityMint: CRNCY_MINT })),
            },
          },
        ],
      ]),
    });

    await expect(
      buildKaminoContext(context(rpc), { instrId: 1, collateralReserve: COLL_RESERVE, debtReserve: DEBT_RESERVE }),
    ).rejects.toThrow(/Collateral reserve liquidity mint/);
  });

  it('checks obligation existence by owner and discriminator', async () => {
    const rpc = mockRpc({
      accountInfo: new Map([
        [OBLIGATION, { value: { owner: KLEND_PROGRAM_ID, data: dataResponse(obligationBuffer().subarray(0, 8)) } }],
      ]),
    });

    await expect(kaminoObligationExists(context(rpc), { obligation: OBLIGATION })).resolves.toBe(true);
    await expect(kaminoObligationExists(context(mockRpc()), { obligation: OBLIGATION })).resolves.toBe(false);
  });

  it('checks client-primary owned ATA existence', async () => {
    const ctx = context();
    const ataResult = await kaminoInstrumentAtasExist(ctx, { instrId: 1 });
    const rpc = mockRpc({
      accountInfo: new Map([[ataResult.assetAta, { value: { owner: TOKEN_PROGRAM_ID, data: dataResponse(Buffer.alloc(165)) } }]]),
    });

    await expect(kaminoAtaExists(context(rpc), { mint: ASSET_MINT })).resolves.toBe(true);
    await expect(kaminoAtaExists(context(mockRpc()), { mint: ASSET_MINT })).resolves.toBe(false);
  });

  it('deduplicates ALT discovery and unpacks user metadata LUT', async () => {
    const rpc = mockRpc({
      accountInfo: new Map([
        [USER_METADATA, { value: { owner: KLEND_PROGRAM_ID, data: dataResponse(userMetadataBuffer(CLIENT_LUT)) } }],
      ]),
    });
    const result = await kaminoLookupTableAddresses(context(rpc), { instrId: 1 }, fakeKaminoContext());

    expect(result.marketLut).toBe(MAIN_KAMINO_MARKET_LUT);
    expect(result.userLookupTable).toBe(CLIENT_LUT);
    expect(result.all).toEqual([MAIN_KAMINO_MARKET_LUT, INSTR_LUT]);
  });

  it('unpacks Kamino client state locally', async () => {
    const rpc = mockRpc({
      accountInfo: new Map([
        [OBLIGATION, { value: { owner: KLEND_PROGRAM_ID, data: dataResponse(obligationBuffer()) } }],
      ]),
    });

    const result = await getKaminoClientState(context(rpc), { instrId: 1 }, fakeKaminoContext());

    expect(result.exists).toBe(true);
    expect(result.obligation).toBe(OBLIGATION);
    expect(result.deposits[0].reserve).toBe(COLL_RESERVE);
    expect(result.borrows[0].reserve).toBe(DEBT_RESERVE);
    expect(result.totalDepositValue).toBe(150);
    expect(result.totalBorrowValue).toBe(50);
    expect(result.borrowLimit).toBe(105);
    expect(result.unhealthyBorrowValue).toBe(120);
    expect(result.healthFactor).toBe(2.4);
    expect(result.maxWithdrawEstimate?.amountRaw).toBeGreaterThan(0);
  });
});

describe('Kamino account order', () => {
  it('builds exact non-VM change-position account order', async () => {
    const ctx = context();
    const kctx = fakeKaminoContext();
    const ix = await buildKaminoChangePositionInstruction(
      ctx,
      { instrId: 1, collateralDelta: 1, borrowDelta: -2 },
      kctx,
    );

    expect(ix.programAddress).toBe(ctx.programId);
    expect(ix.accounts!.map((account) => account.address).slice(0, 9)).toEqual([
      SIGNER,
      ROOT,
      CLIENT_PRIMARY,
      SYSTEM_PROGRAM_ID,
      INSTR_ACCOUNT,
      OBLIGATION,
      MAIN_KAMINO_MARKET,
      kctx.lendingMarketAuthority,
      COLL_RESERVE,
    ]);
    expect(ix.accounts![0].role).toBe(AccountRole.WRITABLE_SIGNER);
    expect(ix.accounts![ix.accounts!.length - 2].address).toBe(KLEND_PROGRAM_ID);
  });

  it('inserts client VM account in the processor position when VM is active', async () => {
    const ctx = context();
    const kctx = fakeKaminoContext(VM_ACCOUNT);
    const ix = await buildKaminoChangePositionInstruction(
      ctx,
      { instrId: 1, collateralDelta: 1, borrowDelta: 0 },
      kctx,
    );

    expect(ix.accounts!.map((account) => account.address).slice(0, 6)).toEqual([
      SIGNER,
      ROOT,
      CLIENT_PRIMARY,
      SYSTEM_PROGRAM_ID,
      VM_ACCOUNT,
      INSTR_ACCOUNT,
    ]);
  });

  it('builds init account orders including optional VM account', async () => {
    const ctx = context();
    const noVm = fakeKaminoContext();
    const withVm = fakeKaminoContext(VM_ACCOUNT);

    const tokenIx = await buildKaminoInitTokenAccountsInstruction(ctx, { instrId: 1 }, withVm);
    expect(tokenIx.accounts!.map((account) => account.address).slice(0, 6)).toEqual([
      SIGNER,
      ROOT,
      CLIENT_PRIMARY,
      VM_ACCOUNT,
      INSTR_ACCOUNT,
      ASSET_MINT,
    ]);

    const obligationIx = await buildKaminoInitObligationInstruction(ctx, { instrId: 1 }, noVm);
    expect(obligationIx.accounts!.map((account) => account.address).slice(0, 6)).toEqual([
      SIGNER,
      ROOT,
      CLIENT_PRIMARY,
      INSTR_ACCOUNT,
      USER_METADATA,
      OBLIGATION,
    ]);

    const farmsIx = await buildKaminoInitObligationFarmsInstruction(ctx, { instrId: 1, side: 0 }, noVm);
    expect(farmsIx.accounts!.map((account) => account.address).slice(0, 8)).toEqual([
      SIGNER,
      ROOT,
      CLIENT_PRIMARY,
      INSTR_ACCOUNT,
      OBLIGATION,
      MAIN_KAMINO_MARKET,
      noVm.lendingMarketAuthority,
      COLL_RESERVE,
    ]);
  });

  it('builds VM add/remove Kamino account order', async () => {
    const ctx = context();
    const addIx = await buildVmAddKaminoInstruction(ctx, { vmAuthority: SIGNER });
    const removeIx = await buildVmRemoveKaminoInstruction(ctx, { vmAuthority: SIGNER });

    expect(addIx.accounts!.map((account) => account.address)[0]).toBe(SIGNER);
    expect(addIx.accounts!.map((account) => account.address)[1]).toBe(ROOT);
    expect(addIx.accounts![addIx.accounts!.length - 1].address).toBe(SYSTEM_PROGRAM_ID);
    expect(removeIx.accounts!.map((account) => account.address).slice(0, 2)).toEqual([SIGNER, ROOT]);
    expect(removeIx.accounts!.length).toBe(4);
  });
});

describe('package dependencies', () => {
  it('does not add forbidden Kamino SDK dependencies', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    const deps = {
      ...(packageJson.dependencies ?? {}),
      ...(packageJson.devDependencies ?? {}),
    };
    expect(deps).not.toHaveProperty('klend-sdk');
    expect(Object.keys(deps).some((name) => name.startsWith('@kamino-finance/'))).toBe(false);
    expect(deps).not.toHaveProperty('@coral-xyz/borsh');
    expect(deps).not.toHaveProperty('bn.js');
    expect(deps).not.toHaveProperty('decimal.js');
  });
});
