import {
  AccountRole,
  Address,
  Base58EncodedBytes,
  Base64EncodedDataResponse,
  getAddressDecoder,
  getAddressEncoder,
  getBase64Encoder,
  getProgramDerivedAddress,
} from '@solana/kit';
import bs58 from 'bs58';
import { Buffer } from 'buffer';

import {
  GetKaminoClientStateArgs,
  GetKaminoContextArgs,
  Instruction,
  KaminoAtaExistsArgs,
  KaminoChangePositionArgs,
  KaminoClientStateResponse,
  KaminoContext,
  KaminoInitObligationArgs,
  KaminoInitObligationFarmsArgs,
  KaminoInitTokenAccountsArgs,
  KaminoInstrumentAtasExistArgs,
  KaminoInstrumentAtasExistResponse,
  KaminoLookupTableAddressesArgs,
  KaminoLookupTableAddressesResponse,
  KaminoObligationExistsArgs,
  KaminoOracleAccounts,
  KaminoReserveByMintArgs,
  KaminoReserveContext,
  KaminoReserveInfo,
  VmFinalizeActivateArgs,
} from '../types';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  FARMS_PROGRAM_ID,
  KLEND_PROGRAM_ID,
  MAIN_KAMINO_MARKET,
  MAIN_KAMINO_MARKET_LUT,
  SYSTEM_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '../constants';
import { Instrument } from '../types/responses';
import { TokenStateModel } from '../structure_models';
import {
  kaminoChangePositionData,
  kaminoInitObligationData,
  kaminoInitObligationFarmsData,
  kaminoInitTokenAccountsData,
} from '../instruction_models';
import { findAssociatedTokenAddress, tokenDec } from './utils';
import {
  AccountHelperContext,
  findClientPrimaryAccount,
  findClientVmAccount,
  getProgramTokenAccount,
} from './account-helpers';

export const KAMINO_REPAY_ALL_FLAG = 1;
export const KAMINO_WITHDRAW_ALL_FLAG = 2;
export const KAMINO_KEEP_OBLIGATION_ALIVE_FLAG = 4;

const NULL_ADDRESS = '11111111111111111111111111111111' as Address;
const SYSVAR_RENT = 'SysvarRent111111111111111111111111111111111' as Address;
const SYSVAR_INSTRUCTIONS = 'Sysvar1nstructions1111111111111111111111111' as Address;

const RESERVE_DISCRIMINATOR = Buffer.from([43, 242, 204, 202, 26, 247, 59, 127]);
const OBLIGATION_DISCRIMINATOR = Buffer.from([168, 206, 141, 106, 88, 76, 172, 167]);
const USER_METADATA_DISCRIMINATOR = Buffer.from([157, 214, 220, 235, 98, 135, 171, 28]);

const RESERVE_LENDING_MARKET_OFFSET = 32;
const RESERVE_FARM_COLLATERAL_OFFSET = 64;
const RESERVE_FARM_DEBT_OFFSET = 96;
const RESERVE_LIQUIDITY_MINT_OFFSET = 128;
const RESERVE_LIQUIDITY_SUPPLY_OFFSET = 160;
const RESERVE_FEE_VAULT_OFFSET = 192;
const RESERVE_MARKET_PRICE_SF_OFFSET = 248;
const RESERVE_MINT_DECIMALS_OFFSET = 272;
const RESERVE_TOKEN_PROGRAM_OFFSET = 408;
const RESERVE_COLLATERAL_MINT_OFFSET = 2560;
const RESERVE_COLLATERAL_SUPPLY_OFFSET = 2592;
const RESERVE_CONFIG_OFFSET = 4856;
const RESERVE_LOAN_TO_VALUE_PCT_OFFSET = RESERVE_CONFIG_OFFSET + 16;
const RESERVE_LIQUIDATION_THRESHOLD_PCT_OFFSET = RESERVE_CONFIG_OFFSET + 17;
const RESERVE_DEPOSIT_LIMIT_OFFSET = RESERVE_CONFIG_OFFSET + 160;
const RESERVE_BORROW_LIMIT_OFFSET = RESERVE_CONFIG_OFFSET + 168;
const RESERVE_SCOPE_PRICE_OFFSET = RESERVE_CONFIG_OFFSET + 176 + 80;
const RESERVE_SWITCHBOARD_PRICE_OFFSET = RESERVE_CONFIG_OFFSET + 176 + 128;
const RESERVE_SWITCHBOARD_TWAP_OFFSET = RESERVE_CONFIG_OFFSET + 176 + 160;
const RESERVE_PYTH_PRICE_OFFSET = RESERVE_CONFIG_OFFSET + 176 + 192;

const USER_METADATA_LOOKUP_TABLE_OFFSET = 48;

const OBLIGATION_OWNER_OFFSET = 64;
const OBLIGATION_DEPOSITS_OFFSET = 96;
const OBLIGATION_COLLATERAL_SIZE = 136;
const OBLIGATION_COLLATERAL_DEPOSITED_AMOUNT_OFFSET = 32;
const OBLIGATION_COLLATERAL_MARKET_VALUE_OFFSET = 40;
const OBLIGATION_DEPOSITED_VALUE_SF_OFFSET = 1192;
const OBLIGATION_BORROWS_OFFSET = 1208;
const OBLIGATION_LIQUIDITY_SIZE = 200;
const OBLIGATION_BORROWED_AMOUNT_SF_OFFSET = 88;
const OBLIGATION_BORROW_MARKET_VALUE_SF_OFFSET = 104;
const OBLIGATION_BORROW_FACTOR_ADJUSTED_DEBT_VALUE_SF_OFFSET = 2208;
const OBLIGATION_BORROWED_ASSETS_MARKET_VALUE_SF_OFFSET = 2224;
const OBLIGATION_ALLOWED_BORROW_VALUE_SF_OFFSET = 2240;
const OBLIGATION_UNHEALTHY_BORROW_VALUE_SF_OFFSET = 2256;

