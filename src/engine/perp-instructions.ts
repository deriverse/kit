import {
  Address,
  AccountRole,
  createAddressWithSeed,
  TransactionSigner,
  SolanaRpcResponse,
  AccountInfoBase,
} from '@solana/kit';
import { getCreateAccountWithSeedInstruction } from '@solana-program/system';

import {
  Instrument,
  InstrId,
  PerpDepositArgs,
  PerpBuySeatArgs,
  PerpSellSeatArgs,
  NewPerpOrderArgs,
  PerpQuotesReplaceArgs,
  PerpOrderCancelArgs,
  PerpMassCancelArgs,
  PerpChangeLeverageArgs,
  PerpStatisticsResetArgs,
  NewInstrumentArgs,
  Instruction,
} from '../types';
import { AccountType, InstrMask } from '../types/enums';
import {
  SYSTEM_PROGRAM_ID,
  ADDRESS_LOOKUP_TABLE_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  DF,
} from '../constants';
import { perpSeatReserve, getLookupTableAddress, tokenDec, buildQuotesMask } from './utils';
import { TokenStateModel, RootStateModel, QuoteOrderModel } from '../structure_models';
import {
  upgradeToPerpData,
  perpDepositData,
  buyMarketSeatData,
  sellMarketSeatData,
  newPerpOrderData,
  perpQuotesReplaceData,
  perpOrderCancelData,
  perpMassCancelData,
  perpChangeLeverageData,
  perpStatisticsResetData,
  newInstrumentData,
} from '../instruction_models';
import {
  getAccountByTag,
  getInstrAccountByTag,
  getTokenAccount,
  getTokenId,
  AccountHelperContext,
} from './account-helpers';
import { getPerpContext } from './context-builders';

/**
 * Context needed for perp instruction builders
 */
export interface PerpInstructionContext extends AccountHelperContext {
  instruments: Map<number, Instrument>;
  tokens: Map<number, TokenStateModel>;
  rootStateModel: RootStateModel;
  uiNumbers: boolean;
  signer: Address;
  rootAccount: Address;
  clientPrimaryAccount: Address;
  clientCommunityAccount: Address;
  refClientPrimaryAccount: Address | null;
  refClientCommunityAccount: Address | null;
}

/**
 * Build upgrade to perp instructions
 */
