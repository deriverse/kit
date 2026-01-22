import { z } from 'zod';
import {
  EngineArgsSchema,
  InstrIdSchema,
  DepositArgsSchema,
  WithdrawArgsSchema,
  NewSpotOrderArgsSchema,
  SpotQuotesReplaceArgsSchema,
  SwapArgsSchema,
  SpotOrderCancelArgsSchema,
  SpotMassCancelArgsSchema,
  SpotLpArgsSchema,
  PerpDepositArgsSchema,
  PerpBuySeatArgsSchema,
  PerpSellSeatArgsSchema,
  NewPerpOrderArgsSchema,
  PerpQuotesReplaceArgsSchema,
  PerpOrderCancelArgsSchema,
  PerpMassCancelArgsSchema,
  PerpChangeLeverageArgsSchema,
  PerpStatisticsResetArgsSchema,
  PerpForcedCloseArgsSchema,
  NewInstrumentArgsSchema,
  GetInstrIdArgsSchema,
  GetSpotContextArgsSchema,
  GetInstrAccountByTagArgsSchema,
  UpdateInstrDataArgsSchema,
  DistribDividendsArgsSchema,
  GetClientSpotOrdersInfoArgsSchema,
  GetClientPerpOrdersInfoArgsSchema,
  GetClientSpotOrdersArgsSchema,
  GetClientPerpOrdersArgsSchema,
} from './schemas';

export type EngineArgs = z.infer<typeof EngineArgsSchema>;
export type InstrId = z.infer<typeof InstrIdSchema>;
export type DepositArgs = z.infer<typeof DepositArgsSchema>;
export type WithdrawArgs = z.infer<typeof WithdrawArgsSchema>;
export type NewSpotOrderArgs = z.infer<typeof NewSpotOrderArgsSchema>;
export type SpotQuotesReplaceArgs = z.infer<typeof SpotQuotesReplaceArgsSchema>;
export type SwapArgs = z.infer<typeof SwapArgsSchema>;
export type SpotOrderCancelArgs = z.infer<typeof SpotOrderCancelArgsSchema>;
export type SpotMassCancelArgs = z.infer<typeof SpotMassCancelArgsSchema>;
export type SpotLpArgs = z.infer<typeof SpotLpArgsSchema>;
export type PerpDepositArgs = z.infer<typeof PerpDepositArgsSchema>;
export type PerpBuySeatArgs = z.infer<typeof PerpBuySeatArgsSchema>;
export type PerpSellSeatArgs = z.infer<typeof PerpSellSeatArgsSchema>;
export type NewPerpOrderArgs = z.infer<typeof NewPerpOrderArgsSchema>;
export type PerpQuotesReplaceArgs = z.infer<typeof PerpQuotesReplaceArgsSchema>;
export type PerpOrderCancelArgs = z.infer<typeof PerpOrderCancelArgsSchema>;
export type PerpMassCancelArgs = z.infer<typeof PerpMassCancelArgsSchema>;
export type PerpChangeLeverageArgs = z.infer<typeof PerpChangeLeverageArgsSchema>;
export type PerpStatisticsResetArgs = z.infer<typeof PerpStatisticsResetArgsSchema>;
export type PerpForcedCloseArgs = z.infer<typeof PerpForcedCloseArgsSchema>;
export type NewInstrumentArgs = z.infer<typeof NewInstrumentArgsSchema>;
export type GetInstrIdArgs = z.infer<typeof GetInstrIdArgsSchema>;
export type GetSpotContextArgs = z.infer<typeof GetSpotContextArgsSchema>;
export type getInstrAccountByTagArgs = z.infer<typeof GetInstrAccountByTagArgsSchema>;
export type updateInstrDataArgs = z.infer<typeof UpdateInstrDataArgsSchema>;
export type DistribDividendsArgs = z.infer<typeof DistribDividendsArgsSchema>;
export type GetClientSpotOrdersInfoArgs = z.infer<typeof GetClientSpotOrdersInfoArgsSchema>;
export type GetClientPerpOrdersInfoArgs = z.infer<typeof GetClientPerpOrdersInfoArgsSchema>;
export type GetClientSpotOrdersArgs = z.infer<typeof GetClientSpotOrdersArgsSchema>;
export type GetClientPerpOrdersArgs = z.infer<typeof GetClientPerpOrdersArgsSchema>;