const SF_FRACTIONAL_BITS = BigInt(60);
const SF_ONE = BigInt(1) << SF_FRACTIONAL_BITS;

const addressEncoder = getAddressEncoder();
const addressDecoder = getAddressDecoder();

export interface KaminoInstructionContext extends AccountHelperContext {
  instruments: Map<number, Instrument>;
  tokens: Map<number, TokenStateModel>;
  uiNumbers: boolean;
  signer: Address;
  rootAccount: Address;
  clientPrimaryAccount: Address | null;
  clientLutAddress: Address | null;
  clientVmActive: boolean;
  getKaminoReserveInfoByMint?: (args: KaminoReserveByMintArgs) => Promise<KaminoReserveInfo>;
}

function dataToBuffer(data: Base64EncodedDataResponse): Buffer {
  return Buffer.from(getBase64Encoder().encode(data[0]));
}

function readAddress(buffer: Buffer, offset: number): Address {
  return addressDecoder.decode(buffer.subarray(offset, offset + 32)) as Address;
}

function readU64(buffer: Buffer, offset: number): number {
  return Number(buffer.readBigUInt64LE(offset));
}

function readU128(buffer: Buffer, offset: number): bigint {
  const lo = buffer.readBigUInt64LE(offset);
  const hi = buffer.readBigUInt64LE(offset + 8);
  return lo + (hi << BigInt(64));
}

function sfToNumber(value: bigint): number {
  return Number(value) / Number(SF_ONE);
}

function sfToIntegerCeil(value: bigint): number {
  if (value === BigInt(0)) return 0;
  return Number((value + SF_ONE - BigInt(1)) >> SF_FRACTIONAL_BITS);
}

function isDefaultAddress(value: Address | null | undefined): boolean {
  return value == null || value === NULL_ADDRESS;
}

function oracleOrSentinel(value: Address): Address {
  return isDefaultAddress(value) ? KLEND_PROGRAM_ID : value;
}

function accountOwner(info: { owner?: Address; programAddress?: Address }): Address | undefined {
  return info.owner ?? info.programAddress;
}

function requireClientPrimary(ctx: KaminoInstructionContext): Address {
  if (ctx.clientPrimaryAccount === null) {
    throw new Error('Client primary account not found');
  }
  return ctx.clientPrimaryAccount;
}

function requireInstrument(ctx: KaminoInstructionContext, instrId: number): Instrument {
  const instr = ctx.instruments.get(instrId);
  if (instr === undefined) {
    throw new Error('Instrument not found');
  }
  return instr;
}

function requireTokenMint(ctx: KaminoInstructionContext, tokenId: number, label: string): Address {
  const token = ctx.tokens.get(tokenId);
  if (token === undefined) {
    throw new Error(`${label} token not found`);
  }
  return token.address;
}

function instrumentMints(ctx: KaminoInstructionContext, instr: Instrument): { assetMint: Address; crncyMint: Address } {
  return {
    assetMint: requireTokenMint(ctx, instr.header.assetTokenId, 'Asset'),
    crncyMint: requireTokenMint(ctx, instr.header.crncyTokenId, 'Currency'),
  };
}

function reserveMemcmp(
  offset: number,
  bytes: Buffer,
): {
  memcmp: { offset: bigint; encoding: 'base58'; bytes: Base58EncodedBytes };
} {
  return {
    memcmp: {
      offset: BigInt(offset),
      encoding: 'base58',
      bytes: bs58.encode(bytes) as Base58EncodedBytes,
    },
  };
}

function addressMemcmp(offset: number, value: Address) {
  return reserveMemcmp(offset, Buffer.from(addressEncoder.encode(value)));
}

export async function lendingMarketAuthPda(lendingMarket: Address): Promise<Address> {
  return (
    await getProgramDerivedAddress({
      programAddress: KLEND_PROGRAM_ID,
      seeds: [Buffer.from('lma'), addressEncoder.encode(lendingMarket)],
    })
  )[0];
}

export async function reserveLiqSupplyPda(reserve: Address): Promise<Address> {
  return (
    await getProgramDerivedAddress({
      programAddress: KLEND_PROGRAM_ID,
      seeds: [Buffer.from('reserve_liq_supply'), addressEncoder.encode(reserve)],
    })
  )[0];
}

export async function reserveCollateralMintPda(reserve: Address): Promise<Address> {
  return (
    await getProgramDerivedAddress({
      programAddress: KLEND_PROGRAM_ID,
      seeds: [Buffer.from('reserve_coll_mint'), addressEncoder.encode(reserve)],
    })
  )[0];
}

export async function reserveCollateralSupplyPda(reserve: Address): Promise<Address> {
  return (
    await getProgramDerivedAddress({
      programAddress: KLEND_PROGRAM_ID,
      seeds: [Buffer.from('reserve_coll_supply'), addressEncoder.encode(reserve)],
    })
  )[0];
}

export async function reserveFeeVaultPda(reserve: Address): Promise<Address> {
  return (
    await getProgramDerivedAddress({
      programAddress: KLEND_PROGRAM_ID,
      seeds: [Buffer.from('fee_receiver'), addressEncoder.encode(reserve)],
    })
  )[0];
}

export async function userMetadataPda(owner: Address): Promise<Address> {
  return (
    await getProgramDerivedAddress({
      programAddress: KLEND_PROGRAM_ID,
      seeds: [Buffer.from('user_meta'), addressEncoder.encode(owner)],
    })
  )[0];
}

export async function vanillaObligationPda(args: { owner: Address; lendingMarket: Address }): Promise<Address> {
  return (
    await getProgramDerivedAddress({
      programAddress: KLEND_PROGRAM_ID,
      seeds: [
        Buffer.from([0]),
        Buffer.from([0]),
        addressEncoder.encode(args.owner),
        addressEncoder.encode(args.lendingMarket),
        addressEncoder.encode(NULL_ADDRESS),
        addressEncoder.encode(NULL_ADDRESS),
      ],
    })
  )[0];
}

