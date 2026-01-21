import { Address, Commitment } from '@solana/kit';

export interface EngineArgs {
  programId?: Address<any>;
  version?: number;
  commitment?: Commitment;
  uiNumbers?: boolean;
}

/**
 * @property {number} instrId Instrument ID
 */
export interface InstrId {
  instrId: number;
}

/**
 * Contains data for deposit function
 *  @property {number} tokenId Deriverse SPL token registered ID
 *  @property {number} amount Amount to deposit
 *  @property {number} refId  Referal Link ID for new account. Zero means no ref link
 *  @property {number} refId  Referal Wallet
 */
export interface DepositArgs {
  tokenId: number;
  amount?: number;
  refId?: number;
  refWallet?: Address;
  all_funds?: boolean;
}

/**
 * Contains data for withdrawSplTokenInstruction function
 * @property {number} tokenId Deriverse token registered ID
 * @property {number} amount Amount to withdraw
 * @property {instrId[]} spot List of instruments ID to withdraw from client temporary instrument accounts
 * client temporary derivative instrument accounts
 */
export interface WithdrawArgs {
  tokenId: number;
  amount: number;
  spot?: Array<InstrId>;
}

/**
 * Contains data for addSpotOrderInstruction
 * @property {number} instrId Instrument ID
 * @property {number} price Order price
 * @property {number} qty Order quantity
 * @property {number} ioc - Immediate Or Cancel. If true no new open order after this instruction execution.
 * @property {number} orderType 0 - Limit, 1 - Market
 * @property {number} side 0 - Bid, 1 - Ask
 */
export interface NewSpotOrderArgs {
  instrId: number;
  price: number;
  qty: number;
  ioc?: number;
  orderType?: number;
  side: number;
  edgePrice?: number;
}

/**
 * Contains data for spotQuotesReplaceInstruction
 * @property {number} instrId Instrument ID
 * @property {number} bidOrderIdToCancel Order ID that you want to cancel on bid side, zero value means no actions
 * @property {number} askOrderIdToCancel Order ID that you want to cancel on ask side, zero value means no actions
 * @property {number} newBidPrice New order bid price
 * @property {number} newAskPrice New order ask price
 * @property {number} newBidQty New order bid quantity, zero value means no actions
 * @property {number} newAskQty New order ask quantity, zero value means no actions
 */
export interface SpotQuotesReplaceArgs {
  instrId: number;
  bidOrderIdToCancel: number;
  newBidPrice: number;
  newBidQty: number;
  askOrderIdToCancel: number;
  newAskPrice: number;
  newAskQty: number;
}

/**
 * Contains data for swapInstruction
 * @property {Address} assetMint Asset Token Mint
 * @property {Address} crncyMint Crncy Token Mint
 * @property {number} amount Amount to swap
 * @property {number} limitPrice limit price
 * @property {boolean} crncyInput crncy token as input token
 */
export interface SwapArgs {
  assetMint: Address<any>;
  crncyMint: Address<any>;
  amount: number;
  limitPrice: number;
  crncyInput: boolean;
}

/**
 * Contains data for perpQuotesReplaceInstruction
 * @property {number} instrId Instrument ID
 * @property {number} bidOrderIdToCancel Order ID that you want to cancel on bid side, zero value means no actions
 * @property {number} askOrderIdToCancel Order ID that you want to cancel on ask side, zero value means no actions
 * @property {number} newBidPrice New order bid price
 * @property {number} newAskPrice New order ask price
 * @property {number} newBidQty New order bid quantity, zero value means no actions
 * @property {number} newAskQty New order ask quantity, zero value means no actions
 */
export interface PerpQuotesReplaceArgs {
  instrId: number;
  bidOrderIdToCancel: number;
  newBidPrice: number;
  newBidQty: number;
  askOrderIdToCancel: number;
  newAskPrice: number;
  newAskQty: number;
}

/**
 * Contains data for spotOrderCancelInstruction function
 * @property {number} instrId Instrument ID
 * @property {number} orderId Order ID to cancel
 * @property {number} side Side. 0 - bid side, 1 - ask side
 */
export interface SpotOrderCancelArgs {
  instrId: number;
  orderId: number;
  side: number;
}

/**
 * Contains data for perpOrderCancelInstruction function
 * @property {number} instrId Instrument ID
 * @property {number} orderId Order ID to cancel
 * @property {number} side Side. 0 - bid side, 1 - ask side
 */
