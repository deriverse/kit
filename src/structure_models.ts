import { Address, Base64EncodedDataResponse } from '@solana/kit';
import { AutoData } from './auto_data';

export enum OrderType {
  limit = 0,
  market = 1,
  marginCall = 2,
  makerOnly = 3,
  makerPriceDeviation = 4,
}

export enum AssetType {
  token = 0x10000000,
  spotLp = 0x20000000,
  spotOrders = 0x30000000,
  perp = 0x40000000,
}

export enum VmFlag {
  active = 0x80000000,
  change = 0x40000000,
  withdraw = 0x20000000,
}

export enum SlotFlag {
  spot = 0b001,
  perp = 0b010,
  option = 0b100,
}

export enum VmWhitelistTag {
  vacant = 0,
  withdrawAccount = 1,
  programId = 2,
  marketId = 3,
}

export enum InstrFlag {
  perpActive = 0x40000000,
  readyToPerpUpgrade = 0x01000000,
  zeroFees = 0x1,
  fixedFees = 0x2,
  similarAssets = 0x4,
  usdStablecoin = 0x8,
  forex = 0x10,
  suspended = 0x20,
  longMarginCall = 0x40,
  shortMarginCall = 0x80,
  expandableCandles = 0x100,
}

export enum TokenFlag {
  token2022 = 0x80000000,
  baseCrncy = 0x40000000,
  wrappedToken = 0x20000000,
  sAMCrncy = 0x10000000,
}

export enum AccountType {
  clientCommunity = 35,
  clientDrv = 32,
  clientPrimary = 31,
  community = 34,
  holder = 1,
  root = 2,
  instr = 7,
  spotAskOrders = 17,
  spotAsksTree = 15,
  spotBidOrders = 16,
  spotBidsTree = 14,
  spotClientInfos = 12,
  spotLines = 18,
  spotMaps = 10,
  token = 4,
  perpAskOrders = 36,
  perpAsksTree = 37,
  perpBidOrders = 38,
  perpBidsTree = 39,
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
  privateClients = 51,
  vmClient = 52,
}

export class ClientCommunityRecordModel {
  static readonly LENGTH = 2 * 4 + 6 * 8; // 56 bytes

  static readonly OFFSET_DIVIDENDS_RATE = 0;
  static readonly OFFSET_DIVIDENDS_VALUE = 8;
  static readonly OFFSET_FEES_PREPAYMENT = 16;
  static readonly OFFSET_FEES_RATIO = 24;
  static readonly OFFSET_REF_REWARDS = 32;
  static readonly OFFSET_REF_PAYMENTS = 40;
  static readonly OFFSET_LAST_FEES_PREPAYMENT_TIME = 48;
  static readonly OFFSET_CRNCY_TOKEN_ID = 52;

  dividendsRate: number;
  dividendsValue: number;
  feesPrepayment: number;
  feesRatio: number;
  refRewards: number;
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
    result.refRewards = autoData.readI64();
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
  static readonly LENGTH = 20 * 4 + 10 * 8; // 160 bytes

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
  static readonly OFFSET_SPOT_POOL_RATIO = 108;
  static readonly OFFSET_MARGIN_CALL_PENALTY_RATE = 112;
  static readonly OFFSET_FEES_PREPAYMENT_FOR_MAX_DISCOUNT = 116;
  static readonly OFFSET_MAX_DISCOUNT = 120;
  static readonly OFFSET_RESERVED_VALUE1 = 124;
  static readonly OFFSET_RESERVED_VALUE2 = 128;
  static readonly OFFSET_RESERVED_VALUE3 = 132;
  static readonly OFFSET_RESERVED_VALUE4 = 136;
  static readonly OFFSET_RESERVED_VALUE5 = 140;
  static readonly OFFSET_RESERVED_VALUE6 = 144;
  static readonly OFFSET_RESERVED_VALUE7 = 148;
  static readonly OFFSET_RESERVED_VALUE8 = 152;
  static readonly OFFSET_COUNT = 156;

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
  spotPoolRatio: number;
  marginCallPenaltyRate: number;
  feesPrepaymentForMaxDiscount: number;
  maxDiscount: number;
  reservedValue1: number;
  reservedValue2: number;
  reservedValue3: number;
  reservedValue4: number;
  reservedValue5: number;
  reservedValue6: number;
  reservedValue7: number;
  reservedValue8: number;
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
    result.spotPoolRatio = autoData.readU32();
    result.marginCallPenaltyRate = autoData.readU32();
    result.feesPrepaymentForMaxDiscount = autoData.readU32();
    result.maxDiscount = autoData.readU32();
    result.reservedValue1 = autoData.readU32();
    result.reservedValue2 = autoData.readU32();
    result.reservedValue3 = autoData.readU32();
    result.reservedValue4 = autoData.readU32();
    result.reservedValue5 = autoData.readU32();
    result.reservedValue6 = autoData.readU32();
    result.reservedValue7 = autoData.readU32();
    result.reservedValue8 = autoData.readU32();
    result.count = autoData.readU32();
    return result;
  }
}

export class SpotTradeAccountHeaderModel {
  static readonly LENGTH = 6 * 4; // 24 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_VERSION = 4;
  static readonly OFFSET_INSTR_ID = 8;
  static readonly OFFSET_SLOT = 12;
  static readonly OFFSET_ASSET_TOKEN_ID = 16;
  static readonly OFFSET_CRNCY_TOKEN_ID = 20;

