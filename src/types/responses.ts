import { Address } from '@solana/kit';
import {
  CommunityAccountHeaderModel,
  ClientCommunityAccountHeaderModel,
  ClientCommunityRecordModel,
  BaseCrncyRecordModel,
  InstrAccountHeaderModel,
  LineQuotesModel,
  OrderModel,
} from '../structure_models';

/**
 * Contains data about orderbook line
 * @property {number} px Price
 * @property {number} qty Quantity
 */
export interface LinePx {
  px: number;
  qty: number;
}

/**
 * Contains data about instrument
 * @property {Address} address Instrument account address
 * @property {InstrAccountHeaderModel} header Instrument account header
 * @property {LineQuotesModel[]} spotBids Spot bids
 * @property {LineQuotesModel[]} spotAsks Spot asks
 * @property {LineQuotesModel[]} perpBids Perp bids
 * @property {LineQuotesModel[]} perpAsks Perp bids
 */
export interface Instrument {
  address: Address;
  header: InstrAccountHeaderModel;
  spotBids: LineQuotesModel[];
  spotAsks: LineQuotesModel[];
  perpBids: LineQuotesModel[];
  perpAsks: LineQuotesModel[];
}

/**
 * Contains data about Token
 * @property {Address} account Deriverse account that stores data about registered token
 * @property {Address} mint Mint token address
 * @property {Address} programAddress SPL token account in which tokens are stored
 * @property {number} id Token ID
 * @property {number} decimals Decimals
 * @property {boolean} baseCrncy Ff this token is currency - true
 * @property {boolean} pool If this token is options pool token - true
 * @property {boolean} token2022 If this token is token 2022 - true
 * @property {number} mainInstrId If If this token is options pool token refers to main instrument ID
 */
export interface Token {
  account: Address;
  mint: Address;
  programAddress: Address;
  id: number;
  decimals: number;
  baseCrncy: boolean;
  pool: boolean;
  token2022: boolean;
  mainInstrId?: number;
}

/**
 * Contains general data about client spot open orders in particular instrument
 * @property {number} bidsCount Open bid orders count
 * @property {number} asksCount Open ask orders count
 * @property {number} bidsEntry Entrypoint in bid orders account
 * @property {number} asksEntry Entrypoint in ask orders account
 * @property {number} contextSlot Context slot of response
 * @property {number} bidSlot Client open bid orders last update slot
 * @property {number} askSlot Client open ask orders last update slot
 * @property {number} tempAssetTokens Asset tokens available to withdraw from client instrument temporary account.
 * It will be automatically transfer to main account during any active transaction with the instrument.
 * @property {number} tempBaseCrncyTokens Base currency tokens available to withdraw from client instrument temporary account
 * It will be automatically transfer to main account during any active transaction with the instrument.
 */
export interface GetClientSpotOrdersInfoResponse {
  bidsCount: number;
  asksCount: number;
  bidsEntry: number;
  asksEntry: number;
  bidSlot: number;
  askSlot: number;
  contextSlot: number;
  tempAssetTokens: number;
  tempCrncyTokens: number;
  inOrdersAssetTokens: number;
  inOrdersCrncyTokens: number;
}

/**
 * Contains general data about client perps in particular instrument
 * @property {number} bidsCount Open bid orders count
 * @property {number} asksCount Open ask orders count
 * @property {number} bidsEntry Entrypoint in bid orders account
 * @property {number} asksEntry Entrypoint in ask orders account
 * @property {number} contextSlot Context slot of response
 * @property {number} bidSlot Client open bid orders last update slot
 * @property {number} askSlot Client open ask orders last update slot
 * @property {number} perps Margin account perps balance
 * @property {number} funds Margin account funds balance
 * @property {number} inOrdersPerps Perps in orders
 * @property {number} inOrdersFunds Funds in orders
 * @property {number} fees Fees statistics
 * @property {number} rebates Rebates statistics
 * @property {number} fundingFunds Funding rate payments statistics
 * @property {number} socLossFunds Socialized losses payments statistics
 * @property {number} result Realized PnL statistics
 * @property {number} cost Position cost
 * @property {number} mask contains some imnformation. First byte - leverage level
 */
