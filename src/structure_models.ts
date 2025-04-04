import { Address, Base64EncodedDataResponse } from '@solana/kit';
import { AutoData } from './auto_data';

export enum OrderType {
  limit = 0,
  market = 1,
  marginCall = 2,
  forcedClose = 3,
}

export enum AccountType {
  clientCommunity = 35,
  clientDrv = 32,
  clientPrimary = 31,
  community = 34,
  pdf = 33,
  futuresAskOrders = 29,
  futuresAsksTree = 27,
  futuresBidOrders = 28,
  futuresBidsTree = 26,
  futuresClientAccounts = 23,
  futuresClientInfos = 24,
  futuresClientInfos2 = 25,
  futuresLines = 30,
  futuresMaps = 22,
  holder = 1,
  root = 2,
  instr = 7,
  instrTrace = 8,
  spot15MCandles = 20,
  spot1MCandles = 19,
  spotAskOrders = 17,
  spotAsksTree = 15,
  spotBidOrders = 16,
  spotBidsTree = 14,
  spotClientAccounts = 11,
  spotClientInfos = 12,
  spotClientInfos2 = 13,
  spotDayCandles = 21,
  spotLines = 18,
  spotMaps = 10,
  token = 4,
  perpAskOrders = 36,
  perpAsksTree = 37,
  perpBidOrders = 38,
  perpBidsTree = 39,
  perpClientAccounts = 40,
  perpClientInfos = 41,
  perpClientInfos2 = 42,
  perpClientInfos3 = 43,
  perpClientInfos4 = 44,
  perpClientInfos5 = 45,
  perpLines = 46,
  perpMaps = 47,
  perpLongPxTree = 48,
  perpShortPxTree = 49,
  perpRebalanceTimeTree = 50,
  perpPriorityTree = 51,
}

export class ClientCommunityRecordModel {
  static readonly LENGTH = 2 * 4 + 5 * 8; // 48 bytes

  static readonly OFFSET_DIVIDENDS_RATE = 0;
  static readonly OFFSET_DIVIDENDS_VALUE = 8;
  static readonly OFFSET_FEES_PREPAYMENT = 16;
  static readonly OFFSET_FEES_RATIO = 24;
  static readonly OFFSET_REF_PAYMENTS = 32;
  static readonly OFFSET_LAST_FEES_PREPAYMENT_TIME = 40;
  static readonly OFFSET_CRNCY_TOKEN_ID = 44;

  dividendsRate: number;
  dividendsValue: number;
  feesPrepayment: number;
  feesRatio: number;
  refPayments: number;
  lastFeesPrepaymentTime: number;
  crncyTokenId: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): ClientCommunityRecordModel {
    const result = new ClientCommunityRecordModel();
    let autoData = new AutoData(data, offset);
    result.dividendsRate = autoData.readF64();
    result.dividendsValue = autoData.readI64();
    result.feesPrepayment = autoData.readI64();
    result.feesRatio = autoData.readF64();
    result.refPayments = autoData.readI64();
    result.lastFeesPrepaymentTime = autoData.readU32();
    result.crncyTokenId = autoData.readU32();
    return result;
  }
}

export class ClientCommunityAccountHeaderModel {
  static readonly LENGTH = 10 * 4 + 3 * 8; // 64 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_VERSION = 4;
  static readonly OFFSET_ID = 8;
  static readonly OFFSET_LAST_VOTING_TIME = 12;
  static readonly OFFSET_LAST_VOTING_COUNTER = 16;
  static readonly OFFSET_CURRENT_VOTING_COUNTER = 20;
  static readonly OFFSET_CURRENT_VOTING_TOKENS = 24;
  static readonly OFFSET_LAST_VOTING_TOKENS = 32;
  static readonly OFFSET_LAST_CHOICE = 40;
  static readonly OFFSET_SLOT = 44;
  static readonly OFFSET_DRVS_TOKENS = 48;
  static readonly OFFSET_COUNT = 56;
  static readonly OFFSET_RESERVED = 60;

  tag: number;
  version: number;
  id: number;
  lastVotingTime: number;
  lastVotingCounter: number;
  currentVotingCounter: number;
  currentVotingTokens: number;
  lastVotingTokens: number;
  lastChoice: number;
  slot: number;
  drvsTokens: number;
  count: number;
  reserved: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): ClientCommunityAccountHeaderModel {
    const result = new ClientCommunityAccountHeaderModel();
    let autoData = new AutoData(data, offset);
    result.tag = autoData.readU32();
    result.version = autoData.readU32();
    result.id = autoData.readU32();
    result.lastVotingTime = autoData.readU32();
    result.lastVotingCounter = autoData.readU32();
    result.currentVotingCounter = autoData.readU32();
    result.currentVotingTokens = autoData.readI64();
    result.lastVotingTokens = autoData.readI64();
    result.lastChoice = autoData.readU32();
    result.slot = autoData.readU32();
    result.drvsTokens = autoData.readI64();
    result.count = autoData.readU32();
    result.reserved = autoData.readU32();
    return result;
  }
}

export class CommunityAccountHeaderModel {
  static readonly LENGTH = 14 * 4 + 10 * 8; // 136 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_VERSION = 4;
  static readonly OFFSET_DRVS_TOKENS = 8;
  static readonly OFFSET_MIN_AMOUNT = 16;
  static readonly OFFSET_VOTING_SUPPLY = 24;
  static readonly OFFSET_PREV_VOTING_SUPPLY = 32;
  static readonly OFFSET_VOTING_DECR = 40;
  static readonly OFFSET_PREV_VOTING_DECR = 48;
  static readonly OFFSET_VOTING_UNCHANGE = 56;
  static readonly OFFSET_PREV_VOTING_UNCHANGE = 64;
  static readonly OFFSET_VOTING_INCR = 72;
  static readonly OFFSET_PREV_VOTING_INCR = 80;
  static readonly OFFSET_VOTING_COUNTER = 88;
  static readonly OFFSET_VOTING_START_SLOT = 92;
  static readonly OFFSET_VOTING_END_TIME = 96;
  static readonly OFFSET_SPOT_FEE_RATE = 100;
  static readonly OFFSET_PERP_FEE_RATE = 104;
  static readonly OFFSET_FUTURES_FEE_RATE = 108;
  static readonly OFFSET_OPTIONS_FEE_RATE = 112;
  static readonly OFFSET_SPOT_POOL_RATIO = 116;
  static readonly OFFSET_OPTIONS_POOL_RATIO = 120;
  static readonly OFFSET_MARGIN_CALL_PENALTY_RATE = 124;
  static readonly OFFSET_FEES_PREPAYMENT_FOR_MAX_DISCOUNT = 128;
  static readonly OFFSET_COUNT = 132;

