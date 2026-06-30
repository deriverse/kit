import { Address, AccountRole } from '@solana/kit';

import {
  AccountMeta,
  Instrument,
  SpotLpArgs,
  NewSpotOrderArgs,
  SpotQuotesReplaceArgs,
  SpotOrderCancelArgs,
  SpotMassCancelArgs,
  Instruction,
} from '../types';
import { AccountType } from '../types/enums';
import {
  SYSTEM_PROGRAM_ID,
  DF,
  lpDec,
} from '../constants';
import { tokenDec, buildQuotesMask } from './utils';
import { TokenStateModel, QuoteOrderModel } from '../structure_models';
import {
  spotLpData,
  newSpotOrderData,
  spotQuotesReplaceData,
  spotOrderCancelData,
  spotMassCancelData,
} from '../instruction_models';
import {
  getAccountByTag,
  getInstrAccountByTag,
  findClientPrimaryAccount,
  findClientCommunityAccount,
  requireClientPrimaryAccount,
  requireClientCommunityAccount,
  AccountHelperContext,
} from './account-helpers';
import { getSpotContext, getSpotOneSidedContext } from './context-builders';

/**
 * Context needed for spot instruction builders
 */
export interface SpotInstructionContext extends AccountHelperContext {
  instruments: Map<number, Instrument>;
  tokens: Map<number, TokenStateModel>;
  uiNumbers: boolean;
  signer: Address;
  rootAccount: Address;
  communityAccount?: Address;
  clientPrimaryAccount: Address | null;
  clientCommunityAccount: Address | null;
  refClientPrimaryAccount: Address | null;
  refClientCommunityAccount: Address | null;
  privateMode: boolean;
}

function requireCommunityAccount(ctx: { communityAccount?: Address }): Address {
  if (ctx.communityAccount === undefined) throw new Error('Community account not found');
  return ctx.communityAccount;
}

export interface CachedSpotAccountMetas {
  spotContext: AccountMeta[];
  spotBidContext: AccountMeta[];
  spotAskContext: AccountMeta[];
}

/**
 * Build spot LP instruction
 */
async function buildSpotLpInstruction(
  ctx: SpotInstructionContext,
  args: SpotLpArgs,
  instr: Instrument,
): Promise<Instruction> {
  const clientPrimaryAccount = requireClientPrimaryAccount(ctx);

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
    { address: clientPrimaryAccount, role: AccountRole.WRITABLE },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
  ];

  if (instr.header.assetTokenId == 0) {
    keys.push({
      address: await getAccountByTag(ctx, AccountType.COMMUNITY),
      role: AccountRole.WRITABLE,
    });
    keys.push({ address: requireClientCommunityAccount(ctx), role: AccountRole.WRITABLE });
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
      minPrice * DF,
      maxPrice * DF,
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
    Math.round(args.price * DF),
    Math.round(args.qty * tokenDec(ctx.tokens, instr.header.assetTokenId, ctx.uiNumbers)),
    (args.edgePrice ?? 0) * DF,
  );

  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: await findClientPrimaryAccount(ctx, ctx.signer), role: AccountRole.WRITABLE },
    { address: await findClientCommunityAccount(ctx, ctx.signer), role: AccountRole.WRITABLE },
    ...(await getSpotContext(ctx, instr.header)),
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
 * Build unchecked new spot order instruction from cached accounts
 */
function buildNewSpotOrderInstructionUnchecked(
  ctx: SpotInstructionContext,
  args: NewSpotOrderArgs,
  instr: Instrument,
  cachedAccounts: CachedSpotAccountMetas,
): Instruction {
  let buf = newSpotOrderData(
    12,
    args.ioc ?? 0,
    args.orderType ?? 0,
    args.side,
    args.instrId,
    Math.round(args.price * DF),
    Math.round(args.qty * tokenDec(ctx.tokens, instr.header.assetTokenId, ctx.uiNumbers)),
    (args.edgePrice ?? 0) * DF,
  );

  const clientPrimaryAccount = requireClientPrimaryAccount(ctx);
  const clientCommunityAccount = requireClientCommunityAccount(ctx);
  const communityAccount = requireCommunityAccount(ctx);

  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: clientPrimaryAccount, role: AccountRole.WRITABLE },
    { address: clientCommunityAccount, role: AccountRole.WRITABLE },
    ...cachedAccounts.spotContext,
    {
      address: communityAccount,
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

  if (args.orders.length > 12) {
    throw new Error('Exceeded orders limit of 12 for spot quotes replace instruction');
  }

  let mask = buildQuotesMask(args.orders);

  let headerBuf = spotQuotesReplaceData(34, args.bump ?? 0, args.orderType ?? 0, args.bailOnOrderNotFound ? 1 : 0, mask, args.instrId);

  let ordersBuf = Buffer.alloc(args.orders.length * QuoteOrderModel.LENGTH);
  for (let i = 0; i < args.orders.length; i++) {
    const offset = i * QuoteOrderModel.LENGTH;
    ordersBuf.writeBigInt64LE(BigInt(Math.round(args.orders[i].newPrice * DF)), offset + QuoteOrderModel.OFFSET_NEW_PRICE);
    ordersBuf.writeBigInt64LE(BigInt(Math.round(args.orders[i].newQty * assetTokenDecFactor)), offset + QuoteOrderModel.OFFSET_NEW_QTY);
    ordersBuf.writeBigInt64LE(BigInt(Math.floor(args.orders[i].oldId)), offset + QuoteOrderModel.OFFSET_OLD_ID);
  }

  let buf = Buffer.concat([headerBuf, ordersBuf]);

  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: await findClientPrimaryAccount(ctx, ctx.signer), role: AccountRole.WRITABLE },
    { address: await findClientCommunityAccount(ctx, ctx.signer), role: AccountRole.WRITABLE },
    ...(await getSpotContext(ctx, instr.header)),
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
 * Build unchecked spot quotes replace instruction from cached accounts
 */