export interface GetClientPerpOrdersInfoResponse {
  bidsCount: number;
  asksCount: number;
  bidsEntry: number;
  asksEntry: number;
  bidSlot: number;
  askSlot: number;
  contextSlot: number;
  perps: number;
  funds: number;
  inOrdersPerps: number;
  inOrdersFunds: number;
  fees: number;
  rebates: number;
  socLossFunds: number;
  fundingFunds: number;
  lossCoverage: number;
  result: number;
  cost: number;
  mask: number;
}

/**
 * @property {number} bidContextSlot Client spot bids data context slot
 * @property {number} askContextSlot Client spot asks data context slot
 * @property {OrderModel[]} bids List of client bid spot orders
 * @property {OrderModel[]} asks List of client ask spot orders
 */
export interface GetClientSpotOrdersResponse {
  contextSlot: number;
  bids: OrderModel[];
  asks: OrderModel[];
}

/**
 * @property {number} bidContextSlot Client perp bids data context slot
 * @property {number} askContextSlot Client perp asks data context slot
 * @property {OrderModel[]} bids List of client bid perp orders
 * @property {OrderModel[]} asks List of client ask perp orders
 */
export interface GetClientPerpOrdersResponse {
  contextSlot: number;
  bids: Array<OrderModel>;
  asks: Array<OrderModel>;
}

/**
 * Contains data about SPL tokens on main client account
 * @property {number} tokenId Deriverse SPL token registered ID
 * @property {number} amount Amount of SPL tokens on main client account
 */
export interface ClientTokenData {
  tokenId: number;
  amount: number;
}

/**
 * Contains data about  Deriverse internal spot LP tokens on main client account
 * @property {number} instrId Instrument ID
 * @property {number} amount Amount of Deriverse internal spot LP tokens on main client account
 */
export interface ClientLpData {
  instrId: number;
  amount: number;
}

/**
 * Contains data about temporary instrument spot client account
 * @property {number} instrId Instrument ID
 * @property {number} clientId Temporary client ID
 * @property {number} slot Temporary instrument client last update slot
 */
export interface ClientSpotData {
  instrId: number;
  clientId: number;
  slot: number;
}

/**
 * Contains data about temporary instrument perp client account
 * @property {number} instrId Instrument ID
 * @property {number} clientId Temporary client ID
 * @property {number} slot Temporary instrument client last update slot
 */
export interface ClientPerpData {
  instrId: number;
  clientId: number;
  slot: number;
}

/**
 * Contains information about referal link
 * @property {number} id Referal ID
 * @property {number} expiration Expiration date of referal link
 * @property {number} discount Fees discount
 * @property {number} ratio Referal payments share in fees (minus rebates)
 */
export interface RefLink {
  id: number;
  expiration: number;
  discount: number;
  ratio: number;
}

export interface CommunityData {
  header: CommunityAccountHeaderModel;
  data: Map<number, BaseCrncyRecordModel>;
}

export interface ClientCommunityData {
  header: ClientCommunityAccountHeaderModel;
  data: Map<number, ClientCommunityRecordModel>;
}

/**
 * Contains information about referal program
 * @property {number} address Refferal Wallet
 * @property {number} expiration Expiration date of referal program
 * @property {number} clientId Referal client ID
 * @property {number} discount Fees discount
 * @property {number} ratio Referal payments share in fees (minus rebates)
 */
export interface ClientRefProgramData {
  address: Address;
  expiration: number;
  clientId: number;
  discount: number;
  ratio: number;
}