  tag: number;
  version: number;
  drvsTokens: number;
  minAmount: number;
  votingSupply: number;
  prevVotingSupply: number;
  votingDecr: number;
  prevVotingDecr: number;
  votingUnchange: number;
  prevVotingUnchange: number;
  votingIncr: number;
  prevVotingIncr: number;
  votingCounter: number;
  votingStartSlot: number;
  votingEndTime: number;
  spotFeeRate: number;
  perpFeeRate: number;
  futuresFeeRate: number;
  optionsFeeRate: number;
  spotPoolRatio: number;
  optionsPoolRatio: number;
  marginCallPenaltyRate: number;
  feesPrepaymentForMaxDiscount: number;
  count: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): CommunityAccountHeaderModel {
    const result = new CommunityAccountHeaderModel();
    let autoData = new AutoData(data, offset);
    result.tag = autoData.readU32();
    result.version = autoData.readU32();
    result.drvsTokens = autoData.readI64();
    result.minAmount = autoData.readI64();
    result.votingSupply = autoData.readI64();
    result.prevVotingSupply = autoData.readI64();
    result.votingDecr = autoData.readI64();
    result.prevVotingDecr = autoData.readI64();
    result.votingUnchange = autoData.readI64();
    result.prevVotingUnchange = autoData.readI64();
    result.votingIncr = autoData.readI64();
    result.prevVotingIncr = autoData.readI64();
    result.votingCounter = autoData.readU32();
    result.votingStartSlot = autoData.readU32();
    result.votingEndTime = autoData.readU32();
    result.spotFeeRate = autoData.readU32();
    result.perpFeeRate = autoData.readU32();
    result.futuresFeeRate = autoData.readU32();
    result.optionsFeeRate = autoData.readU32();
    result.spotPoolRatio = autoData.readU32();
    result.optionsPoolRatio = autoData.readU32();
    result.marginCallPenaltyRate = autoData.readU32();
    result.feesPrepaymentForMaxDiscount = autoData.readU32();
    result.count = autoData.readU32();
    return result;
  }
}

export class SpotTradeAccountHeaderModel {
  static readonly LENGTH = 6 * 4; // 24 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_VERSION = 4;
  static readonly OFFSET_ID = 8;
  static readonly OFFSET_SLOT = 12;
  static readonly OFFSET_ASSET_TOKEN_ID = 16;
  static readonly OFFSET_CRNCY_TOKEN_ID = 20;

  tag: number;
  version: number;
  id: number;
  slot: number;
  assetTokenId: number;
  crncyTokenId: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): SpotTradeAccountHeaderModel {
    const result = new SpotTradeAccountHeaderModel();
    let autoData = new AutoData(data, offset);
    result.tag = autoData.readU32();
    result.version = autoData.readU32();
    result.id = autoData.readU32();
    result.slot = autoData.readU32();
    result.assetTokenId = autoData.readU32();
    result.crncyTokenId = autoData.readU32();
    return result;
  }
}

export class PerpTradeAccountHeaderModel {
  static readonly LENGTH = 6 * 4; // 24 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_VERSION = 4;
  static readonly OFFSET_ID = 8;
  static readonly OFFSET_SLOT = 12;
  static readonly OFFSET_ASSET_TOKEN_ID = 16;
  static readonly OFFSET_CRNCY_TOKEN_ID = 20;

  tag: number;
  version: number;
  id: number;
  slot: number;
  assetTokenId: number;
  crncyTokenId: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): PerpTradeAccountHeaderModel {
    const result = new PerpTradeAccountHeaderModel();
    let autoData = new AutoData(data, offset);
    result.tag = autoData.readU32();
    result.version = autoData.readU32();
    result.id = autoData.readU32();
    result.slot = autoData.readU32();
    result.assetTokenId = autoData.readU32();
    result.crncyTokenId = autoData.readU32();
    return result;
  }
}

export class HolderAccountHeaderModel {
  static readonly LENGTH = 2 * 4; // 8 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_OPERATORS_COUNT = 4;

  tag: number;
  operatorsCount: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): HolderAccountHeaderModel {
    const result = new HolderAccountHeaderModel();
    let autoData = new AutoData(data, offset);
    result.tag = autoData.readU32();
    result.operatorsCount = autoData.readU32();
    return result;
  }
}

export class PdfAccountHeaderModel {
  static readonly LENGTH = 2 * 4; // 8 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_VERSION = 4;

  tag: number;
  version: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): PdfAccountHeaderModel {
    const result = new PdfAccountHeaderModel();
    let autoData = new AutoData(data, offset);
    result.tag = autoData.readU32();
    result.version = autoData.readU32();
    return result;
  }
}

export class OperatorModel {
  static readonly LENGTH = 2 * 4 + 2 * 32; // 72 bytes

  static readonly OFFSET_OPERATOR_ADDRESS = 0;
  static readonly OFFSET_ROOT_ADDRESS = 32;
  static readonly OFFSET_VERSION = 64;
  static readonly OFFSET_RESERVED = 68;

  operatorAddress: Address<any>;
  rootAddress: Address<any>;
  version: number;
  reserved: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): OperatorModel {
    const result = new OperatorModel();
    let autoData = new AutoData(data, offset);
    result.operatorAddress = autoData.readAddress();
    result.rootAddress = autoData.readAddress();
    result.version = autoData.readU32();
    result.reserved = autoData.readU32();
    return result;
  }
}

export class LineQuotesModel {
  static readonly LENGTH = 2 * 8; // 16 bytes

  static readonly OFFSET_PX = 0;
  static readonly OFFSET_QTY = 8;

  px: number;
  qty: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): LineQuotesModel {
    const result = new LineQuotesModel();
    let autoData = new AutoData(data, offset);
    result.px = autoData.readI64();
    result.qty = autoData.readI64();
    return result;
  }
}

export class TraceAccountHeaderModel {
  static readonly LENGTH = 4 * 4; // 16 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_VERSION = 4;
  static readonly OFFSET_ID = 8;
  static readonly OFFSET_COUNT = 12;

  tag: number;
  version: number;
  id: number;
  count: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): TraceAccountHeaderModel {
    const result = new TraceAccountHeaderModel();
    let autoData = new AutoData(data, offset);
    result.tag = autoData.readU32();
    result.version = autoData.readU32();
    result.id = autoData.readU32();
    result.count = autoData.readU32();
    return result;
  }
}

export class CandleModel {
  static readonly LENGTH = 2 * 4 + 6 * 8; // 56 bytes

  static readonly OFFSET_OPEN = 0;
  static readonly OFFSET_CLOSE = 8;
  static readonly OFFSET_MAX = 16;
  static readonly OFFSET_MIN = 24;
  static readonly OFFSET_ASSET_TOKENS = 32;
  static readonly OFFSET_CRNCY_TOKENS = 40;
  static readonly OFFSET_TIME = 48;
  static readonly OFFSET_COUNTER = 52;

  open: number;
  close: number;
  max: number;
  min: number;
  assetTokens: number;
  crncyTokens: number;
  time: number;
  counter: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): CandleModel {
    const result = new CandleModel();
    let autoData = new AutoData(data, offset);
    result.open = autoData.readI64();
    result.close = autoData.readI64();
    result.max = autoData.readI64();
    result.min = autoData.readI64();
    result.assetTokens = autoData.readI64();
    result.crncyTokens = autoData.readI64();
    result.time = autoData.readU32();
    result.counter = autoData.readU32();
    return result;
  }
}

export class CandlesAccountHeaderModel {
  static readonly LENGTH = 6 * 4; // 24 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_VERSION = 4;
  static readonly OFFSET_ID = 8;
  static readonly OFFSET_SLOT = 12;
  static readonly OFFSET_COUNT = 16;
  static readonly OFFSET_LAST = 20;

