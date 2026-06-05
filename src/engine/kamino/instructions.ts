import { Address, AccountRole } from '@solana/kit';

import {
  Instrument,
  VmAddKaminoArgs,
  VmRemoveKaminoArgs,
  ParsedKaminoInitObligationArgs,
  KaminoInitTokenAccountsArgs,
  ParsedKaminoChangePositionArgs,
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
  KaminoChangePositionFlag,
} from '../../constants';
import { TokenFlag, VmFlag, TokenStateModel } from '../../structure_models';
import {
  vmAddKaminoData,
  vmRemoveKaminoData,
  kaminoInitTokenAccountsData,
  kaminoChangePositionData,
} from '../../instruction_models';
import { findAssociatedTokenAddress } from '../utils';
import { isPubkeySentinel } from './bin';
import { fetchObligationDecoded, fetchReservesDecoded } from './fetch';
import {
  findClientPrimaryAccount,
  findClientVmAccount,
  findKaminoUserMetadata,
  findKaminoObligation,
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
 *   1) signer (VM authority, ro signer)
 *   2) root (ro)
 *   3) client_primary (writable)
 *   4) client_vm (writable, may need allocation)
 *   5) system_program (ro)
 */
async function buildVmAddKaminoInstruction(ctx: KaminoInstructionContext, args: VmAddKaminoArgs): Promise<Instruction> {
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
  args: ParsedKaminoInitObligationArgs,
  instrAddress: Address,
): Promise<Instruction> {
  const clientPrimary = await findClientPrimaryAccount(ctx, ctx.signer);
  const userMetadata = await findKaminoUserMetadata(clientPrimary);
  const obligation = await findKaminoObligation(clientPrimary, args.lendingMarket);
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
    { address: obligation, role: AccountRole.WRITABLE },
    { address: args.lendingMarket, role: AccountRole.READONLY },
    { address: KLEND_PROGRAM_ID, role: AccountRole.READONLY },
    { address: KLEND_PROGRAM_ID, role: AccountRole.READONLY },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    { address: SYSVAR_RENT_ID, role: AccountRole.READONLY },
  );

  return {
    accounts: keys,
    programAddress: ctx.programId,
  };
}

/**
 * Tag 84: Create the client_primary-owned ATAs for the instrument's asset & crncy mints.
 *
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
 * Tag 85: Unified signed-delta CPI (deposit / borrow / repay / withdraw).
 */
