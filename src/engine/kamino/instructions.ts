import { Address, AccountRole } from '@solana/kit';

import {
  Instrument,
  VmAddKaminoArgs,
  VmRemoveKaminoArgs,
  KaminoInitObligationArgs,
  KaminoInitTokenAccountsArgs,
  KaminoInitObligationFarmsArgs,
  KaminoChangePositionArgs,
  Instruction,
} from '../../types';
import {
  SYSTEM_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  KLEND_PROGRAM_ID,
  FARMS_PROGRAM_ID,
  SYSVAR_RENT_ID,
  SYSVAR_INSTRUCTIONS_ID,
} from '../../constants';
import { TokenFlag, VmFlag, TokenStateModel } from '../../structure_models';
import {
  vmAddKaminoData,
  vmRemoveKaminoData,
  kaminoInitObligationData,
  kaminoInitTokenAccountsData,
  kaminoInitObligationFarmsData,
  kaminoChangePositionData,
} from '../../instruction_models';
import { findAssociatedTokenAddress } from '../utils';
import {
  findClientPrimaryAccount,
  findClientVmAccount,
  findKaminoUserMetadata,
  findKaminoLendingMarketAuthority,
  findKaminoObligationFarmUserState,
  getProgramTokenAccount,
  AccountHelperContext,
} from '../account-helpers';

export interface KaminoInstructionContext extends AccountHelperContext {
  tokens: Map<number, TokenStateModel>;
  uiNumbers: boolean;
  signer: Address;
  rootAccount: Address;
  vmMask: number;
}

function tokenProgramFor(token: TokenStateModel): Address {
  return (token.mask & TokenFlag.token2022) !== 0 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
}

function requireToken(tokens: Map<number, TokenStateModel>, tokenId: number): TokenStateModel {
  const token = tokens.get(tokenId);
  if (!token) {
    throw new Error(`Token ${tokenId} not found`);
  }
  return token;
}

/**
 * Tag 81: VM authority adds Kamino to client's VM whitelist.
 *
 * Account layout (Rust: vm_add_kamino.rs):
 *   1) signer (VM authority, ro signer)
 *   2) root (ro)
 *   3) client_primary (writable)
 *   4) client_vm (writable, may need allocation)
 *   5) system_program (ro)
 */
async function buildVmAddKaminoInstruction(
  ctx: KaminoInstructionContext,
  args: VmAddKaminoArgs,
): Promise<Instruction> {
  const clientPrimary = await findClientPrimaryAccount(ctx, ctx.signer);
  const clientVm = await findClientVmAccount(ctx, ctx.signer);

  return {
    accounts: [
      { address: args.vmAuthority, role: AccountRole.READONLY_SIGNER },
      { address: ctx.rootAccount, role: AccountRole.READONLY },
      { address: clientPrimary, role: AccountRole.WRITABLE },
      { address: clientVm, role: AccountRole.WRITABLE },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    ],
    programAddress: ctx.programId,
    data: vmAddKaminoData(81),
  };
}

/**
 * Tag 82: VM authority removes Kamino from VM whitelist.
 *
 * Account layout (Rust: vm_remove_kamino.rs):
 *   1) signer (VM authority, ro signer)
 *   2) root (ro)
 *   3) client_primary (writable)
 *   4) client_vm (writable)
 */
async function buildVmRemoveKaminoInstruction(
  ctx: KaminoInstructionContext,
  args: VmRemoveKaminoArgs,
): Promise<Instruction> {
  const clientPrimary = await findClientPrimaryAccount(ctx, ctx.signer);
  const clientVm = await findClientVmAccount(ctx, ctx.signer);

  return {
    accounts: [
      { address: args.vmAuthority, role: AccountRole.READONLY_SIGNER },
      { address: ctx.rootAccount, role: AccountRole.READONLY },
      { address: clientPrimary, role: AccountRole.WRITABLE },
      { address: clientVm, role: AccountRole.WRITABLE },
    ],
    programAddress: ctx.programId,
    data: vmRemoveKaminoData(82),
  };
}

/**
 * Tag 83: Initialize Kamino user_metadata + obligation accounts for the client.
 *
 * Account layout (Rust: kamino_init_obligation.rs):
 *   1) signer (writable signer, fee payer)
 *   2) root (ro)
 *   3) client_primary (writable)
 *   [4) client_vm (ro)  — only when VmFlag.active is set]
 *   5) instr_acc (ro)
 *   6) user_metadata (writable)
 *   7) obligation (writable)
 *   8) lending_market (ro)
 *   9) referrer_user_metadata (ro)  — KLEND program if none
 *   10) klend_program (ro)
 *   11) system_program (ro)
 *   12) sysvar_rent (ro)
 */