  tag: number;
  version: number;
  id: number;
  slot: number;
  count: number;
  last: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): CandlesAccountHeaderModel {
    const result = new CandlesAccountHeaderModel();
    let autoData = new AutoData(data, offset);
    result.tag = autoData.readU32();
    result.version = autoData.readU32();
    result.id = autoData.readU32();
    result.slot = autoData.readU32();
    result.count = autoData.readU32();
    result.last = autoData.readU32();
    return result;
  }
}

export class InstrAccountHeaderModel {
  static readonly LENGTH = 68 * 4 + 61 * 8 + 4 * 32; // 888 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_VERSION = 4;
  static readonly OFFSET_ID = 8;
  static readonly OFFSET_ASSET_TOKEN_ID = 12;
  static readonly OFFSET_CRNCY_TOKEN_ID = 16;
  static readonly OFFSET_MASK = 20;
  static readonly OFFSET_MAPS_ADDRESS = 24;
  static readonly OFFSET_PERP_MAPS_ADDRESS = 56;
  static readonly OFFSET_LUT_ADDRESS = 88;
  static readonly OFFSET_FEED_ID = 120;
  static readonly OFFSET_DRV_COUNT = 152;
  static readonly OFFSET_ASSET_TOKEN_DECS_COUNT = 156;
  static readonly OFFSET_CRNCY_TOKEN_DECS_COUNT = 160;
  static readonly OFFSET_SLOT = 164;
  static readonly OFFSET_LAST_TIME = 168;
  static readonly OFFSET_DISTRIB_TIME = 172;
  static readonly OFFSET_BASE_CRNCY_INDEX = 176;
  static readonly OFFSET_INSTANCE_COUNTER = 180;
  static readonly OFFSET_VARIANCE_COUNTER = 184;
  static readonly OFFSET_BIDS_TREE_NODES_COUNT = 188;
  static readonly OFFSET_BIDS_TREE_LINES_ENTRY = 192;
  static readonly OFFSET_BIDS_TREE_ORDERS_ENTRY = 196;
  static readonly OFFSET_ASKS_TREE_NODES_COUNT = 200;
  static readonly OFFSET_ASKS_TREE_LINES_ENTRY = 204;
  static readonly OFFSET_ASKS_TREE_ORDERS_ENTRY = 208;
  static readonly OFFSET_BID_LINES_BEGIN = 212;
  static readonly OFFSET_BID_LINES_END = 216;
  static readonly OFFSET_BID_LINES_COUNT = 220;
  static readonly OFFSET_ASK_LINES_BEGIN = 224;
  static readonly OFFSET_ASK_LINES_END = 228;
  static readonly OFFSET_ASK_LINES_COUNT = 232;
  static readonly OFFSET_BID_ORDERS_COUNT = 236;
  static readonly OFFSET_ASK_ORDERS_COUNT = 240;
  static readonly OFFSET_FIXING_TIME = 244;
  static readonly OFFSET_FIXING_CRNCY_TOKENS = 248;
  static readonly OFFSET_FIXING_ASSET_TOKENS = 256;
  static readonly OFFSET_COUNTER = 264;
  static readonly OFFSET_ASSET_TOKENS = 272;
  static readonly OFFSET_CRNCY_TOKENS = 280;
  static readonly OFFSET_POOL_FEES = 288;
  static readonly OFFSET_PS = 296;
  static readonly OFFSET_PROTOCOL_FEES = 304;
  static readonly OFFSET_HITS_COUNTER = 312;
  static readonly OFFSET_LAST_ASSET_TOKENS = 320;
  static readonly OFFSET_LAST_CRNCY_TOKENS = 328;
  static readonly OFFSET_PERP_UNDERLYING_PX = 336;
  static readonly OFFSET_LAST_PX = 344;
  static readonly OFFSET_BEST_BID = 352;
  static readonly OFFSET_BEST_ASK = 360;
  static readonly OFFSET_FIXING_PX = 368;
  static readonly OFFSET_LAST_HOUR_PX = 376;
  static readonly OFFSET_VARIANCE = 384;
  static readonly OFFSET_AVG_SPREAD = 392;
  static readonly OFFSET_LAST_SPREAD = 400;
  static readonly OFFSET_LAST_SPREAD_TIME = 408;
  static readonly OFFSET_TOTAL_SPREAD_PERIOD = 412;
  static readonly OFFSET_LAST_CLOSE = 416;
  static readonly OFFSET_DAY_ASSET_TOKENS = 424;
  static readonly OFFSET_DAY_CRNCY_TOKENS = 432;
  static readonly OFFSET_DAY_LOW = 440;
  static readonly OFFSET_DAY_HIGH = 448;
  static readonly OFFSET_PREV_DAY_ASSET_TOKENS = 456;
  static readonly OFFSET_PREV_DAY_CRNCY_TOKENS = 464;
  static readonly OFFSET_ALLTIME_ASSET_TOKENS = 472;
  static readonly OFFSET_ALLTIME_CRNCY_TOKENS = 480;
  static readonly OFFSET_DAY_TRADES = 488;
  static readonly OFFSET_PREV_DAY_TRADES = 492;
  static readonly OFFSET_LP_DAY_TRADES = 496;
  static readonly OFFSET_LP_PREV_DAY_TRADES = 500;
  static readonly OFFSET_ALLTIME_TRADES = 504;
  static readonly OFFSET_DEC_FACTOR = 512;
  static readonly OFFSET_OPTIONS_POOL_TOKEN_ID = 520;
  static readonly OFFSET_OPTIONS_POOL_CLIENT_ID = 524;
  static readonly OFFSET_OPTIONS_POOL_SUPPLY = 528;
  static readonly OFFSET_OPTIONS_POOL_EXPOSURE = 536;
  static readonly OFFSET_OPTIONS_POOL_EST_PAYOFF = 544;
  static readonly OFFSET_OPTIONS_POOL_FINAL_PAYOFF = 552;
  static readonly OFFSET_OPTIONS_POOL_FUNDS = 560;
  static readonly OFFSET_OPTIONS_POOL_TOKEN_PX = 568;
  static readonly OFFSET_PERP_CLIENTS_COUNT = 576;
  static readonly OFFSET_PERP_SLOT = 580;
  static readonly OFFSET_PERP_TIME = 584;
  static readonly OFFSET_PERP_FUNDING_RATE_SLOT = 588;
  static readonly OFFSET_PERP_FUNDING_RATE_TIME = 592;
  static readonly OFFSET_PERP_LONG_PX_TREE_NODES_COUNT = 596;
  static readonly OFFSET_PERP_LONG_PX_TREE_ENTRY = 600;
  static readonly OFFSET_PERP_SHORT_PX_TREE_NODES_COUNT = 604;
  static readonly OFFSET_PERP_SHORT_PX_TREE_ENTRY = 608;
  static readonly OFFSET_PERP_REBALANCE_TIME_TREE_NODES_COUNT = 612;
  static readonly OFFSET_PERP_REBALANCE_TIME_TREE_ENTRY = 616;
  static readonly OFFSET_PERP_PRIORITY_TREE_NODES_COUNT = 620;
  static readonly OFFSET_PERP_PRIORITY_TREE_ENTRY = 624;
  static readonly OFFSET_PERP_BIDS_TREE_NODES_COUNT = 628;
  static readonly OFFSET_PERP_BIDS_TREE_LINES_ENTRY = 632;
  static readonly OFFSET_PERP_BIDS_TREE_ORDERS_ENTRY = 636;
  static readonly OFFSET_PERP_ASKS_TREE_NODES_COUNT = 640;
  static readonly OFFSET_PERP_ASKS_TREE_LINES_ENTRY = 644;
  static readonly OFFSET_PERP_ASKS_TREE_ORDERS_ENTRY = 648;
  static readonly OFFSET_PERP_BID_LINES_BEGIN = 652;
  static readonly OFFSET_PERP_BID_LINES_END = 656;
  static readonly OFFSET_PERP_BID_LINES_COUNT = 660;
  static readonly OFFSET_PERP_ASK_LINES_BEGIN = 664;
  static readonly OFFSET_PERP_ASK_LINES_END = 668;
  static readonly OFFSET_PERP_ASK_LINES_COUNT = 672;
  static readonly OFFSET_PERP_BID_ORDERS_COUNT = 676;
  static readonly OFFSET_PERP_ASK_ORDERS_COUNT = 680;
  static readonly OFFSET_PERP_DAY_TRADES = 684;
  static readonly OFFSET_PERP_PREV_DAY_TRADES = 688;
  static readonly OFFSET_RESERVED = 692;
  static readonly OFFSET_PERP_ALLTIME_TRADES = 696;
  static readonly OFFSET_PERP_SPOT_PRICE_FOR_WITHDROWAL = 704;
  static readonly OFFSET_PERP_SOC_LOSS_LONG_RATE = 712;
  static readonly OFFSET_PERP_SOC_LOSS_SHORT_RATE = 720;
  static readonly OFFSET_PERP_OPEN_INT = 728;
  static readonly OFFSET_RESERVED2 = 736;
  static readonly OFFSET_PERP_FUNDING_RATE = 744;
  static readonly OFFSET_PERP_FUNDING_FUNDS = 752;
  static readonly OFFSET_PERP_SOC_LOSS_FUNDS = 760;
  static readonly OFFSET_PERP_INSURANCE_FUND = 768;
  static readonly OFFSET_PERP_LAST_CLOSE = 776;
  static readonly OFFSET_PERP_LAST_ASSET_TOKENS = 784;
  static readonly OFFSET_PERP_LAST_CRNCY_TOKENS = 792;
  static readonly OFFSET_PERP_LAST_PX = 800;
  static readonly OFFSET_PERP_BEST_BID = 808;
  static readonly OFFSET_PERP_BEST_ASK = 816;
  static readonly OFFSET_PERP_DAY_ASSET_TOKENS = 824;
  static readonly OFFSET_PERP_DAY_CRNCY_TOKENS = 832;
  static readonly OFFSET_PERP_DAY_LOW = 840;
  static readonly OFFSET_PERP_DAY_HIGH = 848;
  static readonly OFFSET_PERP_PREV_DAY_ASSET_TOKENS = 856;
  static readonly OFFSET_PERP_PREV_DAY_CRNCY_TOKENS = 864;
  static readonly OFFSET_PERP_ALLTIME_ASSET_TOKENS = 872;
  static readonly OFFSET_PERP_ALLTIME_CRNCY_TOKENS = 880;