async function buildUpgradeToPerpInstructions(
  ctx: PerpInstructionContext,
  args: InstrId,
  instr: Instrument,
  rpcGetMinBalance: (size: bigint) => Promise<bigint>,
): Promise<Instruction[]> {
  if ((instr.header.mask & InstrMask.READY_TO_PERP_UPGRADE) == 0) {
    throw new Error('Impossible to upgrade');
  }
  if ((instr.header.mask & InstrMask.PERP) != 0) {
    throw new Error('Instr already upgraded');
  }

  const perpMapsAccountSeed =
    ctx.version.toString() +
    '_' +
    AccountType.PERP_MAPS.toString() +
    '_' +
    instr.header.assetTokenId.toString() +
    '_' +
    instr.header.crncyTokenId.toString();
  const perpMapsAccount = await createAddressWithSeed({
    baseAddress: ctx.signer,
    programAddress: ctx.programId,
    seed: perpMapsAccountSeed,
  });
  const perpMapsAccountSize = 168576;
  const perpMapsAccountLamports = await rpcGetMinBalance(BigInt(perpMapsAccountSize));
  const createMapsAccountIx = getCreateAccountWithSeedInstruction({
    payer: ctx.signer as unknown as TransactionSigner,
    baseAccount: ctx.signer as unknown as TransactionSigner,
    base: ctx.signer,
    newAccount: perpMapsAccount,
    seed: perpMapsAccountSeed,
    space: perpMapsAccountSize,
    programAddress: ctx.programId,
    amount: perpMapsAccountLamports,
  });

  const tokenArgs = {
    assetTokenId: instr.header.assetTokenId,
    crncyTokenId: instr.header.crncyTokenId,
  };

  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.WRITABLE },
    {
      address: await getInstrAccountByTag(ctx, { ...tokenArgs, tag: AccountType.INSTR }),
      role: AccountRole.WRITABLE,
    },
    { address: instr.header.lutAddress, role: AccountRole.WRITABLE },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    { address: ADDRESS_LOOKUP_TABLE_PROGRAM_ID, role: AccountRole.READONLY },
    { address: ctx.drvsAuthority, role: AccountRole.READONLY },
    {
      address: await getInstrAccountByTag(ctx, { ...tokenArgs, tag: AccountType.PERP_BIDS_TREE }),
      role: AccountRole.WRITABLE,
    },
    {
      address: await getInstrAccountByTag(ctx, { ...tokenArgs, tag: AccountType.PERP_ASKS_TREE }),
      role: AccountRole.WRITABLE,
    },
    {
      address: await getInstrAccountByTag(ctx, { ...tokenArgs, tag: AccountType.PERP_BID_ORDERS }),
      role: AccountRole.WRITABLE,
    },
    {
      address: await getInstrAccountByTag(ctx, { ...tokenArgs, tag: AccountType.PERP_ASK_ORDERS }),
      role: AccountRole.WRITABLE,
    },
    {
      address: await getInstrAccountByTag(ctx, { ...tokenArgs, tag: AccountType.PERP_LINES }),
      role: AccountRole.WRITABLE,
    },
    { address: perpMapsAccount, role: AccountRole.WRITABLE },
    {
      address: await getInstrAccountByTag(ctx, {
        ...tokenArgs,
        tag: AccountType.PERP_CLIENT_INFOS,
      }),
      role: AccountRole.WRITABLE,
    },
    {
      address: await getInstrAccountByTag(ctx, {
        ...tokenArgs,
        tag: AccountType.PERP_CLIENT_INFOS2,
      }),
      role: AccountRole.WRITABLE,
    },
    {
      address: await getInstrAccountByTag(ctx, {
        ...tokenArgs,
        tag: AccountType.PERP_CLIENT_INFOS3,
      }),
      role: AccountRole.WRITABLE,
    },
    {
      address: await getInstrAccountByTag(ctx, {
        ...tokenArgs,
        tag: AccountType.PERP_CLIENT_INFOS4,
      }),
      role: AccountRole.WRITABLE,
    },
    {
      address: await getInstrAccountByTag(ctx, {
        ...tokenArgs,
        tag: AccountType.PERP_CLIENT_INFOS5,
      }),
      role: AccountRole.WRITABLE,
    },
    {
      address: await getInstrAccountByTag(ctx, {
        ...tokenArgs,
        tag: AccountType.PERP_LONG_PX_TREE,
      }),
      role: AccountRole.WRITABLE,
    },
    {
      address: await getInstrAccountByTag(ctx, {
        ...tokenArgs,
        tag: AccountType.PERP_SHORT_PX_TREE,
      }),
      role: AccountRole.WRITABLE,
    },
    {
      address: await getInstrAccountByTag(ctx, {
        ...tokenArgs,
        tag: AccountType.PERP_REBALANCE_TIME_TREE,
      }),
      role: AccountRole.WRITABLE,
    },
  ];

  const upgradeIx: Instruction = {
    accounts: keys,
    programAddress: ctx.programId,
    data: upgradeToPerpData(10, args.instrId),
  };
  return [createMapsAccountIx, upgradeIx];
}

/**
 * Build perp deposit instruction
 */
async function buildPerpDepositInstruction(
  ctx: PerpInstructionContext,
  args: PerpDepositArgs,
  instr: Instrument,
): Promise<Instruction> {
  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: ctx.clientPrimaryAccount, role: AccountRole.WRITABLE },
    ...(await getPerpContext(ctx, instr.header)),
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
  ];

  return {
    accounts: keys,
    programAddress: ctx.programId,
    data: perpDepositData(
      11,
      args.instrId,
      args.amount * tokenDec(ctx.tokens, instr.header.crncyTokenId, ctx.uiNumbers),
    ),
  };
}

/**
 * Build perp buy seat instruction
 */
async function buildPerpBuySeatInstruction(
  ctx: PerpInstructionContext,
  args: PerpBuySeatArgs,
  instr: Instrument,
): Promise<Instruction> {
  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: ctx.clientPrimaryAccount, role: AccountRole.WRITABLE },
    ...(await getPerpContext(ctx, instr.header)),
    { address: await getAccountByTag(ctx, AccountType.COMMUNITY), role: AccountRole.READONLY },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
  ];

  const slippage = args.slippage ?? 0;
  const slippagePrice =
    (perpSeatReserve(instr.header.perpClientsCount + 1) - perpSeatReserve(instr.header.perpClientsCount)) *
    (1 + slippage);
  const crncyDec = tokenDec(ctx.tokens, instr.header.crncyTokenId, ctx.uiNumbers);

  return {
    accounts: keys,
    programAddress: ctx.programId,
    data: buyMarketSeatData(47, args.instrId, slippagePrice * crncyDec, args.amount * crncyDec),
  };
}

