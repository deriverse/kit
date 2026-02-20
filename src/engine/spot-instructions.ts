import { Address, AccountRole } from '@solana/kit';

import {
  Instrument,
  DepositArgs,
  WithdrawArgs,
  SpotLpArgs,
  NewSpotOrderArgs,
  SpotQuotesReplaceArgs,
  SpotOrderCancelArgs,
  SpotMassCancelArgs,
  SwapArgs,
  Instruction,
} from '../types';
import { AccountType } from '../types/enums';
import {
  SYSTEM_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  ADDRESS_LOOKUP_TABLE_PROGRAM_ID,
  lpDec,
} from '../constants';
import { findAssociatedTokenAddress, getLookupTableAddress, tokenDec } from './utils';
import { TokenStateModel } from '../structure_models';
import {
  depositData,
  withdrawData,
  spotLpData,
  newSpotOrderData,
  spotQuotesReplaceData,
  spotOrderCancelData,
  spotMassCancelData,
  swapData,
} from '../instruction_models';
import {
  getAccountByTag,
  getInstrAccountByTag,
  getTokenAccount,
  getTokenId,
  getInstrId,
  findClientPrimaryAccount,
  findClientCommunityAccount,
  AccountHelperContext,
} from './account-helpers';
import { getSpotContext, getSpotCandles } from './context-builders';

/**
 * Context needed for spot instruction builders
 */
export interface SpotInstructionContext extends AccountHelperContext {
  instruments: Map<number, Instrument>;
  tokens: Map<number, TokenStateModel>;
  uiNumbers: boolean;
  signer: Address;
  rootAccount: Address;
  clientPrimaryAccount: Address;
  clientCommunityAccount: Address;
  refClientPrimaryAccount: Address | null;
  refClientCommunityAccount: Address | null;
  privateMode: boolean;
}

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
      data: depositData(7, 0, allFunds, args.tokenId, amount * tokenDec(ctx.tokens, args.tokenId, ctx.uiNumbers), 0, 0),
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
    data: withdrawData(8, args.tokenId, args.amount * tokenDec(ctx.tokens, args.tokenId, ctx.uiNumbers)),
  };
}

/**
 * Build spot LP instruction
 */
async function buildSpotLpInstruction(
  ctx: SpotInstructionContext,
  args: SpotLpArgs,
  instr: Instrument,
): Promise<Instruction> {
  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    {
      address: await getInstrAccountByTag(ctx, {
        assetTokenId: instr.header.assetTokenId,
        crncyTokenId: instr.header.crncyTokenId,
        tag: AccountType.INSTR,
      }),
      role: AccountRole.WRITABLE,
    },
    { address: ctx.clientPrimaryAccount, role: AccountRole.WRITABLE },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
  ];

  if (instr.header.assetTokenId == 0) {
    keys.push({
      address: await getAccountByTag(ctx, AccountType.COMMUNITY),
      role: AccountRole.WRITABLE,
    });
    keys.push({ address: ctx.clientCommunityAccount, role: AccountRole.WRITABLE });
  }

  const minPrice = args.minPrice ?? 0;
  const maxPrice = args.maxPrice ?? 0;

  return {
    accounts: keys,
    programAddress: ctx.programId,
    data: spotLpData(
      14,
      args.side,
      args.instrId,
      Math.round(args.amount * lpDec),
      minPrice * 1000000000,
      maxPrice * 1000000000,
    ),
  };
}

/**
 * Build new spot order instruction
 */
async function buildNewSpotOrderInstruction(
  ctx: SpotInstructionContext,
  args: NewSpotOrderArgs,
  instr: Instrument,
): Promise<Instruction> {
  let buf = newSpotOrderData(
    12,
    args.ioc ?? 0,
    args.orderType ?? 0,
    args.side,
    args.instrId,
    Math.round(args.price * 1000000000),
    Math.round(args.qty * tokenDec(ctx.tokens, instr.header.assetTokenId, ctx.uiNumbers)),
    (args.edgePrice ?? 0) * 1000000000,
  );

  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: await findClientPrimaryAccount(ctx, ctx.signer), role: AccountRole.WRITABLE },
    { address: await findClientCommunityAccount(ctx, ctx.signer), role: AccountRole.WRITABLE },
    ...(await getSpotContext(ctx, instr.header)),
    ...(await getSpotCandles(ctx, instr.header)),
    {
      address: await getAccountByTag(ctx, AccountType.COMMUNITY),
      role: instr.header.assetTokenId == 0 ? AccountRole.WRITABLE : AccountRole.READONLY,
    },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
  ];

  if (ctx.refClientPrimaryAccount != null) {
    keys.push({ address: ctx.refClientPrimaryAccount, role: AccountRole.WRITABLE });
  }

  if (ctx.refClientCommunityAccount != null) {
    keys.push({ address: ctx.refClientCommunityAccount, role: AccountRole.WRITABLE });
  }

  return { accounts: keys, programAddress: ctx.programId, data: buf };
}