  tag: number;
  version: number;
  id: number;
  assetTokenId: number;
  crncyTokenId: number;
  mask: number;
  mapsAddress: Address<any>;
  perpMapsAddress: Address<any>;
  lutAddress: Address<any>;
  feedId: Address<any>;
  drvCount: number;
  assetTokenDecsCount: number;
  crncyTokenDecsCount: number;
  slot: number;
  lastTime: number;
  distribTime: number;
  baseCrncyIndex: number;
  instanceCounter: number;
  varianceCounter: number;
  bidsTreeNodesCount: number;
  bidsTreeLinesEntry: number;
  bidsTreeOrdersEntry: number;
  asksTreeNodesCount: number;
  asksTreeLinesEntry: number;
  asksTreeOrdersEntry: number;
  bidLinesBegin: number;
  bidLinesEnd: number;
  bidLinesCount: number;
  askLinesBegin: number;
  askLinesEnd: number;
  askLinesCount: number;
  bidOrdersCount: number;
  askOrdersCount: number;
  fixingTime: number;
  fixingCrncyTokens: number;
  fixingAssetTokens: number;
  counter: number;
  assetTokens: number;
  crncyTokens: number;
  poolFees: number;
  ps: number;
  protocolFees: number;
  hitsCounter: number;
  lastAssetTokens: number;
  lastCrncyTokens: number;
  perpUnderlyingPx: number;
  lastPx: number;
  bestBid: number;
  bestAsk: number;
  fixingPx: number;
  lastHourPx: number;
  variance: number;
  avgSpread: number;
  lastSpread: number;
  lastSpreadTime: number;
  totalSpreadPeriod: number;
  lastClose: number;
  dayAssetTokens: number;
  dayCrncyTokens: number;
  dayLow: number;
  dayHigh: number;
  prevDayAssetTokens: number;
  prevDayCrncyTokens: number;
  alltimeAssetTokens: number;
  alltimeCrncyTokens: number;
  dayTrades: number;
  prevDayTrades: number;
  lpDayTrades: number;
  lpPrevDayTrades: number;
  alltimeTrades: number;
  decFactor: number;
  optionsPoolTokenId: number;
  optionsPoolClientId: number;
  optionsPoolSupply: number;
  optionsPoolExposure: number;
  optionsPoolEstPayoff: number;
  optionsPoolFinalPayoff: number;
  optionsPoolFunds: number;
  optionsPoolTokenPx: number;
  perpClientsCount: number;
  perpSlot: number;
  perpTime: number;
  perpFundingRateSlot: number;
  perpFundingRateTime: number;
  perpLongPxTreeNodesCount: number;
  perpLongPxTreeEntry: number;
  perpShortPxTreeNodesCount: number;
  perpShortPxTreeEntry: number;
  perpRebalanceTimeTreeNodesCount: number;
  perpRebalanceTimeTreeEntry: number;
  perpPriorityTreeNodesCount: number;
  perpPriorityTreeEntry: number;
  perpBidsTreeNodesCount: number;
  perpBidsTreeLinesEntry: number;
  perpBidsTreeOrdersEntry: number;
  perpAsksTreeNodesCount: number;
  perpAsksTreeLinesEntry: number;
  perpAsksTreeOrdersEntry: number;
  perpBidLinesBegin: number;
  perpBidLinesEnd: number;
  perpBidLinesCount: number;
  perpAskLinesBegin: number;
  perpAskLinesEnd: number;
  perpAskLinesCount: number;
  perpBidOrdersCount: number;
  perpAskOrdersCount: number;
  perpDayTrades: number;
  perpPrevDayTrades: number;
  reserved: number;
  perpAlltimeTrades: number;
  perpSpotPriceForWithdrowal: number;
  perpSocLossLongRate: number;
  perpSocLossShortRate: number;
  perpOpenInt: number;
  reserved2: number;
  perpFundingRate: number;
  perpFundingFunds: number;
  perpSocLossFunds: number;
  perpInsuranceFund: number;
  perpLastClose: number;
  perpLastAssetTokens: number;
  perpLastCrncyTokens: number;
  perpLastPx: number;
  perpBestBid: number;
  perpBestAsk: number;
  perpDayAssetTokens: number;
  perpDayCrncyTokens: number;
  perpDayLow: number;
  perpDayHigh: number;
  perpPrevDayAssetTokens: number;
  perpPrevDayCrncyTokens: number;
  perpAlltimeAssetTokens: number;
  perpAlltimeCrncyTokens: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): InstrAccountHeaderModel {
    const result = new InstrAccountHeaderModel();
    let autoData = new AutoData(data, offset);
    result.tag = autoData.readU32();
    result.version = autoData.readU32();
    result.id = autoData.readU32();
    result.assetTokenId = autoData.readU32();
    result.crncyTokenId = autoData.readU32();
    result.mask = autoData.readU32();
    result.mapsAddress = autoData.readAddress();
    result.perpMapsAddress = autoData.readAddress();
    result.lutAddress = autoData.readAddress();
    result.feedId = autoData.readAddress();
    result.drvCount = autoData.readU32();
    result.assetTokenDecsCount = autoData.readU32();
    result.crncyTokenDecsCount = autoData.readU32();
    result.slot = autoData.readU32();
    result.lastTime = autoData.readU32();
    result.distribTime = autoData.readU32();
    result.baseCrncyIndex = autoData.readU32();
    result.instanceCounter = autoData.readU32();
    result.varianceCounter = autoData.readU32();
    result.bidsTreeNodesCount = autoData.readU32();
    result.bidsTreeLinesEntry = autoData.readU32();
    result.bidsTreeOrdersEntry = autoData.readU32();
    result.asksTreeNodesCount = autoData.readU32();
    result.asksTreeLinesEntry = autoData.readU32();
    result.asksTreeOrdersEntry = autoData.readU32();
    result.bidLinesBegin = autoData.readU32();
    result.bidLinesEnd = autoData.readU32();
    result.bidLinesCount = autoData.readU32();
    result.askLinesBegin = autoData.readU32();
    result.askLinesEnd = autoData.readU32();
    result.askLinesCount = autoData.readU32();
    result.bidOrdersCount = autoData.readU32();
    result.askOrdersCount = autoData.readU32();
    result.fixingTime = autoData.readU32();
    result.fixingCrncyTokens = autoData.readI64();
    result.fixingAssetTokens = autoData.readI64();
    result.counter = autoData.readI64();
    result.assetTokens = autoData.readI64();
    result.crncyTokens = autoData.readI64();
    result.poolFees = autoData.readI64();
    result.ps = autoData.readI64();
    result.protocolFees = autoData.readI64();
    result.hitsCounter = autoData.readI64();
    result.lastAssetTokens = autoData.readI64();
    result.lastCrncyTokens = autoData.readI64();
    result.perpUnderlyingPx = autoData.readI64();
    result.lastPx = autoData.readI64();
    result.bestBid = autoData.readI64();
    result.bestAsk = autoData.readI64();
    result.fixingPx = autoData.readI64();
    result.lastHourPx = autoData.readI64();
    result.variance = autoData.readF64();
    result.avgSpread = autoData.readF64();
    result.lastSpread = autoData.readF64();
    result.lastSpreadTime = autoData.readU32();
    result.totalSpreadPeriod = autoData.readU32();
    result.lastClose = autoData.readI64();
    result.dayAssetTokens = autoData.readI64();
    result.dayCrncyTokens = autoData.readI64();
    result.dayLow = autoData.readI64();
    result.dayHigh = autoData.readI64();
    result.prevDayAssetTokens = autoData.readI64();
    result.prevDayCrncyTokens = autoData.readI64();
    result.alltimeAssetTokens = autoData.readF64();
    result.alltimeCrncyTokens = autoData.readF64();
    result.dayTrades = autoData.readU32();
    result.prevDayTrades = autoData.readU32();
    result.lpDayTrades = autoData.readU32();
    result.lpPrevDayTrades = autoData.readU32();
    result.alltimeTrades = autoData.readI64();
    result.decFactor = autoData.readI64();
    result.optionsPoolTokenId = autoData.readU32();
    result.optionsPoolClientId = autoData.readU32();
    result.optionsPoolSupply = autoData.readI64();
    result.optionsPoolExposure = autoData.readI64();
    result.optionsPoolEstPayoff = autoData.readI64();
    result.optionsPoolFinalPayoff = autoData.readI64();
    result.optionsPoolFunds = autoData.readI64();
    result.optionsPoolTokenPx = autoData.readI64();
    result.perpClientsCount = autoData.readU32();
    result.perpSlot = autoData.readU32();
    result.perpTime = autoData.readU32();
    result.perpFundingRateSlot = autoData.readU32();
    result.perpFundingRateTime = autoData.readU32();
    result.perpLongPxTreeNodesCount = autoData.readU32();
    result.perpLongPxTreeEntry = autoData.readU32();
    result.perpShortPxTreeNodesCount = autoData.readU32();
    result.perpShortPxTreeEntry = autoData.readU32();
    result.perpRebalanceTimeTreeNodesCount = autoData.readU32();
    result.perpRebalanceTimeTreeEntry = autoData.readU32();
    result.perpPriorityTreeNodesCount = autoData.readU32();
    result.perpPriorityTreeEntry = autoData.readU32();
    result.perpBidsTreeNodesCount = autoData.readU32();
    result.perpBidsTreeLinesEntry = autoData.readU32();
    result.perpBidsTreeOrdersEntry = autoData.readU32();
    result.perpAsksTreeNodesCount = autoData.readU32();
    result.perpAsksTreeLinesEntry = autoData.readU32();
    result.perpAsksTreeOrdersEntry = autoData.readU32();
    result.perpBidLinesBegin = autoData.readU32();
    result.perpBidLinesEnd = autoData.readU32();
    result.perpBidLinesCount = autoData.readU32();
    result.perpAskLinesBegin = autoData.readU32();
    result.perpAskLinesEnd = autoData.readU32();
    result.perpAskLinesCount = autoData.readU32();
    result.perpBidOrdersCount = autoData.readU32();
    result.perpAskOrdersCount = autoData.readU32();
    result.perpDayTrades = autoData.readU32();
    result.perpPrevDayTrades = autoData.readU32();
    result.reserved = autoData.readU32();
    result.perpAlltimeTrades = autoData.readI64();
    result.perpSpotPriceForWithdrowal = autoData.readI64();
    result.perpSocLossLongRate = autoData.readF64();
    result.perpSocLossShortRate = autoData.readF64();
    result.perpOpenInt = autoData.readI64();
    result.reserved2 = autoData.readI64();
    result.perpFundingRate = autoData.readF64();
    result.perpFundingFunds = autoData.readI64();
    result.perpSocLossFunds = autoData.readI64();
    result.perpInsuranceFund = autoData.readI64();
    result.perpLastClose = autoData.readI64();
    result.perpLastAssetTokens = autoData.readI64();
    result.perpLastCrncyTokens = autoData.readI64();
    result.perpLastPx = autoData.readI64();
    result.perpBestBid = autoData.readI64();
    result.perpBestAsk = autoData.readI64();
    result.perpDayAssetTokens = autoData.readI64();
    result.perpDayCrncyTokens = autoData.readI64();
    result.perpDayLow = autoData.readI64();
    result.perpDayHigh = autoData.readI64();
    result.perpPrevDayAssetTokens = autoData.readI64();
    result.perpPrevDayCrncyTokens = autoData.readI64();
    result.perpAlltimeAssetTokens = autoData.readF64();
    result.perpAlltimeCrncyTokens = autoData.readF64();
    return result;
  }
}