/**
 * Build perp sell seat instruction
 */
async function buildPerpSellSeatInstruction(
  ctx: PerpInstructionContext,
  args: PerpSellSeatArgs,
  instr: Instrument,
): Promise<Instruction> {
  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: ctx.clientPrimaryAccount, role: AccountRole.WRITABLE },
    ...(await getPerpContext(ctx, instr.header)),
    { address: await getAccountByTag(ctx, AccountType.COMMUNITY), role: AccountRole.READONLY },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
  ];

  const slippage = args.slippage ?? 0;
  const slippagePrice =
    (perpSeatReserve(instr.header.perpClientsCount) - perpSeatReserve(instr.header.perpClientsCount - 1)) /
    (1 + slippage);
  const crncyDec = tokenDec(ctx.tokens, instr.header.crncyTokenId, ctx.uiNumbers);

  return {
    accounts: keys,
    programAddress: ctx.programId,
    data: sellMarketSeatData(48, args.instrId, slippagePrice * crncyDec),
  };
}

/**
 * Build new perp order instruction
 */
async function buildNewPerpOrderInstruction(
  ctx: PerpInstructionContext,
  args: NewPerpOrderArgs,
  instr: Instrument,
): Promise<Instruction> {
  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: ctx.clientPrimaryAccount, role: AccountRole.WRITABLE },
    { address: ctx.clientCommunityAccount, role: AccountRole.WRITABLE },
    ...(await getPerpContext(ctx, instr.header)),
    { address: await getAccountByTag(ctx, AccountType.COMMUNITY), role: AccountRole.READONLY },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
  ];

  if (ctx.refClientPrimaryAccount != null) {
    keys.push({ address: ctx.refClientPrimaryAccount, role: AccountRole.WRITABLE });
  }

  if (ctx.refClientCommunityAccount != null) {
    keys.push({ address: ctx.refClientCommunityAccount, role: AccountRole.WRITABLE });
  }

  return {
    accounts: keys,
    programAddress: ctx.programId,
    data: newPerpOrderData(
      19,
      args.ioc ?? 0,
      args.leverage ?? 0,
      args.orderType ?? 0,
      args.side,
      args.instrId,
      args.price * DF,
      args.qty * tokenDec(ctx.tokens, instr.header.assetTokenId, ctx.uiNumbers),
      (args.edgePrice ?? 0) * DF,
    ),
  };
}

/**
 * Build perp quotes replace instruction
 */
async function buildPerpQuotesReplaceInstruction(
  ctx: PerpInstructionContext,
  args: PerpQuotesReplaceArgs,
  instr: Instrument,
): Promise<Instruction> {
  let assetTokenDecFactor = tokenDec(ctx.tokens, instr.header.assetTokenId, ctx.uiNumbers);

  if (args.orders.length > 12) {
    throw new Error('Exceeded orders limit of 12 for perp quotes replace instruction');
  }

  let mask = buildQuotesMask(args.orders);

  let headerBuf = perpQuotesReplaceData(42, args.bump ?? 0, args.orderType ?? 0, mask, args.instrId);

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
    { address: ctx.clientPrimaryAccount, role: AccountRole.WRITABLE },
    { address: ctx.clientCommunityAccount, role: AccountRole.WRITABLE },
    ...(await getPerpContext(ctx, instr.header)),
    { address: await getAccountByTag(ctx, AccountType.COMMUNITY), role: AccountRole.READONLY },
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
 * Build perp order cancel instruction
 */
async function buildPerpOrderCancelInstruction(
  ctx: PerpInstructionContext,
  args: PerpOrderCancelArgs,
  instr: Instrument,
): Promise<Instruction> {
  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: ctx.clientPrimaryAccount, role: AccountRole.WRITABLE },
    ...(await getPerpContext(ctx, instr.header)),
    { address: await getAccountByTag(ctx, AccountType.COMMUNITY), role: AccountRole.READONLY },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
  ];

  return {
    accounts: keys,
    programAddress: ctx.programId,
    data: perpOrderCancelData(30, args.side, args.instrId, args.orderId),
  };
}