  tag: number;
  version: number;
  instrId: number;
  slot: number;
  assetTokenId: number;
  crncyTokenId: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): SpotTradeAccountHeaderModel {
    const result = new SpotTradeAccountHeaderModel();
    let autoData = new AutoData(data, offset);
    result.tag = autoData.readU32();
    result.version = autoData.readU32();
    result.instrId = autoData.readU32();
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

export class CandleModel {
  static readonly LENGTH = 2 * 2 + 1 * 4 + 6 * 8; // 56 bytes

  static readonly OFFSET_OPEN = 0;
  static readonly OFFSET_CLOSE = 8;
  static readonly OFFSET_MAX = 16;
  static readonly OFFSET_MIN = 24;
  static readonly OFFSET_ASSET_TOKENS = 32;
  static readonly OFFSET_CRNCY_TOKENS = 40;
  static readonly OFFSET_TIME = 48;
  static readonly OFFSET_KIND = 52;
  static readonly OFFSET_NEXT = 54;

  open: number;
  close: number;
  max: number;
  min: number;
  assetTokens: number;
  crncyTokens: number;
  time: number;
  kind: number;
  next: number;
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
    result.kind = autoData.readU16();
    result.next = autoData.readU16();
    return result;
  }
}

export class CandlesHeaderModel {
  static readonly LENGTH = 12 * 4; // 48 bytes

  static readonly OFFSET_TOTAL_COUNT = 0;
  static readonly OFFSET_USED_COUNT = 4;
  static readonly OFFSET_COUNT_1M = 8;
  static readonly OFFSET_COUNT_15M = 12;
  static readonly OFFSET_COUNT_DAY = 16;
  static readonly OFFSET_FIRST_1M = 20;
  static readonly OFFSET_FIRST_15M = 24;
  static readonly OFFSET_FIRST_DAY = 28;
  static readonly OFFSET_LAST_1M = 32;
  static readonly OFFSET_LAST_15M = 36;
  static readonly OFFSET_LAST_DAY = 40;
  static readonly OFFSET_PADDING = 44;

  totalCount: number;
  usedCount: number;
  count1M: number;
  count15M: number;
  countDay: number;
  first1M: number;
  first15M: number;
  firstDay: number;
  last1M: number;
  last15M: number;
  lastDay: number;
  padding: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): CandlesHeaderModel {
    const result = new CandlesHeaderModel();
    let autoData = new AutoData(data, offset);
    result.totalCount = autoData.readU32();
    result.usedCount = autoData.readU32();
    result.count1M = autoData.readU32();
    result.count15M = autoData.readU32();
    result.countDay = autoData.readU32();
    result.first1M = autoData.readU32();
    result.first15M = autoData.readU32();
    result.firstDay = autoData.readU32();
    result.last1M = autoData.readU32();
    result.last15M = autoData.readU32();
    result.lastDay = autoData.readU32();
    result.padding = autoData.readU32();
    return result;
  }
}

