import { AccountRole } from '@solana/kit';

import { DepositArgs, WithdrawArgs, Instruction } from '../types';
import { AccountType } from '../types/enums';
import {
  SYSTEM_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  ADDRESS_LOOKUP_TABLE_PROGRAM_ID,
} from '../constants';
import { findAssociatedTokenAddress, getLookupTableAddress, tokenDec } from './utils';
import {
  getAccountByTag,
  getInstrAccountByTag,
  getTokenAccount,
  findClientPrimaryAccount,
  findClientCommunityAccount,
} from './account-helpers';
import { depositData, withdrawData } from '../instruction_models';
import { SpotInstructionContext } from './spot-instructions';

/**
 * Build deposit instruction
 */
async function buildDepositInstruction(
  ctx: SpotInstructionContext,
  args: DepositArgs,
  exists: boolean,
  rpcGetSlot: () => Promise<bigint>,
): Promise<Instruction> {
  const amount = args.amount ?? 0;
  const allFunds = args.all_funds ? 1 : 0;
  const token = ctx.tokens.get(args.tokenId);
  if (!token) {
    throw new Error(`Token ${args.tokenId} not found`);
  }
  const tokenProgramId = (token.mask & 0x80000000) != 0 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
  const clientTokenAccount = await findAssociatedTokenAddress(ctx.signer, tokenProgramId, token.address);
  const clientPrimaryAccount = await findClientPrimaryAccount(ctx, ctx.signer);

  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: clientTokenAccount, role: AccountRole.WRITABLE },
    { address: token.programAddress, role: AccountRole.WRITABLE },
    { address: token.address, role: AccountRole.READONLY },
    { address: ctx.rootAccount, role: exists ? AccountRole.READONLY : AccountRole.WRITABLE },
    { address: await getTokenAccount(ctx, token.address), role: AccountRole.READONLY },
    { address: clientPrimaryAccount, role: AccountRole.WRITABLE },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    { address: tokenProgramId, role: AccountRole.READONLY },
  ];

  if (ctx.privateMode) {
    keys.push({
      address: await getAccountByTag(ctx, AccountType.PRIVATE_CLIENTS),
      role: AccountRole.WRITABLE,
    });
  }

  if (exists) {
    if (args.tokenId == 0) {
      keys.push({
        address: await getAccountByTag(ctx, AccountType.COMMUNITY),
        role: AccountRole.WRITABLE,
      });
      keys.push({ address: ctx.clientCommunityAccount, role: AccountRole.WRITABLE });
    }
    return {
      accounts: keys,
      programAddress: ctx.programId,
      data: depositData(7, 0, allFunds, args.tokenId, amount * tokenDec(ctx.tokens, args.tokenId, ctx.uiNumbers), 0, 0, args.customId),
    };
  } else {
    const slot = Number(await rpcGetSlot()) - 1;
    const lutAddress = await getLookupTableAddress(ctx.signer, slot);
    const clientCommunityAccount = await findClientCommunityAccount(ctx, ctx.signer);
    keys.push({ address: clientCommunityAccount, role: AccountRole.WRITABLE });
    keys.push({ address: lutAddress, role: AccountRole.WRITABLE });
    keys.push({ address: ADDRESS_LOOKUP_TABLE_PROGRAM_ID, role: AccountRole.WRITABLE });
    if (args.tokenId == 0) {
      keys.push({
        address: await getAccountByTag(ctx, AccountType.COMMUNITY),
        role: AccountRole.WRITABLE,
      });
      keys.push({ address: clientCommunityAccount, role: AccountRole.WRITABLE });
    }
    let refId: number;
    if (args.refId != null && args.refId != undefined) {
      refId = args.refId;
      if (args.refWallet == null) {
        throw new Error('Ref Wallet Not Found');
      }
      keys.push({
        address: await findClientPrimaryAccount(ctx, args.refWallet),
        role: AccountRole.WRITABLE,
      });
      keys.push({
        address: await findClientCommunityAccount(ctx, args.refWallet),
        role: AccountRole.WRITABLE,
      });
    } else {
      refId = 0;
    }
    return {
      accounts: keys,
      programAddress: ctx.programId,
      data: depositData(
        7,
        0,
        allFunds,
        args.tokenId,
        amount * tokenDec(ctx.tokens, args.tokenId, ctx.uiNumbers),
        slot,
        refId,
        args.customId,
      ),
    };
  }
}

/**
 * Build withdraw instruction
 */
async function buildWithdrawInstruction(ctx: SpotInstructionContext, args: WithdrawArgs): Promise<Instruction> {
  const token = ctx.tokens.get(args.tokenId);
  if (!token) {
    throw new Error(`Token ${args.tokenId} not found`);
  }
  const tokenProgramId = (token.mask & 0x80000000) != 0 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
  const clientTokenAccount = await findAssociatedTokenAddress(ctx.signer, tokenProgramId, token.address);

  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: clientTokenAccount, role: AccountRole.WRITABLE },
    { address: token.programAddress, role: AccountRole.WRITABLE },
    { address: token.address, role: AccountRole.READONLY },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: await getTokenAccount(ctx, token.address), role: AccountRole.READONLY },
    { address: ctx.clientPrimaryAccount, role: AccountRole.WRITABLE },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    { address: tokenProgramId, role: AccountRole.READONLY },
    { address: ctx.drvsAuthority, role: AccountRole.READONLY },
    { address: ASSOCIATED_TOKEN_PROGRAM_ID, role: AccountRole.WRITABLE },
  ];

  if (args.spot != undefined) {
    for (let i = 0; i < args.spot.length; ++i) {
      const instr = ctx.instruments.get(args.spot[i].instrId);
      if (!instr) {
        throw new Error(`Instrument ${args.spot[i].instrId} not found`);
      }
      if (instr.header.assetTokenId == args.tokenId || instr.header.crncyTokenId == args.tokenId) {
        keys.push({ address: instr.header.mapsAddress, role: AccountRole.READONLY });
        keys.push({
          address: await getInstrAccountByTag(ctx, {
            assetTokenId: instr.header.assetTokenId,
            crncyTokenId: instr.header.crncyTokenId,
            tag: AccountType.SPOT_CLIENT_INFOS,
          }),
          role: AccountRole.READONLY,
        });
      }
    }
  }

  if (args.tokenId == 0) {
    keys.push({
      address: await getAccountByTag(ctx, AccountType.COMMUNITY),
      role: AccountRole.WRITABLE,
    });
    keys.push({ address: ctx.clientCommunityAccount, role: AccountRole.WRITABLE });
  }

  return {
    accounts: keys,
    programAddress: ctx.programId,
    data: withdrawData(8, args.tokenId, args.amount * tokenDec(ctx.tokens, args.tokenId, ctx.uiNumbers), args.customId),
  };
}

export { buildDepositInstruction, buildWithdrawInstruction };