/**
 * Build perp mass cancel instruction
 */
async function buildPerpMassCancelInstruction(
  ctx: PerpInstructionContext,
  args: PerpMassCancelArgs,
  instr: Instrument,
): Promise<Instruction> {
  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: ctx.clientPrimaryAccount, role: AccountRole.WRITABLE },
    ...(await getPerpContext(ctx, instr.header)),
    { address: await getAccountByTag(ctx, AccountType.COMMUNITY), role: AccountRole.READONLY },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
  ];

  return {
    accounts: keys,
    programAddress: ctx.programId,
    data: perpMassCancelData(36, args.instrId),
  };
}

/**
 * Build perp change leverage instruction
 */
async function buildPerpChangeLeverageInstruction(
  ctx: PerpInstructionContext,
  args: PerpChangeLeverageArgs,
  instr: Instrument,
): Promise<Instruction> {
  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: ctx.clientPrimaryAccount, role: AccountRole.WRITABLE },
    ...(await getPerpContext(ctx, instr.header)),
    { address: await getAccountByTag(ctx, AccountType.COMMUNITY), role: AccountRole.READONLY },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
  ];

  return {
    accounts: keys,
    programAddress: ctx.programId,
    data: perpChangeLeverageData(37, args.leverage, args.instrId),
  };
}

/**
 * Build perp statistics reset instruction
 */
async function buildPerpStatisticsResetInstruction(
  ctx: PerpInstructionContext,
  args: PerpStatisticsResetArgs,
  instr: Instrument,
): Promise<Instruction> {
  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: ctx.clientPrimaryAccount, role: AccountRole.WRITABLE },
    ...(await getPerpContext(ctx, instr.header)),
    { address: await getAccountByTag(ctx, AccountType.COMMUNITY), role: AccountRole.READONLY },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
  ];

  return {
    accounts: keys,
    programAddress: ctx.programId,
    data: perpStatisticsResetData(46, args.instrId),
  };
}

/**
 * Build new ref link instruction
 */
async function buildNewRefLinkInstruction(ctx: PerpInstructionContext): Promise<Instruction> {
  let buf = Buffer.alloc(1);
  buf.writeUInt8(45, 0);

  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.WRITABLE },
    { address: ctx.clientPrimaryAccount, role: AccountRole.WRITABLE },
  ];

  return { accounts: keys, programAddress: ctx.programId, data: buf };
}

/**
 * Build new instrument instructions
 */