export class InstrAccountHeaderModel {
  static readonly LENGTH = 4 * 1 + 65 * 4 + 76 * 8 + 6 * 32; // 1064 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_VERSION = 4;
  static readonly OFFSET_INSTR_ID = 8;
  static readonly OFFSET_ASSET_TOKEN_ID = 12;
  static readonly OFFSET_CRNCY_TOKEN_ID = 16;
  static readonly OFFSET_ASSET_TOKEN_DECS_COUNT = 20;
  static readonly OFFSET_CRNCY_TOKEN_DECS_COUNT = 24;
  static readonly OFFSET_MASK = 28;
  static readonly OFFSET_LAST_PX = 32;
  static readonly OFFSET_LAST_CLOSE = 40;
  static readonly OFFSET_BEST_BID = 48;
  static readonly OFFSET_BEST_ASK = 56;
  static readonly OFFSET_PERP_LAST_PX = 64;
  static readonly OFFSET_PERP_LAST_CLOSE = 72;
  static readonly OFFSET_PERP_OPEN_INT = 80;
  static readonly OFFSET_VARIANCE = 88;
  static readonly OFFSET_MAX_LEVERAGE = 96;
  static readonly OFFSET_PREV_DAY_TRADES = 104;
  static readonly OFFSET_PERP_INSURANCE_FUND = 112;
  static readonly OFFSET_PERP_PRICE_DELTA = 120;
  static readonly OFFSET_SHORT_EMA_PX = 128;
  static readonly OFFSET_LP_PREV_DAY_FEES = 136;
  static readonly OFFSET_ASSET_TOKENS = 144;
  static readonly OFFSET_CRNCY_TOKENS = 152;
  static readonly OFFSET_PS = 160;
  static readonly OFFSET_POOL_FEES = 168;
  static readonly OFFSET_RESERVED_VALUE1 = 176;
  static readonly OFFSET_RESERVED_VALUE2 = 184;
  static readonly OFFSET_RESERVED_VALUE3 = 192;
  static readonly OFFSET_LAST_TRADE_ASSET_TOKENS = 200;
  static readonly OFFSET_LAST_TRADE_CRNCY_TOKENS = 208;
  static readonly OFFSET_DAY_LOW = 216;
  static readonly OFFSET_DAY_HIGH = 224;
  static readonly OFFSET_DAY_ASSET_TOKENS = 232;
  static readonly OFFSET_DAY_CRNCY_TOKENS = 240;
  static readonly OFFSET_PERP_CLIENTS_COUNT = 248;
  static readonly OFFSET_PERP_DAY_TRADES = 252;
  static readonly OFFSET_PERP_BEST_BID = 256;
  static readonly OFFSET_PERP_BEST_ASK = 264;
  static readonly OFFSET_PERP_DAY_LOW = 272;
  static readonly OFFSET_PERP_DAY_HIGH = 280;
  static readonly OFFSET_PERP_DAY_ASSET_TOKENS = 288;
  static readonly OFFSET_PERP_DAY_CRNCY_TOKENS = 296;
  static readonly OFFSET_PERP_ALLTIME_TRADES = 304;
  static readonly OFFSET_PERP_PREV_DAY_TRADES = 312;
  static readonly OFFSET_PERP_LAST_TRADE_ASSET_TOKENS = 320;
  static readonly OFFSET_PERP_LAST_TRADE_CRNCY_TOKENS = 328;
  static readonly OFFSET_ALLTIME_TRADES = 336;
  static readonly OFFSET_DAY_VOLATILITY = 344;
  static readonly OFFSET_MAPS_ADDRESS = 352;
  static readonly OFFSET_PERP_MAPS_ADDRESS = 384;
  static readonly OFFSET_ASSET_MINT = 416;
  static readonly OFFSET_CRNCY_MINT = 448;
  static readonly OFFSET_LUT_ADDRESS = 480;
  static readonly OFFSET_DRV_COUNT = 512;
  static readonly OFFSET_SLOT = 516;
  static readonly OFFSET_CREATOR = 520;
  static readonly OFFSET_LAST_TIME = 552;
  static readonly OFFSET_DISTRIB_TIME = 556;
  static readonly OFFSET_BASE_CRNCY_INDEX = 560;
  static readonly OFFSET_INSTANCE_COUNTER = 564;
  static readonly OFFSET_VARIANCE_COUNTER = 568;
  static readonly OFFSET_BIDS_TREE_NODES_COUNT = 572;
  static readonly OFFSET_BIDS_TREE_LINES_ENTRY = 576;
  static readonly OFFSET_BIDS_TREE_ORDERS_ENTRY = 580;
  static readonly OFFSET_ASKS_TREE_NODES_COUNT = 584;
  static readonly OFFSET_ASKS_TREE_LINES_ENTRY = 588;
  static readonly OFFSET_ASKS_TREE_ORDERS_ENTRY = 592;
  static readonly OFFSET_BID_LINES_BEGIN = 596;
  static readonly OFFSET_BID_LINES_END = 600;
  static readonly OFFSET_BID_LINES_COUNT = 604;
  static readonly OFFSET_ASK_LINES_BEGIN = 608;
  static readonly OFFSET_ASK_LINES_END = 612;
  static readonly OFFSET_ASK_LINES_COUNT = 616;
  static readonly OFFSET_BID_ORDERS_COUNT = 620;
  static readonly OFFSET_ASK_ORDERS_COUNT = 624;
  static readonly OFFSET_FIXING_TIME = 628;
  static readonly OFFSET_FIXING_CRNCY_TOKENS = 632;
  static readonly OFFSET_FIXING_ASSET_TOKENS = 640;
  static readonly OFFSET_COUNTER = 648;
  static readonly OFFSET_PROTOCOL_FEES = 656;
  static readonly OFFSET_HITS_COUNTER = 664;
  static readonly OFFSET_LAST_ASSET_TOKENS = 672;
  static readonly OFFSET_LAST_CRNCY_TOKENS = 680;
  static readonly OFFSET_PERP_UNDERLYING_PX = 688;
  static readonly OFFSET_FIXING_PX = 696;
  static readonly OFFSET_AVG_SPREAD = 704;
  static readonly OFFSET_LAST_SPREAD = 712;
  static readonly OFFSET_LAST_SPREAD_TIME = 720;
  static readonly OFFSET_TOTAL_SPREAD_PERIOD = 724;
  static readonly OFFSET_PREV_DAY_ASSET_TOKENS = 728;
  static readonly OFFSET_PREV_DAY_CRNCY_TOKENS = 736;
  static readonly OFFSET_ALLTIME_ASSET_TOKENS = 744;
  static readonly OFFSET_ALLTIME_CRNCY_TOKENS = 752;
  static readonly OFFSET_DAY_TRADES = 760;
  static readonly OFFSET_LP_DAY_TRADES = 764;
  static readonly OFFSET_LP_ALLTIME_FEES = 768;
  static readonly OFFSET_LP_DAY_FEES = 776;
  static readonly OFFSET_LP_PREV_DAY_TRADES = 784;
  static readonly OFFSET_LP_TIME = 788;
  static readonly OFFSET_FEES_TIME = 792;
  static readonly OFFSET_CREATION_TIME = 796;
  static readonly OFFSET_DEC_FACTOR = 800;
  static readonly OFFSET_PERP_SLOT = 808;
  static readonly OFFSET_PERP_TIME = 812;
  static readonly OFFSET_PERP_FUNDING_RATE_SLOT = 816;
  static readonly OFFSET_PERP_FUNDING_RATE_TIME = 820;
  static readonly OFFSET_PERP_LONG_PX_TREE_NODES_COUNT = 824;
  static readonly OFFSET_PERP_LONG_PX_TREE_ENTRY = 828;
  static readonly OFFSET_PERP_SHORT_PX_TREE_NODES_COUNT = 832;
  static readonly OFFSET_PERP_SHORT_PX_TREE_ENTRY = 836;
  static readonly OFFSET_PERP_REBALANCE_TIME_TREE_NODES_COUNT = 840;
  static readonly OFFSET_PERP_REBALANCE_TIME_TREE_ENTRY = 844;
  static readonly OFFSET_PERP_BIDS_TREE_NODES_COUNT = 848;
  static readonly OFFSET_PERP_BIDS_TREE_LINES_ENTRY = 852;
  static readonly OFFSET_PERP_BIDS_TREE_ORDERS_ENTRY = 856;
  static readonly OFFSET_PERP_ASKS_TREE_NODES_COUNT = 860;
  static readonly OFFSET_PERP_ASKS_TREE_LINES_ENTRY = 864;
  static readonly OFFSET_PERP_ASKS_TREE_ORDERS_ENTRY = 868;
  static readonly OFFSET_PERP_BID_LINES_BEGIN = 872;
  static readonly OFFSET_PERP_BID_LINES_END = 876;
  static readonly OFFSET_PERP_BID_LINES_COUNT = 880;
  static readonly OFFSET_PERP_ASK_LINES_BEGIN = 884;
  static readonly OFFSET_PERP_ASK_LINES_END = 888;
  static readonly OFFSET_PERP_ASK_LINES_COUNT = 892;
  static readonly OFFSET_PERP_BID_ORDERS_COUNT = 896;
  static readonly OFFSET_PERP_ASK_ORDERS_COUNT = 900;
  static readonly OFFSET_PERP_LONG_SPOT_PRICE_FOR_WITHDROWAL = 904;
  static readonly OFFSET_PERP_SHORT_SPOT_PRICE_FOR_WITHDROWAL = 912;
  static readonly OFFSET_PERP_SOC_LOSS_LONG_RATE = 920;
  static readonly OFFSET_PERP_SOC_LOSS_SHORT_RATE = 928;
  static readonly OFFSET_PERP_FUNDING_RATE = 936;
  static readonly OFFSET_PERP_FUNDING_FUNDS = 944;
  static readonly OFFSET_PERP_SOC_LOSS_FUNDS = 952;
  static readonly OFFSET_PERP_PREV_DAY_ASSET_TOKENS = 960;
  static readonly OFFSET_PERP_PREV_DAY_CRNCY_TOKENS = 968;
  static readonly OFFSET_PERP_ALLTIME_ASSET_TOKENS = 976;
  static readonly OFFSET_PERP_ALLTIME_CRNCY_TOKENS = 984;
  static readonly OFFSET_LIQUIDATION_THRESHOLD = 992;
  static readonly OFFSET_SEATS_RESERVE = 1000;
  static readonly OFFSET_SWAP_FEES = 1008;
  static readonly OFFSET_SIMILAR_ASSETS_MIN_QTY = 1016;
  static readonly OFFSET_FIXED_FEE_RATE = 1024;
  static readonly OFFSET_MID_EMA_PX = 1032;
  static readonly OFFSET_LONG_EMA_PX = 1040;
  static readonly OFFSET_LOG_SEQ_NO = 1048;
  static readonly OFFSET_ASSET_BUMP_SEED = 1056;
  static readonly OFFSET_CRNCY_BUMP_SEED = 1057;
  static readonly OFFSET_SPOT_FEE_RATE = 1058;
  static readonly OFFSET_SPOT_POOL_RATIO = 1059;
  static readonly OFFSET_RESERVED_VALUE10 = 1060;

