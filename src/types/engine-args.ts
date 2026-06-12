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
  VmInitActivateArgsSchema,
  VmFinalizeActivateArgsSchema,
  VmFinalizeDeactivateArgsSchema,
  VmInitWithdrawArgsSchema,
  VmInitWithdrawCancelArgsSchema,
  VmInitWithdrawFinalizeArgsSchema,
  VmChangeListArgsSchema,
  VmAddWithdrawalAddressArgsSchema,
  VmRemoveWithdrawalAddressArgsSchema,
  VmDirectWithdrawArgsSchema,
  KaminoReserveByMintArgsSchema,
  GetKaminoContextArgsSchema,
  KaminoInitInstrumentArgsSchema,
  KaminoInitObligationArgsSchema,
  KaminoUpdateObligationsArgsSchema,
  KaminoRefreshReservesArgsSchema,
  KaminoChangePositionArgsSchema,
  KaminoLookupTableAddressesArgsSchema,
  KaminoObligationExistsArgsSchema,
  SnapshotKaminoObligationArgsSchema,
  KaminoAtaExistsArgsSchema,
  KaminoInstrumentAccountsExistArgsSchema,
  GetKaminoClientStateArgsSchema,
  GetKaminoClientStateFromBuffersArgsSchema,
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
export type NewInstrumentArgs = z.input<typeof NewInstrumentArgsSchema>;
export type ParsedNewInstrumentArgs = z.infer<typeof NewInstrumentArgsSchema>;
export type GetInstrIdArgs = z.infer<typeof GetInstrIdArgsSchema>;
export type GetSpotContextArgs = z.infer<typeof GetSpotContextArgsSchema>;
export type getInstrAccountByTagArgs = z.infer<typeof GetInstrAccountByTagArgsSchema>;
export type updateInstrDataArgs = z.infer<typeof UpdateInstrDataArgsSchema>;
export type DistribDividendsArgs = z.infer<typeof DistribDividendsArgsSchema>;
export type GetClientSpotOrdersInfoArgs = z.infer<typeof GetClientSpotOrdersInfoArgsSchema>;
export type GetClientPerpOrdersInfoArgs = z.infer<typeof GetClientPerpOrdersInfoArgsSchema>;
export type GetClientSpotOrdersArgs = z.infer<typeof GetClientSpotOrdersArgsSchema>;
export type GetClientPerpOrdersArgs = z.infer<typeof GetClientPerpOrdersArgsSchema>;
export type VmInitActivateArgs = z.infer<typeof VmInitActivateArgsSchema>;
export type VmFinalizeActivateArgs = z.infer<typeof VmFinalizeActivateArgsSchema>;
export type VmFinalizeDeactivateArgs = z.infer<typeof VmFinalizeDeactivateArgsSchema>;
export type VmInitWithdrawArgs = z.infer<typeof VmInitWithdrawArgsSchema>;
export type VmInitWithdrawCancelArgs = z.infer<typeof VmInitWithdrawCancelArgsSchema>;
export type VmInitWithdrawFinalizeArgs = z.infer<typeof VmInitWithdrawFinalizeArgsSchema>;
export type VmChangeListArgs = z.infer<typeof VmChangeListArgsSchema>;
export type VmAddWithdrawalAddressArgs = z.infer<typeof VmAddWithdrawalAddressArgsSchema>;
export type VmRemoveWithdrawalAddressArgs = z.infer<typeof VmRemoveWithdrawalAddressArgsSchema>;
export type VmDirectWithdrawArgs = z.infer<typeof VmDirectWithdrawArgsSchema>;
export type KaminoReserveByMintArgs = z.infer<typeof KaminoReserveByMintArgsSchema>;
export type GetKaminoContextArgs = z.infer<typeof GetKaminoContextArgsSchema>;
export type KaminoInitInstrumentArgs = z.infer<typeof KaminoInitInstrumentArgsSchema>;
export type KaminoInitObligationArgs = z.infer<typeof KaminoInitObligationArgsSchema>;
export type KaminoUpdateObligationsArgs = z.infer<typeof KaminoUpdateObligationsArgsSchema>;
export type KaminoRefreshReservesArgs = z.infer<typeof KaminoRefreshReservesArgsSchema>;
export type KaminoChangePositionArgs = z.infer<typeof KaminoChangePositionArgsSchema>;
export type KaminoLookupTableAddressesArgs = z.infer<typeof KaminoLookupTableAddressesArgsSchema>;
export type KaminoObligationExistsArgs = z.infer<typeof KaminoObligationExistsArgsSchema>;
export type SnapshotKaminoObligationArgs = z.infer<typeof SnapshotKaminoObligationArgsSchema>;
export type KaminoAtaExistsArgs = z.infer<typeof KaminoAtaExistsArgsSchema>;
export type KaminoInstrumentAccountsExistArgs = z.infer<typeof KaminoInstrumentAccountsExistArgsSchema>;
export type GetKaminoClientStateArgs = z.infer<typeof GetKaminoClientStateArgsSchema>;
export type GetKaminoClientStateFromBuffersArgs = z.infer<typeof GetKaminoClientStateFromBuffersArgsSchema>;