export async function obligationFarmStatePda(args: { farmState: Address; obligation: Address }): Promise<Address> {
  return (
    await getProgramDerivedAddress({
      programAddress: FARMS_PROGRAM_ID,
      seeds: [Buffer.from('user'), addressEncoder.encode(args.farmState), addressEncoder.encode(args.obligation)],
    })
  )[0];
}

export async function clientPrimaryAta(args: {
  clientPrimaryAccount: Address;
  mint: Address;
  tokenProgram: Address;
}): Promise<Address> {
  return findAssociatedTokenAddress(args.clientPrimaryAccount, args.tokenProgram, args.mint);
}

function decodeReserve(address: Address, buffer: Buffer): KaminoReserveInfo {
  if (buffer.length < RESERVE_CONFIG_OFFSET + 936) {
    throw new Error(`Invalid Kamino reserve layout: ${address}`);
  }
  if (!buffer.subarray(0, 8).equals(RESERVE_DISCRIMINATOR)) {
    throw new Error(`Invalid Kamino reserve discriminator: ${address}`);
  }

  const lendingMarket = readAddress(buffer, RESERVE_LENDING_MARKET_OFFSET);
  const tokenProgram = readAddress(buffer, RESERVE_TOKEN_PROGRAM_OFFSET);
  const farmCollateral = readAddress(buffer, RESERVE_FARM_COLLATERAL_OFFSET);
  const farmDebt = readAddress(buffer, RESERVE_FARM_DEBT_OFFSET);
  const oracles: KaminoOracleAccounts = {
    pyth: oracleOrSentinel(readAddress(buffer, RESERVE_PYTH_PRICE_OFFSET)),
    switchboardPrice: oracleOrSentinel(readAddress(buffer, RESERVE_SWITCHBOARD_PRICE_OFFSET)),
    switchboardTwap: oracleOrSentinel(readAddress(buffer, RESERVE_SWITCHBOARD_TWAP_OFFSET)),
    scope: oracleOrSentinel(readAddress(buffer, RESERVE_SCOPE_PRICE_OFFSET)),
  };

  return {
    address,
    lendingMarket,
    liquidityMint: readAddress(buffer, RESERVE_LIQUIDITY_MINT_OFFSET),
    liquiditySupply: readAddress(buffer, RESERVE_LIQUIDITY_SUPPLY_OFFSET),
    collateralMint: readAddress(buffer, RESERVE_COLLATERAL_MINT_OFFSET),
    collateralSupply: readAddress(buffer, RESERVE_COLLATERAL_SUPPLY_OFFSET),
    feeVault: readAddress(buffer, RESERVE_FEE_VAULT_OFFSET),
    tokenProgram: isDefaultAddress(tokenProgram) ? TOKEN_PROGRAM_ID : tokenProgram,
    farmCollateral,
    farmDebt,
    oracles,
    loanToValuePct: buffer.readUint8(RESERVE_LOAN_TO_VALUE_PCT_OFFSET),
    liquidationThresholdPct: buffer.readUint8(RESERVE_LIQUIDATION_THRESHOLD_PCT_OFFSET),
    mintDecimals: readU64(buffer, RESERVE_MINT_DECIMALS_OFFSET),
    raw: {
      marketPriceSf: sfToNumber(readU128(buffer, RESERVE_MARKET_PRICE_SF_OFFSET)),
      borrowLimit: readU64(buffer, RESERVE_BORROW_LIMIT_OFFSET),
      depositLimit: readU64(buffer, RESERVE_DEPOSIT_LIMIT_OFFSET),
    },
  };
}

export async function loadKaminoReserve(
  ctx: Pick<KaminoInstructionContext, 'rpc' | 'commitment'>,
  reserve: Address,
): Promise<KaminoReserveInfo> {
  const info = await ctx.rpc.getAccountInfo(reserve, { commitment: ctx.commitment, encoding: 'base64' }).send();
  if (info.value == null) {
    throw new Error(`Kamino reserve not found: ${reserve}`);
  }
  if (accountOwner(info.value) !== KLEND_PROGRAM_ID) {
    throw new Error(`Kamino reserve is not owned by KLend: ${reserve}`);
  }
  return decodeReserve(reserve, dataToBuffer(info.value.data));
}

function validateReserveForMint(
  reserve: KaminoReserveInfo,
  expectedMint: Address,
  lendingMarket: Address,
  label: string,
): void {
  if (reserve.lendingMarket !== lendingMarket) {
    throw new Error(`${label} reserve lending market mismatch`);
  }
  if (reserve.liquidityMint !== expectedMint) {
    throw new Error(`${label} reserve liquidity mint does not match instrument mint`);
  }
}

export async function findKaminoReserveByMint(
  ctx: KaminoInstructionContext,
  args: KaminoReserveByMintArgs,
): Promise<KaminoReserveInfo> {
  const lendingMarket = args.lendingMarket ?? MAIN_KAMINO_MARKET;
  const accounts = await ctx.rpc
    .getProgramAccounts(KLEND_PROGRAM_ID, {
      encoding: 'base64',
      filters: [
        reserveMemcmp(0, RESERVE_DISCRIMINATOR),
        addressMemcmp(RESERVE_LENDING_MARKET_OFFSET, lendingMarket),
        addressMemcmp(RESERVE_LIQUIDITY_MINT_OFFSET, args.mint),
      ],
    })
    .send();

  if (accounts.length === 0) {
    throw new Error(`Kamino reserve not found for mint ${args.mint}`);
  }
  if (accounts.length > 1) {
    throw new Error(`Multiple Kamino reserves found for mint ${args.mint}`);
  }

  return decodeReserve(accounts[0].pubkey, dataToBuffer(accounts[0].account.data));
}

async function resolveKaminoReserveByMint(
  ctx: KaminoInstructionContext,
  args: KaminoReserveByMintArgs,
): Promise<KaminoReserveInfo> {
  return ctx.getKaminoReserveInfoByMint != null
    ? ctx.getKaminoReserveInfoByMint(args)
    : findKaminoReserveByMint(ctx, args);
}