async function buildKaminoInitObligationInstruction(
  ctx: KaminoInstructionContext,
  args: KaminoInitObligationArgs,
  instrAddress: Address,
): Promise<Instruction> {
  const clientPrimary = await findClientPrimaryAccount(ctx, ctx.signer);
  const userMetadata = await findKaminoUserMetadata(clientPrimary);
  const vmActive = (ctx.vmMask & VmFlag.active) !== 0;

  const keys: { address: Address; role: AccountRole }[] = [
    { address: ctx.signer, role: AccountRole.WRITABLE_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: clientPrimary, role: AccountRole.WRITABLE },
  ];

  if (vmActive) {
    const clientVm = await findClientVmAccount(ctx, ctx.signer);
    keys.push({ address: clientVm, role: AccountRole.READONLY });
  }

  keys.push(
    { address: instrAddress, role: AccountRole.READONLY },
    { address: userMetadata, role: AccountRole.WRITABLE },
    { address: args.obligation, role: AccountRole.WRITABLE },
    { address: args.lendingMarket, role: AccountRole.READONLY },
    { address: KLEND_PROGRAM_ID, role: AccountRole.READONLY },
    { address: KLEND_PROGRAM_ID, role: AccountRole.READONLY },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    { address: SYSVAR_RENT_ID, role: AccountRole.READONLY },
  );

  return {
    accounts: keys,
    programAddress: ctx.programId,
    data: kaminoInitObligationData(83, args.instrId),
  };
}

/**
 * Tag 84: Create the client_primary-owned ATAs for the instrument's asset & crncy mints.
 *
 * Account layout (Rust: kamino_init_token_accounts.rs):
 *   1) signer (signer)
 *   2) root (ro)
 *   3) client_primary (ro)
 *   [4) client_vm (ro) — only when VmFlag.active is set]
 *   5) instr_acc (ro)
 *   6) asset_mint (ro)
 *   7) crncy_mint (ro)
 *   8) asset_ata (writable)
 *   9) crncy_ata (writable)
 *   10) asset_token_program (ro)
 *   11) crncy_token_program (ro)
 *   12) ata_program (ro)
 *   13) system_program (ro)
 */
async function buildKaminoInitTokenAccountsInstruction(
  ctx: KaminoInstructionContext,
  args: KaminoInitTokenAccountsArgs,
  instr: Instrument,
): Promise<Instruction> {
  const assetToken = requireToken(ctx.tokens, instr.header.assetTokenId);
  const crncyToken = requireToken(ctx.tokens, instr.header.crncyTokenId);
  const assetTokenProgram = tokenProgramFor(assetToken);
  const crncyTokenProgram = tokenProgramFor(crncyToken);

  const clientPrimary = await findClientPrimaryAccount(ctx, ctx.signer);
  const assetAta = await findAssociatedTokenAddress(clientPrimary, assetTokenProgram, assetToken.address);
  const crncyAta = await findAssociatedTokenAddress(clientPrimary, crncyTokenProgram, crncyToken.address);
  const vmActive = (ctx.vmMask & VmFlag.active) !== 0;

  const keys: { address: Address; role: AccountRole }[] = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: clientPrimary, role: AccountRole.READONLY },
  ];

  if (vmActive) {
    const clientVm = await findClientVmAccount(ctx, ctx.signer);
    keys.push({ address: clientVm, role: AccountRole.READONLY });
  }

  keys.push(
    { address: instr.address, role: AccountRole.READONLY },
    { address: assetToken.address, role: AccountRole.READONLY },
    { address: crncyToken.address, role: AccountRole.READONLY },
    { address: assetAta, role: AccountRole.WRITABLE },
    { address: crncyAta, role: AccountRole.WRITABLE },
    { address: assetTokenProgram, role: AccountRole.READONLY },
    { address: crncyTokenProgram, role: AccountRole.READONLY },
    { address: ASSOCIATED_TOKEN_PROGRAM_ID, role: AccountRole.READONLY },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
  );

  return {
    accounts: keys,
    programAddress: ctx.programId,
    data: kaminoInitTokenAccountsData(84, args.instrId),
  };
}

