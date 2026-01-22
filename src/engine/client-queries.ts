import { Address, getBase64Encoder } from '@solana/kit';
import { Buffer } from 'buffer';

import {
  Instrument,
  GetClientSpotOrdersInfoResponse,
  GetClientSpotOrdersArgs,
  GetClientSpotOrdersResponse,
  GetClientPerpOrdersInfoResponse,
  GetClientPerpOrdersArgs,
  GetClientPerpOrdersResponse,
  ClientTokenData,
  ClientLpData,
  ClientSpotData,
  GetClientDataResponse,
  GetClientSpotOrdersInfoArgs,
  GetClientPerpOrdersInfoArgs,
} from '../types';
import { AccountType } from '../types/enums';
import { lpDec } from '../constants';
import { getMultipleSpotOrders, getMultiplePerpOrders, tokenDec } from './utils';
import {
  ClientCommunityAccountHeaderModel,
  ClientCommunityRecordModel,
  ClientPrimaryAccountHeaderModel,
  OrderModel,
  PerpClientInfo2Model,
  PerpClientInfo3Model,
  PerpClientInfo4Model,
  PerpClientInfo5Model,
  PerpClientInfoModel,
  PerpTradeAccountHeaderModel,
  SpotClientInfo2Model,
  SpotClientInfoModel,
  SpotTradeAccountHeaderModel,
  TokenStateModel,
} from '../structure_models';
import { getInstrAccountByTag, AccountHelperContext } from './account-helpers';

/**
 * Context needed for client query functions
 */
export interface ClientQueryContext extends AccountHelperContext {
  instruments: Map<number, Instrument>;
  tokens: Map<number, TokenStateModel>;
  uiNumbers: boolean;
  clientPrimaryAccount: Address;
  clientCommunityAccount: Address;
  originalClientId: number;
}

/**
 * Unpack client accounts
 */