function buildSpotQuotesReplaceInstructionUnchecked(
  ctx: SpotInstructionContext,
  args: SpotQuotesReplaceArgs,
  instr: Instrument,
  cachedAccounts: CachedSpotAccountMetas,
): Instruction {
  let assetTokenDecFactor = tokenDec(ctx.tokens, instr.header.assetTokenId, ctx.uiNumbers);

  if (args.orders.length > 12) {
    throw new Error('Exceeded orders limit of 12 for spot quotes replace instruction');
  }

  let mask = buildQuotesMask(args.orders);

  let headerBuf = spotQuotesReplaceData(34, args.bump ?? 0, args.orderType ?? 0, args.bailOnOrderNotFound ? 1 : 0, mask, args.instrId);

  let ordersBuf = Buffer.alloc(args.orders.length * QuoteOrderModel.LENGTH);
  for (let i = 0; i < args.orders.length; i++) {
    const offset = i * QuoteOrderModel.LENGTH;
    ordersBuf.writeBigInt64LE(BigInt(Math.round(args.orders[i].newPrice * DF)), offset + QuoteOrderModel.OFFSET_NEW_PRICE);
    ordersBuf.writeBigInt64LE(BigInt(Math.round(args.orders[i].newQty * assetTokenDecFactor)), offset + QuoteOrderModel.OFFSET_NEW_QTY);
    ordersBuf.writeBigInt64LE(BigInt(Math.floor(args.orders[i].oldId)), offset + QuoteOrderModel.OFFSET_OLD_ID);
  }

  let buf = Buffer.concat([headerBuf, ordersBuf]);
  const clientPrimaryAccount = requireClientPrimaryAccount(ctx);
  const clientCommunityAccount = requireClientCommunityAccount(ctx);
  const communityAccount = requireCommunityAccount(ctx);

  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: clientPrimaryAccount, role: AccountRole.WRITABLE },
    { address: clientCommunityAccount, role: AccountRole.WRITABLE },
    ...cachedAccounts.spotContext,
    {
      address: communityAccount,
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
  const clientPrimaryAccount = requireClientPrimaryAccount(ctx);
  const drvs = instr.header.assetTokenId == 0;

  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: clientPrimaryAccount, role: AccountRole.WRITABLE },
    ...(await getSpotOneSidedContext(ctx, instr.header, args.side)),
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
  ];

  if (drvs) {
    keys.push({
      address: await getAccountByTag(ctx, AccountType.COMMUNITY),
      role: AccountRole.WRITABLE,
    });
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
 * Build unchecked spot order cancel instruction from cached accounts
 */
function buildSpotOrderCancelInstructionUnchecked(
  ctx: SpotInstructionContext,
  args: SpotOrderCancelArgs,
  instr: Instrument,
  cachedAccounts: CachedSpotAccountMetas,
): Instruction {
  const clientPrimaryAccount = requireClientPrimaryAccount(ctx);
  const drvs = instr.header.assetTokenId == 0;
  const oneSidedContext = args.side === 0 ? cachedAccounts.spotBidContext : cachedAccounts.spotAskContext;
  const communityAccount = drvs ? requireCommunityAccount(ctx) : undefined;

  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: clientPrimaryAccount, role: AccountRole.WRITABLE },
    ...oneSidedContext,
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
  ];

  if (drvs) {
    keys.push({
      address: communityAccount!,
      role: AccountRole.WRITABLE,
    });
    keys.push({
      address: requireClientCommunityAccount(ctx),
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
  const clientPrimaryAccount = requireClientPrimaryAccount(ctx);
  const drvs = instr.header.assetTokenId == 0;

  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: clientPrimaryAccount, role: AccountRole.WRITABLE },
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
 * Build unchecked spot mass cancel instruction from cached accounts
 */
function buildSpotMassCancelInstructionUnchecked(
  ctx: SpotInstructionContext,
  args: SpotMassCancelArgs,
  instr: Instrument,
  cachedAccounts: CachedSpotAccountMetas,
): Instruction {
  const clientPrimaryAccount = requireClientPrimaryAccount(ctx);
  const drvs = instr.header.assetTokenId == 0;
  const communityAccount = requireCommunityAccount(ctx);

  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: clientPrimaryAccount, role: AccountRole.WRITABLE },
    ...cachedAccounts.spotContext,
    {
      address: communityAccount,
      role: drvs ? AccountRole.WRITABLE : AccountRole.READONLY,
    },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
  ];

  if (drvs) {
    keys.push({
      address: requireClientCommunityAccount(ctx),
      role: AccountRole.WRITABLE,
    });
  }

  return {
    accounts: keys,
    programAddress: ctx.programId,
    data: spotMassCancelData(15, args.instrId),
  };
}

export {
  buildSpotLpInstruction,
  buildNewSpotOrderInstruction,
  buildNewSpotOrderInstructionUnchecked,
  buildSpotQuotesReplaceInstruction,
  buildSpotQuotesReplaceInstructionUnchecked,
  buildSpotOrderCancelInstruction,
  buildSpotOrderCancelInstructionUnchecked,
  buildSpotMassCancelInstruction,
  buildSpotMassCancelInstructionUnchecked,
};