async function farmContext(args: {
  reserve: KaminoReserveInfo;
  obligation: Address;
  side: 'collateral' | 'debt';
}): Promise<Pick<KaminoReserveContext, 'obligationFarm' | 'reserveFarmState' | 'hasFarm'>> {
  const reserveFarmState = args.side === 'collateral' ? args.reserve.farmCollateral : args.reserve.farmDebt;
  if (isDefaultAddress(reserveFarmState)) {
    return {
      obligationFarm: KLEND_PROGRAM_ID,
      reserveFarmState: KLEND_PROGRAM_ID,
      hasFarm: false,
    };
  }
  return {
    obligationFarm: await obligationFarmStatePda({ farmState: reserveFarmState, obligation: args.obligation }),
    reserveFarmState,
    hasFarm: true,
  };
}

async function reserveContext(args: {
  ctx: KaminoInstructionContext;
  reserve: KaminoReserveInfo;
  obligation: Address;
  clientPrimaryAccount: Address;
  side: 'collateral' | 'debt';
}): Promise<KaminoReserveContext> {
  const [vault, clientAta, farm] = await Promise.all([
    getProgramTokenAccount(args.ctx, args.reserve.liquidityMint),
    clientPrimaryAta({
      clientPrimaryAccount: args.clientPrimaryAccount,
      mint: args.reserve.liquidityMint,
      tokenProgram: args.reserve.tokenProgram,
    }),
    farmContext({
      reserve: args.reserve,
      obligation: args.obligation,
      side: args.side,
    }),
  ]);

  return {
    ...args.reserve,
    vault,
    clientAta,
    ...farm,
  };
}

function reserveMetaRole(hasFarm: boolean): AccountRole {
  return hasFarm ? AccountRole.WRITABLE : AccountRole.READONLY;
}

function appendOptionalVmAccount(accounts: { address: Address; role: AccountRole }[], ctx: KaminoContext): void {
  if (ctx.clientVmAccount !== null) {
    accounts.push({ address: ctx.clientVmAccount, role: AccountRole.READONLY });
  }
}

export async function buildKaminoContext(
  ctx: KaminoInstructionContext,
  args: GetKaminoContextArgs,
): Promise<KaminoContext> {
  const lendingMarket = args.lendingMarket ?? MAIN_KAMINO_MARKET;
  const instr = requireInstrument(ctx, args.instrId);
  const { assetMint, crncyMint } = instrumentMints(ctx, instr);
  const clientPrimaryAccount = requireClientPrimary(ctx);
  const clientVmAccount = ctx.clientVmActive ? await findClientVmAccount(ctx, ctx.signer) : null;
  const obligation = await vanillaObligationPda({ owner: clientPrimaryAccount, lendingMarket });
  const userMetadata = await userMetadataPda(clientPrimaryAccount);

  const collateralReserveInfo = await resolveKaminoReserveByMint(ctx, { mint: assetMint, lendingMarket });
  validateReserveForMint(collateralReserveInfo, assetMint, lendingMarket, 'Collateral');

  const debtReserveInfo = await resolveKaminoReserveByMint(ctx, { mint: crncyMint, lendingMarket });
  validateReserveForMint(debtReserveInfo, crncyMint, lendingMarket, 'Debt');

  const [lendingMarketAuthority, collateralReserve, debtReserve] = await Promise.all([
    lendingMarketAuthPda(lendingMarket),
    reserveContext({
      ctx,
      reserve: collateralReserveInfo,
      obligation,
      clientPrimaryAccount,
      side: 'collateral',
    }),
    reserveContext({
      ctx,
      reserve: debtReserveInfo,
      obligation,
      clientPrimaryAccount,
      side: 'debt',
    }),
  ]);

  return {
    instrId: args.instrId,
    lendingMarket,
    lendingMarketAuthority,
    instrAccount: instr.address,
    clientPrimaryAccount,
    clientVmAccount,
    userMetadata,
    obligation,
    collateralReserve,
    debtReserve,
    extraReserves: [],
  };
}

export async function buildVmAddKaminoInstruction(
  ctx: KaminoInstructionContext,
  args: VmFinalizeActivateArgs,
): Promise<Instruction> {
  const clientPrimaryAccount = await findClientPrimaryAccount(ctx, ctx.signer);
  const clientVmAccount = await findClientVmAccount(ctx, ctx.signer);
  return {
    accounts: [
      { address: args.vmAuthority, role: AccountRole.WRITABLE_SIGNER },
      { address: ctx.rootAccount, role: AccountRole.READONLY },
      { address: clientPrimaryAccount, role: AccountRole.WRITABLE },
      { address: clientVmAccount, role: AccountRole.WRITABLE },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    ],
    programAddress: ctx.programId,
    data: Buffer.from([81]),
  };
}

export async function buildVmRemoveKaminoInstruction(
  ctx: KaminoInstructionContext,
  args: VmFinalizeActivateArgs,
): Promise<Instruction> {
  const clientPrimaryAccount = await findClientPrimaryAccount(ctx, ctx.signer);
  const clientVmAccount = await findClientVmAccount(ctx, ctx.signer);
  return {
    accounts: [
      { address: args.vmAuthority, role: AccountRole.READONLY_SIGNER },
      { address: ctx.rootAccount, role: AccountRole.READONLY },
      { address: clientPrimaryAccount, role: AccountRole.WRITABLE },
      { address: clientVmAccount, role: AccountRole.WRITABLE },
    ],
    programAddress: ctx.programId,
    data: Buffer.from([82]),
  };
}