/**
 * Contains general client data
 * @property {number} clientId Client ID
 * @property {number} points Points for Drverse tokens airdrop
 * @property {number} mask Contains some additioal data
 * @property {number} slot Last update slot
 * @property {number} spotTrades All-time active spot trades
 * @property {number} lpTrades All-time lp trades
 * @property {number} perpTrades All-time active perp trades
 * @property {ClientTokenData[]} tokens Client tokens data
 * @property {ClientLpData[]} lp Client data about Deriverse internal spot LP tokens
 * @property {ClientSpotData[]} spot Client spot trading data
 * @property {ClientPerpData[]} perp Client perp trading data
 */
export interface GetClientDataResponse {
  clientId: number;
  points: number;
  mask: number;
  slot: number;
  spotTrades: number;
  lpTrades: number;
  perpTrades: number;
  tokens: Map<number, ClientTokenData>;
  lp: Map<number, ClientLpData>;
  spot: Map<number, ClientSpotData>;
  perp: Map<number, ClientPerpData>;
  refProgram: ClientRefProgramData;
  refLinks: RefLink[];
  community: ClientCommunityData;
}

export interface KaminoOracleAccounts {
  pyth: Address;
  switchboardPrice: Address;
  switchboardTwap: Address;
  scope: Address;
}

export interface KaminoReserveInfo {
  address: Address;
  lendingMarket: Address;
  liquidityMint: Address;
  liquiditySupply: Address;
  collateralMint: Address;
  collateralSupply: Address;
  feeVault: Address;
  tokenProgram: Address;
  farmCollateral: Address;
  farmDebt: Address;
  oracles: KaminoOracleAccounts;
  loanToValuePct: number;
  liquidationThresholdPct: number;
  mintDecimals: number;
  raw: {
    marketPriceSf: number;
    borrowLimit: number;
    depositLimit: number;
  };
}

export interface KaminoReserveContext extends KaminoReserveInfo {
  vault: Address;
  clientAta: Address;
  obligationFarm: Address;
  reserveFarmState: Address;
  hasFarm: boolean;
}

export interface KaminoContext {
  instrId: number;
  lendingMarket: Address;
  lendingMarketAuthority: Address;
  instrAccount: Address;
  clientPrimaryAccount: Address;
  clientVmAccount: Address | null;
  userMetadata: Address;
  obligation: Address;
  collateralReserve: KaminoReserveContext;
  debtReserve: KaminoReserveContext;
  extraReserves: KaminoReserveInfo[];
}

export interface KaminoLookupTableAddressesResponse {
  marketLut: Address | null;
  clientLut: Address | null;
  instrumentLut: Address | null;
  userLookupTable: Address | null;
  all: Address[];
}

export interface KaminoInstrumentAtasExistResponse {
  assetAta: Address;
  crncyAta: Address;
  assetExists: boolean;
  crncyExists: boolean;
}

export interface KaminoClientReservePosition {
  reserve: Address;
  depositedAmount: number;
  depositedAmountRaw: number;
  depositMarketValue: number;
  borrowedAmount: number;
  borrowedAmountRaw: number;
  borrowMarketValue: number;
}

export interface KaminoClientStateResponse {
  obligation: Address;
  exists: boolean;
  lendingMarket: Address;
  reserves: {
    collateralReserve: Address;
    debtReserve: Address;
  };
  deposits: KaminoClientReservePosition[];
  borrows: KaminoClientReservePosition[];
  totalDepositValue: number;
  totalBorrowValue: number;
  borrowLimit: number;
  unhealthyBorrowValue: number;
  ltv: number | null;
  healthFactor: number | null;
  liquidationBuffer: number | null;
  maxWithdrawEstimate: {
    amount: number;
    amountRaw: number;
    reserve: Address;
  } | null;
  raw: {
    owner?: Address;
    depositedValueSf?: number;
    borrowedAssetsMarketValueSf?: number;
    borrowFactorAdjustedDebtValueSf?: number;
    allowedBorrowValueSf?: number;
    unhealthyBorrowValueSf?: number;
  };
}
