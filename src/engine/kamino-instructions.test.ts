import { describe, it, expect, vi } from 'vitest';
import { AccountRole, Address, Base64EncodedDataResponse, getAddressEncoder } from '@solana/kit';
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
import { kaminoChangePositionData, kaminoInitInstrumentData, kaminoInitObligationData } from '../instruction_models';
import { InstrAccountHeaderModel, TokenStateModel } from '../structure_models';
import { Instrument } from '../types';
import {
  buildKaminoChangePositionInstruction,
  buildKaminoContext,
  buildKaminoInitInstrumentInstruction,
  buildKaminoInitObligationInstruction,
  buildKaminoRefreshReservesInstruction,
  buildKaminoUpdateObligationsInstruction,
  decodeKaminoReserveData,
  buildVmAddKaminoInstruction,
  buildVmRemoveKaminoInstruction,
  getKaminoClientState,
  kaminoAtaExists,
  kaminoInstrumentAccountsExist,
  kaminoLookupTableAddresses,
  kaminoMarketLut,
  kaminoObligationExists,
  KaminoInstructionContext,
  KAMINO_REFRESH_OBLIGATION_DISCRIMINATOR,
  KAMINO_REFRESH_RESERVES_BATCH_DISCRIMINATOR,
  userMetadataPda,
  vanillaObligationPda,
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
const NULL_ADDRESS = '11111111111111111111111111111111' as Address;
const USER_METADATA = '4uQeVj5tqViQh7yWWGStvkEG1Zmhx6uasJtWCJziofM' as Address;
const OBLIGATION = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' as Address;
const VM_ACCOUNT = 'SysvarRent111111111111111111111111111111111' as Address;
const SYSVAR_RENT_ADDRESS = 'SysvarRent111111111111111111111111111111111' as Address;

function dataResponse(buffer: Buffer): Base64EncodedDataResponse {
  return [buffer.toString('base64'), 'base64'] as unknown as Base64EncodedDataResponse;
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

function reserveBuffer(args: {
  lendingMarket?: Address;
  liquidityMint: Address;
  farmCollateral?: Address;
  farmDebt?: Address;
  tokenProgram?: Address;
  loanToValuePct?: number;
  liquidationThresholdPct?: number;
  mintDecimals?: number;
  totalAvailableAmount?: number;
  borrowedAmount?: number;
  collateralMintTotalSupply?: number;
}): Buffer {
  const buffer = Buffer.alloc(6000);
  Buffer.from([43, 242, 204, 202, 26, 247, 59, 127]).copy(buffer, 0);
  writeAddress(buffer, 32, args.lendingMarket ?? MAIN_KAMINO_MARKET);
  writeAddress(buffer, 64, args.farmCollateral ?? ('11111111111111111111111111111111' as Address));
  writeAddress(buffer, 96, args.farmDebt ?? ('11111111111111111111111111111111' as Address));
  writeAddress(buffer, 128, args.liquidityMint);
  writeAddress(buffer, 160, 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL' as Address);
  writeAddress(buffer, 192, 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address);
  buffer.writeBigUInt64LE(BigInt(args.totalAvailableAmount ?? 100_000_000), 224);
  writeU128(buffer, 232, BigInt(args.borrowedAmount ?? 23_456_000) << BigInt(60));
  writeU128(buffer, 248, sf(1.5));
  buffer.writeBigUInt64LE(BigInt(args.mintDecimals ?? 9), 272);
  writeAddress(buffer, 408, args.tokenProgram ?? TOKEN_PROGRAM_ID);
  writeAddress(buffer, 2560, 'AddressLookupTab1e1111111111111111111111111' as Address);
  buffer.writeBigUInt64LE(BigInt(args.collateralMintTotalSupply ?? 123_456_000), 2592);
  writeAddress(buffer, 2600, 'BPFLoaderUpgradeab1e11111111111111111111111' as Address);
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

function obligationReserveListBuffer(deposits: Address[], borrows: Address[]): Buffer {
  const buffer = Buffer.alloc(2400);
  Buffer.from([168, 206, 141, 106, 88, 76, 172, 167]).copy(buffer, 0);
  writeAddress(buffer, 64, CLIENT_PRIMARY);
  deposits.forEach((reserve, index) => writeAddress(buffer, 96 + index * 136, reserve));
  borrows.forEach((reserve, index) => writeAddress(buffer, 1208 + index * 200, reserve));
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
    programAccounts?: Array<{ pubkey: Address; account: { data: Base64EncodedDataResponse } }[]>;
    accountInfo?: Map<Address, { value: any }>;
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

function fakeKaminoContext(
  clientVmAccount: Address | null = null,
  farms: {
    assetCollateral: Address | null;
    assetLiquidity: Address | null;
    crncyCollateral: Address | null;
    crncyLiquidity: Address | null;
  } = {
    assetCollateral: FARM_COLL,
    assetLiquidity: FARM_DEBT,
    crncyCollateral: FARM_COLL,
    crncyLiquidity: FARM_DEBT,
  },
) {
  const farm = (address: Address | null) => ({
    reserveFarmState: address ?? KLEND_PROGRAM_ID,
    obligationFarm: address == null ? KLEND_PROGRAM_ID : (`${address}Obl` as Address),
    hasFarm: address != null,
  });
  const reserve = (
    address: Address,
    mint: Address,
    collateralFarmAddress: Address | null,
    liquidityFarmAddress: Address | null,
    selectedSide: 'collateral' | 'liquidity',
  ) => {
    const collateralFarm = farm(collateralFarmAddress);
    const liquidityFarm = farm(liquidityFarmAddress);
    const selectedFarm = selectedSide === 'collateral' ? collateralFarm : liquidityFarm;
    return {
      address,
      lastUpdateSlot: BigInt(0),
      lendingMarket: MAIN_KAMINO_MARKET,
      liquidityMint: mint,
      liquiditySupply: `${address}Supply` as Address,
      collateralMint: `${address}CMint` as Address,
      collateralSupply: `${address}CSupply` as Address,
      feeVault: `${address}Fee` as Address,
      tokenProgram: TOKEN_PROGRAM_ID,
      farmCollateral: collateralFarmAddress ?? NULL_ADDRESS,
      farmDebt: liquidityFarmAddress ?? NULL_ADDRESS,
      oracles: {
        pyth: KLEND_PROGRAM_ID,
        switchboardPrice: KLEND_PROGRAM_ID,
        switchboardTwap: KLEND_PROGRAM_ID,
        scope: KLEND_PROGRAM_ID,
      },
      scopePriceChain: [0, 0, 0, 0],
      loanToValuePct: 70,
      liquidationThresholdPct: 80,
      borrowFactorPct: BigInt(100),
      mintDecimals: 9,
      raw: {
        marketPriceSf: 1,
        totalAvailableAmount: 100_000_000,
        borrowedAmountSf: 23_456_000,
        borrowedAmountSfRaw: BigInt(23_456_000) << BigInt(60),
        accumulatedProtocolFeesSf: 0,
        accumulatedProtocolFeesSfRaw: BigInt(0),
        accumulatedReferrerFeesSf: 0,
        accumulatedReferrerFeesSfRaw: BigInt(0),
        pendingReferrerFeesSf: 0,
        pendingReferrerFeesSfRaw: BigInt(0),
        collateralMintTotalSupply: 123_456_000,
        totalLiquidity: 123_456_000,
        totalLiquiditySfRaw: BigInt(123_456_000) << BigInt(60),
        borrowLimit: 1,
        depositLimit: 1,
      },
      vault: `${address}Vault` as Address,
      clientAta: `${address}Ata` as Address,
      collateralFarm,
      liquidityFarm,
      obligationFarm: selectedFarm.obligationFarm,
      reserveFarmState: selectedFarm.reserveFarmState,
      hasFarm: selectedFarm.hasFarm,
    };
  };
  return {
    instrId: 1,
    lendingMarket: MAIN_KAMINO_MARKET,
    lendingMarketAuthority: '7XSxc3v9Q2zQHjNBJHVpH9mMLL4h5jz5s4Lk3QGTo1Hi' as Address,
    instrAccount: INSTR_ACCOUNT,
    clientPrimaryAccount: CLIENT_PRIMARY,
    clientVmAccount,
    userMetadata: USER_METADATA,
    obligation: OBLIGATION,
    collateralReserve: reserve(COLL_RESERVE, ASSET_MINT, farms.assetCollateral, farms.assetLiquidity, 'collateral'),
    debtReserve: reserve(DEBT_RESERVE, CRNCY_MINT, farms.crncyCollateral, farms.crncyLiquidity, 'liquidity'),
    extraReserves: [],
  };
}

describe('Kamino instruction data', () => {
  it('builds byte layouts for tags 81..85', async () => {
    const ctx = context();
    expect((await buildVmAddKaminoInstruction(ctx, { vmAuthority: SIGNER })).data![0]).toBe(81);
    expect((await buildVmRemoveKaminoInstruction(ctx, { vmAuthority: SIGNER })).data![0]).toBe(82);
    expect(kaminoInitObligationData(83)).toEqual(Buffer.from([83, 0, 0, 0, 0, 0, 0, 0]));
    expect(kaminoInitInstrumentData(84, 7)).toEqual(Buffer.from([84, 0, 0, 0, 7, 0, 0, 0]));
    expect(kaminoChangePositionData(85, 0, 7, 0, 0, 0)[0]).toBe(85);
  });

  it('keeps KaminoChangePositionData at 32 bytes with flags in the second byte', () => {
    const data = kaminoChangePositionData(85, 3, 9, -11, 13, 17);
    expect(data.length).toBe(32);
    expect(data[0]).toBe(85);
    expect(data[1]).toBe(3);
    expect(data.readUInt32LE(4)).toBe(9);
    expect(data.readBigInt64LE(8)).toBe(BigInt(-11));
    expect(data.readBigInt64LE(16)).toBe(BigInt(13));
    expect(data.readBigInt64LE(24)).toBe(BigInt(17));
  });

  it('encodes only repayAll and withdrawAll in change-position flags', async () => {
    const ix = await buildKaminoChangePositionInstruction(
      context(),
      { instrId: 1, assetIsCollateral: true, collateralDelta: 0, borrowDelta: 0, repayAll: true, withdrawAll: true },
      fakeKaminoContext(),
    );

    expect(ix.data![1]).toBe(3);
  });

  it('uses the main market LUT by default', () => {
    expect(kaminoMarketLut()).toBe(MAIN_KAMINO_MARKET_LUT);
    expect(kaminoMarketLut(MAIN_KAMINO_MARKET)).toBe(MAIN_KAMINO_MARKET_LUT);
  });

  it('uses the KLend refresh-obligation discriminator for update-obligations', async () => {
    const ix = await buildKaminoUpdateObligationsInstruction(context(), {});

    expect(ix.programAddress).toBe(KLEND_PROGRAM_ID);
    expect(ix.data).toEqual(KAMINO_REFRESH_OBLIGATION_DISCRIMINATOR);
  });
});

describe('Kamino reserve decoding', () => {
  it('decodes collateral supply vault after collateral mint total supply', () => {
    const result = decodeKaminoReserveData(COLL_RESERVE, dataResponse(reserveBuffer({ liquidityMint: ASSET_MINT })));

    expect(result.collateralSupply).toBe('BPFLoaderUpgradeab1e11111111111111111111111');
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

  it('validates autoderived reserve mints', async () => {
    const rpc = mockRpc({
      programAccounts: [
        [{ pubkey: COLL_RESERVE, account: { data: dataResponse(reserveBuffer({ liquidityMint: CRNCY_MINT })) } }],
      ],
    });

    await expect(buildKaminoContext(context(rpc), { instrId: 1 })).rejects.toThrow(/Collateral reserve liquidity mint/);
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
    const kctx = fakeKaminoContext();
    const accountsResult = await kaminoInstrumentAccountsExist(ctx, { instrId: 1 }, kctx);
    const rpc = mockRpc({
      accountInfo: new Map([
        [
          accountsResult.assetAta.address,
          { value: { owner: TOKEN_PROGRAM_ID, data: dataResponse(Buffer.alloc(165)) } },
        ],
      ]),
    });

    await expect(kaminoAtaExists(context(rpc), { mint: ASSET_MINT })).resolves.toBe(true);
    await expect(kaminoAtaExists(context(mockRpc()), { mint: ASSET_MINT })).resolves.toBe(false);
  });

  it('checks all non-obligation Kamino instrument accounts', async () => {
    const kctx = fakeKaminoContext();
    const firstPass = await kaminoInstrumentAccountsExist(context(), { instrId: 1 }, kctx);
    const accountInfo = new Map<Address, { value: any }>();
    accountInfo.set(firstPass.assetAta.address, {
      value: { owner: TOKEN_PROGRAM_ID, data: dataResponse(Buffer.alloc(165)) },
    });
    accountInfo.set(firstPass.crncyAta.address, {
      value: { owner: TOKEN_PROGRAM_ID, data: dataResponse(Buffer.alloc(165)) },
    });
    for (const farm of Object.values(firstPass.farms)) {
      if (farm == null) continue;
      accountInfo.set(farm.reserveFarmState.address, {
        value: { owner: FARM_COLL, data: dataResponse(Buffer.alloc(128)) },
      });
      accountInfo.set(farm.obligationFarm.address, {
        value: { owner: FARM_COLL, data: dataResponse(Buffer.alloc(128)) },
      });
    }

    const result = await kaminoInstrumentAccountsExist(context(mockRpc({ accountInfo })), { instrId: 1 }, kctx);

    expect(result.assetAta.exists).toBe(true);
    expect(result.farms.assetCollateral?.reserveFarmState.exists).toBe(true);
    expect(result.farms.crncyLiquidity?.obligationFarm.exists).toBe(true);
    expect(result.allExist).toBe(true);
  });

  it('marks account checks missing on owner mismatch and ignores absent farm sides', async () => {
    const noFarmCtx = fakeKaminoContext(null, {
      assetCollateral: null,
      assetLiquidity: null,
      crncyCollateral: null,
      crncyLiquidity: null,
    });
    const firstPass = await kaminoInstrumentAccountsExist(context(), { instrId: 1 }, noFarmCtx);
    const accountInfo = new Map<Address, { value: any }>([
      [firstPass.assetAta.address, { value: { owner: TOKEN_PROGRAM_ID, data: dataResponse(Buffer.alloc(165)) } }],
      [firstPass.crncyAta.address, { value: { owner: SYSTEM_PROGRAM_ID, data: dataResponse(Buffer.alloc(165)) } }],
    ]);

    const result = await kaminoInstrumentAccountsExist(context(mockRpc({ accountInfo })), { instrId: 1 }, noFarmCtx);

    expect(result.assetAta.exists).toBe(true);
    expect(result.crncyAta.exists).toBe(false);
    expect(result.farms.assetCollateral).toBeNull();
    expect(result.allExist).toBe(false);
  });

  it('deduplicates ALT discovery without treating Kamino user metadata as a LUT', async () => {
    const rpc = mockRpc();
    const result = await kaminoLookupTableAddresses(context(rpc), { instrId: 1 }, fakeKaminoContext());

    expect(result.marketLut).toBe(MAIN_KAMINO_MARKET_LUT);
    expect(result.userLookupTable).toBeNull();
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
    expect(result.deposits[0].liquidityMint).toBe(ASSET_MINT);
    expect(result.deposits[0].collateralMint).toBe(`${COLL_RESERVE}CMint`);
    expect(result.deposits[0].tokenProgram).toBe(TOKEN_PROGRAM_ID);
    expect(result.deposits[0].deriverseTokenId).toBe(1);
    expect(result.deposits[0].depositedAmountRaw).toBe(100_000_000);
    expect(result.deposits[0].collateralAmountRaw).toBe(100_000_000);
    expect(result.borrows[0].reserve).toBe(DEBT_RESERVE);
    expect(result.borrows[0].liquidityMint).toBe(CRNCY_MINT);
    expect(result.borrows[0].collateralMint).toBe(`${DEBT_RESERVE}CMint`);
    expect(result.borrows[0].tokenProgram).toBe(TOKEN_PROGRAM_ID);
    expect(result.borrows[0].deriverseTokenId).toBe(2);
    expect(result.totalDepositValue).toBe(150);
    expect(result.totalBorrowValue).toBe(50);
    expect(result.borrowLimit).toBe(105);
    expect(result.unhealthyBorrowValue).toBe(120);
    expect(result.healthFactor).toBe(2.4);
    expect(result.maxWithdrawEstimate?.amountRaw).toBeGreaterThan(0);
    expect(result.maxWithdrawEstimate?.collateralAmountRaw).toBeGreaterThan(0);
  });

  it('converts Kamino obligation cToken collateral to underlying liquidity amount', async () => {
    const rpc = mockRpc({
      accountInfo: new Map([
        [OBLIGATION, { value: { owner: KLEND_PROGRAM_ID, data: dataResponse(obligationBuffer()) } }],
      ]),
    });
    const kctx = fakeKaminoContext();
    kctx.collateralReserve.raw.collateralMintTotalSupply = 50_000_000;
    kctx.collateralReserve.raw.totalLiquidity = 100_000_000;
    kctx.collateralReserve.raw.totalLiquiditySfRaw = BigInt(100_000_000) << BigInt(60);

    const result = await getKaminoClientState(context(rpc), { instrId: 1 }, kctx);

    expect(result.deposits[0].collateralAmountRaw).toBe(100_000_000);
    expect(result.deposits[0].depositedAmountRaw).toBe(200_000_000);
    expect(result.deposits[0].depositedAmount).toBe(0.2);
  });

  it('uses reserve price fallback when raw borrow exists but aggregate borrow value is zero', async () => {
    const obligation = obligationBuffer();
    writeU128(obligation, 1208 + 104, BigInt(0));
    writeU128(obligation, 2208, BigInt(0));
    writeU128(obligation, 2224, BigInt(0));
    const rpc = mockRpc({
      accountInfo: new Map([[OBLIGATION, { value: { owner: KLEND_PROGRAM_ID, data: dataResponse(obligation) } }]]),
    });

    const result = await getKaminoClientState(context(rpc), { instrId: 1 }, fakeKaminoContext());

    expect(result.borrows[0].borrowedAmountRaw).toBe(40_000_000);
    expect(result.borrows[0].borrowMarketValue).toBe(0);
    expect(result.totalBorrowValue).toBe(0.04);
    expect(result.healthFactor).toBe(3000);
    expect(result.liquidationBuffer).toBeCloseTo(119.96);
    expect(result.raw.borrowedAssetsMarketValueSf).toBe(0);
  });
});

describe('Kamino account order', () => {
  it('builds exact non-VM change-position account order', async () => {
    const ctx = context();
    const kctx = fakeKaminoContext();
    const ix = await buildKaminoChangePositionInstruction(
      ctx,
      { instrId: 1, assetIsCollateral: true, collateralDelta: 1, borrowDelta: -2 },
      kctx,
    );

    expect(ix.programAddress).toBe(ctx.programId);
    expect(ix.accounts!.map((account) => account.address).slice(0, 11)).toEqual([
      SIGNER,
      ROOT,
      CLIENT_PRIMARY,
      SYSTEM_PROGRAM_ID,
      INSTR_ACCOUNT,
      OBLIGATION,
      USER_METADATA,
      SYSVAR_RENT_ADDRESS,
      MAIN_KAMINO_MARKET,
      kctx.lendingMarketAuthority,
      COLL_RESERVE,
    ]);
    expect(ix.accounts![0].role).toBe(AccountRole.WRITABLE_SIGNER);
    expect(ix.accounts![4].role).toBe(AccountRole.WRITABLE);
    expect(ix.accounts![6].role).toBe(AccountRole.READONLY);
    expect(ix.accounts![7].role).toBe(AccountRole.READONLY);
    expect(ix.accounts![ix.accounts!.length - 2].address).toBe(KLEND_PROGRAM_ID);
  });

  it('swaps change-position reserve clusters when asset is the debt side', async () => {
    const ctx = context();
    const assetCollateralFarm = 'AssetCollFarm111111111111111111111111' as Address;
    const assetLiquidityFarm = 'AssetLiqFarm1111111111111111111111111' as Address;
    const crncyCollateralFarm = 'CrncyCollFarm111111111111111111111111' as Address;
    const crncyLiquidityFarm = 'CrncyLiqFarm1111111111111111111111111' as Address;
    const kctx = fakeKaminoContext(null, {
      assetCollateral: assetCollateralFarm,
      assetLiquidity: assetLiquidityFarm,
      crncyCollateral: crncyCollateralFarm,
      crncyLiquidity: crncyLiquidityFarm,
    });
    (kctx.collateralReserve as any).oracles = {
      pyth: 'AssetPyth1111111111111111111111111111' as Address,
      switchboardPrice: 'AssetSbPrice111111111111111111111111' as Address,
      switchboardTwap: 'AssetSbTwap1111111111111111111111111' as Address,
      scope: 'AssetScope11111111111111111111111111' as Address,
    };
    (kctx.debtReserve as any).oracles = {
      pyth: 'CrncyPyth1111111111111111111111111111' as Address,
      switchboardPrice: 'CrncySbPrice111111111111111111111111' as Address,
      switchboardTwap: 'CrncySbTwap1111111111111111111111111' as Address,
      scope: 'CrncyScope11111111111111111111111111' as Address,
    };

    const ix = await buildKaminoChangePositionInstruction(
      ctx,
      { instrId: 1, assetIsCollateral: false, collateralDelta: 1, borrowDelta: -2 },
      kctx,
    );
    const addresses = ix.accounts!.map((account) => account.address);

    expect(addresses.slice(10, 26)).toEqual([
      DEBT_RESERVE,
      CRNCY_MINT,
      kctx.debtReserve.liquiditySupply,
      kctx.debtReserve.collateralMint,
      kctx.debtReserve.collateralSupply,
      kctx.debtReserve.clientAta,
      kctx.debtReserve.vault,
      kctx.debtReserve.tokenProgram,
      kctx.debtReserve.tokenProgram,
      COLL_RESERVE,
      ASSET_MINT,
      kctx.collateralReserve.liquiditySupply,
      kctx.collateralReserve.feeVault,
      kctx.collateralReserve.clientAta,
      kctx.collateralReserve.vault,
      kctx.collateralReserve.tokenProgram,
    ]);
    expect(addresses.slice(26, 34)).toEqual([
      kctx.debtReserve.oracles.pyth,
      kctx.debtReserve.oracles.switchboardPrice,
      kctx.debtReserve.oracles.switchboardTwap,
      kctx.debtReserve.oracles.scope,
      kctx.collateralReserve.oracles.pyth,
      kctx.collateralReserve.oracles.switchboardPrice,
      kctx.collateralReserve.oracles.switchboardTwap,
      kctx.collateralReserve.oracles.scope,
    ]);
    expect(addresses.slice(34, 38)).toEqual([
      `${crncyCollateralFarm}Obl` as Address,
      crncyCollateralFarm,
      `${assetLiquidityFarm}Obl` as Address,
      assetLiquidityFarm,
    ]);
  });

  it('inserts client VM account in the processor position when VM is active', async () => {
    const ctx = context();
    const kctx = fakeKaminoContext(VM_ACCOUNT);
    const ix = await buildKaminoChangePositionInstruction(
      ctx,
      { instrId: 1, assetIsCollateral: true, collateralDelta: 1, borrowDelta: 0 },
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
    expect(ix.accounts!.map((account) => account.address).slice(6, 10)).toEqual([
      OBLIGATION,
      USER_METADATA,
      SYSVAR_RENT_ADDRESS,
      MAIN_KAMINO_MARKET,
    ]);
  });

  it('builds init account orders including optional VM account', async () => {
    const ctx = context();
    const withVm = fakeKaminoContext(VM_ACCOUNT);

    const initInstrumentIx = await buildKaminoInitInstrumentInstruction(ctx, { instrId: 1 }, withVm);
    expect(initInstrumentIx.accounts!.map((account) => account.address).slice(0, 9)).toEqual([
      SIGNER,
      ROOT,
      INSTR_ACCOUNT,
      CLIENT_PRIMARY,
      VM_ACCOUNT,
      OBLIGATION,
      MAIN_KAMINO_MARKET,
      withVm.lendingMarketAuthority,
      ASSET_MINT,
    ]);
    expect(initInstrumentIx.accounts!.map((account) => account.address).slice(-2)).toEqual([
      FARM_COLL,
      'SysvarRent111111111111111111111111111111111' as Address,
    ]);

    const obligationIx = await buildKaminoInitObligationInstruction(ctx, {});
    const expectedUserMetadata = await userMetadataPda(CLIENT_PRIMARY);
    const expectedObligation = await vanillaObligationPda({
      owner: CLIENT_PRIMARY,
      lendingMarket: MAIN_KAMINO_MARKET,
    });
    expect(obligationIx.accounts!.map((account) => account.address).slice(0, 5)).toEqual([
      SIGNER,
      ROOT,
      CLIENT_PRIMARY,
      expectedUserMetadata,
      expectedObligation,
    ]);
    expect(obligationIx.accounts!.map((account) => account.address)).not.toContain(INSTR_ACCOUNT);
  });

  it('omits optional farm accounts and farm program when reserves have no farms', async () => {
    const ctx = context();
    const noFarmCtx = fakeKaminoContext(null, {
      assetCollateral: null,
      assetLiquidity: null,
      crncyCollateral: null,
      crncyLiquidity: null,
    });

    const ix = await buildKaminoInitInstrumentInstruction(ctx, { instrId: 1 }, noFarmCtx);

    expect(ix.accounts!.map((account) => account.address)).toEqual([
      SIGNER,
      ROOT,
      INSTR_ACCOUNT,
      CLIENT_PRIMARY,
      OBLIGATION,
      MAIN_KAMINO_MARKET,
      noFarmCtx.lendingMarketAuthority,
      ASSET_MINT,
      noFarmCtx.collateralReserve.clientAta,
      TOKEN_PROGRAM_ID,
      COLL_RESERVE,
      CRNCY_MINT,
      noFarmCtx.debtReserve.clientAta,
      TOKEN_PROGRAM_ID,
      DEBT_RESERVE,
      'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL' as Address,
      KLEND_PROGRAM_ID,
      SYSTEM_PROGRAM_ID,
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

  it('builds minimal update-obligations order when the obligation account is missing', async () => {
    const obligation = await vanillaObligationPda({
      owner: CLIENT_PRIMARY,
      lendingMarket: MAIN_KAMINO_MARKET,
    });
    const ix = await buildKaminoUpdateObligationsInstruction(context(), {});

    expect(ix.accounts).toEqual([
      { address: MAIN_KAMINO_MARKET, role: AccountRole.READONLY },
      { address: obligation, role: AccountRole.WRITABLE },
    ]);
  });

  it('uses a custom lending market when deriving update-obligations accounts', async () => {
    const obligation = await vanillaObligationPda({
      owner: CLIENT_PRIMARY,
      lendingMarket: OBLIGATION,
    });
    const ix = await buildKaminoUpdateObligationsInstruction(context(), { lendingMarket: OBLIGATION });

    expect(ix.accounts!.map((account) => account.address)).toEqual([OBLIGATION, obligation]);
  });

  it('parses update-obligations reserves from obligation deposits and borrows', async () => {
    const obligation = await vanillaObligationPda({
      owner: CLIENT_PRIMARY,
      lendingMarket: MAIN_KAMINO_MARKET,
    });
    const rpc = mockRpc({
      accountInfo: new Map([
        [obligation, { value: { owner: KLEND_PROGRAM_ID, data: dataResponse(obligationBuffer()) } }],
      ]),
    });
    const ix = await buildKaminoUpdateObligationsInstruction(context(rpc), {});

    expect(ix.accounts!.map((account) => account.address)).toEqual([
      MAIN_KAMINO_MARKET,
      obligation,
      COLL_RESERVE,
      DEBT_RESERVE,
    ]);
    expect(ix.accounts!.slice(2).every((account) => account.role === AccountRole.WRITABLE)).toBe(true);
  });

  it('builds refresh-reserves batch data with default and explicit skipPriceUpdates', async () => {
    const obligation = await vanillaObligationPda({
      owner: CLIENT_PRIMARY,
      lendingMarket: MAIN_KAMINO_MARKET,
    });
    const rpc = mockRpc({
      accountInfo: new Map([
        [obligation, { value: { owner: KLEND_PROGRAM_ID, data: dataResponse(obligationBuffer()) } }],
        [
          COLL_RESERVE,
          { value: { owner: KLEND_PROGRAM_ID, data: dataResponse(reserveBuffer({ liquidityMint: ASSET_MINT })) } },
        ],
        [
          DEBT_RESERVE,
          { value: { owner: KLEND_PROGRAM_ID, data: dataResponse(reserveBuffer({ liquidityMint: CRNCY_MINT })) } },
        ],
      ]),
    });

    const defaultIx = await buildKaminoRefreshReservesInstruction(context(rpc), {});
    const skipIx = await buildKaminoRefreshReservesInstruction(context(rpc), { skipPriceUpdates: true });

    expect(defaultIx.programAddress).toBe(KLEND_PROGRAM_ID);
    expect(defaultIx.data).toEqual(Buffer.concat([KAMINO_REFRESH_RESERVES_BATCH_DISCRIMINATOR, Buffer.from([0])]));
    expect(skipIx.data).toEqual(Buffer.concat([KAMINO_REFRESH_RESERVES_BATCH_DISCRIMINATOR, Buffer.from([1])]));
  });

  it('builds refresh-reserves batch account order from obligation reserves and reserve oracles', async () => {
    const obligation = await vanillaObligationPda({
      owner: CLIENT_PRIMARY,
      lendingMarket: MAIN_KAMINO_MARKET,
    });
    const collReserveData = reserveBuffer({
      liquidityMint: ASSET_MINT,
      farmCollateral: FARM_COLL,
      farmDebt: FARM_DEBT,
    });
    const debtReserveData = reserveBuffer({ liquidityMint: CRNCY_MINT });
    const rpc = mockRpc({
      accountInfo: new Map([
        [obligation, { value: { owner: KLEND_PROGRAM_ID, data: dataResponse(obligationBuffer()) } }],
        [COLL_RESERVE, { value: { owner: KLEND_PROGRAM_ID, data: dataResponse(collReserveData) } }],
        [DEBT_RESERVE, { value: { owner: KLEND_PROGRAM_ID, data: dataResponse(debtReserveData) } }],
      ]),
    });

    const ix = await buildKaminoRefreshReservesInstruction(context(rpc), {});

    expect(ix.accounts).toEqual([
      { address: COLL_RESERVE, role: AccountRole.WRITABLE },
      { address: MAIN_KAMINO_MARKET, role: AccountRole.READONLY },
      { address: KLEND_PROGRAM_ID, role: AccountRole.READONLY },
      { address: KLEND_PROGRAM_ID, role: AccountRole.READONLY },
      { address: KLEND_PROGRAM_ID, role: AccountRole.READONLY },
      { address: KLEND_PROGRAM_ID, role: AccountRole.READONLY },
      { address: DEBT_RESERVE, role: AccountRole.WRITABLE },
      { address: MAIN_KAMINO_MARKET, role: AccountRole.READONLY },
      { address: KLEND_PROGRAM_ID, role: AccountRole.READONLY },
      { address: KLEND_PROGRAM_ID, role: AccountRole.READONLY },
      { address: KLEND_PROGRAM_ID, role: AccountRole.READONLY },
      { address: KLEND_PROGRAM_ID, role: AccountRole.READONLY },
    ]);
  });

  it('dedupes update-obligations reserve accounts while preserving first-seen order', async () => {
    const obligation = await vanillaObligationPda({
      owner: CLIENT_PRIMARY,
      lendingMarket: MAIN_KAMINO_MARKET,
    });
    const buffer = obligationReserveListBuffer(
      [COLL_RESERVE, DEBT_RESERVE, COLL_RESERVE],
      [DEBT_RESERVE, COLL_RESERVE],
    );
    const rpc = mockRpc({
      accountInfo: new Map([[obligation, { value: { owner: KLEND_PROGRAM_ID, data: dataResponse(buffer) } }]]),
    });
    const ix = await buildKaminoUpdateObligationsInstruction(context(rpc), {});

    expect(ix.accounts!.map((account) => account.address).slice(2)).toEqual([COLL_RESERVE, DEBT_RESERVE]);
  });

  it('dedupes refresh-reserves batch accounts while preserving first-seen order', async () => {
    const obligation = await vanillaObligationPda({
      owner: CLIENT_PRIMARY,
      lendingMarket: MAIN_KAMINO_MARKET,
    });
    const buffer = obligationReserveListBuffer(
      [DEBT_RESERVE, COLL_RESERVE, DEBT_RESERVE],
      [COLL_RESERVE, DEBT_RESERVE],
    );
    const rpc = mockRpc({
      accountInfo: new Map([
        [obligation, { value: { owner: KLEND_PROGRAM_ID, data: dataResponse(buffer) } }],
        [
          COLL_RESERVE,
          { value: { owner: KLEND_PROGRAM_ID, data: dataResponse(reserveBuffer({ liquidityMint: ASSET_MINT })) } },
        ],
        [
          DEBT_RESERVE,
          { value: { owner: KLEND_PROGRAM_ID, data: dataResponse(reserveBuffer({ liquidityMint: CRNCY_MINT })) } },
        ],
      ]),
    });

    const ix = await buildKaminoRefreshReservesInstruction(context(rpc), {});

    expect(ix.accounts!.map((account) => account.address).filter((_, index) => index % 6 === 0)).toEqual([
      DEBT_RESERVE,
      COLL_RESERVE,
    ]);
  });

  it('uses a custom lending market when deriving refresh-reserves accounts', async () => {
    const obligation = await vanillaObligationPda({
      owner: CLIENT_PRIMARY,
      lendingMarket: OBLIGATION,
    });
    const rpc = mockRpc({
      accountInfo: new Map([
        [
          obligation,
          {
            value: {
              owner: KLEND_PROGRAM_ID,
              data: dataResponse(obligationReserveListBuffer([COLL_RESERVE], [])),
            },
          },
        ],
        [
          COLL_RESERVE,
          {
            value: {
              owner: KLEND_PROGRAM_ID,
              data: dataResponse(reserveBuffer({ liquidityMint: ASSET_MINT, lendingMarket: OBLIGATION })),
            },
          },
        ],
      ]),
    });

    const ix = await buildKaminoRefreshReservesInstruction(context(rpc), { lendingMarket: OBLIGATION });

    expect(ix.accounts!.map((account) => account.address).slice(0, 2)).toEqual([COLL_RESERVE, OBLIGATION]);
  });

  it('throws on invalid update-obligations obligation layout', async () => {
    const obligation = await vanillaObligationPda({
      owner: CLIENT_PRIMARY,
      lendingMarket: MAIN_KAMINO_MARKET,
    });
    const rpc = mockRpc({
      accountInfo: new Map([
        [obligation, { value: { owner: KLEND_PROGRAM_ID, data: dataResponse(Buffer.alloc(64)) } }],
      ]),
    });

    await expect(buildKaminoUpdateObligationsInstruction(context(rpc), {})).rejects.toThrow(
      /Invalid Kamino obligation layout/,
    );
  });

  it('throws on invalid refresh-reserves obligation layout', async () => {
    const obligation = await vanillaObligationPda({
      owner: CLIENT_PRIMARY,
      lendingMarket: MAIN_KAMINO_MARKET,
    });
    const rpc = mockRpc({
      accountInfo: new Map([
        [obligation, { value: { owner: KLEND_PROGRAM_ID, data: dataResponse(Buffer.alloc(64)) } }],
      ]),
    });

    await expect(buildKaminoRefreshReservesInstruction(context(rpc), {})).rejects.toThrow(
      /Invalid Kamino obligation layout/,
    );
  });

  it('throws on invalid refresh-reserves reserve layout', async () => {
    const obligation = await vanillaObligationPda({
      owner: CLIENT_PRIMARY,
      lendingMarket: MAIN_KAMINO_MARKET,
    });
    const rpc = mockRpc({
      accountInfo: new Map([
        [
          obligation,
          {
            value: {
              owner: KLEND_PROGRAM_ID,
              data: dataResponse(obligationReserveListBuffer([COLL_RESERVE], [])),
            },
          },
        ],
        [COLL_RESERVE, { value: { owner: KLEND_PROGRAM_ID, data: dataResponse(Buffer.alloc(6000)) } }],
      ]),
    });

    await expect(buildKaminoRefreshReservesInstruction(context(rpc), {})).rejects.toThrow(
      /Invalid Kamino reserve discriminator/,
    );
  });
});

describe('package dependencies', () => {
  it('bumps package metadata to 1.0.67', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    const packageLock = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package-lock.json'), 'utf8'));
    expect(packageJson.version).toBe('1.0.67');
    expect(packageLock.version).toBe('1.0.67');
    expect(packageLock.packages[''].version).toBe('1.0.67');
  });

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