  tag: number;
  version: number;
  instrId: number;
  assetTokenId: number;
  crncyTokenId: number;
  assetTokenDecsCount: number;
  crncyTokenDecsCount: number;
  mask: number;
  lastPx: number;
  lastClose: number;
  bestBid: number;
  bestAsk: number;
  perpLastPx: number;
  perpLastClose: number;
  perpOpenInt: number;
  variance: number;
  maxLeverage: number;
  prevDayTrades: number;
  perpInsuranceFund: number;
  perpPriceDelta: number;
  shortEmaPx: number;
  lpPrevDayFees: number;
  assetTokens: number;
  crncyTokens: number;
  ps: number;
  poolFees: number;
  reservedValue1: number;
  reservedValue2: number;
  reservedValue3: number;
  lastTradeAssetTokens: number;
  lastTradeCrncyTokens: number;
  dayLow: number;
  dayHigh: number;
  dayAssetTokens: number;
  dayCrncyTokens: number;
  perpClientsCount: number;
  perpDayTrades: number;
  perpBestBid: number;
  perpBestAsk: number;
  perpDayLow: number;
  perpDayHigh: number;
  perpDayAssetTokens: number;
  perpDayCrncyTokens: number;
  perpAlltimeTrades: number;
  perpPrevDayTrades: number;
  perpLastTradeAssetTokens: number;
  perpLastTradeCrncyTokens: number;
  alltimeTrades: number;
  dayVolatility: number;
  mapsAddress: Address<any>;
  perpMapsAddress: Address<any>;
  assetMint: Address<any>;
  crncyMint: Address<any>;
  lutAddress: Address<any>;
  drvCount: number;
  slot: number;
  creator: Address<any>;
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
  protocolFees: number;
  hitsCounter: number;
  lastAssetTokens: number;
  lastCrncyTokens: number;
  perpUnderlyingPx: number;
  fixingPx: number;
  avgSpread: number;
  lastSpread: number;
  lastSpreadTime: number;
  totalSpreadPeriod: number;
  prevDayAssetTokens: number;
  prevDayCrncyTokens: number;
  alltimeAssetTokens: number;
  alltimeCrncyTokens: number;
  dayTrades: number;
  lpDayTrades: number;
  lpAlltimeFees: number;
  lpDayFees: number;
  lpPrevDayTrades: number;
  lpTime: number;
  feesTime: number;
  creationTime: number;
  decFactor: number;
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
  perpLongSpotPriceForWithdrowal: number;
  perpShortSpotPriceForWithdrowal: number;
  perpSocLossLongRate: number;
  perpSocLossShortRate: number;
  perpFundingRate: number;
  perpFundingFunds: number;
  perpSocLossFunds: number;
  perpPrevDayAssetTokens: number;
  perpPrevDayCrncyTokens: number;
  perpAlltimeAssetTokens: number;
  perpAlltimeCrncyTokens: number;
  liquidationThreshold: number;
  seatsReserve: number;
  swapFees: number;
  similarAssetsMinQty: number;
  fixedFeeRate: number;
  midEmaPx: number;
  longEmaPx: number;
  logSeqNo: number;
  assetBumpSeed: number;
  crncyBumpSeed: number;
  spotFeeRate: number;
  spotPoolRatio: number;
  reservedValue10: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): InstrAccountHeaderModel {
    const result = new InstrAccountHeaderModel();
    let autoData = new AutoData(data, offset);
    result.tag = autoData.readU32();
    result.version = autoData.readU32();
    result.instrId = autoData.readU32();
    result.assetTokenId = autoData.readU32();
    result.crncyTokenId = autoData.readU32();
    result.assetTokenDecsCount = autoData.readU32();
    result.crncyTokenDecsCount = autoData.readU32();
    result.mask = autoData.readU32();
    result.lastPx = autoData.readI64();
    result.lastClose = autoData.readI64();
    result.bestBid = autoData.readI64();
    result.bestAsk = autoData.readI64();
    result.perpLastPx = autoData.readI64();
    result.perpLastClose = autoData.readI64();
    result.perpOpenInt = autoData.readI64();
    result.variance = autoData.readF64();
    result.maxLeverage = autoData.readF64();
    result.prevDayTrades = autoData.readI64();
    result.perpInsuranceFund = autoData.readI64();
    result.perpPriceDelta = autoData.readF64();
    result.shortEmaPx = autoData.readF64();
    result.lpPrevDayFees = autoData.readI64();
    result.assetTokens = autoData.readI64();
    result.crncyTokens = autoData.readI64();
    result.ps = autoData.readI64();
    result.poolFees = autoData.readI64();
    result.reservedValue1 = autoData.readI64();
    result.reservedValue2 = autoData.readI64();
    result.reservedValue3 = autoData.readI64();
    result.lastTradeAssetTokens = autoData.readI64();
    result.lastTradeCrncyTokens = autoData.readI64();
    result.dayLow = autoData.readI64();
    result.dayHigh = autoData.readI64();
    result.dayAssetTokens = autoData.readI64();
    result.dayCrncyTokens = autoData.readI64();
    result.perpClientsCount = autoData.readU32();
    result.perpDayTrades = autoData.readU32();
    result.perpBestBid = autoData.readI64();
    result.perpBestAsk = autoData.readI64();
    result.perpDayLow = autoData.readI64();
    result.perpDayHigh = autoData.readI64();
    result.perpDayAssetTokens = autoData.readI64();
    result.perpDayCrncyTokens = autoData.readI64();
    result.perpAlltimeTrades = autoData.readI64();
    result.perpPrevDayTrades = autoData.readI64();
    result.perpLastTradeAssetTokens = autoData.readI64();
    result.perpLastTradeCrncyTokens = autoData.readI64();
    result.alltimeTrades = autoData.readI64();
    result.dayVolatility = autoData.readF64();
    result.mapsAddress = autoData.readAddress();
    result.perpMapsAddress = autoData.readAddress();
    result.assetMint = autoData.readAddress();
    result.crncyMint = autoData.readAddress();
    result.lutAddress = autoData.readAddress();
    result.drvCount = autoData.readU32();
    result.slot = autoData.readU32();
    result.creator = autoData.readAddress();
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
    result.protocolFees = autoData.readI64();
    result.hitsCounter = autoData.readI64();
    result.lastAssetTokens = autoData.readI64();
    result.lastCrncyTokens = autoData.readI64();
    result.perpUnderlyingPx = autoData.readI64();
    result.fixingPx = autoData.readI64();
    result.avgSpread = autoData.readF64();
    result.lastSpread = autoData.readF64();
    result.lastSpreadTime = autoData.readU32();
    result.totalSpreadPeriod = autoData.readU32();
    result.prevDayAssetTokens = autoData.readI64();
    result.prevDayCrncyTokens = autoData.readI64();
    result.alltimeAssetTokens = autoData.readF64();
    result.alltimeCrncyTokens = autoData.readF64();
    result.dayTrades = autoData.readU32();
    result.lpDayTrades = autoData.readU32();
    result.lpAlltimeFees = autoData.readF64();
    result.lpDayFees = autoData.readI64();
    result.lpPrevDayTrades = autoData.readU32();
    result.lpTime = autoData.readU32();
    result.feesTime = autoData.readU32();
    result.creationTime = autoData.readU32();
    result.decFactor = autoData.readI64();
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
    result.perpLongSpotPriceForWithdrowal = autoData.readI64();
    result.perpShortSpotPriceForWithdrowal = autoData.readI64();
    result.perpSocLossLongRate = autoData.readF64();
    result.perpSocLossShortRate = autoData.readF64();
    result.perpFundingRate = autoData.readF64();
    result.perpFundingFunds = autoData.readI64();
    result.perpSocLossFunds = autoData.readI64();
    result.perpPrevDayAssetTokens = autoData.readI64();
    result.perpPrevDayCrncyTokens = autoData.readI64();
    result.perpAlltimeAssetTokens = autoData.readF64();
    result.perpAlltimeCrncyTokens = autoData.readF64();
    result.liquidationThreshold = autoData.readF64();
    result.seatsReserve = autoData.readI64();
    result.swapFees = autoData.readI64();
    result.similarAssetsMinQty = autoData.readI64();
    result.fixedFeeRate = autoData.readF64();
    result.midEmaPx = autoData.readF64();
    result.longEmaPx = autoData.readF64();
    result.logSeqNo = autoData.readI64();
    result.assetBumpSeed = autoData.readU8();
    result.crncyBumpSeed = autoData.readU8();
    result.spotFeeRate = autoData.readU8();
    result.spotPoolRatio = autoData.readU8();
    result.reservedValue10 = autoData.readU32();
    return result;
  }
}