async function getClientData(ctx: ClientQueryContext): Promise<GetClientDataResponse> {
  const infos = await ctx.rpc
    .getMultipleAccounts([ctx.clientPrimaryAccount, ctx.clientCommunityAccount], {
      commitment: ctx.commitment,
      encoding: 'base64',
    })
    .send();
  if (infos.value == null) {
    throw new Error('GetClientData: GetAccountInfo failed');
  }
  const clientPrimaryAccountHeaderModel = ClientPrimaryAccountHeaderModel.fromBuffer(infos.value[0].data);
  let clientCommunityAccountHeaderModel = ClientCommunityAccountHeaderModel.fromBuffer(infos.value[1].data);
  const primaryData = Buffer.from(getBase64Encoder().encode(infos.value[0].data[0]));
  let tokens: Map<number, ClientTokenData> = new Map();
  let lp: Map<number, ClientLpData> = new Map();
  let spot: Map<number, ClientSpotData> = new Map();
  let perp: Map<number, ClientSpotData> = new Map();
  for (let i = 0; i < clientPrimaryAccountHeaderModel.assetsCount; ++i) {
    const offset = ClientPrimaryAccountHeaderModel.LENGTH + i * 16;
    const assetInfo = primaryData.readUint32LE(offset);
    const tag = assetInfo >> 28;
    const id = assetInfo & 0xfffffff;
    if (tag == 1) {
      tokens.set(id, {
        tokenId: id,
        amount: Number(primaryData.readBigInt64LE(offset + 8)) / tokenDec(ctx.tokens, id, ctx.uiNumbers),
      });
    } else if (tag == 2) {
      lp.set(id, { instrId: id, amount: Number(primaryData.readBigInt64LE(offset + 8)) / lpDec });
    } else if (tag == 3) {
      const clientId = primaryData.readUint32LE(offset + 4);
      const slot = primaryData.readUint32LE(offset + 8);
      spot.set(id, { instrId: id, clientId: clientId, slot: slot });
    } else if (tag == 4) {
      const clientId = primaryData.readUint32LE(offset + 4);
      const slot = primaryData.readUint32LE(offset + 8);
      perp.set(id, { instrId: id, clientId: clientId, slot: slot });
    }
  }
  let clientCommunityRecords = new Map();
  for (let i = 0; i < clientCommunityAccountHeaderModel.count; ++i) {
    const offset = ClientCommunityAccountHeaderModel.LENGTH + ClientCommunityRecordModel.LENGTH * i;
    let clientCommunityRecordModel = ClientCommunityRecordModel.fromBuffer(infos.value[1].data, offset);
    const crncyDec = tokenDec(ctx.tokens, clientCommunityRecordModel.crncyTokenId, ctx.uiNumbers);
    clientCommunityRecordModel.dividendsValue /= crncyDec;
    clientCommunityRecordModel.feesPrepayment /= crncyDec;
    clientCommunityRecordModel.refPayments /= crncyDec;
    clientCommunityRecords.set(clientCommunityRecordModel.crncyTokenId, clientCommunityRecordModel);
  }
  const drvsDec = tokenDec(ctx.tokens, 0, ctx.uiNumbers);
  clientCommunityAccountHeaderModel.drvsTokens /= drvsDec;
  clientCommunityAccountHeaderModel.currentVotingTokens /= drvsDec;
  clientCommunityAccountHeaderModel.lastVotingTokens /= drvsDec;
  return {
    clientId: clientPrimaryAccountHeaderModel.id,
    mask: clientPrimaryAccountHeaderModel.mask,
    points: clientPrimaryAccountHeaderModel.points,
    slot: clientPrimaryAccountHeaderModel.slot,
    spotTrades: clientPrimaryAccountHeaderModel.spotTrades,
    lpTrades: clientPrimaryAccountHeaderModel.lpTrades,
    perpTrades: clientPrimaryAccountHeaderModel.perpTrades,
    tokens: tokens,
    lp: lp,
    spot: spot,
    perp: perp,
    refProgram: {
      address: clientPrimaryAccountHeaderModel.refAddress,
      expiration: clientPrimaryAccountHeaderModel.refProgramExpiration,
      clientId: clientPrimaryAccountHeaderModel.refClientId,
      disount: clientPrimaryAccountHeaderModel.refProgramDiscount,
      ratio: clientPrimaryAccountHeaderModel.refProgramRatio,
    },
    community: { header: clientCommunityAccountHeaderModel, data: clientCommunityRecords },
    refLinks: [
      {
        id: clientPrimaryAccountHeaderModel.firstRefLinkId,
        expiration: clientPrimaryAccountHeaderModel.firstRefLinkExpiration,
        discount: clientPrimaryAccountHeaderModel.firstRefLinkDiscount,
        ratio: clientPrimaryAccountHeaderModel.firstRefLinkRatio,
      },
      {
        id: clientPrimaryAccountHeaderModel.secondRefLinkId,
        expiration: clientPrimaryAccountHeaderModel.secondRefLinkExpiration,
        discount: clientPrimaryAccountHeaderModel.secondRefLinkDiscount,
        ratio: clientPrimaryAccountHeaderModel.secondRefLinkRatio,
      },
    ],
  };
}

/**
 * Get general information about open orders in particular instrument (spot)
 */