async function buildNewInstrumentInstructions(
  ctx: PerpInstructionContext,
  args: NewInstrumentArgs,
  rpcGetSlot: () => Promise<bigint>,
  rpcGetAccountInfo: (address: Address) => Promise<SolanaRpcResponse<AccountInfoBase | null>>,
  rpcGetMinBalance: (size: bigint) => Promise<bigint>,
): Promise<Instruction[]> {
  if (args.initialPrice <= 0) {
    throw new Error('Invalid initial price');
  }

  const assetInfo = await rpcGetAccountInfo(args.assetMint);
  if (!assetInfo.value) {
    throw new Error('Asset mint not found');
  }

  const tokenProgramId = assetInfo.value.owner == TOKEN_2022_PROGRAM_ID ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
  const crncyTokenId = await getTokenId(ctx, args.crncyMint);
  const id = await getTokenId(ctx, args.assetMint);
  const newAssetToken = id == null;
  const assetTokenId = newAssetToken ? ctx.rootStateModel.tokensCount : id;

  if (!crncyTokenId) {
    throw new Error('Currency mint not found');
  }

  const mapsAccountSeed =
    ctx.version.toString() +
    '_' +
    AccountType.SPOT_MAPS.toString() +
    '_' +
    assetTokenId.toString() +
    '_' +
    crncyTokenId.toString();
  const mapsAccount = await createAddressWithSeed({
    baseAddress: ctx.signer,
    programAddress: ctx.programId,
    seed: mapsAccountSeed,
  });
  const mapsAccountSize = 42184;
  const mapsAccountLamports = await rpcGetMinBalance(BigInt(mapsAccountSize));
  const createMapsAccountIx = getCreateAccountWithSeedInstruction({
    payer: ctx.signer as unknown as TransactionSigner,
    baseAccount: ctx.signer as unknown as TransactionSigner,
    base: ctx.signer,
    newAccount: mapsAccount,
    seed: mapsAccountSeed,
    space: mapsAccountSize,
    programAddress: ctx.programId,
    amount: mapsAccountLamports,
  });

  const slot = Number(await rpcGetSlot()) - 1;
  const lutAddress = await getLookupTableAddress(ctx.drvsAuthority, slot);

  const tokenArgs = { assetTokenId: assetTokenId, crncyTokenId: crncyTokenId };

  let keys = [
    { address: ctx.signer, role: AccountRole.READONLY_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.WRITABLE },
    {
      address: await getTokenAccount(ctx, args.assetMint),
      role: newAssetToken ? AccountRole.WRITABLE : AccountRole.READONLY,
    },
    { address: await getTokenAccount(ctx, args.crncyMint), role: AccountRole.READONLY },
    {
      address: newAssetToken ? args.newProgramAccountAddress : ctx.tokens.get(assetTokenId)!.programAddress,
      role: newAssetToken ? AccountRole.WRITABLE_SIGNER : AccountRole.READONLY,
    },
    { address: args.assetMint, role: AccountRole.READONLY },
    { address: lutAddress, role: AccountRole.WRITABLE },
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    { address: tokenProgramId, role: AccountRole.READONLY },
    { address: ADDRESS_LOOKUP_TABLE_PROGRAM_ID, role: AccountRole.READONLY },
    { address: ctx.drvsAuthority, role: AccountRole.READONLY },
    {
      address: await getInstrAccountByTag(ctx, { ...tokenArgs, tag: AccountType.INSTR }),
      role: AccountRole.WRITABLE,
    },
    {
      address: await getInstrAccountByTag(ctx, { ...tokenArgs, tag: AccountType.SPOT_BIDS_TREE }),
      role: AccountRole.WRITABLE,
    },
    {
      address: await getInstrAccountByTag(ctx, { ...tokenArgs, tag: AccountType.SPOT_ASKS_TREE }),
      role: AccountRole.WRITABLE,
    },
    {
      address: await getInstrAccountByTag(ctx, { ...tokenArgs, tag: AccountType.SPOT_BID_ORDERS }),
      role: AccountRole.WRITABLE,
    },
    {
      address: await getInstrAccountByTag(ctx, { ...tokenArgs, tag: AccountType.SPOT_ASK_ORDERS }),
      role: AccountRole.WRITABLE,
    },
    {
      address: await getInstrAccountByTag(ctx, { ...tokenArgs, tag: AccountType.SPOT_LINES }),
      role: AccountRole.WRITABLE,
    },
    { address: mapsAccount, role: AccountRole.WRITABLE },
    {
      address: await getInstrAccountByTag(ctx, {
        ...tokenArgs,
        tag: AccountType.SPOT_CLIENT_INFOS,
      }),
      role: AccountRole.WRITABLE,
    },
    {
      address: await getInstrAccountByTag(ctx, {
        ...tokenArgs,
        tag: AccountType.SPOT_CLIENT_INFOS2,
      }),
      role: AccountRole.WRITABLE,
    },
    {
      address: await getInstrAccountByTag(ctx, { ...tokenArgs, tag: AccountType.SPOT_1M_CANDLES }),
      role: AccountRole.WRITABLE,
    },
    {
      address: await getInstrAccountByTag(ctx, { ...tokenArgs, tag: AccountType.SPOT_15M_CANDLES }),
      role: AccountRole.WRITABLE,
    },
    {
      address: await getInstrAccountByTag(ctx, { ...tokenArgs, tag: AccountType.SPOT_DAY_CANDLES }),
      role: AccountRole.WRITABLE,
    },
  ];

  const newInstrIx = {
    accounts: keys,
    programAddress: ctx.programId,
    data: newInstrumentData(9, args.mask, crncyTokenId, slot, args.initialPrice * DF, args.minQty, args.fixedFeeRate),
  } as Instruction;
  return [createMapsAccountIx, newInstrIx];
}

export {
  buildUpgradeToPerpInstructions,
  buildPerpDepositInstruction,
  buildPerpBuySeatInstruction,
  buildPerpSellSeatInstruction,
  buildNewPerpOrderInstruction,
  buildPerpQuotesReplaceInstruction,
  buildPerpOrderCancelInstruction,
  buildPerpMassCancelInstruction,
  buildPerpChangeLeverageInstruction,
  buildPerpStatisticsResetInstruction,
  buildNewRefLinkInstruction,
  buildNewInstrumentInstructions,
};