export class RootStateModel {
  static readonly LENGTH = 16 * 4 + 7 * 8 + 6 * 32; // 312 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_VERSION = 4;
  static readonly OFFSET_OPERATOR_ADDRESS = 8;
  static readonly OFFSET_HOLDER_ADDRESS = 40;
  static readonly OFFSET_DRVS_MINT_ADDRESS = 72;
  static readonly OFFSET_LUT_ADDRESS = 104;
  static readonly OFFSET_AIRDROP_AUTHORITY_ADDRESS = 136;
  static readonly OFFSET_PRIVATE_MODE_AUTHORITY_ADDRESS = 168;
  static readonly OFFSET_REF_PROGRAM_DURATION = 200;
  static readonly OFFSET_REF_LINK_DURATION = 204;
  static readonly OFFSET_REF_DISCOUNT = 208;
  static readonly OFFSET_REF_RATIO = 216;
  static readonly OFFSET_CLIENTS_COUNT = 224;
  static readonly OFFSET_TOKENS_COUNT = 228;
  static readonly OFFSET_INSTR_COUNT = 232;
  static readonly OFFSET_REF_COUNTER = 236;
  static readonly OFFSET_MASK = 240;
  static readonly OFFSET_POINTS_PROGRAM_EXPIRATION = 244;
  static readonly OFFSET_PURCHASING_PERP_SEAT_FEE = 248;
  static readonly OFFSET_SPOT_FEE_RATE = 256;
  static readonly OFFSET_PERP_FEE_RATE = 260;
  static readonly OFFSET_SPOT_POOL_RATIO = 264;
  static readonly OFFSET_MARGIN_CALL_PENALTY_RATE = 268;
  static readonly OFFSET_FEES_PREPAYMENT_FOR_MAX_DISCOUNT = 272;
  static readonly OFFSET_RESERVED_0 = 276;
  static readonly OFFSET_RESERVED_1 = 280;
  static readonly OFFSET_RESERVED_2 = 288;
  static readonly OFFSET_RESERVED_3 = 296;
  static readonly OFFSET_RESERVED_4 = 304;