async function getClientSpotOrdersInfo(
  ctx: ClientQueryContext,
  args: GetClientSpotOrdersInfoArgs,
): Promise<GetClientSpotOrdersInfoResponse> {
  const instr = ctx.instruments.get(args.instrId);
  if (instr == undefined) {
    throw new Error('Invalid Instrument ID');
  }
  const clientInfosAccount = await getInstrAccountByTag(ctx, {
    assetTokenId: instr.header.assetTokenId,
    crncyTokenId: instr.header.crncyTokenId,
    tag: AccountType.SPOT_CLIENT_INFOS,
  });
  const clientInfos2Account = await getInstrAccountByTag(ctx, {
    assetTokenId: instr.header.assetTokenId,
    crncyTokenId: instr.header.crncyTokenId,
    tag: AccountType.SPOT_CLIENT_INFOS2,
  });
  const infos = await ctx.rpc
    .getMultipleAccounts([clientInfosAccount, clientInfos2Account], {
      commitment: ctx.commitment,
      encoding: 'base64',
      dataSlice: { offset: SpotTradeAccountHeaderModel.LENGTH + 32 * args.clientId, length: 32 },
    })
    .send();
  if (infos.value[0] == null || infos.value[1] == null) {
    throw new Error('Orders Info Not Found');
  }
  const data = Buffer.from(getBase64Encoder().encode(infos.value[0].data[0]));
  const data1 = Buffer.from(getBase64Encoder().encode(infos.value[1].data[0]));
  return {
    contextSlot: Number(infos.context.slot),
    bidSlot: data1.readUint32LE(SpotClientInfo2Model.OFFSET_BID_SLOT),
    askSlot: data1.readUint32LE(SpotClientInfo2Model.OFFSET_ASK_SLOT),
    bidsEntry: data.readUint16LE(SpotClientInfoModel.OFFSET_BIDS_ENTRY),
    bidsCount: data.readUint16LE(SpotClientInfoModel.OFFSET_BIDS_ENTRY + 2),
    asksEntry: data.readUint16LE(SpotClientInfoModel.OFFSET_ASKS_ENTRY),
    asksCount: data.readUint16LE(SpotClientInfoModel.OFFSET_ASKS_ENTRY + 2),
    tempAssetTokens:
      Number(data.readBigInt64LE(SpotClientInfoModel.OFFSET_AVAIL_ASSET_TOKENS)) /
      tokenDec(ctx.tokens, instr.header.assetTokenId, ctx.uiNumbers),
    tempCrncyTokens:
      Number(data.readBigInt64LE(SpotClientInfoModel.OFFSET_AVAIL_CRNCY_TOKENS)) /
      tokenDec(ctx.tokens, instr.header.crncyTokenId, ctx.uiNumbers),
    inOrdersAssetTokens:
      Number(data1.readBigInt64LE(SpotClientInfo2Model.OFFSET_IN_ORDERS_ASSET_TOKENS)) /
      tokenDec(ctx.tokens, instr.header.assetTokenId, ctx.uiNumbers),
    inOrdersCrncyTokens:
      Number(data1.readBigInt64LE(SpotClientInfo2Model.OFFSET_IN_ORDERS_CRNCY_TOKENS)) /
      tokenDec(ctx.tokens, instr.header.crncyTokenId, ctx.uiNumbers),
  };
}

/**
 * Get general information about open orders in particular instrument (perp)
 */