/**
 * Tag 86: Initialize Kamino obligation-farm-user-state for a single side (collateral or debt).
 *
 * Account layout (Rust: kamino_init_obligation_farms.rs):
 *   1) signer (writable signer)
 *   2) root (ro)
 *   3) client_primary (ro)
 *   [4) client_vm (ro) — only when VmFlag.active is set]
 *   5) instr_acc (ro)
 *   6) obligation (writable)
 *   7) lending_market (ro)
 *   8) lending_market_authority (ro)
 *   9) reserve (writable)
 *   10) reserve_farm_state (writable)
 *   11) obligation_farm (writable)
 *   12) klend_program (ro)
 *   13) farms_program (ro)
 *   14) system_program (ro)
 *   15) sysvar_rent (ro)
 */
async function buildKaminoInitObligationFarmsInstruction(
  ctx: KaminoInstructionContext,
  args: KaminoInitObligationFarmsArgs,
  instrAddress: Address,
): Promise<Instruction> {
  const clientPrimary = await findClientPrimaryAccount(ctx, ctx.signer);
  const lendingMarketAuthority = await findKaminoLendingMarketAuthority(args.lendingMarket);
  const obligationFarm = await findKaminoObligationFarmUserState(args.reserveFarmState, args.obligation);
  const vmActive = (ctx.vmMask & VmFlag.active) !== 0;

  const keys: { address: Address; role: AccountRole }[] = [
    { address: ctx.signer, role: AccountRole.WRITABLE_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: clientPrimary, role: AccountRole.READONLY },
  ];

  if (vmActive) {
    const clientVm = await findClientVmAccount(ctx, ctx.signer);
    keys.push({ address: clientVm, role: AccountRole.READONLY });
  }

  keys.push(
    { address: instrAddress, role: AccountRole.READONLY },
    { address: args.obligation, role: AccountRole.WRITABLE },
    { address: args.lendingMarket, role: AccountRole.READONLY },
    { address: lendingMarketAuthority, role: AccountRole.READONLY },
    { address: args.reserve, role: AccountRole.WRITABLE },
    { address: args.reserveFarmState, role: AccountRole.WRITABLE },
    { address: obligationFarm, role: AccountRole.WRITABLE },
    { address: KLEND_PROGRAM_ID, role: AccountRole.READONLY },
    { address: FARMS_PROGRAM_ID, role: AccountRole.READONLY },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    { address: SYSVAR_RENT_ID, role: AccountRole.READONLY },
  );

  return {
    accounts: keys,
    programAddress: ctx.programId,
    data: kaminoInitObligationFarmsData(86, args.side, args.instrId),
  };
}

/**
 * Tag 85: Unified signed-delta CPI (deposit / borrow / repay / withdraw).
 *
 * The caller is responsible for resolving all Kamino-side accounts (reserves, oracles,
 * lending market, farm states); the kit only derives client-owned PDAs (obligation,
 * ATAs, vault PDAs, lending-market-authority).
 *
 * Amounts (`borrowDelta`, `collateralDelta`) are raw integer token units. The sentinel
 * `Number.MIN_SAFE_INTEGER` or callers using `BigInt(i64::MIN)`-equivalent encoding
 * cannot be expressed safely as a JS number. If you need the on-chain "settle all"
 * sentinel, you must encode it manually — `kaminoChangePositionData` writes via
 * `writeBigInt64LE(BigInt(Math.floor(value)))`, so values must fit in i64.
 *
 * Account layout (Rust: kamino_change_position.rs:177-232).
 */