  tag: number;
  version: number;
  operatorAddress: Address<any>;
  holderAddress: Address<any>;
  drvsMintAddress: Address<any>;
  lutAddress: Address<any>;
  airdropAuthorityAddress: Address<any>;
  privateModeAuthorityAddress: Address<any>;
  refProgramDuration: number;
  refLinkDuration: number;
  refDiscount: number;
  refRatio: number;
  clientsCount: number;
  tokensCount: number;
  instrCount: number;
  refCounter: number;
  mask: number;
  pointsProgramExpiration: number;
  purchasingPerpSeatFee: number;
  spotFeeRate: number;
  perpFeeRate: number;
  spotPoolRatio: number;
  marginCallPenaltyRate: number;
  feesPrepaymentForMaxDiscount: number;
  reserved0: number;
  reserved1: number;
  reserved2: number;
  reserved3: number;
  reserved4: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): RootStateModel {
    const result = new RootStateModel();
    let autoData = new AutoData(data, offset);
    result.tag = autoData.readU32();
    result.version = autoData.readU32();
    result.operatorAddress = autoData.readAddress();
    result.holderAddress = autoData.readAddress();
    result.drvsMintAddress = autoData.readAddress();
    result.lutAddress = autoData.readAddress();
    result.airdropAuthorityAddress = autoData.readAddress();
    result.privateModeAuthorityAddress = autoData.readAddress();
    result.refProgramDuration = autoData.readU32();
    result.refLinkDuration = autoData.readU32();
    result.refDiscount = autoData.readF64();
    result.refRatio = autoData.readF64();
    result.clientsCount = autoData.readU32();
    result.tokensCount = autoData.readU32();
    result.instrCount = autoData.readU32();
    result.refCounter = autoData.readU32();
    result.mask = autoData.readU32();
    result.pointsProgramExpiration = autoData.readU32();
    result.purchasingPerpSeatFee = autoData.readF64();
    result.spotFeeRate = autoData.readU32();
    result.perpFeeRate = autoData.readU32();
    result.spotPoolRatio = autoData.readU32();
    result.marginCallPenaltyRate = autoData.readU32();
    result.feesPrepaymentForMaxDiscount = autoData.readU32();
    result.reserved0 = autoData.readU32();
    result.reserved1 = autoData.readU64();
    result.reserved2 = autoData.readU64();
    result.reserved3 = autoData.readU64();
    result.reserved4 = autoData.readU64();
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
  static readonly OFFSET_RESERVED = 80;
  static readonly OFFSET_BASE_CRNCY_INDEX = 84;

  tag: number;
  version: number;
  address: Address<any>;
  programAddress: Address<any>;
  id: number;
  mask: number;
  reserved: number;
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
    result.reserved = autoData.readU32();
    result.baseCrncyIndex = autoData.readU32();
    return result;
  }
}

export class SpotClientInfoModel {
  static readonly LENGTH = 6 * 4 + 5 * 8; // 64 bytes

  static readonly OFFSET_CLIENT = 0;
  static readonly OFFSET_FILLED_ORDERS = 4;
  static readonly OFFSET_BIDS_ENTRY = 8;
  static readonly OFFSET_ASKS_ENTRY = 12;
  static readonly OFFSET_AVAIL_ASSET_TOKENS = 16;
  static readonly OFFSET_AVAIL_CRNCY_TOKENS = 24;
  static readonly OFFSET_IN_ORDERS_ASSET_TOKENS = 32;
  static readonly OFFSET_IN_ORDERS_CRNCY_TOKENS = 40;
  static readonly OFFSET_BID_SLOT = 48;
  static readonly OFFSET_ASK_SLOT = 52;
  static readonly OFFSET_RESERVED = 56;