export async function buildKaminoInitTokenAccountsInstruction(
  ctx: KaminoInstructionContext,
  args: KaminoInitTokenAccountsArgs,
  kaminoCtx: KaminoContext,
): Promise<Instruction> {
  const instr = requireInstrument(ctx, args.instrId);
  const { assetMint, crncyMint } = instrumentMints(ctx, instr);
  const accounts = [
    { address: ctx.signer, role: AccountRole.WRITABLE_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: kaminoCtx.clientPrimaryAccount, role: AccountRole.READONLY },
  ];
  appendOptionalVmAccount(accounts, kaminoCtx);
  accounts.push(
    { address: kaminoCtx.instrAccount, role: AccountRole.READONLY },
    { address: assetMint, role: AccountRole.READONLY },
    { address: crncyMint, role: AccountRole.READONLY },
    { address: kaminoCtx.collateralReserve.clientAta, role: AccountRole.WRITABLE },
    { address: kaminoCtx.debtReserve.clientAta, role: AccountRole.WRITABLE },
    { address: kaminoCtx.collateralReserve.tokenProgram, role: AccountRole.READONLY },
    { address: kaminoCtx.debtReserve.tokenProgram, role: AccountRole.READONLY },
    { address: ASSOCIATED_TOKEN_PROGRAM_ID, role: AccountRole.READONLY },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
  );
  return {
    accounts,
    programAddress: ctx.programId,
    data: kaminoInitTokenAccountsData(84, args.instrId),
  };
}

export async function buildKaminoInitObligationInstruction(
  ctx: KaminoInstructionContext,
  args: KaminoInitObligationArgs,
  kaminoCtx: KaminoContext,
): Promise<Instruction> {
  const accounts = [
    { address: ctx.signer, role: AccountRole.WRITABLE_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: kaminoCtx.clientPrimaryAccount, role: AccountRole.WRITABLE },
  ];
  appendOptionalVmAccount(accounts, kaminoCtx);
  accounts.push(
    { address: kaminoCtx.instrAccount, role: AccountRole.READONLY },
    { address: kaminoCtx.userMetadata, role: AccountRole.WRITABLE },
    { address: kaminoCtx.obligation, role: AccountRole.WRITABLE },
    { address: kaminoCtx.lendingMarket, role: AccountRole.READONLY },
    { address: args.referrerUserMetadata ?? KLEND_PROGRAM_ID, role: AccountRole.READONLY },
    { address: KLEND_PROGRAM_ID, role: AccountRole.READONLY },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    { address: SYSVAR_RENT, role: AccountRole.READONLY },
  );
  return {
    accounts,
    programAddress: ctx.programId,
    data: kaminoInitObligationData(83, args.instrId),
  };
}

export async function buildKaminoInitObligationFarmsInstruction(
  ctx: KaminoInstructionContext,
  args: KaminoInitObligationFarmsArgs,
  kaminoCtx: KaminoContext,
): Promise<Instruction> {
  const sideName = args.side === 0 ? 'collateral' : 'debt';
  const selectedReserve = sideName === 'collateral' ? kaminoCtx.collateralReserve : kaminoCtx.debtReserve;

  const instr = requireInstrument(ctx, args.instrId);
  const { assetMint, crncyMint } = instrumentMints(ctx, instr);
  const expectedMint = sideName === 'collateral' ? assetMint : crncyMint;
  validateReserveForMint(selectedReserve, expectedMint, kaminoCtx.lendingMarket, 'Farm');
  if (!selectedReserve.hasFarm) {
    throw new Error(`Selected Kamino ${sideName} reserve has no farm`);
  }

  const accounts = [
    { address: ctx.signer, role: AccountRole.WRITABLE_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: kaminoCtx.clientPrimaryAccount, role: AccountRole.READONLY },
  ];
  appendOptionalVmAccount(accounts, kaminoCtx);
  accounts.push(
    { address: kaminoCtx.instrAccount, role: AccountRole.READONLY },
    { address: kaminoCtx.obligation, role: AccountRole.WRITABLE },
    { address: kaminoCtx.lendingMarket, role: AccountRole.READONLY },
    { address: kaminoCtx.lendingMarketAuthority, role: AccountRole.READONLY },
    { address: selectedReserve.address, role: AccountRole.WRITABLE },
    { address: selectedReserve.reserveFarmState, role: AccountRole.WRITABLE },
    { address: selectedReserve.obligationFarm, role: AccountRole.WRITABLE },
    { address: KLEND_PROGRAM_ID, role: AccountRole.READONLY },
    { address: FARMS_PROGRAM_ID, role: AccountRole.READONLY },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    { address: SYSVAR_RENT, role: AccountRole.READONLY },
  );
  return {
    accounts,
    programAddress: ctx.programId,
    data: kaminoInitObligationFarmsData(86, args.side, args.instrId),
  };
}

function kaminoChangeFlags(args: KaminoChangePositionArgs): number {
  let flags = 0;
  if (args.repayAll) flags |= KAMINO_REPAY_ALL_FLAG;
  if (args.withdrawAll) flags |= KAMINO_WITHDRAW_ALL_FLAG;
  if (args.keepObligationAlive) flags |= KAMINO_KEEP_OBLIGATION_ALIVE_FLAG;
  return flags;
}

function validateChangeFlags(args: KaminoChangePositionArgs): void {
  if (args.repayAll && args.borrowDelta !== 0) {
    throw new Error('repayAll requires borrowDelta to be 0');
  }
  if (args.withdrawAll && args.collateralDelta !== 0) {
    throw new Error('withdrawAll requires collateralDelta to be 0');
  }
  if (args.keepObligationAlive && args.withdrawAll) {
    throw new Error('keepObligationAlive cannot be used together with withdrawAll');
  }
  if (args.keepObligationAlive && args.collateralDelta === 0) {
    throw new Error('keepObligationAlive requires collateralDelta to be non-zero');
  }
}

function appendOracleAccounts(accounts: { address: Address; role: AccountRole }[], reserve: KaminoReserveInfo): void {
  accounts.push(
    { address: reserve.oracles.pyth, role: AccountRole.READONLY },
    { address: reserve.oracles.switchboardPrice, role: AccountRole.READONLY },
    { address: reserve.oracles.switchboardTwap, role: AccountRole.READONLY },
    { address: reserve.oracles.scope, role: AccountRole.READONLY },
  );
}