export interface PerpOrderCancelArgs {
  instrId: number;
  orderId: number;
  side: number;
}

/**
 * Contains data for spotMassCancelInstruction
 * @property {number} instrId Instrument ID
 */
export interface SpotMassCancelArgs {
  instrId: number;
}

export interface PerpMassCancelArgs {
  instrId: number;
}

export interface PerpStatisticsResetArgs {
  instrId: number;
}

export interface PerpChangeLeverageArgs {
  instrId: number;
  leverage: number;
}

export interface PerpForcedCloseArgs {
  instrId: number;
  clientPrimaryAccount: Address;
}

/**
 * Contains data for getInstrId function
 * @property {number} assetTokenId Asset Deriverse token registered ID
 * @property {number} baseCrncyTokenId Base currency Deriverse token registered ID
 */
export interface GetInstrIdArgs {
  assetTokenId: number;
  crncyTokenId: number;
}

export interface GetSpotContextArgs {
  assetTokenId: number;
  crncyTokenId: number;
}

export interface getInstrAccountByTagArgs {
  assetTokenId: number;
  crncyTokenId: number;
  tag: number;
}

export interface updateInstrDataArgs {
  assetTokenId: number;
  crncyTokenId: number;
}

/**
 * Contains data for spotLpInstruction function
 * @property {number} instrId Instrument ID
 * @property {number} amount Amount of tokens to trade. Negative value means selling
 */
export interface SpotLpArgs {
  instrId: number;
  side: number;
  amount: number;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Contains data for distribFundsInstruction function
 * @property {number[]} instruments Instruments ID
 */
export interface DistribDividendsArgs {
  instruments: number[];
}

export interface PerpDepositArgs {
  instrId: number;
  amount: number;
}

export interface PerpBuySeatArgs {
  instrId: number;
  amount: number;
  slippage?: number;
}

export interface PerpSellSeatArgs {
  instrId: number;
  slippage?: number;
}

export interface NewPerpOrderArgs {
  instrId: number;
  ioc?: number;
  orderType?: number;
  qty: number;
  price: number;
  leverage?: number;
  side: number;
  edgePrice?: number;
}

export interface NewInstrumentArgs {
  assetMint: Address<any>;
  crncyMint: Address<any>;
  newProgramAccountAddress?: Address<any>;
  initialPrice: number;
}

/**
 * Contains data for getClientSpotOrdersInfo function
 * @property {number} instrId Instrument ID
 * @property {number} clientId Temporary spot client ID. Use getClientData function to get this value.
 */
export interface GetClientSpotOrdersInfoArgs {
  instrId: number;
  clientId: number;
}

/**
 * Contains data for getClientPerpOrdersInfo function
 * @property {number} instrId Instrument ID
 * @property {number} clientId Temporary perp client ID. Use getClientData function to get this value.
 */
export interface GetClientPerpOrdersInfoArgs {
  instrId: number;
  clientId: number;
}

/**
 * Contains data for getClientSpotOrders function
 * @property {number} instrId instrument ID
 * @property {number} bidsCount Client spot bid orders count. Use getClientSpotOrdersInfo function to get this value.
 * @property {number} asksCount Client spot ask orders count. Use getClientSpotOrdersInfo function to get this value.
 * @property {number} bidsEntry Entrypoint in spot bid orders account. Use getClientSpotOrdersInfo function to get this value.
 * @property {number} asksEntry Entrypoint in spot ask orders account. Use getClientSpotOrdersInfo function to get this value.
 */
export interface GetClientSpotOrdersArgs {
  instrId: number;
  bidsCount: number;
  asksCount: number;
  bidsEntry: number;
  asksEntry: number;
}

/**
 * Contains data for getClientPerpOrders function
 * @property {number} instrId instrument ID
 * @property {number} bidsCount Client spot bid orders count. Use getClientPerpOrdersInfo function to get this value.
 * @property {number} asksCount Client spot ask orders count. Use getClientPerpOrdersInfo function to get this value.
 * @property {number} bidsEntry Entrypoint in spot bid orders account. Use getClientPerpOrdersInfo function to get this value.
 * @property {number} asksEntry Entrypoint in spot ask orders account. Use getClientPerpOrdersInfo function to get this value.
 */
export interface GetClientPerpOrdersArgs {
  instrId: number;
  bidsCount: number;
  asksCount: number;
  bidsEntry: number;
  asksEntry: number;
}