export class RootStateModel {
  static readonly LENGTH = 8 * 4 + 2 * 8 + 6 * 32; // 240 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_VERSION = 4;
  static readonly OFFSET_OPERATOR_ADDRESS = 8;
  static readonly OFFSET_HOLDER_ADDRESS = 40;
  static readonly OFFSET_COMMUNITY_ADDRESS = 72;
  static readonly OFFSET_PDF_ADDRESS = 104;
  static readonly OFFSET_DRVS_MINT_ADDRESS = 136;
  static readonly OFFSET_LUT_ADDRESS = 168;
  static readonly OFFSET_REF_PROGRAM_DURATION = 200;
  static readonly OFFSET_REF_LINK_DURATION = 204;
  static readonly OFFSET_REF_DISCOUNT = 208;
  static readonly OFFSET_REF_RATIO = 216;
  static readonly OFFSET_CLIENTS_COUNT = 224;
  static readonly OFFSET_TOKENS_COUNT = 228;
  static readonly OFFSET_INSTR_COUNT = 232;
  static readonly OFFSET_REF_COUNTER = 236;

  tag: number;
  version: number;
  operatorAddress: Address<any>;
  holderAddress: Address<any>;
  communityAddress: Address<any>;
  pdfAddress: Address<any>;
  drvsMintAddress: Address<any>;
  lutAddress: Address<any>;
  refProgramDuration: number;
  refLinkDuration: number;
  refDiscount: number;
  refRatio: number;
  clientsCount: number;
  tokensCount: number;
  instrCount: number;
  refCounter: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): RootStateModel {
    const result = new RootStateModel();
    let autoData = new AutoData(data, offset);
    result.tag = autoData.readU32();
    result.version = autoData.readU32();
    result.operatorAddress = autoData.readAddress();
    result.holderAddress = autoData.readAddress();
    result.communityAddress = autoData.readAddress();
    result.pdfAddress = autoData.readAddress();
    result.drvsMintAddress = autoData.readAddress();
    result.lutAddress = autoData.readAddress();
    result.refProgramDuration = autoData.readU32();
    result.refLinkDuration = autoData.readU32();
    result.refDiscount = autoData.readF64();
    result.refRatio = autoData.readF64();
    result.clientsCount = autoData.readU32();
    result.tokensCount = autoData.readU32();
    result.instrCount = autoData.readU32();
    result.refCounter = autoData.readU32();
    return result;
  }
}