async function getClientPerpOrdersInfo(
  ctx: ClientQueryContext,
  args: GetClientPerpOrdersInfoArgs,
): Promise<GetClientPerpOrdersInfoResponse> {
  const instr = ctx.instruments.get(args.instrId);
  if (instr == undefined) {
    throw new Error('Invalid Instrument ID');
  }
  const clientInfosAccount = await getInstrAccountByTag(ctx, {
    assetTokenId: instr.header.assetTokenId,
    crncyTokenId: instr.header.crncyTokenId,
    tag: AccountType.PERP_CLIENT_INFOS,
  });
  const clientInfos2Account = await getInstrAccountByTag(ctx, {
    assetTokenId: instr.header.assetTokenId,
    crncyTokenId: instr.header.crncyTokenId,
    tag: AccountType.PERP_CLIENT_INFOS2,
  });
  const clientInfos3Account = await getInstrAccountByTag(ctx, {
    assetTokenId: instr.header.assetTokenId,
    crncyTokenId: instr.header.crncyTokenId,
    tag: AccountType.PERP_CLIENT_INFOS3,
  });
  const clientInfos4Account = await getInstrAccountByTag(ctx, {
    assetTokenId: instr.header.assetTokenId,
    crncyTokenId: instr.header.crncyTokenId,
    tag: AccountType.PERP_CLIENT_INFOS4,
  });
  const clientInfos5Account = await getInstrAccountByTag(ctx, {
    assetTokenId: instr.header.assetTokenId,
    crncyTokenId: instr.header.crncyTokenId,
    tag: AccountType.PERP_CLIENT_INFOS5,
  });
  const infos = await ctx.rpc
    .getMultipleAccounts(
      [clientInfosAccount, clientInfos2Account, clientInfos3Account, clientInfos4Account, clientInfos5Account],
      {
        commitment: ctx.commitment,
        encoding: 'base64',
        dataSlice: { offset: SpotTradeAccountHeaderModel.LENGTH + 32 * args.clientId, length: 32 },
      },
    )
    .send();
  if (
    infos.value[0] == null ||
    infos.value[1] == null ||
    infos.value[2] == null ||
    infos.value[3] == null ||
    infos.value[4] == null
  ) {
    throw new Error('Orders Info Not Found');
  }
  const clientInfoModel = PerpClientInfoModel.fromBuffer(infos.value[0].data);
  const clientInfo2Model = PerpClientInfo2Model.fromBuffer(infos.value[1].data);
  const clientInfo3Model = PerpClientInfo3Model.fromBuffer(infos.value[2].data);
  const clientInfo4Model = PerpClientInfo4Model.fromBuffer(infos.value[3].data);
  const clientInfo5Model = PerpClientInfo5Model.fromBuffer(infos.value[4].data);
  return {
    contextSlot: Number(infos.context.slot),
    bidSlot: clientInfo2Model.bidSlot,
    askSlot: clientInfo2Model.askSlot,
    bidsEntry: clientInfo3Model.bidsEntry & 0xffff,
    bidsCount: clientInfo3Model.bidsEntry >> 16,
    asksEntry: clientInfo3Model.asksEntry & 0xffff,
    asksCount: clientInfo3Model.asksEntry >> 16,
    perps: clientInfoModel.perps,
    funds: clientInfoModel.funds,
    inOrdersPerps: clientInfoModel.inOrdersPerps,
    inOrdersFunds: clientInfoModel.inOrdersFunds,
    fees: clientInfo3Model.fees,
    rebates: clientInfo3Model.rebates,
    result: clientInfo2Model.result,
    cost: clientInfo2Model.cost,
    mask: clientInfo2Model.mask,
    socLossFunds: clientInfo4Model.socLossFunds,
    fundingFunds: clientInfo5Model.fundingFunds,
    lossCoverage: clientInfo4Model.lossCoverage,
  };
}

/**
 * Get list of open orders (spot) in particular instrument
 */