async function buildKaminoChangePositionInstruction(
  ctx: KaminoInstructionContext,
  args: KaminoChangePositionArgs,
  instrAddress: Address,
): Promise<Instruction> {
  const clientPrimary = await findClientPrimaryAccount(ctx, ctx.signer);
  const lendingMarketAuthority = await findKaminoLendingMarketAuthority(args.lendingMarket);
  const userCollAta = await findAssociatedTokenAddress(clientPrimary, args.collTokenProgram, args.collLiqMint);
  const userDebtAta = await findAssociatedTokenAddress(clientPrimary, args.debtTokenProgram, args.debtLiqMint);
  const collVault = await getProgramTokenAccount(ctx, args.collLiqMint);
  const debtVault = await getProgramTokenAccount(ctx, args.debtLiqMint);
  const vmActive = (ctx.vmMask & VmFlag.active) !== 0;

  const collFarmReserveState = args.collReserveFarmState;
  const debtFarmReserveState = args.debtReserveFarmState;
  const collObligationFarm = collFarmReserveState
    ? await findKaminoObligationFarmUserState(collFarmReserveState, args.obligation)
    : KLEND_PROGRAM_ID;
  const debtObligationFarm = debtFarmReserveState
    ? await findKaminoObligationFarmUserState(debtFarmReserveState, args.obligation)
    : KLEND_PROGRAM_ID;

  const farmRole = (hasFarm: boolean): AccountRole =>
    hasFarm ? AccountRole.WRITABLE : AccountRole.READONLY;

  const keys: { address: Address; role: AccountRole }[] = [
    { address: ctx.signer, role: AccountRole.WRITABLE_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: clientPrimary, role: AccountRole.WRITABLE },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
  ];

  if (vmActive) {
    const clientVm = await findClientVmAccount(ctx, ctx.signer);
    keys.push({ address: clientVm, role: AccountRole.READONLY });
  }

  keys.push(
    { address: instrAddress, role: AccountRole.READONLY },
    { address: args.obligation, role: AccountRole.WRITABLE },
    { address: args.lendingMarket, role: AccountRole.READONLY },
    { address: lendingMarketAuthority, role: AccountRole.READONLY },
    // Collateral cluster
    { address: args.collReserve, role: AccountRole.WRITABLE },
    { address: args.collLiqMint, role: AccountRole.READONLY },
    { address: args.collReserveLiqSupply, role: AccountRole.WRITABLE },
    { address: args.collReserveCollMint, role: AccountRole.WRITABLE },
    { address: args.collDestDepositColl, role: AccountRole.WRITABLE },
    { address: userCollAta, role: AccountRole.WRITABLE },
    { address: collVault, role: AccountRole.WRITABLE },
    { address: args.collTokenProgram, role: AccountRole.READONLY },
    { address: args.collLiqTokenProgram, role: AccountRole.READONLY },
    // Debt cluster
    { address: args.debtReserve, role: AccountRole.WRITABLE },
    { address: args.debtLiqMint, role: AccountRole.READONLY },
    { address: args.debtReserveSourceLiq, role: AccountRole.WRITABLE },
    { address: args.debtBorrowFeeReceiver ?? KLEND_PROGRAM_ID, role: AccountRole.WRITABLE },
    { address: userDebtAta, role: AccountRole.WRITABLE },
    { address: debtVault, role: AccountRole.WRITABLE },
    { address: args.debtTokenProgram, role: AccountRole.READONLY },
    // Oracles — collateral side
    { address: args.collOracles.pyth, role: AccountRole.READONLY },
    { address: args.collOracles.sbPrice, role: AccountRole.READONLY },
    { address: args.collOracles.sbTwap, role: AccountRole.READONLY },
    { address: args.collOracles.scope, role: AccountRole.READONLY },
    // Oracles — debt side
    { address: args.debtOracles.pyth, role: AccountRole.READONLY },
    { address: args.debtOracles.sbPrice, role: AccountRole.READONLY },
    { address: args.debtOracles.sbTwap, role: AccountRole.READONLY },
    { address: args.debtOracles.scope, role: AccountRole.READONLY },
    // Farm slots
    { address: collObligationFarm, role: farmRole(!!collFarmReserveState) },
    { address: collFarmReserveState ?? KLEND_PROGRAM_ID, role: farmRole(!!collFarmReserveState) },
    { address: debtObligationFarm, role: farmRole(!!debtFarmReserveState) },
    { address: debtFarmReserveState ?? KLEND_PROGRAM_ID, role: farmRole(!!debtFarmReserveState) },
    { address: FARMS_PROGRAM_ID, role: AccountRole.READONLY },
    // Globals
    { address: KLEND_PROGRAM_ID, role: AccountRole.READONLY },
    { address: SYSVAR_INSTRUCTIONS_ID, role: AccountRole.READONLY },
  );

  // Extras tail: one 5-tuple per additional obligation reserve.
  if (args.extraReserves) {
    for (const extra of args.extraReserves) {
      keys.push(
        { address: extra.reserve, role: AccountRole.WRITABLE },
        { address: extra.oracles.pyth, role: AccountRole.READONLY },
        { address: extra.oracles.sbPrice, role: AccountRole.READONLY },
        { address: extra.oracles.sbTwap, role: AccountRole.READONLY },
        { address: extra.oracles.scope, role: AccountRole.READONLY },
      );
    }
  }

  return {
    accounts: keys,
    programAddress: ctx.programId,
    data: kaminoChangePositionData(
      85,
      args.flags ?? 0,
      args.instrId,
      args.borrowDelta,
      args.collateralDelta,
      args.customId ?? 0,
    ),
  };
}

export {
  buildVmAddKaminoInstruction,
  buildVmRemoveKaminoInstruction,
  buildKaminoInitObligationInstruction,
  buildKaminoInitTokenAccountsInstruction,
  buildKaminoInitObligationFarmsInstruction,
  buildKaminoChangePositionInstruction,
};
