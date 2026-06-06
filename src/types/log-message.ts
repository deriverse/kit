import {
  BuyMarketSeatReportModel,
  DepositReportModel,
  DrvsAirdropReportModel,
  EarningsReportModel,
  FeesDepositReportModel,
  FeesWithdrawReportModel,
  PerpChangeLeverageReportModel,
  PerpDepositReportModel,
  PerpFeesReportModel,
  PerpFillOrderReportModel,
  PerpFundingReportModel,
  PerpMassCancelReportModel,
  PerpNewOrderReportModel,
  PerpOrderCancelReportModel,
  PerpOrderRevokeReportModel,
  PerpPlaceMassCancelReportModel,
  PerpPlaceOrderReportModel,
  PerpSocLossReportModel,
  PerpWithdrawReportModel,
  ChangePointsReportModel,
  MoveSpotAvailFundsReportModel,
  PlaceSwapOrderReportModel,
  SellMarketSeatReportModel,
  SpotFeesReportModel,
  SpotFillOrderReportModel,
  SpotlpTradeReportModel,
  SpotMassCancelReportModel,
  SpotNewOrderReportModel,
  SpotOrderCancelReportModel,
  SpotOrderRevokeReportModel,
  SpotPlaceMassCancelReportModel,
  SpotPlaceOrderReportModel,
  VmChangeListReportModel,
  VmFinalizeActivateReportModel,
  VmFinalizeDeactivateReportModel,
  VmInitActivateCancelReportModel,
  VmInitActivateReportModel,
  VmInitDeactivateCancelReportModel,
  VmInitDeactivateReportModel,
  VmInitWithdrawCancelReportModel,
  VmInitWithdrawFinalizeReportModel,
  VmInitWithdrawReportModel,
  KaminoChangePositionReportModel,
  WithdrawReportModel,
} from '../logs_models';

export type LogMessage =
  | DepositReportModel
  | WithdrawReportModel
  | PerpDepositReportModel
  | PerpWithdrawReportModel
  | FeesDepositReportModel
  | FeesWithdrawReportModel
  | SpotlpTradeReportModel
  | EarningsReportModel
  | DrvsAirdropReportModel
  | SpotPlaceOrderReportModel
  | SpotFillOrderReportModel
  | SpotNewOrderReportModel
  | SpotOrderCancelReportModel
  | SpotOrderRevokeReportModel
  | SpotFeesReportModel
  | SpotPlaceMassCancelReportModel
  | SpotMassCancelReportModel
  | PerpPlaceOrderReportModel
  | PerpFillOrderReportModel
  | PerpNewOrderReportModel
  | PerpOrderCancelReportModel
  | PerpOrderRevokeReportModel
  | PerpFeesReportModel
  | PerpPlaceMassCancelReportModel
  | PerpMassCancelReportModel
  | PerpFundingReportModel
  | PerpSocLossReportModel
  | PerpChangeLeverageReportModel
  | BuyMarketSeatReportModel
  | SellMarketSeatReportModel
  | PlaceSwapOrderReportModel
  | MoveSpotAvailFundsReportModel
  | ChangePointsReportModel
  | VmInitActivateReportModel
  | VmInitActivateCancelReportModel
  | VmFinalizeActivateReportModel
  | VmInitDeactivateReportModel
  | VmInitDeactivateCancelReportModel
  | VmFinalizeDeactivateReportModel
  | VmChangeListReportModel
  | VmInitWithdrawReportModel
  | VmInitWithdrawCancelReportModel
  | VmInitWithdrawFinalizeReportModel
  | KaminoChangePositionReportModel;