/**
 * Build spot quotes replace instruction
 */
async function buildSpotQuotesReplaceInstruction(
  ctx: SpotInstructionContext,
  args: SpotQuotesReplaceArgs,
  instr: Instrument,
): Promise<Instruction> {
  let assetTokenDecFactor = tokenDec(ctx.tokens, instr.header.assetTokenId, ctx.uiNumbers);
  let buf = spotQuotesReplaceData(
    34,
    args.instrId,
    Math.round(args.newBidPrice * 1000000000),
    Math.round(args.newBidQty * assetTokenDecFactor),
    args.bidOrderIdToCancel,
    Math.round(args.newAskPrice * 1000000000),
    Math.round(args.newAskQty * assetTokenDecFactor),
    args.askOrderIdToCancel,
  );

  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: await findClientPrimaryAccount(ctx, ctx.signer), role: AccountRole.WRITABLE },
    { address: await findClientCommunityAccount(ctx, ctx.signer), role: AccountRole.WRITABLE },
    ...(await getSpotContext(ctx, instr.header)),
    ...(await getSpotCandles(ctx, instr.header)),
    {
      address: await getAccountByTag(ctx, AccountType.COMMUNITY),
      role: instr.header.assetTokenId == 0 ? AccountRole.WRITABLE : AccountRole.READONLY,
    },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
  ];

  if (ctx.refClientPrimaryAccount != null) {
    keys.push({ address: ctx.refClientPrimaryAccount, role: AccountRole.WRITABLE });
  }

  if (ctx.refClientCommunityAccount != null) {
    keys.push({ address: ctx.refClientCommunityAccount, role: AccountRole.WRITABLE });
  }

  return { accounts: keys, programAddress: ctx.programId, data: buf };
}

/**
 * Build spot order cancel instruction
 */
async function buildSpotOrderCancelInstruction(
  ctx: SpotInstructionContext,
  args: SpotOrderCancelArgs,
  instr: Instrument,
): Promise<Instruction> {
  const drvs = instr.header.assetTokenId == 0;

  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: ctx.clientPrimaryAccount, role: AccountRole.WRITABLE },
    ...(await getSpotContext(ctx, instr.header)),
    {
      address: await getAccountByTag(ctx, AccountType.COMMUNITY),
      role: drvs ? AccountRole.WRITABLE : AccountRole.READONLY,
    },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
  ];

  if (drvs) {
    keys.push({
      address: await findClientCommunityAccount(ctx, ctx.signer),
      role: AccountRole.WRITABLE,
    });
  }

  return {
    accounts: keys,
    programAddress: ctx.programId,
    data: spotOrderCancelData(13, args.side, args.instrId, args.orderId),
  };
}

/**
 * Build spot mass cancel instruction
 */
async function buildSpotMassCancelInstruction(
  ctx: SpotInstructionContext,
  args: SpotMassCancelArgs,
  instr: Instrument,
): Promise<Instruction> {
  const drvs = instr.header.assetTokenId == 0;

  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: ctx.clientPrimaryAccount, role: AccountRole.WRITABLE },
    ...(await getSpotContext(ctx, instr.header)),
    {
      address: await getAccountByTag(ctx, AccountType.COMMUNITY),
      role: drvs ? AccountRole.WRITABLE : AccountRole.READONLY,
    },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
  ];

  if (drvs) {
    keys.push({
      address: await findClientCommunityAccount(ctx, ctx.signer),
      role: AccountRole.WRITABLE,
    });
  }

  return {
    accounts: keys,
    programAddress: ctx.programId,
    data: spotMassCancelData(15, args.instrId),
  };
}

