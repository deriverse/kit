import { Buffer } from 'buffer';
import { decode } from 'base64-arraybuffer';

import { Instrument, LogMessage } from '../types';
import { dec, lpDec } from '../constants';
import { TokenStateModel } from '../structure_models';
import { tokenDec } from './utils';
import {
  BuyMarketSeatReportModel,
  ChangePointsReportModel,
  DepositReportModel,
  DrvsAirdropReportModel,
  EarningsReportModel,
  FeesDepositReportModel,
  FeesWithdrawReportModel,
  LogType,
  MoveSpotAvailFundsReportModel,
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
  SwapRefFeesReportModel,
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
  WithdrawReportModel,
} from '../logs_models';

/**
 * Context needed for decoding transaction logs
 */
export interface LogsDecoderContext {
  instruments: Map<number, Instrument>;
  tokens: Map<number, TokenStateModel>;
  uiNumbers: boolean;
}

/**
 * Decode transaction logs into structured log messages
 * @param data Array of log strings from transaction
 * @param ctx Context containing instruments, tokens, and uiNumbers flag
 * @returns Array of decoded log messages
 */
function decodeTransactionLogs(data: readonly string[], ctx: LogsDecoderContext): LogMessage[] {
  const { instruments, tokens, uiNumbers } = ctx;
  let assetTokenDec = 1;
  let crncyTokenDec = 1;
  let logs: LogMessage[] = [];

  for (let log of data) {
    if (log.startsWith('Program returned error') || log.startsWith(`Program logged: "Error`)) {
      return [];
    }
    if (!log.startsWith('Program data: ')) {
      continue;
    }
    const buffer = Buffer.from(decode(log.substring(14)));
    switch (buffer[0]) {
      case LogType.deposit: {
        if (buffer.length == DepositReportModel.LENGTH) {
          let report = DepositReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            crncyTokenDec = tokenDec(tokens, report.tokenId, uiNumbers);
            report.amount /= crncyTokenDec;
          }
          logs.push(report);
        }
        break;
      }
      case LogType.withdraw: {
        if (buffer.length == WithdrawReportModel.LENGTH) {
          let report = WithdrawReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            crncyTokenDec = tokenDec(tokens, report.tokenId, uiNumbers);
            report.amount /= crncyTokenDec;
          }
          logs.push(report);
        }
        break;
      }
      case LogType.perpDeposit: {
        if (buffer.length == PerpDepositReportModel.LENGTH) {
          let report = PerpDepositReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            const instrInfo = instruments.get(report.instrId);
            if (instrInfo) {
              crncyTokenDec = tokenDec(tokens, instrInfo.header.crncyTokenId, uiNumbers);
              report.amount /= crncyTokenDec;
            }
          }
          logs.push(report);
        }
        break;
      }
      case LogType.buyMarketSeat: {
        if (buffer.length == BuyMarketSeatReportModel.LENGTH) {
          let report = BuyMarketSeatReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            const instrInfo = instruments.get(report.instrId);
            if (instrInfo) {
              crncyTokenDec = tokenDec(tokens, instrInfo.header.crncyTokenId, uiNumbers);
              report.amount /= crncyTokenDec;
              report.seatPrice /= crncyTokenDec;
            }
          }
          logs.push(report);
        }
        break;
      }
      case LogType.sellMarketSeat: {
        if (buffer.length == SellMarketSeatReportModel.LENGTH) {
          let report = SellMarketSeatReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            const instrInfo = instruments.get(report.instrId);
            if (instrInfo) {
              crncyTokenDec = tokenDec(tokens, instrInfo.header.crncyTokenId, uiNumbers);
              report.seatPrice /= crncyTokenDec;
            }
          }
          logs.push(report);
        }
        break;
      }
      case LogType.perpWithdraw: {
        if (buffer.length == PerpWithdrawReportModel.LENGTH) {
          let report = PerpWithdrawReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            const instrInfo = instruments.get(report.instrId);
            if (instrInfo) {
              crncyTokenDec = tokenDec(tokens, instrInfo.header.crncyTokenId, uiNumbers);
              report.amount /= crncyTokenDec;
            }
          }
          logs.push(report);
        }
        break;
      }
      case LogType.feesDeposit: {
        if (buffer.length == FeesDepositReportModel.LENGTH) {
          let report = FeesDepositReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            crncyTokenDec = tokenDec(tokens, report.tokenId, uiNumbers);
            report.amount /= crncyTokenDec;
          }
          logs.push(report);
        }
        break;
      }
      case LogType.feesWithdraw: {
        if (buffer.length == FeesWithdrawReportModel.LENGTH) {
          let report = FeesWithdrawReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            crncyTokenDec = tokenDec(tokens, report.tokenId, uiNumbers);
            report.amount /= crncyTokenDec;
          }
          logs.push(report);
        }
        break;
      }
      case LogType.spotLpTrade: {
        if (buffer.length == SpotlpTradeReportModel.LENGTH) {
          let report = SpotlpTradeReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            const instrInfo = instruments.get(report.instrId);
            if (instrInfo) {
              assetTokenDec = tokenDec(tokens, instrInfo.header.assetTokenId, uiNumbers);
              crncyTokenDec = tokenDec(tokens, instrInfo.header.crncyTokenId, uiNumbers);
              report.qty /= lpDec;
              report.tokens /= assetTokenDec;
              report.crncy /= crncyTokenDec;
            }
          }
          logs.push(report);
        }
        break;
      }
      case LogType.moveSpot: {
        if (buffer.length == MoveSpotAvailFundsReportModel.LENGTH) {
          let report = MoveSpotAvailFundsReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            const instrInfo = instruments.get(report.instrId);
            if (instrInfo) {
              assetTokenDec = tokenDec(tokens, instrInfo.header.assetTokenId, uiNumbers);
              crncyTokenDec = tokenDec(tokens, instrInfo.header.crncyTokenId, uiNumbers);
              report.qty /= assetTokenDec;
              report.crncy /= crncyTokenDec;
            }
          }
          logs.push(report);
        }
        break;
      }
      case LogType.earnings: {
        if (buffer.length == EarningsReportModel.LENGTH) {
          let report = EarningsReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            crncyTokenDec = tokenDec(tokens, report.tokenId, uiNumbers);
            report.amount /= crncyTokenDec;
          }
          logs.push(report);
        }
        break;
      }
      case LogType.drvsAirdrop: {
        if (buffer.length == DrvsAirdropReportModel.LENGTH) {
          let report = DrvsAirdropReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            crncyTokenDec = tokenDec(tokens, 0, uiNumbers);
            report.amount /= crncyTokenDec;
          }
          logs.push(report);
        }
        break;
      }
      case LogType.spotPlaceOrder: {
        if (buffer.length == SpotPlaceOrderReportModel.LENGTH) {
          let report = SpotPlaceOrderReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            const instrInfo = instruments.get(report.instrId);
            if (instrInfo) {
              assetTokenDec = tokenDec(tokens, instrInfo.header.assetTokenId, uiNumbers);
              crncyTokenDec = tokenDec(tokens, instrInfo.header.crncyTokenId, uiNumbers);
              report.qty /= assetTokenDec;
            }
            report.price /= dec;
          }
          logs.push(report);
        }
        break;
      }
      case LogType.spotFillOrder: {
        if (buffer.length == SpotFillOrderReportModel.LENGTH) {
          let report = SpotFillOrderReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            report.qty /= assetTokenDec;
            report.crncy /= crncyTokenDec;
            report.rebates /= crncyTokenDec;
            report.price /= dec;
          }
          logs.push(report);
        }
        break;
      }
      case LogType.spotNewOrder: {
        if (buffer.length == SpotNewOrderReportModel.LENGTH) {
          let report = SpotNewOrderReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            report.qty /= assetTokenDec;
            report.crncy /= crncyTokenDec;
          }
          logs.push(report);
        }
        break;
      }
      case LogType.spotOrderCancel: {
        if (buffer.length == SpotOrderCancelReportModel.LENGTH) {
          let report = SpotOrderCancelReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            const instrInfo = instruments.get(report.instrId);
            if (instrInfo) {
              assetTokenDec = tokenDec(tokens, instrInfo.header.assetTokenId, uiNumbers);
              crncyTokenDec = tokenDec(tokens, instrInfo.header.crncyTokenId, uiNumbers);
              report.qty /= assetTokenDec;
              report.crncy /= crncyTokenDec;
            }
          }
          logs.push(report);
        }
        break;
      }
      case LogType.spotOrderRevoke: {
        if (buffer.length == SpotOrderRevokeReportModel.LENGTH) {
          let report = SpotOrderRevokeReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            report.qty /= assetTokenDec;
            report.crncy /= crncyTokenDec;
          }
          logs.push(report);
        }
        break;
      }
      case LogType.spotFees: {
        if (buffer.length == SpotFeesReportModel.LENGTH) {
          let report = SpotFeesReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            report.fees /= crncyTokenDec;
            report.refPayment /= crncyTokenDec;
          }
          logs.push(report);
        }
        break;
      }
      case LogType.spotPlaceMassCancel: {
        if (buffer.length == SpotPlaceMassCancelReportModel.LENGTH) {
          let report = SpotPlaceMassCancelReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            const instrInfo = instruments.get(report.instrId);
            if (instrInfo) {
              assetTokenDec = tokenDec(tokens, instrInfo.header.assetTokenId, uiNumbers);
              crncyTokenDec = tokenDec(tokens, instrInfo.header.crncyTokenId, uiNumbers);
            }
          }
          logs.push(report);
        }
        break;
      }
      case LogType.spotMassCancel: {
        if (buffer.length == SpotMassCancelReportModel.LENGTH) {
          let report = SpotMassCancelReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            report.qty /= assetTokenDec;
            report.crncy /= crncyTokenDec;
          }
          logs.push(report);
        }
        break;
      }
      case LogType.perpPlaceOrder: {
        if (buffer.length == PerpPlaceOrderReportModel.LENGTH) {
          let report = PerpPlaceOrderReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            const instrInfo = instruments.get(report.instrId);
            if (instrInfo) {
              assetTokenDec = tokenDec(tokens, instrInfo.header.assetTokenId, uiNumbers);
              crncyTokenDec = tokenDec(tokens, instrInfo.header.crncyTokenId, uiNumbers);
              report.perps /= assetTokenDec;
            }
            report.price /= dec;
          }
          logs.push(report);
        }
        break;
      }
      case LogType.perpFillOrder: {
        if (buffer.length == PerpFillOrderReportModel.LENGTH) {
          let report = PerpFillOrderReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            report.perps /= assetTokenDec;
            report.crncy /= crncyTokenDec;
            report.rebates /= crncyTokenDec;
            report.price /= dec;
          }
          logs.push(report);
        }
        break;
      }
      case LogType.perpNewOrder: {
        if (buffer.length == PerpNewOrderReportModel.LENGTH) {
          let report = PerpNewOrderReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            report.perps /= assetTokenDec;
            report.crncy /= crncyTokenDec;
          }
          logs.push(report);
        }
        break;
      }
      case LogType.perpOrderCancel: {
        if (buffer.length == PerpOrderCancelReportModel.LENGTH) {
          let report = PerpOrderCancelReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            const instrInfo = instruments.get(report.instrId);
            if (instrInfo) {
              assetTokenDec = tokenDec(tokens, instrInfo.header.assetTokenId, uiNumbers);
              crncyTokenDec = tokenDec(tokens, instrInfo.header.crncyTokenId, uiNumbers);
              report.perps /= assetTokenDec;
              report.crncy /= crncyTokenDec;
            }
          }
          logs.push(report);
        }
        break;
      }
      case LogType.perpOrderRevoke: {
        if (buffer.length == PerpOrderRevokeReportModel.LENGTH) {
          let report = PerpOrderRevokeReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            report.perps /= assetTokenDec;
            report.crncy /= crncyTokenDec;
          }
          logs.push(report);
        }
        break;
      }
      case LogType.perpFees: {
        if (buffer.length == PerpFeesReportModel.LENGTH) {
          let report = PerpFeesReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            report.fees /= crncyTokenDec;
            report.refPayment /= crncyTokenDec;
          }
          logs.push(report);
        }
        break;
      }
      case LogType.perpPlaceMassCancel: {
        if (buffer.length == PerpPlaceMassCancelReportModel.LENGTH) {
          let report = PerpPlaceMassCancelReportModel.fromBuffer(buffer);
          logs.push(report);
        }
        break;
      }
      case LogType.perpMassCancel: {
        if (buffer.length == PerpMassCancelReportModel.LENGTH) {
          let report = PerpMassCancelReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            report.perps /= assetTokenDec;
            report.crncy /= crncyTokenDec;
          }
          logs.push(report);
        }
        break;
      }
      case LogType.perpFunding: {
        if (buffer.length == PerpFundingReportModel.LENGTH) {
          let report = PerpFundingReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            report.funding /= crncyTokenDec;
          }
          logs.push(report);
        }
        break;
      }
      case LogType.perpSocLoss: {
        if (buffer.length == PerpSocLossReportModel.LENGTH) {
          let report = PerpSocLossReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            report.socLoss /= crncyTokenDec;
          }
          logs.push(report);
        }
        break;
      }
      case LogType.perpChangeLeverage: {
        if (buffer.length == PerpChangeLeverageReportModel.LENGTH) {
          let report = PerpChangeLeverageReportModel.fromBuffer(buffer);
          logs.push(report);
        }
        break;
      }
      case LogType.swapOrder: {
        if (buffer.length == PlaceSwapOrderReportModel.LENGTH) {
          let report = PlaceSwapOrderReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            const instrInfo = instruments.get(report.instrId);
            if (instrInfo) {
              assetTokenDec = tokenDec(tokens, instrInfo.header.assetTokenId, uiNumbers);
              crncyTokenDec = tokenDec(tokens, instrInfo.header.crncyTokenId, uiNumbers);
              report.qty /= assetTokenDec;
            }
            report.price /= dec;
          }
          logs.push(report);
        }
        break;
      }
      case LogType.changedPoints: {
        if (buffer.length == ChangePointsReportModel.LENGTH) {
          let report = ChangePointsReportModel.fromBuffer(buffer);
          logs.push(report);
        }
        break;
      }
      case LogType.swapFees: {
        if (buffer.length == SwapRefFeesReportModel.LENGTH) {
          let report = SwapRefFeesReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            report.fees /= crncyTokenDec;
          }
          logs.push(report);
        }
        break;
      }
      case LogType.vmInitActivate: {
        if (buffer.length == VmInitActivateReportModel.LENGTH) {
          let report = VmInitActivateReportModel.fromBuffer(buffer);
          logs.push(report);
        }
        break;
      }
      case LogType.vmInitActivateCancel: {
        if (buffer.length == VmInitActivateCancelReportModel.LENGTH) {
          let report = VmInitActivateCancelReportModel.fromBuffer(buffer);
          logs.push(report);
        }
        break;
      }
      case LogType.vmFinalizeActivate: {
        if (buffer.length == VmFinalizeActivateReportModel.LENGTH) {
          let report = VmFinalizeActivateReportModel.fromBuffer(buffer);
          logs.push(report);
        }
        break;
      }
      case LogType.vmInitDeactivate: {
        if (buffer.length == VmInitDeactivateReportModel.LENGTH) {
          let report = VmInitDeactivateReportModel.fromBuffer(buffer);
          logs.push(report);
        }
        break;
      }
      case LogType.vmInitDeactivateCancel: {
        if (buffer.length == VmInitDeactivateCancelReportModel.LENGTH) {
          let report = VmInitDeactivateCancelReportModel.fromBuffer(buffer);
          logs.push(report);
        }
        break;
      }
      case LogType.vmFinalizeDeactivate: {
        if (buffer.length == VmFinalizeDeactivateReportModel.LENGTH) {
          let report = VmFinalizeDeactivateReportModel.fromBuffer(buffer);
          logs.push(report);
        }
        break;
      }
      case LogType.vmChangeList: {
        if (buffer.length == VmChangeListReportModel.LENGTH) {
          let report = VmChangeListReportModel.fromBuffer(buffer);
          logs.push(report);
        }
        break;
      }
      case LogType.vmInitWithdraw: {
        if (buffer.length == VmInitWithdrawReportModel.LENGTH) {
          let report = VmInitWithdrawReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            crncyTokenDec = tokenDec(tokens, report.tokenId, uiNumbers);
            report.amount /= crncyTokenDec;
          }
          logs.push(report);
        }
        break;
      }
      case LogType.vmInitWithdrawCancel: {
        if (buffer.length == VmInitWithdrawCancelReportModel.LENGTH) {
          let report = VmInitWithdrawCancelReportModel.fromBuffer(buffer);
          logs.push(report);
        }
        break;
      }
      case LogType.vmInitWithdrawFinalize: {
        if (buffer.length == VmInitWithdrawFinalizeReportModel.LENGTH) {
          let report = VmInitWithdrawFinalizeReportModel.fromBuffer(buffer);
          if (uiNumbers) {
            crncyTokenDec = tokenDec(tokens, report.tokenId, uiNumbers);
            report.amount /= crncyTokenDec;
          }
          logs.push(report);
        }
        break;
      }
    }
  }
  return logs;
}

export { decodeTransactionLogs };
