import { Address, AccountRole, getAddressEncoder } from '@solana/kit';

import {
  VmInitActivateArgs,
  VmFinalizeActivateArgs,
  VmFinalizeDeactivateArgs,
  VmInitWithdrawArgs,
  VmInitWithdrawFinalizeArgs,
  VmChangeListArgs,
  VmAddWithdrawalAddressArgs,
  VmRemoveWithdrawalAddressArgs,
  VmDirectWithdrawArgs,
  Instruction,
} from '../types';
import { AccountType } from '../types/enums';
import {
  SYSTEM_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '../constants';
import { findAssociatedTokenAddress, tokenDec } from './utils';
import { TokenStateModel } from '../structure_models';
import {
  vmInitWithdrawData,
  vmChangeWhitelistData,
  vmDirectWithdrawData,
  vmRemoveWithdrawalAddressData,
} from '../instruction_models';
import {
  getAccountByTag,
  getTokenAccount,
  findClientPrimaryAccount,
  findClientCommunityAccount,
  findClientVmAccount,
  AccountHelperContext,
} from './account-helpers';

export interface VmInstructionContext extends AccountHelperContext {
  tokens: Map<number, TokenStateModel>;
  uiNumbers: boolean;
  signer: Address;
  rootAccount: Address;
}

/**
 * Tag 63: Main wallet initiates VM activation
 */
async function buildVmInitActivateInstruction(
  ctx: VmInstructionContext,
  args: VmInitActivateArgs,
): Promise<Instruction> {
  const clientPrimaryAccount = await findClientPrimaryAccount(ctx, ctx.signer);

  return {
    accounts: [
      { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
      { address: ctx.rootAccount, role: AccountRole.READONLY },
      { address: clientPrimaryAccount, role: AccountRole.WRITABLE },
      { address: args.vmAuthority, role: AccountRole.READONLY },
    ],
    programAddress: ctx.programId,
    data: Buffer.from([63]),
  };
}

/**
 * Tag 64: Main wallet cancels pending VM activation
 */
async function buildVmInitActivateCancelInstruction(ctx: VmInstructionContext): Promise<Instruction> {
  const clientPrimaryAccount = await findClientPrimaryAccount(ctx, ctx.signer);

  return {
    accounts: [
      { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
      { address: ctx.rootAccount, role: AccountRole.READONLY },
      { address: clientPrimaryAccount, role: AccountRole.WRITABLE },
    ],
    programAddress: ctx.programId,
    data: Buffer.from([64]),
  };
}

/**
 * Tag 65: VM authority finalizes activation
 */
async function buildVmFinalizeActivateInstruction(
  ctx: VmInstructionContext,
  args: VmFinalizeActivateArgs,
): Promise<Instruction> {
  const clientPrimaryAccount = await findClientPrimaryAccount(ctx, ctx.signer);

  return {
    accounts: [
      { address: args.vmAuthority, role: AccountRole.READONLY_SIGNER },
      { address: ctx.rootAccount, role: AccountRole.READONLY },
      { address: clientPrimaryAccount, role: AccountRole.WRITABLE },
    ],
    programAddress: ctx.programId,
    data: Buffer.from([65]),
  };
}

/**
 * Tag 66: Main wallet initiates VM deactivation
 */
async function buildVmInitDeactivateInstruction(ctx: VmInstructionContext): Promise<Instruction> {
  const clientPrimaryAccount = await findClientPrimaryAccount(ctx, ctx.signer);

  return {
    accounts: [
      { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
      { address: ctx.rootAccount, role: AccountRole.READONLY },
      { address: clientPrimaryAccount, role: AccountRole.WRITABLE },
    ],
    programAddress: ctx.programId,
    data: Buffer.from([66]),
  };
}

/**
 * Tag 67: Main wallet cancels pending VM deactivation
 */
async function buildVmInitDeactivateCancelInstruction(ctx: VmInstructionContext): Promise<Instruction> {
  const clientPrimaryAccount = await findClientPrimaryAccount(ctx, ctx.signer);

  return {
    accounts: [
      { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
      { address: ctx.rootAccount, role: AccountRole.READONLY },
      { address: clientPrimaryAccount, role: AccountRole.WRITABLE },
    ],
    programAddress: ctx.programId,
    data: Buffer.from([67]),
  };
}

/**
 * Tag 68: VM authority finalizes deactivation
 */
async function buildVmFinalizeDeactivateInstruction(
  ctx: VmInstructionContext,
  args: VmFinalizeDeactivateArgs,
): Promise<Instruction> {
  const clientPrimaryAccount = await findClientPrimaryAccount(ctx, ctx.signer);

  return {
    accounts: [
      { address: args.vmAuthority, role: AccountRole.READONLY_SIGNER },
      { address: ctx.rootAccount, role: AccountRole.READONLY },
      { address: clientPrimaryAccount, role: AccountRole.WRITABLE },
    ],
    programAddress: ctx.programId,
    data: Buffer.from([68]),
  };
}

/**
 * Tag 69: Main wallet initiates VM withdrawal
 */
async function buildVmInitWithdrawInstruction(
  ctx: VmInstructionContext,
  args: VmInitWithdrawArgs,
): Promise<Instruction> {
  const clientPrimaryAccount = await findClientPrimaryAccount(ctx, ctx.signer);

  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: clientPrimaryAccount, role: AccountRole.WRITABLE },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
  ];

  if (args.tokenId == 0) {
    keys.push({
      address: await getAccountByTag(ctx, AccountType.COMMUNITY),
      role: AccountRole.READONLY,
    });
    keys.push({
      address: await findClientCommunityAccount(ctx, ctx.signer),
      role: AccountRole.WRITABLE,
    });
  }

  return {
    accounts: keys,
    programAddress: ctx.programId,
    data: vmInitWithdrawData(69, args.tokenId, args.amount * tokenDec(ctx.tokens, args.tokenId, ctx.uiNumbers)),
  };
}

/**
 * Tag 70: Main wallet cancels pending VM withdrawal
 */
async function buildVmInitWithdrawCancelInstruction(ctx: VmInstructionContext): Promise<Instruction> {
  const clientPrimaryAccount = await findClientPrimaryAccount(ctx, ctx.signer);

  return {
    accounts: [
      { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
      { address: ctx.rootAccount, role: AccountRole.READONLY },
      { address: clientPrimaryAccount, role: AccountRole.WRITABLE },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    ],
    programAddress: ctx.programId,
    data: Buffer.from([70]),
  };
}

/**
 * Tag 71: VM authority finalizes withdrawal (transfers tokens)
 */
async function buildVmInitWithdrawFinalizeInstruction(
  ctx: VmInstructionContext,
  args: VmInitWithdrawFinalizeArgs,
): Promise<Instruction> {
  const token = ctx.tokens.get(args.tokenId);
  if (!token) {
    throw new Error(`Token ${args.tokenId} not found`);
  }
  const tokenProgramId = (token.mask & 0x80000000) != 0 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
  const vmAuthorityTokenAccount = await findAssociatedTokenAddress(args.vmAuthority, tokenProgramId, token.address);
  const clientPrimaryAccount = await findClientPrimaryAccount(ctx, ctx.signer);

  let keys = [
    { address: args.vmAuthority, role: AccountRole.WRITABLE_SIGNER },
    { address: vmAuthorityTokenAccount, role: AccountRole.WRITABLE },
    { address: token.programAddress, role: AccountRole.WRITABLE },
    { address: token.address, role: AccountRole.READONLY },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: await getTokenAccount(ctx, token.address), role: AccountRole.READONLY },
    { address: clientPrimaryAccount, role: AccountRole.WRITABLE },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    { address: tokenProgramId, role: AccountRole.READONLY },
    { address: ctx.drvsAuthority, role: AccountRole.READONLY },
    { address: ASSOCIATED_TOKEN_PROGRAM_ID, role: AccountRole.READONLY },
  ];

  if (args.tokenId == 0) {
    keys.push({
      address: await getAccountByTag(ctx, AccountType.COMMUNITY),
      role: AccountRole.READONLY,
    });
    keys.push({
      address: await findClientCommunityAccount(ctx, args.vmAuthority),
      role: AccountRole.WRITABLE,
    });
  }

  return {
    accounts: keys,
    programAddress: ctx.programId,
    data: Buffer.from([71]),
  };
}

/**
 * Tag 72: VM authority changes instrument whitelist
 */
async function buildVmChangeListInstruction(
  ctx: VmInstructionContext,
  args: VmChangeListArgs,
): Promise<Instruction> {
  const clientPrimaryAccount = await findClientPrimaryAccount(ctx, ctx.signer);

  return {
    accounts: [
      { address: args.vmAuthority, role: AccountRole.READONLY_SIGNER },
      { address: ctx.rootAccount, role: AccountRole.READONLY },
      { address: clientPrimaryAccount, role: AccountRole.WRITABLE },
    ],
    programAddress: ctx.programId,
    data: vmChangeWhitelistData(72, args.mask, args.whitelist ?? []),
  };
}

/**
 * Tag 78: VM authority adds a withdrawal address to whitelist
 */
async function buildVmAddWithdrawalAddressInstruction(
  ctx: VmInstructionContext,
  args: VmAddWithdrawalAddressArgs,
): Promise<Instruction> {
  const clientPrimaryAccount = await findClientPrimaryAccount(ctx, ctx.signer);
  const clientVmAccount = await findClientVmAccount(ctx, ctx.signer);

  return {
    accounts: [
      { address: args.vmAuthority, role: AccountRole.WRITABLE_SIGNER },
      { address: ctx.rootAccount, role: AccountRole.READONLY },
      { address: clientPrimaryAccount, role: AccountRole.WRITABLE },
      { address: clientVmAccount, role: AccountRole.WRITABLE },
      { address: args.withdrawalTokenAccount, role: AccountRole.READONLY },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    ],
    programAddress: ctx.programId,
    data: Buffer.from([78]),
  };
}

/**
 * Tag 79: VM authority removes a withdrawal address from whitelist
 */
async function buildVmRemoveWithdrawalAddressInstruction(
  ctx: VmInstructionContext,
  args: VmRemoveWithdrawalAddressArgs,
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
    data: vmRemoveWithdrawalAddressData(79, new Uint8Array(getAddressEncoder().encode(args.withdrawalAddress))),
  };
}

/**
 * Tag 80: Any wallet triggers direct VM withdrawal to whitelisted address
 */
async function buildVmDirectWithdrawInstruction(
  ctx: VmInstructionContext,
  args: VmDirectWithdrawArgs,
): Promise<Instruction> {
  const token = ctx.tokens.get(args.tokenId);
  if (!token) {
    throw new Error(`Token ${args.tokenId} not found`);
  }
  const tokenProgramId = (token.mask & 0x80000000) != 0 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
  const clientPrimaryAccount = await findClientPrimaryAccount(ctx, ctx.signer);
  const clientVmAccount = await findClientVmAccount(ctx, ctx.signer);

  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: args.withdrawalTokenAccount, role: AccountRole.WRITABLE },
    { address: token.programAddress, role: AccountRole.WRITABLE },
    { address: token.address, role: AccountRole.READONLY },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: await getTokenAccount(ctx, token.address), role: AccountRole.READONLY },
    { address: clientPrimaryAccount, role: AccountRole.WRITABLE },
    { address: clientVmAccount, role: AccountRole.READONLY },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    { address: tokenProgramId, role: AccountRole.READONLY },
    { address: ctx.drvsAuthority, role: AccountRole.READONLY },
  ];

  if (args.tokenId == 0) {
    keys.push({
      address: await getAccountByTag(ctx, AccountType.COMMUNITY),
      role: AccountRole.READONLY,
    });
    keys.push({
      address: await findClientCommunityAccount(ctx, ctx.signer),
      role: AccountRole.WRITABLE,
    });
  }

  return {
    accounts: keys,
    programAddress: ctx.programId,
    data: vmDirectWithdrawData(80, args.tokenId, args.amount * tokenDec(ctx.tokens, args.tokenId, ctx.uiNumbers)),
  };
}

export {
  buildVmInitActivateInstruction,
  buildVmInitActivateCancelInstruction,
  buildVmFinalizeActivateInstruction,
  buildVmInitDeactivateInstruction,
  buildVmInitDeactivateCancelInstruction,
  buildVmFinalizeDeactivateInstruction,
  buildVmInitWithdrawInstruction,
  buildVmInitWithdrawCancelInstruction,
  buildVmInitWithdrawFinalizeInstruction,
  buildVmChangeListInstruction,
  buildVmAddWithdrawalAddressInstruction,
  buildVmRemoveWithdrawalAddressInstruction,
  buildVmDirectWithdrawInstruction,
};