async function getClientSpotOrders(
  ctx: ClientQueryContext,
  args: GetClientSpotOrdersArgs,
): Promise<GetClientSpotOrdersResponse> {
  const instr = ctx.instruments.get(args.instrId);
  const bidOrdersAccount = await getInstrAccountByTag(ctx, {
    assetTokenId: instr.header.assetTokenId,
    crncyTokenId: instr.header.crncyTokenId,
    tag: AccountType.SPOT_BID_ORDERS,
  });
  const askOrdersAccount = await getInstrAccountByTag(ctx, {
    assetTokenId: instr.header.assetTokenId,
    crncyTokenId: instr.header.crncyTokenId,
    tag: AccountType.SPOT_ASK_ORDERS,
  });
  const assetTokenDec = tokenDec(ctx.tokens, instr.header.assetTokenId, ctx.uiNumbers);
  const crncyTokenDec = tokenDec(ctx.tokens, instr.header.crncyTokenId, ctx.uiNumbers);
  if (args.bidsCount > 1 && args.asksCount > 1) {
    let infos = await ctx.rpc
      .getMultipleAccounts([bidOrdersAccount, askOrdersAccount], {
        commitment: ctx.commitment,
        encoding: 'base64',
      })
      .send();
    let bids = getMultipleSpotOrders(infos.value[0].data, args.bidsEntry, ctx.originalClientId);
    for (let i = 0; i < bids.length; ++i) {
      bids[i].qty /= assetTokenDec;
      bids[i].sum /= crncyTokenDec;
    }
    let asks = getMultipleSpotOrders(infos.value[1].data, args.asksEntry, ctx.originalClientId);
    for (let i = 0; i < asks.length; ++i) {
      asks[i].qty /= assetTokenDec;
      asks[i].sum /= crncyTokenDec;
    }
    return { contextSlot: Number(infos.context.slot), bids: bids, asks: asks };
  }
  let bids: Array<OrderModel> = [];
  let asks: Array<OrderModel> = [];
  let bidContextSlot = 0;
  let askContextSlot = 0;
  if (args.bidsCount > 1) {
    let info = await ctx.rpc
      .getAccountInfo(bidOrdersAccount, { commitment: ctx.commitment, encoding: 'base64' })
      .send();
    bidContextSlot = Number(info.context.slot);
    bids = getMultipleSpotOrders(info.value.data, args.bidsEntry, ctx.originalClientId);
  } else if (args.bidsCount == 1) {
    let info = await ctx.rpc
      .getAccountInfo(bidOrdersAccount, {
        commitment: ctx.commitment,
        encoding: 'base64',
        dataSlice: { offset: args.bidsEntry * 64 + SpotTradeAccountHeaderModel.LENGTH, length: 64 },
      })
      .send();
    const order = OrderModel.fromBuffer(info.value.data);
    if (order.origClientId == ctx.originalClientId) {
      bids = [order];
    }
    bidContextSlot = Number(info.context.slot);
  }
  if (args.asksCount > 1) {
    let info = await ctx.rpc
      .getAccountInfo(askOrdersAccount, { commitment: ctx.commitment, encoding: 'base64' })
      .send();
    askContextSlot = Number(info.context.slot);
    asks = getMultipleSpotOrders(info.value.data, args.bidsEntry, ctx.originalClientId);
  } else if (args.asksCount == 1) {
    let info = await ctx.rpc
      .getAccountInfo(askOrdersAccount, {
        commitment: ctx.commitment,
        encoding: 'base64',
        dataSlice: { offset: args.asksEntry * 64 + SpotTradeAccountHeaderModel.LENGTH, length: 64 },
      })
      .send();
    const order = OrderModel.fromBuffer(info.value.data);
    if (order.origClientId == ctx.originalClientId) {
      asks = [order];
    }
    askContextSlot = Number(info.context.slot);
  }
  for (let i = 0; i < bids.length; ++i) {
    bids[i].qty /= assetTokenDec;
    bids[i].sum /= crncyTokenDec;
  }
  for (let i = 0; i < asks.length; ++i) {
    asks[i].qty /= assetTokenDec;
    asks[i].sum /= crncyTokenDec;
  }
  let contextSlot = 0;
  if (bidContextSlot > 0 || askContextSlot > 0) {
    if (bidContextSlot == 0) {
      contextSlot = askContextSlot;
    } else if (askContextSlot == 0) {
      contextSlot = bidContextSlot;
    } else {
      contextSlot = Math.min(bidContextSlot, askContextSlot);
    }
  }
  return { contextSlot: contextSlot, bids: bids, asks: asks };
}

/**
 * Get list of open orders (perp) in particular instrument
 */