  client: number;
  filledOrders: number;
  bidsEntry: number;
  asksEntry: number;
  availAssetTokens: number;
  availCrncyTokens: number;
  inOrdersAssetTokens: number;
  inOrdersCrncyTokens: number;
  bidSlot: number;
  askSlot: number;
  reserved: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): SpotClientInfoModel {
    const result = new SpotClientInfoModel();
    let autoData = new AutoData(data, offset);
    result.client = autoData.readU32();
    result.filledOrders = autoData.readU32();
    result.bidsEntry = autoData.readU32();
    result.asksEntry = autoData.readU32();
    result.availAssetTokens = autoData.readI64();
    result.availCrncyTokens = autoData.readI64();
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
  static readonly OFFSET_FILLED_ORDERS = 4;
  static readonly OFFSET_BIDS_ENTRY = 8;
  static readonly OFFSET_ASKS_ENTRY = 12;
  static readonly OFFSET_FEES = 16;
  static readonly OFFSET_REBATES = 24;

  client: number;
  filledOrders: number;
  bidsEntry: number;
  asksEntry: number;
  fees: number;
  rebates: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): PerpClientInfo3Model {
    const result = new PerpClientInfo3Model();
    let autoData = new AutoData(data, offset);
    result.client = autoData.readU32();
    result.filledOrders = autoData.readU32();
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
  static readonly OFFSET_LOSS_COVERAGE = 24;

  lastSocLossRate: number;
  lastSocLossPerps: number;
  socLossFunds: number;
  lossCoverage: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): PerpClientInfo4Model {
    const result = new PerpClientInfo4Model();
    let autoData = new AutoData(data, offset);
    result.lastSocLossRate = autoData.readF64();
    result.lastSocLossPerps = autoData.readI64();
    result.socLossFunds = autoData.readI64();
    result.lossCoverage = autoData.readI64();
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
  static readonly LENGTH = 30 * 4 + 12 * 8 + 5 * 32; // 376 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_VERSION = 4;
  static readonly OFFSET_WALLET_ADDRESS = 8;
  static readonly OFFSET_LUT_ADDRESS = 40;
  static readonly OFFSET_REF_ADDRESS = 72;
  static readonly OFFSET_VM_WALLET_ADDRESS = 104;
  static readonly OFFSET_VM_INSTRS = 136;
  static readonly OFFSET_VM_WITHDRAW_TOKEN_ID = 168;
  static readonly OFFSET_VM_MASK = 172;
  static readonly OFFSET_VM_WITHDRAW_AMOUNT = 176;
  static readonly OFFSET_FIRST_REF_LINK_DISCOUNT = 184;
  static readonly OFFSET_SECOND_REF_LINK_DISCOUNT = 192;
  static readonly OFFSET_FIRST_REF_LINK_RATIO = 200;
  static readonly OFFSET_SECOND_REF_LINK_RATIO = 208;
  static readonly OFFSET_REF_PROGRAM_DISCOUNT = 216;
  static readonly OFFSET_REF_PROGRAM_RATIO = 224;
  static readonly OFFSET_RESERVED = 232;
  static readonly OFFSET_MASK = 240;
  static readonly OFFSET_ID = 248;
  static readonly OFFSET_REF_CLIENT_ID = 252;
  static readonly OFFSET_REF_COUNTER = 256;
  static readonly OFFSET_FIRST_REF_LINK_ID = 260;
  static readonly OFFSET_SECOND_REF_LINK_ID = 264;
  static readonly OFFSET_FIRST_REF_LINK_EXPIRATION = 268;
  static readonly OFFSET_SECOND_REF_LINK_EXPIRATION = 272;
  static readonly OFFSET_REF_PROGRAM_EXPIRATION = 276;
  static readonly OFFSET_SPOT_TRADES = 280;
  static readonly OFFSET_PERP_TRADES = 284;
  static readonly OFFSET_LP_TRADES = 288;
  static readonly OFFSET_POINTS = 292;
  static readonly OFFSET_SLOT = 296;
  static readonly OFFSET_ASSETS_COUNT = 300;
  static readonly OFFSET_SPOT_FILLED_ORDERS = 304;
  static readonly OFFSET_PERP_FILLED_ORDERS = 308;
  static readonly OFFSET_LOG_SEQ_NO = 312;
  static readonly OFFSET_RESERVED_VALUE1 = 316;
  static readonly OFFSET_MULTISIG_ADDRESS = 320;
  static readonly OFFSET_RESERVED_VALUE2 = 352;
  static readonly OFFSET_RESERVED_VALUE3 = 360;
  static readonly OFFSET_RESERVED_VALUE4 = 368;

  tag: number;
  version: number;
  walletAddress: Address<any>;
  lutAddress: Address<any>;
  refAddress: Address<any>;
  vmWalletAddress: Address<any>;
  vmInstrs: number[];
  vmWithdrawTokenId: number;
  vmMask: number;
  vmWithdrawAmount: number;
  firstRefLinkDiscount: number;
  secondRefLinkDiscount: number;
  firstRefLinkRatio: number;
  secondRefLinkRatio: number;
  refProgramDiscount: number;
  refProgramRatio: number;
  reserved: number;
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
  points: number;
  slot: number;
  assetsCount: number;
  spotFilledOrders: number;
  perpFilledOrders: number;
  logSeqNo: number;
  reservedValue1: number;
  multisigAddress: Address<any>;
  reservedValue2: number;
  reservedValue3: number;
  reservedValue4: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): ClientPrimaryAccountHeaderModel {
    const result = new ClientPrimaryAccountHeaderModel();
    let autoData = new AutoData(data, offset);
    result.tag = autoData.readU32();
    result.version = autoData.readU32();
    result.walletAddress = autoData.readAddress();
    result.lutAddress = autoData.readAddress();
    result.refAddress = autoData.readAddress();
    result.vmWalletAddress = autoData.readAddress();
    result.vmInstrs = Array.from({length: 8}, () => autoData.readU32());
    result.vmWithdrawTokenId = autoData.readU32();
    result.vmMask = autoData.readU32();
    result.vmWithdrawAmount = autoData.readI64();
    result.firstRefLinkDiscount = autoData.readF64();
    result.secondRefLinkDiscount = autoData.readF64();
    result.firstRefLinkRatio = autoData.readF64();
    result.secondRefLinkRatio = autoData.readF64();
    result.refProgramDiscount = autoData.readF64();
    result.refProgramRatio = autoData.readF64();
    result.reserved = autoData.readI64();
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
    result.points = autoData.readU32();
    result.slot = autoData.readU32();
    result.assetsCount = autoData.readU32();
    result.spotFilledOrders = autoData.readU32();
    result.perpFilledOrders = autoData.readU32();
    result.logSeqNo = autoData.readU32();
    result.reservedValue1 = autoData.readU32();
    result.multisigAddress = autoData.readAddress();
    result.reservedValue2 = autoData.readI64();
    result.reservedValue3 = autoData.readI64();
    result.reservedValue4 = autoData.readI64();
    return result;
  }
}

export class DiscriminatorModel {
  static readonly LENGTH = 2 * 4; // 8 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_VERSION = 4;

  tag: number;
  version: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): DiscriminatorModel {
    const result = new DiscriminatorModel();
    let autoData = new AutoData(data, offset);
    result.tag = autoData.readU32();
    result.version = autoData.readU32();
    return result;
  }
}

export class OperatorModel {
  static readonly LENGTH = 2 * 4 + 1 * 32; // 40 bytes

  static readonly OFFSET_OPERATOR_ADDRESS = 0;
  static readonly OFFSET_VERSION = 32;
  static readonly OFFSET_RESERVED = 36;