export class TokenStateModel {
  static readonly LENGTH = 6 * 4 + 2 * 32; // 88 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_VERSION = 4;
  static readonly OFFSET_ADDRESS = 8;
  static readonly OFFSET_PROGRAM_ADDRESS = 40;
  static readonly OFFSET_ID = 72;
  static readonly OFFSET_MASK = 76;
  static readonly OFFSET_BASE_INSTR_ID = 80;
  static readonly OFFSET_BASE_CRNCY_INDEX = 84;

  tag: number;
  version: number;
  address: Address<any>;
  programAddress: Address<any>;
  id: number;
  mask: number;
  baseInstrId: number;
  baseCrncyIndex: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): TokenStateModel {
    const result = new TokenStateModel();
    let autoData = new AutoData(data, offset);
    result.tag = autoData.readU32();
    result.version = autoData.readU32();
    result.address = autoData.readAddress();
    result.programAddress = autoData.readAddress();
    result.id = autoData.readU32();
    result.mask = autoData.readU32();
    result.baseInstrId = autoData.readU32();
    result.baseCrncyIndex = autoData.readU32();
    return result;
  }
}

export class BaseCrncyRecordModel {
  static readonly LENGTH = 2 * 4 + 2 * 8; // 24 bytes

  static readonly OFFSET_CRNCY_TOKEN_ID = 0;
  static readonly OFFSET_DECS_COUNT = 4;
  static readonly OFFSET_FUNDS = 8;
  static readonly OFFSET_RATE = 16;

  crncyTokenId: number;
  decsCount: number;
  funds: number;
  rate: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): BaseCrncyRecordModel {
    const result = new BaseCrncyRecordModel();
    let autoData = new AutoData(data, offset);
    result.crncyTokenId = autoData.readU32();
    result.decsCount = autoData.readU32();
    result.funds = autoData.readI64();
    result.rate = autoData.readF64();
    return result;
  }
}

export class ClientSpotModel {
  static readonly LENGTH = 4 * 4; // 16 bytes

  static readonly OFFSET_ASSET_ID = 0;
  static readonly OFFSET_TEMP_CLIENT_ID = 4;
  static readonly OFFSET_SLOT = 8;
  static readonly OFFSET_PADDING = 12;

  assetId: number;
  tempClientId: number;
  slot: number;
  padding: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): ClientSpotModel {
    const result = new ClientSpotModel();
    let autoData = new AutoData(data, offset);
    result.assetId = autoData.readU32();
    result.tempClientId = autoData.readU32();
    result.slot = autoData.readU32();
    result.padding = autoData.readU32();
    return result;
  }
}

export class ClientPerpModel {
  static readonly LENGTH = 4 * 4; // 16 bytes

  static readonly OFFSET_ASSET_ID = 0;
  static readonly OFFSET_TEMP_CLIENT_ID = 4;
  static readonly OFFSET_SLOT = 8;
  static readonly OFFSET_PADDING = 12;

  assetId: number;
  tempClientId: number;
  slot: number;
  padding: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): ClientPerpModel {
    const result = new ClientPerpModel();
    let autoData = new AutoData(data, offset);
    result.assetId = autoData.readU32();
    result.tempClientId = autoData.readU32();
    result.slot = autoData.readU32();
    result.padding = autoData.readU32();
    return result;
  }
}

export class AssetRecordModel {
  static readonly LENGTH = 2 * 4 + 1 * 8; // 16 bytes

  static readonly OFFSET_ASSET_ID = 0;
  static readonly OFFSET_TEMP_ID = 4;
  static readonly OFFSET_VALUE = 8;

  assetId: number;
  tempId: number;
  value: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): AssetRecordModel {
    const result = new AssetRecordModel();
    let autoData = new AutoData(data, offset);
    result.assetId = autoData.readU32();
    result.tempId = autoData.readU32();
    result.value = autoData.readI64();
    return result;
  }
}

export class SpotClientInfoModel {
  static readonly LENGTH = 4 * 4 + 2 * 8; // 32 bytes