async function getClientPerpOrders(
  ctx: ClientQueryContext,
  args: GetClientPerpOrdersArgs,
): Promise<GetClientPerpOrdersResponse> {
  const instr = ctx.instruments.get(args.instrId);
  const bidOrdersAccount = await getInstrAccountByTag(ctx, {
    assetTokenId: instr.header.assetTokenId,
    crncyTokenId: instr.header.crncyTokenId,
    tag: AccountType.PERP_BID_ORDERS,
  });
  const askOrdersAccount = await getInstrAccountByTag(ctx, {
    assetTokenId: instr.header.assetTokenId,
    crncyTokenId: instr.header.crncyTokenId,
    tag: AccountType.PERP_ASK_ORDERS,
  });
  const assetTokenDec = tokenDec(ctx.tokens, instr.header.assetTokenId, ctx.uiNumbers);
  const crncyTokenDec = tokenDec(ctx.tokens, instr.header.crncyTokenId, ctx.uiNumbers);
  if (args.bidsCount > 1 && args.asksCount > 1) {
    let infos = await ctx.rpc
      .getMultipleAccounts([bidOrdersAccount, askOrdersAccount], {
        commitment: ctx.commitment,
        encoding: 'base64',
      })
      .send();
    let bids = getMultiplePerpOrders(infos.value[0].data, args.bidsEntry, ctx.originalClientId);
    for (let i = 0; i < bids.length; ++i) {
      bids[i].qty /= assetTokenDec;
      bids[i].sum /= crncyTokenDec;
    }
    let asks = getMultiplePerpOrders(infos.value[1].data, args.asksEntry, ctx.originalClientId);
    for (let i = 0; i < asks.length; ++i) {
      asks[i].qty /= assetTokenDec;
      asks[i].sum /= crncyTokenDec;
    }
    return { contextSlot: Number(infos.context.slot), bids: bids, asks: asks };
  }
  let bids: OrderModel[] = [];
  let asks: OrderModel[] = [];
  let bidContextSlot = 0;
  let askContextSlot = 0;
  if (args.bidsCount > 1) {
    let info = await ctx.rpc
      .getAccountInfo(bidOrdersAccount, { commitment: ctx.commitment, encoding: 'base64' })
      .send();
    bidContextSlot = Number(info.context.slot);
    bids = getMultiplePerpOrders(info.value.data, args.bidsEntry, ctx.originalClientId);
  } else if (args.bidsCount == 1) {
    let info = await ctx.rpc
      .getAccountInfo(bidOrdersAccount, {
        commitment: ctx.commitment,
        encoding: 'base64',
        dataSlice: { offset: args.bidsEntry * 64 + PerpTradeAccountHeaderModel.LENGTH, length: 64 },
      })
      .send();
    const order = OrderModel.fromBuffer(info.value.data);
    if (order.origClientId == ctx.originalClientId) {
      bids = [order];
    }
    bidContextSlot = Number(info.context.slot);
  }
  if (args.asksCount > 1) {
    let info = await ctx.rpc
      .getAccountInfo(askOrdersAccount, { commitment: ctx.commitment, encoding: 'base64' })
      .send();
    askContextSlot = Number(info.context.slot);
    asks = getMultiplePerpOrders(info.value.data, args.bidsEntry, ctx.originalClientId);
  } else if (args.asksCount == 1) {
    let info = await ctx.rpc
      .getAccountInfo(askOrdersAccount, {
        commitment: ctx.commitment,
        encoding: 'base64',
        dataSlice: { offset: args.asksEntry * 64 + PerpTradeAccountHeaderModel.LENGTH, length: 64 },
      })
      .send();
    const order = OrderModel.fromBuffer(info.value.data);
    if (order.origClientId == ctx.originalClientId) {
      asks = [order];
    }
    askContextSlot = Number(info.context.slot);
  }
  for (let i = 0; i < bids.length; ++i) {
    bids[i].qty /= assetTokenDec;
    bids[i].sum /= crncyTokenDec;
  }
  for (let i = 0; i < asks.length; ++i) {
    asks[i].qty /= assetTokenDec;
    asks[i].sum /= crncyTokenDec;
  }
  let contextSlot = 0;
  if (bidContextSlot > 0 || askContextSlot > 0) {
    if (bidContextSlot == 0) {
      contextSlot = askContextSlot;
    } else if (askContextSlot == 0) {
      contextSlot = bidContextSlot;
    } else {
      contextSlot = Math.min(bidContextSlot, askContextSlot);
    }
  }
  return { contextSlot: contextSlot, bids: bids, asks: asks };
}

export { getClientData, getClientSpotOrdersInfo, getClientPerpOrdersInfo, getClientSpotOrders, getClientPerpOrders };