export async function buildKaminoChangePositionInstruction(
  ctx: KaminoInstructionContext,
  args: KaminoChangePositionArgs,
  kaminoCtx: KaminoContext,
): Promise<Instruction> {
  validateChangeFlags(args);
  const instr = requireInstrument(ctx, args.instrId);
  const collateralDelta = args.collateralDelta * tokenDec(ctx.tokens, instr.header.assetTokenId, ctx.uiNumbers);
  const borrowDelta = args.borrowDelta * tokenDec(ctx.tokens, instr.header.crncyTokenId, ctx.uiNumbers);

  const accounts = [
    { address: ctx.signer, role: AccountRole.WRITABLE_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: kaminoCtx.clientPrimaryAccount, role: AccountRole.WRITABLE },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
  ];
  appendOptionalVmAccount(accounts, kaminoCtx);
  accounts.push(
    { address: kaminoCtx.instrAccount, role: AccountRole.READONLY },
    { address: kaminoCtx.obligation, role: AccountRole.WRITABLE },
    { address: kaminoCtx.lendingMarket, role: AccountRole.READONLY },
    { address: kaminoCtx.lendingMarketAuthority, role: AccountRole.READONLY },
    { address: kaminoCtx.collateralReserve.address, role: AccountRole.WRITABLE },
    { address: kaminoCtx.collateralReserve.liquidityMint, role: AccountRole.READONLY },
    { address: kaminoCtx.collateralReserve.liquiditySupply, role: AccountRole.WRITABLE },
    { address: kaminoCtx.collateralReserve.collateralMint, role: AccountRole.WRITABLE },
    { address: kaminoCtx.collateralReserve.collateralSupply, role: AccountRole.WRITABLE },
    { address: kaminoCtx.collateralReserve.clientAta, role: AccountRole.WRITABLE },
    { address: kaminoCtx.collateralReserve.vault, role: AccountRole.WRITABLE },
    { address: kaminoCtx.collateralReserve.tokenProgram, role: AccountRole.READONLY },
    { address: kaminoCtx.collateralReserve.tokenProgram, role: AccountRole.READONLY },
    { address: kaminoCtx.debtReserve.address, role: AccountRole.WRITABLE },
    { address: kaminoCtx.debtReserve.liquidityMint, role: AccountRole.READONLY },
    { address: kaminoCtx.debtReserve.liquiditySupply, role: AccountRole.WRITABLE },
    { address: kaminoCtx.debtReserve.feeVault, role: AccountRole.WRITABLE },
    { address: kaminoCtx.debtReserve.clientAta, role: AccountRole.WRITABLE },
    { address: kaminoCtx.debtReserve.vault, role: AccountRole.WRITABLE },
    { address: kaminoCtx.debtReserve.tokenProgram, role: AccountRole.READONLY },
  );
  appendOracleAccounts(accounts, kaminoCtx.collateralReserve);
  appendOracleAccounts(accounts, kaminoCtx.debtReserve);
  accounts.push(
    {
      address: kaminoCtx.collateralReserve.obligationFarm,
      role: reserveMetaRole(kaminoCtx.collateralReserve.hasFarm),
    },
    {
      address: kaminoCtx.collateralReserve.reserveFarmState,
      role: reserveMetaRole(kaminoCtx.collateralReserve.hasFarm),
    },
    {
      address: kaminoCtx.debtReserve.obligationFarm,
      role: reserveMetaRole(kaminoCtx.debtReserve.hasFarm),
    },
    {
      address: kaminoCtx.debtReserve.reserveFarmState,
      role: reserveMetaRole(kaminoCtx.debtReserve.hasFarm),
    },
    { address: FARMS_PROGRAM_ID, role: AccountRole.READONLY },
    { address: KLEND_PROGRAM_ID, role: AccountRole.READONLY },
    { address: SYSVAR_INSTRUCTIONS, role: AccountRole.READONLY },
  );
  for (const reserve of kaminoCtx.extraReserves) {
    accounts.push({ address: reserve.address, role: AccountRole.WRITABLE });
    appendOracleAccounts(accounts, reserve);
  }

  return {
    accounts,
    programAddress: ctx.programId,
    data: kaminoChangePositionData(
      85,
      kaminoChangeFlags(args),
      args.instrId,
      borrowDelta,
      collateralDelta,
      args.customId ?? 0,
    ),
  };
}

export function kaminoMarketLut(lendingMarket?: Address): Address | null {
  return (lendingMarket ?? MAIN_KAMINO_MARKET) === MAIN_KAMINO_MARKET ? MAIN_KAMINO_MARKET_LUT : null;
}

function addUniqueAddress(out: Address[], value: Address | null | undefined): void {
  if (value == null || isDefaultAddress(value) || out.includes(value)) {
    return;
  }
  out.push(value);
}

function instrumentLut(instr: Instrument): Address | null {
  const lut = instr.header.lutAddress as Address | undefined;
  return lut == null || isDefaultAddress(lut) ? null : lut;
}

export async function getKaminoUserLookupTable(
  ctx: KaminoInstructionContext,
  userMetadata: Address,
): Promise<Address | null> {
  const info = await ctx.rpc.getAccountInfo(userMetadata, { commitment: ctx.commitment, encoding: 'base64' }).send();
  if (info.value == null || accountOwner(info.value) !== KLEND_PROGRAM_ID) {
    return null;
  }
  const buffer = dataToBuffer(info.value.data);
  if (
    buffer.length < USER_METADATA_LOOKUP_TABLE_OFFSET + 32 ||
    !buffer.subarray(0, 8).equals(USER_METADATA_DISCRIMINATOR)
  ) {
    return null;
  }
  const lut = readAddress(buffer, USER_METADATA_LOOKUP_TABLE_OFFSET);
  return isDefaultAddress(lut) ? null : lut;
}