  operatorAddress: Address<any>;
  version: number;
  reserved: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): OperatorModel {
    const result = new OperatorModel();
    let autoData = new AutoData(data, offset);
    result.operatorAddress = autoData.readAddress();
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

export class BaseCrncyRecordModel {
  static readonly LENGTH = 2 * 4 + 6 * 8; // 56 bytes

  static readonly OFFSET_CRNCY_TOKEN_ID = 0;
  static readonly OFFSET_DECS_COUNT = 4;
  static readonly OFFSET_FUNDS = 8;
  static readonly OFFSET_RATE = 16;
  static readonly OFFSET_DENOMINATOR = 24;
  static readonly OFFSET_LOCKED_DRVS_AMOUNT = 32;
  static readonly OFFSET_LOCKED_DRVS_DIVIDENDS_VALUE = 40;
  static readonly OFFSET_MASK = 48;

  crncyTokenId: number;
  decsCount: number;
  funds: number;
  rate: number;
  denominator: number;
  lockedDrvsAmount: number;
  lockedDrvsDividendsValue: number;
  mask: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): BaseCrncyRecordModel {
    const result = new BaseCrncyRecordModel();
    let autoData = new AutoData(data, offset);
    result.crncyTokenId = autoData.readU32();
    result.decsCount = autoData.readU32();
    result.funds = autoData.readI64();
    result.rate = autoData.readF64();
    result.denominator = autoData.readF64();
    result.lockedDrvsAmount = autoData.readI64();
    result.lockedDrvsDividendsValue = autoData.readI64();
    result.mask = autoData.readI64();
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

export class VmMaskModel {
  static readonly LENGTH = 1 * 4; // 4 bytes

  static readonly OFFSET_VALUE = 0;

  value: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): VmMaskModel {
    const result = new VmMaskModel();
    let autoData = new AutoData(data, offset);
    result.value = autoData.readU32();
    return result;
  }
}

export class SlotFlagsModel {
  static readonly LENGTH = 1 * 1; // 1 bytes

  static readonly OFFSET_VALUE = 0;

  value: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): SlotFlagsModel {
    const result = new SlotFlagsModel();
    let autoData = new AutoData(data, offset);
    result.value = autoData.readU8();
    return result;
  }
}

export class QuoteOrderModel {
  static readonly LENGTH = 3 * 8; // 24 bytes

  static readonly OFFSET_NEW_PRICE = 0;
  static readonly OFFSET_NEW_QTY = 8;
  static readonly OFFSET_OLD_ID = 16;

  newPrice: number;
  newQty: number;
  oldId: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): QuoteOrderModel {
    const result = new QuoteOrderModel();
    let autoData = new AutoData(data, offset);
    result.newPrice = autoData.readI64();
    result.newQty = autoData.readI64();
    result.oldId = autoData.readI64();
    return result;
  }
}

export class QuoteMaskModel {
  static readonly LENGTH = 1 * 2; // 2 bytes

  static readonly OFFSET_VALUE = 0;

  value: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): QuoteMaskModel {
    const result = new QuoteMaskModel();
    let autoData = new AutoData(data, offset);
    result.value = autoData.readU16();
    return result;
  }
}

export class ClientVmAccountHeaderModel {
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
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): ClientVmAccountHeaderModel {
    const result = new ClientVmAccountHeaderModel();
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

export class VmWhitelistRecordModel {
  static readonly LENGTH = 2 * 4 + 1 * 32; // 40 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_REFERENCE = 4;
  static readonly OFFSET_ADDRESS = 8;

  tag: number;
  reference: number;
  address: Address<any>;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): VmWhitelistRecordModel {
    const result = new VmWhitelistRecordModel();
    let autoData = new AutoData(data, offset);
    result.tag = autoData.readU32();
    result.reference = autoData.readU32();
    result.address = autoData.readAddress();
    return result;
  }
}

export class CappedI64Model {
  static readonly LENGTH = 1 * 8; // 8 bytes

  static readonly OFFSET_VALUE = 0;

  value: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): CappedI64Model {
    const result = new CappedI64Model();
    let autoData = new AutoData(data, offset);
    result.value = autoData.readI64();
    return result;
  }
}

export class InstrMaskModel {
  static readonly LENGTH = 1 * 4; // 4 bytes

  static readonly OFFSET_VALUE = 0;

  value: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): InstrMaskModel {
    const result = new InstrMaskModel();
    let autoData = new AutoData(data, offset);
    result.value = autoData.readU32();
    return result;
  }
}

export class InstrInputMaskModel {
  static readonly LENGTH = 1 * 1; // 1 bytes

  static readonly OFFSET_VALUE = 0;

  value: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): InstrInputMaskModel {
    const result = new InstrInputMaskModel();
    let autoData = new AutoData(data, offset);
    result.value = autoData.readU8();
    return result;
  }
}

export class TokenMaskModel {
  static readonly LENGTH = 1 * 4; // 4 bytes

  static readonly OFFSET_VALUE = 0;

  value: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): TokenMaskModel {
    const result = new TokenMaskModel();
    let autoData = new AutoData(data, offset);
    result.value = autoData.readU32();
    return result;
  }
}

export class PrivateClientHeaderModel {
  static readonly LENGTH = 2 * 4; // 8 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_VERSION = 4;

  tag: number;
  version: number;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): PrivateClientHeaderModel {
    const result = new PrivateClientHeaderModel();
    let autoData = new AutoData(data, offset);
    result.tag = autoData.readU32();
    result.version = autoData.readU32();
    return result;
  }
}

export class PrivateClientModel {
  static readonly LENGTH = 2 * 4 + 1 * 32; // 40 bytes

  static readonly OFFSET_CREATION_TIME = 0;
  static readonly OFFSET_EXPIRATION_TIME = 4;
  static readonly OFFSET_WALLET = 8;

  creationTime: number;
  expirationTime: number;
  wallet: Address<any>;
  static fromBuffer(data: Base64EncodedDataResponse, offset?: number): PrivateClientModel {
    const result = new PrivateClientModel();
    let autoData = new AutoData(data, offset);
    result.creationTime = autoData.readU32();
    result.expirationTime = autoData.readU32();
    result.wallet = autoData.readAddress();
    return result;
  }
}