async function buildKaminoChangePositionInstruction(
  ctx: KaminoInstructionContext,
  args: ParsedKaminoChangePositionArgs,
  instr: Instrument,
): Promise<Instruction> {
  const assetToken = requireToken(ctx.tokens, instr.header.assetTokenId);
  const crncyToken = requireToken(ctx.tokens, instr.header.crncyTokenId);
  const instrMints = new Set<Address>([assetToken.address, crncyToken.address]);

  const clientPrimary = await findClientPrimaryAccount(ctx, ctx.signer);
  const obligationAddress = await findKaminoObligation(clientPrimary, args.lendingMarket);

  const obligation = await fetchObligationDecoded(ctx, obligationAddress);
  const allReserveAddrs = [...new Set<Address>([...obligation.depositReserves, ...obligation.borrowReserves])];
  const reserves = await fetchReservesDecoded(ctx, allReserveAddrs);

  const mintOf = (reserveAddr: Address): Address => {
    const r = reserves.get(reserveAddr);
    if (!r) throw new Error(`Reserve ${reserveAddr} missing from batch fetch`);
    return r.liquidity.mint;
  };

  const collReserveAddr = obligation.depositReserves.find((r) => instrMints.has(mintOf(r)));
  const debtReserveAddr = obligation.borrowReserves.find((r) => instrMints.has(mintOf(r)));
  if (!collReserveAddr) {
    throw new Error(
      `No deposit (collateral) reserve on obligation ${obligationAddress} matches instrument ` +
        `${instr.header.instrId} mints. Deposit collateral before adjusting this position.`,
    );
  }
  if (!debtReserveAddr) {
    throw new Error(
      `No borrow (debt) reserve on obligation ${obligationAddress} matches instrument ` +
        `${instr.header.instrId} mints. Borrow before adjusting this position.`,
    );
  }
  const collReserve = reserves.get(collReserveAddr)!;
  const debtReserve = reserves.get(debtReserveAddr)!;

  const lendingMarket = obligation.lendingMarket;
  const lendingMarketAuthority = await findKaminoLendingMarketAuthority(lendingMarket);

  const collLiqMint = collReserve.liquidity.mint;
  const debtLiqMint = debtReserve.liquidity.mint;

  const collTokenProgram = collReserve.liquidity.tokenProgram;
  const debtTokenProgram = debtReserve.liquidity.tokenProgram;

  const userCollAta = await findAssociatedTokenAddress(clientPrimary, collTokenProgram, collLiqMint);
  const userDebtAta = await findAssociatedTokenAddress(clientPrimary, debtTokenProgram, debtLiqMint);
  const collVault = await getProgramTokenAccount(ctx, collLiqMint);
  const debtVault = await getProgramTokenAccount(ctx, debtLiqMint);
  const vmActive = (ctx.vmMask & VmFlag.active) !== 0;

  const collFarmReserveState = isPubkeySentinel(collReserve.farmCollateral) ? null : collReserve.farmCollateral;
  const debtFarmReserveState = isPubkeySentinel(debtReserve.farmDebt) ? null : debtReserve.farmDebt;
  const collObligationFarm = collFarmReserveState
    ? await findKaminoObligationFarmUserState(collFarmReserveState, obligationAddress)
    : KLEND_PROGRAM_ID;
  const debtObligationFarm = debtFarmReserveState
    ? await findKaminoObligationFarmUserState(debtFarmReserveState, obligationAddress)
    : KLEND_PROGRAM_ID;

  const debtBorrowFeeReceiver = isPubkeySentinel(debtReserve.liquidity.feeVault)
    ? KLEND_PROGRAM_ID
    : debtReserve.liquidity.feeVault;

  const extraReserveAddrs = allReserveAddrs.filter((r) => r !== collReserveAddr && r !== debtReserveAddr);

  const farmRole = (hasFarm: boolean): AccountRole => (hasFarm ? AccountRole.WRITABLE : AccountRole.READONLY);

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
    { address: instr.address, role: AccountRole.READONLY },
    { address: obligationAddress, role: AccountRole.WRITABLE },
    { address: lendingMarket, role: AccountRole.READONLY },
    { address: lendingMarketAuthority, role: AccountRole.READONLY },
    // Collateral cluster
    { address: collReserveAddr, role: AccountRole.WRITABLE },
    { address: collLiqMint, role: AccountRole.READONLY },
    { address: collReserve.liquidity.supplyVault, role: AccountRole.WRITABLE },
    { address: collReserve.collateral.mint, role: AccountRole.WRITABLE },
    { address: collReserve.collateral.supplyVault, role: AccountRole.WRITABLE },
    { address: userCollAta, role: AccountRole.WRITABLE },
    { address: collVault, role: AccountRole.WRITABLE },
    { address: collTokenProgram, role: AccountRole.READONLY },
    // Collateral cToken program: Kamino reserve collateral mints are always SPL Token.
    { address: TOKEN_PROGRAM_ID, role: AccountRole.READONLY },
    // Debt cluster
    { address: debtReserveAddr, role: AccountRole.WRITABLE },
    { address: debtLiqMint, role: AccountRole.READONLY },
    { address: debtReserve.liquidity.supplyVault, role: AccountRole.WRITABLE },
    { address: debtBorrowFeeReceiver, role: AccountRole.WRITABLE },
    { address: userDebtAta, role: AccountRole.WRITABLE },
    { address: debtVault, role: AccountRole.WRITABLE },
    { address: debtTokenProgram, role: AccountRole.READONLY },
    // Oracles — collateral side
    { address: collReserve.oracles.pyth, role: AccountRole.READONLY },
    { address: collReserve.oracles.switchboardPrice, role: AccountRole.READONLY },
    { address: collReserve.oracles.switchboardTwap, role: AccountRole.READONLY },
    { address: collReserve.oracles.scope, role: AccountRole.READONLY },
    // Oracles — debt side
    { address: debtReserve.oracles.pyth, role: AccountRole.READONLY },
    { address: debtReserve.oracles.switchboardPrice, role: AccountRole.READONLY },
    { address: debtReserve.oracles.switchboardTwap, role: AccountRole.READONLY },
    { address: debtReserve.oracles.scope, role: AccountRole.READONLY },
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
  for (const extraAddr of extraReserveAddrs) {
    const extra = reserves.get(extraAddr)!;
    keys.push(
      { address: extraAddr, role: AccountRole.WRITABLE },
      { address: extra.oracles.pyth, role: AccountRole.READONLY },
      { address: extra.oracles.switchboardPrice, role: AccountRole.READONLY },
      { address: extra.oracles.switchboardTwap, role: AccountRole.READONLY },
      { address: extra.oracles.scope, role: AccountRole.READONLY },
    );
  }

  let flags = 0;
  if (args.repayAll) flags |= KaminoChangePositionFlag.repayAll;
  if (args.withdrawAll) flags |= KaminoChangePositionFlag.withdrawAll;

  return {
    accounts: keys,
    programAddress: ctx.programId,
    data: kaminoChangePositionData(85, flags, args.instrId, args.borrowDelta, args.collateralDelta, args.customId ?? 0),
  };
}

export {
  buildVmAddKaminoInstruction,
  buildVmRemoveKaminoInstruction,
  buildKaminoInitObligationInstruction,
  buildKaminoInitTokenAccountsInstruction,
  buildKaminoChangePositionInstruction,
};