export async function kaminoLookupTableAddresses(
  ctx: KaminoInstructionContext,
  args: KaminoLookupTableAddressesArgs,
  kaminoCtx: KaminoContext,
): Promise<KaminoLookupTableAddressesResponse> {
  const instr = requireInstrument(ctx, args.instrId);
  const marketLut = kaminoMarketLut(args.lendingMarket);
  const clientLut = ctx.clientLutAddress;
  const instrumentLutAddress = instrumentLut(instr);
  const userLookupTable = await getKaminoUserLookupTable(ctx, kaminoCtx.userMetadata);
  const all: Address[] = [];
  addUniqueAddress(all, marketLut);
  addUniqueAddress(all, clientLut);
  addUniqueAddress(all, instrumentLutAddress);
  addUniqueAddress(all, userLookupTable);
  return {
    marketLut,
    clientLut,
    instrumentLut: instrumentLutAddress,
    userLookupTable,
    all,
  };
}

export async function kaminoObligationExists(
  ctx: KaminoInstructionContext,
  args: KaminoObligationExistsArgs,
): Promise<boolean> {
  const obligation =
    args.obligation ??
    (await vanillaObligationPda({
      owner: requireClientPrimary(ctx),
      lendingMarket: args.lendingMarket ?? MAIN_KAMINO_MARKET,
    }));
  const info = await ctx.rpc
    .getAccountInfo(obligation, {
      commitment: ctx.commitment,
      encoding: 'base64',
      dataSlice: { offset: 0, length: 8 },
    })
    .send();
  if (info.value == null || accountOwner(info.value) !== KLEND_PROGRAM_ID) {
    return false;
  }
  const buffer = dataToBuffer(info.value.data);
  return buffer.length >= 8 && buffer.subarray(0, 8).equals(OBLIGATION_DISCRIMINATOR);
}

function registeredTokenProgram(ctx: KaminoInstructionContext, mint: Address): Address | null {
  for (const token of ctx.tokens.values()) {
    if (token.address === mint) {
      return (token.mask & 0x80000000) !== 0 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
    }
  }
  return null;
}

async function resolveTokenProgram(
  ctx: KaminoInstructionContext,
  mint: Address,
  explicit?: Address,
): Promise<Address | null> {
  if (explicit != null) {
    return explicit;
  }
  const registered = registeredTokenProgram(ctx, mint);
  if (registered != null) {
    return registered;
  }
  const info = await ctx.rpc.getAccountInfo(mint, { commitment: ctx.commitment, encoding: 'base64' }).send();
  if (info.value == null) {
    return null;
  }
  return accountOwner(info.value) ?? null;
}

export async function kaminoAtaExists(ctx: KaminoInstructionContext, args: KaminoAtaExistsArgs): Promise<boolean> {
  const owner = args.owner ?? requireClientPrimary(ctx);
  const tokenProgram = await resolveTokenProgram(ctx, args.mint, args.tokenProgram);
  if (tokenProgram == null) {
    return false;
  }
  const ata = await clientPrimaryAta({
    clientPrimaryAccount: owner,
    mint: args.mint,
    tokenProgram,
  });
  const info = await ctx.rpc.getAccountInfo(ata, { commitment: ctx.commitment, encoding: 'base64' }).send();
  return info.value != null && accountOwner(info.value) === tokenProgram;
}

export async function kaminoInstrumentAtasExist(
  ctx: KaminoInstructionContext,
  args: KaminoInstrumentAtasExistArgs,
): Promise<KaminoInstrumentAtasExistResponse> {
  const instr = requireInstrument(ctx, args.instrId);
  const { assetMint, crncyMint } = instrumentMints(ctx, instr);
  const clientPrimaryAccount = requireClientPrimary(ctx);
  const assetTokenProgram = (await resolveTokenProgram(ctx, assetMint)) ?? TOKEN_PROGRAM_ID;
  const crncyTokenProgram = (await resolveTokenProgram(ctx, crncyMint)) ?? TOKEN_PROGRAM_ID;
  const [assetAta, crncyAta] = await Promise.all([
    clientPrimaryAta({
      clientPrimaryAccount,
      mint: assetMint,
      tokenProgram: assetTokenProgram,
    }),
    clientPrimaryAta({
      clientPrimaryAccount,
      mint: crncyMint,
      tokenProgram: crncyTokenProgram,
    }),
  ]);
  const [assetExists, crncyExists] = await Promise.all([
    kaminoAtaExists(ctx, {
      mint: assetMint,
      owner: clientPrimaryAccount,
      tokenProgram: assetTokenProgram,
    }),
    kaminoAtaExists(ctx, {
      mint: crncyMint,
      owner: clientPrimaryAccount,
      tokenProgram: crncyTokenProgram,
    }),
  ]);
  return { assetAta, crncyAta, assetExists, crncyExists };
}

function reserveDecimals(context: KaminoContext, reserve: Address): number {
  if (reserve === context.collateralReserve.address) return context.collateralReserve.mintDecimals;
  if (reserve === context.debtReserve.address) return context.debtReserve.mintDecimals;
  const extra = context.extraReserves.find((entry) => entry.address === reserve);
  return extra?.mintDecimals ?? 0;
}