  static readonly OFFSET_CLIENT = 0;
  static readonly OFFSET_RESERVED = 4;
  static readonly OFFSET_BIDS_ENTRY = 8;
  static readonly OFFSET_ASKS_ENTRY = 12;
  static readonly OFFSET_AVAIL_ASSET_TOKENS = 16;
  static readonly OFFSET_AVAIL_CRNCY_TOKENS = 24;

  client: number;
  reserved: number;
  bidsEntry: number;
  asksEntry: number;
  availAssetTokens: number;
  availCrncyTokens: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): SpotClientInfoModel {
    const result = new SpotClientInfoModel();
    let autoData = new AutoData(data, offset);
    result.client = autoData.readU32();
    result.reserved = autoData.readU32();
    result.bidsEntry = autoData.readU32();
    result.asksEntry = autoData.readU32();
    result.availAssetTokens = autoData.readI64();
    result.availCrncyTokens = autoData.readI64();
    return result;
  }
}

export class SpotClientInfo2Model {
  static readonly LENGTH = 2 * 4 + 3 * 8; // 32 bytes

  static readonly OFFSET_IN_ORDERS_ASSET_TOKENS = 0;
  static readonly OFFSET_IN_ORDERS_CRNCY_TOKENS = 8;
  static readonly OFFSET_BID_SLOT = 16;
  static readonly OFFSET_ASK_SLOT = 20;
  static readonly OFFSET_RESERVED = 24;

  inOrdersAssetTokens: number;
  inOrdersCrncyTokens: number;
  bidSlot: number;
  askSlot: number;
  reserved: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): SpotClientInfo2Model {
    const result = new SpotClientInfo2Model();
    let autoData = new AutoData(data, offset);
    result.inOrdersAssetTokens = autoData.readI64();
    result.inOrdersCrncyTokens = autoData.readI64();
    result.bidSlot = autoData.readU32();
    result.askSlot = autoData.readU32();
    result.reserved = autoData.readI64();
    return result;
  }
}

export class PerpClientInfoModel {
  static readonly LENGTH = 4 * 8; // 32 bytes

  static readonly OFFSET_FUNDS = 0;
  static readonly OFFSET_PERPS = 8;
  static readonly OFFSET_IN_ORDERS_FUNDS = 16;
  static readonly OFFSET_IN_ORDERS_PERPS = 24;

  funds: number;
  perps: number;
  inOrdersFunds: number;
  inOrdersPerps: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): PerpClientInfoModel {
    const result = new PerpClientInfoModel();
    let autoData = new AutoData(data, offset);
    result.funds = autoData.readI64();
    result.perps = autoData.readI64();
    result.inOrdersFunds = autoData.readI64();
    result.inOrdersPerps = autoData.readI64();
    return result;
  }
}

export class PerpClientInfo2Model {
  static readonly LENGTH = 4 * 4 + 2 * 8; // 32 bytes

  static readonly OFFSET_COST = 0;
  static readonly OFFSET_RESULT = 8;
  static readonly OFFSET_BID_SLOT = 16;
  static readonly OFFSET_ASK_SLOT = 20;
  static readonly OFFSET_PX_NODE = 24;
  static readonly OFFSET_MASK = 28;

  cost: number;
  result: number;
  bidSlot: number;
  askSlot: number;
  pxNode: number;
  mask: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): PerpClientInfo2Model {
    const result = new PerpClientInfo2Model();
    let autoData = new AutoData(data, offset);
    result.cost = autoData.readI64();
    result.result = autoData.readI64();
    result.bidSlot = autoData.readU32();
    result.askSlot = autoData.readU32();
    result.pxNode = autoData.readU32();
    result.mask = autoData.readU32();
    return result;
  }
}

export class PerpClientInfo3Model {
  static readonly LENGTH = 4 * 4 + 2 * 8; // 32 bytes

  static readonly OFFSET_CLIENT = 0;
  static readonly OFFSET_PRIORITY_NODE = 4;
  static readonly OFFSET_BIDS_ENTRY = 8;
  static readonly OFFSET_ASKS_ENTRY = 12;
  static readonly OFFSET_FEES = 16;
  static readonly OFFSET_REBATES = 24;

  client: number;
  priorityNode: number;
  bidsEntry: number;
  asksEntry: number;
  fees: number;
  rebates: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): PerpClientInfo3Model {
    const result = new PerpClientInfo3Model();
    let autoData = new AutoData(data, offset);
    result.client = autoData.readU32();
    result.priorityNode = autoData.readU32();
    result.bidsEntry = autoData.readU32();
    result.asksEntry = autoData.readU32();
    result.fees = autoData.readI64();
    result.rebates = autoData.readI64();
    return result;
  }
}

export class PerpClientInfo4Model {
  static readonly LENGTH = 4 * 8; // 32 bytes

  static readonly OFFSET_LAST_SOC_LOSS_RATE = 0;
  static readonly OFFSET_LAST_SOC_LOSS_PERPS = 8;
  static readonly OFFSET_SOC_LOSS_FUNDS = 16;
  static readonly OFFSET_RESERVED = 24;

  lastSocLossRate: number;
  lastSocLossPerps: number;
  socLossFunds: number;
  reserved: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): PerpClientInfo4Model {
    const result = new PerpClientInfo4Model();
    let autoData = new AutoData(data, offset);
    result.lastSocLossRate = autoData.readF64();
    result.lastSocLossPerps = autoData.readI64();
    result.socLossFunds = autoData.readI64();
    result.reserved = autoData.readI64();
    return result;
  }
}

export class PerpClientInfo5Model {
  static readonly LENGTH = 2 * 4 + 3 * 8; // 32 bytes

  static readonly OFFSET_FUNDING_FUNDS = 0;
  static readonly OFFSET_LAST_FUNDING_RATE = 8;
  static readonly OFFSET_RESERVED = 16;
  static readonly OFFSET_REBALANCE_TIME = 24;
  static readonly OFFSET_FUNDING_NODE = 28;

  fundingFunds: number;
  lastFundingRate: number;
  reserved: number;
  rebalanceTime: number;
  fundingNode: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): PerpClientInfo5Model {
    const result = new PerpClientInfo5Model();
    let autoData = new AutoData(data, offset);
    result.fundingFunds = autoData.readI64();
    result.lastFundingRate = autoData.readF64();
    result.reserved = autoData.readI64();
    result.rebalanceTime = autoData.readU32();
    result.fundingNode = autoData.readU32();
    return result;
  }
}