/**
 * Build swap instruction
 */
async function buildSwapInstruction(
  ctx: SpotInstructionContext,
  args: SwapArgs,
  instr: Instrument,
): Promise<Instruction> {
  const assetTokenId = await getTokenId(ctx, args.assetMint);
  const crncyTokenId = await getTokenId(ctx, args.crncyMint);
  if (assetTokenId == null) {
    throw new Error(`Asset token not found for mint ${args.assetMint}`);
  }
  if (crncyTokenId == null) {
    throw new Error(`Currency token not found for mint ${args.crncyMint}`);
  }
  const assetTokenAccount = ctx.tokens.get(assetTokenId);
  const crncyTokenAccount = ctx.tokens.get(crncyTokenId);
  if (!assetTokenAccount || !crncyTokenAccount) {
    throw new Error('Token account not found');
  }
  const assetTokenProgramId = (assetTokenAccount.mask & 0x80000000) == 0 ? TOKEN_PROGRAM_ID : TOKEN_2022_PROGRAM_ID;
  const crncyTokenProgramId = (crncyTokenAccount.mask & 0x80000000) == 0 ? TOKEN_PROGRAM_ID : TOKEN_2022_PROGRAM_ID;
  let instrId = await getInstrId(ctx, { assetTokenId: assetTokenId, crncyTokenId: crncyTokenId });
  if (instrId === null) {
    throw new Error('No instruction ID');
  }

  const clientAssetTokenAccount = await findAssociatedTokenAddress(ctx.signer, assetTokenProgramId, args.assetMint);
  const clientCrncyTokenAccount = await findAssociatedTokenAddress(ctx.signer, crncyTokenProgramId, args.crncyMint);

  let buf = swapData(
    26,
    args.crncyInput ? 1 : 0,
    instrId,
    Math.round(args.limitPrice * 1000000000),
    Math.round(
      args.amount *
        (args.crncyInput
          ? tokenDec(ctx.tokens, instr.header.crncyTokenId, ctx.uiNumbers)
          : tokenDec(ctx.tokens, instr.header.assetTokenId, ctx.uiNumbers)),
    ),
    args.refFeeRate,
    args.minAmountOut,
  );

  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    ...(await getSpotContext(ctx, instr.header)),
    ...(await getSpotCandles(ctx, instr.header)),
    { address: await getAccountByTag(ctx, AccountType.COMMUNITY), role: AccountRole.READONLY },
    { address: assetTokenAccount.programAddress, role: AccountRole.WRITABLE },
    { address: crncyTokenAccount.programAddress, role: AccountRole.WRITABLE },
    { address: args.assetMint, role: AccountRole.READONLY },
    { address: args.crncyMint, role: AccountRole.READONLY },
    { address: await getTokenAccount(ctx, args.assetMint), role: AccountRole.READONLY },
    { address: await getTokenAccount(ctx, args.crncyMint), role: AccountRole.READONLY },
    { address: clientAssetTokenAccount, role: AccountRole.WRITABLE },
    { address: clientCrncyTokenAccount, role: AccountRole.WRITABLE },
    { address: ctx.drvsAuthority, role: AccountRole.READONLY },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    { address: assetTokenProgramId, role: AccountRole.READONLY },
    { address: crncyTokenProgramId, role: AccountRole.READONLY },
    { address: ASSOCIATED_TOKEN_PROGRAM_ID, role: AccountRole.READONLY },
  ];

  if (args.feeTakerWallet && args.refFeeRate > 0) {
    const feeTakerTokenAccount = await findAssociatedTokenAddress(args.feeTakerWallet, crncyTokenProgramId, args.crncyMint);
    keys.push({ address: feeTakerTokenAccount, role: AccountRole.WRITABLE });
    keys.push({ address: args.feeTakerWallet, role: AccountRole.WRITABLE });
  }

  return { accounts: keys, programAddress: ctx.programId, data: buf };
}

export {
  buildDepositInstruction,
  buildWithdrawInstruction,
  buildSpotLpInstruction,
  buildNewSpotOrderInstruction,
  buildSpotQuotesReplaceInstruction,
  buildSpotOrderCancelInstruction,
  buildSpotMassCancelInstruction,
  buildSwapInstruction,
};