function decodeKaminoClientState(
  obligation: Address,
  buffer: Buffer,
  context: KaminoContext,
): KaminoClientStateResponse {
  const owner = readAddress(buffer, OBLIGATION_OWNER_OFFSET);
  const deposits = [];
  for (let i = 0; i < 8; i++) {
    const offset = OBLIGATION_DEPOSITS_OFFSET + i * OBLIGATION_COLLATERAL_SIZE;
    const reserve = readAddress(buffer, offset);
    const amountRaw = readU64(buffer, offset + OBLIGATION_COLLATERAL_DEPOSITED_AMOUNT_OFFSET);
    const marketValue = sfToNumber(readU128(buffer, offset + OBLIGATION_COLLATERAL_MARKET_VALUE_OFFSET));
    if (!isDefaultAddress(reserve) || amountRaw !== 0 || marketValue !== 0) {
      const decimals = reserveDecimals(context, reserve);
      deposits.push({
        reserve,
        depositedAmount: amountRaw / 10 ** decimals,
        depositedAmountRaw: amountRaw,
        depositMarketValue: marketValue,
        borrowedAmount: 0,
        borrowedAmountRaw: 0,
        borrowMarketValue: 0,
      });
    }
  }

  const borrows = [];
  for (let i = 0; i < 5; i++) {
    const offset = OBLIGATION_BORROWS_OFFSET + i * OBLIGATION_LIQUIDITY_SIZE;
    const reserve = readAddress(buffer, offset);
    const borrowedAmountSf = readU128(buffer, offset + OBLIGATION_BORROWED_AMOUNT_SF_OFFSET);
    const amountRaw = sfToIntegerCeil(borrowedAmountSf);
    const marketValue = sfToNumber(readU128(buffer, offset + OBLIGATION_BORROW_MARKET_VALUE_SF_OFFSET));
    if (!isDefaultAddress(reserve) || amountRaw !== 0 || marketValue !== 0) {
      const decimals = reserveDecimals(context, reserve);
      borrows.push({
        reserve,
        depositedAmount: 0,
        depositedAmountRaw: 0,
        depositMarketValue: 0,
        borrowedAmount: amountRaw / 10 ** decimals,
        borrowedAmountRaw: amountRaw,
        borrowMarketValue: marketValue,
      });
    }
  }

  const totalDepositValue = sfToNumber(readU128(buffer, OBLIGATION_DEPOSITED_VALUE_SF_OFFSET));
  const borrowFactorAdjustedDebtValue = sfToNumber(
    readU128(buffer, OBLIGATION_BORROW_FACTOR_ADJUSTED_DEBT_VALUE_SF_OFFSET),
  );
  const totalBorrowValue = sfToNumber(readU128(buffer, OBLIGATION_BORROWED_ASSETS_MARKET_VALUE_SF_OFFSET));
  const borrowLimit = sfToNumber(readU128(buffer, OBLIGATION_ALLOWED_BORROW_VALUE_SF_OFFSET));
  const unhealthyBorrowValue = sfToNumber(readU128(buffer, OBLIGATION_UNHEALTHY_BORROW_VALUE_SF_OFFSET));

  const collateralDeposit = deposits.find((entry) => entry.reserve === context.collateralReserve.address);
  let maxWithdrawEstimate: KaminoClientStateResponse['maxWithdrawEstimate'] = null;
  if (collateralDeposit != null) {
    let amountRaw = 0;
    if (collateralDeposit.depositedAmountRaw > 0) {
      if (borrows.length === 0) {
        amountRaw = collateralDeposit.depositedAmountRaw;
      } else if (collateralDeposit.depositMarketValue > 0) {
        const maxWithdrawValue =
          borrowLimit <= borrowFactorAdjustedDebtValue
            ? 0
            : context.collateralReserve.loanToValuePct === 0
              ? collateralDeposit.depositMarketValue
              : (borrowLimit - borrowFactorAdjustedDebtValue) / (context.collateralReserve.loanToValuePct / 100);
        const withdrawValue = Math.min(maxWithdrawValue, collateralDeposit.depositMarketValue);
        amountRaw = Math.min(
          collateralDeposit.depositedAmountRaw,
          Math.floor((withdrawValue / collateralDeposit.depositMarketValue) * collateralDeposit.depositedAmountRaw),
        );
      }
    }
    maxWithdrawEstimate = {
      reserve: context.collateralReserve.address,
      amountRaw,
      amount: amountRaw / 10 ** context.collateralReserve.mintDecimals,
    };
  }

  return {
    obligation,
    exists: true,
    lendingMarket: context.lendingMarket,
    reserves: {
      collateralReserve: context.collateralReserve.address,
      debtReserve: context.debtReserve.address,
    },
    deposits,
    borrows,
    totalDepositValue,
    totalBorrowValue,
    borrowLimit,
    unhealthyBorrowValue,
    ltv: totalDepositValue === 0 ? null : totalBorrowValue / totalDepositValue,
    healthFactor: totalBorrowValue === 0 ? null : unhealthyBorrowValue / totalBorrowValue,
    liquidationBuffer: totalBorrowValue === 0 ? null : unhealthyBorrowValue - totalBorrowValue,
    maxWithdrawEstimate,
    raw: {
      owner,
      depositedValueSf: totalDepositValue,
      borrowedAssetsMarketValueSf: totalBorrowValue,
      borrowFactorAdjustedDebtValueSf: borrowFactorAdjustedDebtValue,
      allowedBorrowValueSf: borrowLimit,
      unhealthyBorrowValueSf: unhealthyBorrowValue,
    },
  };
}

export async function getKaminoClientState(
  ctx: KaminoInstructionContext,
  args: GetKaminoClientStateArgs,
  context: KaminoContext,
): Promise<KaminoClientStateResponse> {
  const obligation = args.obligation ?? context.obligation;
  const info = await ctx.rpc.getAccountInfo(obligation, { commitment: ctx.commitment, encoding: 'base64' }).send();
  if (info.value == null || accountOwner(info.value) !== KLEND_PROGRAM_ID) {
    return {
      obligation,
      exists: false,
      lendingMarket: context.lendingMarket,
      reserves: {
        collateralReserve: context.collateralReserve.address,
        debtReserve: context.debtReserve.address,
      },
      deposits: [],
      borrows: [],
      totalDepositValue: 0,
      totalBorrowValue: 0,
      borrowLimit: 0,
      unhealthyBorrowValue: 0,
      ltv: null,
      healthFactor: null,
      liquidationBuffer: null,
      maxWithdrawEstimate: null,
      raw: {},
    };
  }
  const buffer = dataToBuffer(info.value.data);
  if (
    buffer.length < OBLIGATION_UNHEALTHY_BORROW_VALUE_SF_OFFSET + 16 ||
    !buffer.subarray(0, 8).equals(OBLIGATION_DISCRIMINATOR)
  ) {
    throw new Error(`Invalid Kamino obligation layout: ${obligation}`);
  }
  return decodeKaminoClientState(obligation, buffer, context);
}