export class ClientPrimaryAccountHeaderModel {
  static readonly LENGTH = 18 * 4 + 7 * 8 + 5 * 32; // 288 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_VERSION = 4;
  static readonly OFFSET_WALLET_ADDRESS = 8;
  static readonly OFFSET_DRV_ADDRESS = 40;
  static readonly OFFSET_COMMUNITY_ADDRESS = 72;
  static readonly OFFSET_LUT_ADDRESS = 104;
  static readonly OFFSET_REF_ADDRESS = 136;
  static readonly OFFSET_FIRST_REF_LINK_DISCOUNT = 168;
  static readonly OFFSET_SECOND_REF_LINK_DISCOUNT = 176;
  static readonly OFFSET_FIRST_REF_LINK_RATIO = 184;
  static readonly OFFSET_SECOND_REF_LINK_RATIO = 192;
  static readonly OFFSET_REF_PROGRAM_DISCOUNT = 200;
  static readonly OFFSET_REF_PROGRAM_RATIO = 208;
  static readonly OFFSET_MASK = 216;
  static readonly OFFSET_ID = 224;
  static readonly OFFSET_REF_CLIENT_ID = 228;
  static readonly OFFSET_REF_COUNTER = 232;
  static readonly OFFSET_FIRST_REF_LINK_ID = 236;
  static readonly OFFSET_SECOND_REF_LINK_ID = 240;
  static readonly OFFSET_FIRST_REF_LINK_EXPIRATION = 244;
  static readonly OFFSET_SECOND_REF_LINK_EXPIRATION = 248;
  static readonly OFFSET_REF_PROGRAM_EXPIRATION = 252;
  static readonly OFFSET_SPOT_TRADES = 256;
  static readonly OFFSET_PERP_TRADES = 260;
  static readonly OFFSET_LP_TRADES = 264;
  static readonly OFFSET_FUTURES_TRADES = 268;
  static readonly OFFSET_OPTIONS_TRADES = 272;
  static readonly OFFSET_POINTS = 276;
  static readonly OFFSET_SLOT = 280;
  static readonly OFFSET_ASSETS_COUNT = 284;

  tag: number;
  version: number;
  walletAddress: Address<any>;
  drvAddress: Address<any>;
  communityAddress: Address<any>;
  lutAddress: Address<any>;
  refAddress: Address<any>;
  firstRefLinkDiscount: number;
  secondRefLinkDiscount: number;
  firstRefLinkRatio: number;
  secondRefLinkRatio: number;
  refProgramDiscount: number;
  refProgramRatio: number;
  mask: number;
  id: number;
  refClientId: number;
  refCounter: number;
  firstRefLinkId: number;
  secondRefLinkId: number;
  firstRefLinkExpiration: number;
  secondRefLinkExpiration: number;
  refProgramExpiration: number;
  spotTrades: number;
  perpTrades: number;
  lpTrades: number;
  futuresTrades: number;
  optionsTrades: number;
  points: number;
  slot: number;
  assetsCount: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): ClientPrimaryAccountHeaderModel {
    const result = new ClientPrimaryAccountHeaderModel();
    let autoData = new AutoData(data, offset);
    result.tag = autoData.readU32();
    result.version = autoData.readU32();
    result.walletAddress = autoData.readAddress();
    result.drvAddress = autoData.readAddress();
    result.communityAddress = autoData.readAddress();
    result.lutAddress = autoData.readAddress();
    result.refAddress = autoData.readAddress();
    result.firstRefLinkDiscount = autoData.readF64();
    result.secondRefLinkDiscount = autoData.readF64();
    result.firstRefLinkRatio = autoData.readF64();
    result.secondRefLinkRatio = autoData.readF64();
    result.refProgramDiscount = autoData.readF64();
    result.refProgramRatio = autoData.readF64();
    result.mask = autoData.readI64();
    result.id = autoData.readU32();
    result.refClientId = autoData.readU32();
    result.refCounter = autoData.readU32();
    result.firstRefLinkId = autoData.readU32();
    result.secondRefLinkId = autoData.readU32();
    result.firstRefLinkExpiration = autoData.readU32();
    result.secondRefLinkExpiration = autoData.readU32();
    result.refProgramExpiration = autoData.readU32();
    result.spotTrades = autoData.readU32();
    result.perpTrades = autoData.readU32();
    result.lpTrades = autoData.readU32();
    result.futuresTrades = autoData.readU32();
    result.optionsTrades = autoData.readU32();
    result.points = autoData.readU32();
    result.slot = autoData.readU32();
    result.assetsCount = autoData.readU32();
    return result;
  }
}

export class ClientDrvAccountHeaderModel {
  static readonly LENGTH = 6 * 4; // 24 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_VERSION = 4;
  static readonly OFFSET_ID = 8;
  static readonly OFFSET_COUNT = 12;
  static readonly OFFSET_SLOT = 16;
  static readonly OFFSET_RESERVED = 20;

  tag: number;
  version: number;
  id: number;
  count: number;
  slot: number;
  reserved: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): ClientDrvAccountHeaderModel {
    const result = new ClientDrvAccountHeaderModel();
    let autoData = new AutoData(data, offset);
    result.tag = autoData.readU32();
    result.version = autoData.readU32();
    result.id = autoData.readU32();
    result.count = autoData.readU32();
    result.slot = autoData.readU32();
    result.reserved = autoData.readU32();
    return result;
  }
}

export class OrderModel {
  static readonly LENGTH = 10 * 4 + 3 * 8; // 64 bytes

  static readonly OFFSET_QTY = 0;
  static readonly OFFSET_SUM = 8;
  static readonly OFFSET_ORDER_ID = 16;
  static readonly OFFSET_ORIG_CLIENT_ID = 24;
  static readonly OFFSET_CLIENT_ID = 28;
  static readonly OFFSET_LINE = 32;
  static readonly OFFSET_PREV = 36;
  static readonly OFFSET_NEXT = 40;
  static readonly OFFSET_SREF = 44;
  static readonly OFFSET_LINK = 48;
  static readonly OFFSET_CL_PREV = 52;
  static readonly OFFSET_CL_NEXT = 56;
  static readonly OFFSET_TIME = 60;

  qty: number;
  sum: number;
  orderId: number;
  origClientId: number;
  clientId: number;
  line: number;
  prev: number;
  next: number;
  sref: number;
  link: number;
  clPrev: number;
  clNext: number;
  time: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): OrderModel {
    const result = new OrderModel();
    let autoData = new AutoData(data, offset);
    result.qty = autoData.readI64();
    result.sum = autoData.readI64();
    result.orderId = autoData.readI64();
    result.origClientId = autoData.readU32();
    result.clientId = autoData.readU32();
    result.line = autoData.readU32();
    result.prev = autoData.readU32();
    result.next = autoData.readU32();
    result.sref = autoData.readU32();
    result.link = autoData.readU32();
    result.clPrev = autoData.readU32();
    result.clNext = autoData.readU32();
    result.time = autoData.readU32();
    return result;
  }
}

export class PxOrdersModel {
  static readonly LENGTH = 6 * 4 + 2 * 8; // 40 bytes

  static readonly OFFSET_PRICE = 0;
  static readonly OFFSET_QTY = 8;
  static readonly OFFSET_NEXT = 16;
  static readonly OFFSET_PREV = 20;
  static readonly OFFSET_SREF = 24;
  static readonly OFFSET_LINK = 28;
  static readonly OFFSET_BEGIN = 32;
  static readonly OFFSET_END = 36;

  price: number;
  qty: number;
  next: number;
  prev: number;
  sref: number;
  link: number;
  begin: number;
  end: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): PxOrdersModel {
    const result = new PxOrdersModel();
    let autoData = new AutoData(data, offset);
    result.price = autoData.readI64();
    result.qty = autoData.readI64();
    result.next = autoData.readU32();
    result.prev = autoData.readU32();
    result.sref = autoData.readU32();
    result.link = autoData.readU32();
    result.begin = autoData.readU32();
    result.end = autoData.readU32();
    return result;
  }
}

