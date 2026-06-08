import { z } from 'zod';
import { Address, Base64EncodedDataResponse, Commitment } from '@solana/kit';

const nonNegativeInt = z.int().nonnegative({ error: 'Must be a non-negative integer' });
const positiveNumber = z.number().positive({ error: 'Must be a positive number' });
const signedAmount = z.number().finite({ error: 'Must be a finite number' });
const side = z.int().min(0).max(1, { error: 'Side must be 0 (Bid) or 1 (Ask)' });
const orderType = z.int().min(0).max(1, { error: 'Order type must be 0 (Limit) or 1 (Market)' });
const iocFlag = z.int().min(0).max(1, { error: 'IOC flag must be 0 (No) or 1 (Yes)' });
const solanaAddress = z.custom<Address>((val) => typeof val === 'string', { error: 'Must be a valid Solana address' });
const commitment = z.custom<Commitment>((val) => typeof val === 'string', {
  error: 'Must be a valid commitment level',
});
const base64EncodedDataResponse = z.custom<Base64EncodedDataResponse>(
  (val) => Array.isArray(val) && typeof val[0] === 'string' && val[1] === 'base64',
  { error: 'Must be a base64 encoded account data response' },
);

const EngineArgsSchema = z.object({
  programId: solanaAddress.optional(),
  version: nonNegativeInt.optional(),
  commitment: commitment.optional(),
  uiNumbers: z.boolean().optional(),
});

const InstrIdSchema = z.object({
  instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
});

const DepositArgsSchema = z.object({
  tokenId: nonNegativeInt.meta({ description: 'Deriverse SPL token registered ID' }),
  amount: positiveNumber.optional().meta({ description: 'Amount to deposit' }),
  refId: nonNegativeInt.optional().meta({ description: 'Referal Link ID for new account. Zero means no ref link' }),
  refWallet: solanaAddress.optional().meta({ description: 'Referal Wallet' }),
  all_funds: z.boolean().optional(),
  customId: nonNegativeInt.optional().meta({ description: 'Custom ID' }),
});

const WithdrawArgsSchema = z.object({
  tokenId: nonNegativeInt.meta({ description: 'Deriverse token registered ID' }),
  amount: positiveNumber.meta({ description: 'Amount to withdraw' }),
  spot: z
    .array(InstrIdSchema)
    .optional()
    .meta({ description: 'List of instruments ID to withdraw from client temporary instrument accounts' }),
  customId: nonNegativeInt.optional().meta({ description: 'Custom ID' }),
});

const NewSpotOrderArgsSchema = z.object({
  instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
  price: positiveNumber.meta({ description: 'Order price' }),
  qty: positiveNumber.meta({ description: 'Order quantity' }),
  ioc: iocFlag
    .optional()
    .meta({ description: 'Immediate Or Cancel. If true no new open order after this instruction execution' }),
  orderType: orderType.optional().meta({ description: '0 - Limit, 1 - Market' }),
  side: side.meta({ description: '0 - Bid, 1 - Ask' }),
  edgePrice: positiveNumber.optional(),
});

const QuoteOrderSchema = z.object({
  newPrice: z.number().nonnegative({ error: 'Price must be non-negative' }).meta({ description: 'New order price' }),
  newQty: z
    .number()
    .nonnegative({ error: 'Quantity must be non-negative' })
    .meta({ description: 'New order quantity' }),
  oldId: nonNegativeInt.meta({ description: 'Old order ID to cancel, zero means no action' }),
  side: side.meta({ description: '0 - Bid, 1 - Ask' }),
});

const SpotQuotesReplaceArgsSchema = z.object({
  instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
  bump: nonNegativeInt.optional().meta({ description: 'Bump' }),
  orderType: nonNegativeInt.optional().meta({ description: 'Order type' }),
  bailOnOrderNotFound: z.boolean().optional().meta({
    description: 'If true, fail the instruction when an order to cancel is not found',
  }),
  orders: z
    .array(QuoteOrderSchema)
    .min(1)
    .max(12, { error: 'Exceeded orders limit of 12' })
    .meta({ description: 'Quote orders to place/replace' }),
});

const SwapArgsSchema = z.object({
  assetMint: solanaAddress.meta({ description: 'Asset Token Mint' }),
  crncyMint: solanaAddress.meta({ description: 'Currency Token Mint' }),
  amount: positiveNumber.meta({ description: 'Amount to swap' }),
  limitPrice: z.number().min(0, { error: 'Limit price must be at least 0' }).meta({ description: 'Limit price' }),
  crncyInput: z.boolean().meta({ description: 'Currency token as input token' }),
  minAmountOut: z.number().min(0, { error: 'Min amount out must be at least 0' }).optional(),
});

const SpotOrderCancelArgsSchema = z.object({
  instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
  orderId: nonNegativeInt.meta({ description: 'Order ID to cancel' }),
  side: side.meta({ description: '0 - bid side, 1 - ask side' }),
});

const SpotMassCancelArgsSchema = z.object({
  instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
});

const SpotLpArgsSchema = z.object({
  instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
  side: side,
  amount: z.number().meta({ description: 'Amount of tokens to trade. Negative value means selling' }),
  minPrice: positiveNumber.optional(),
  maxPrice: positiveNumber.optional(),
});

const PerpDepositArgsSchema = z.object({
  instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
  amount: positiveNumber,
});

const PerpBuySeatArgsSchema = z.object({
  instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
  amount: positiveNumber,
  slippage: z.number().min(0).max(1, { error: 'Slippage must be between 0 and 1' }).optional(),
});

const PerpSellSeatArgsSchema = z.object({
  instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
  slippage: z.number().min(0).max(1, { error: 'Slippage must be between 0 and 1' }).optional(),
});

const NewPerpOrderArgsSchema = z.object({
  instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
  ioc: iocFlag
    .optional()
    .meta({ description: 'Immediate Or Cancel. If true no new open order after this instruction execution' }),
  orderType: orderType.optional().meta({ description: '0 - Limit, 1 - Market' }),
  qty: positiveNumber.meta({ description: 'Order quantity' }),
  price: positiveNumber.meta({ description: 'Order price' }),
  leverage: z.int().min(1).max(100, { error: 'Leverage must be between 1 and 100' }).optional(),
  side: side.meta({ description: '0 - Bid, 1 - Ask' }),
  edgePrice: positiveNumber.optional(),
});

const PerpQuotesReplaceArgsSchema = z.object({
  instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
  bump: nonNegativeInt.optional().meta({ description: 'Bump' }),
  orderType: nonNegativeInt.optional().meta({ description: 'Order type' }),
  bailOnOrderNotFound: z.boolean().optional().meta({
    description: 'If true, fail the instruction when an order to cancel is not found',
  }),
  orders: z
    .array(QuoteOrderSchema)
    .min(1)
    .max(12, { error: 'Exceeded orders limit of 12' })
    .meta({ description: 'Quote orders to place/replace' }),
});

const PerpOrderCancelArgsSchema = z.object({
  instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
  orderId: nonNegativeInt.meta({ description: 'Order ID to cancel' }),
  side: side.meta({ description: '0 - bid side, 1 - ask side' }),
});

const PerpMassCancelArgsSchema = z.object({
  instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
});

const PerpChangeLeverageArgsSchema = z.object({
  instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
  leverage: z.int().min(1).max(100, { error: 'Leverage must be between 1 and 100' }),
});

const PerpStatisticsResetArgsSchema = z.object({
  instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
});

const PerpForcedCloseArgsSchema = z.object({
  instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
  clientPrimaryAccount: solanaAddress,
});

const NewInstrumentArgsSchema = z.object({
  assetMint: solanaAddress.meta({ description: 'Asset Token Mint' }),
  crncyMint: solanaAddress.meta({ description: 'Currency Token Mint' }),
  initialPrice: positiveNumber,
  mask: nonNegativeInt.default(0),
  minQty: z.number().default(1),
  fixedFeeRate: z.number().default(0),
});

const GetInstrIdArgsSchema = z.object({
  assetTokenId: nonNegativeInt.meta({ description: 'Asset Deriverse token registered ID' }),
  crncyTokenId: nonNegativeInt.meta({ description: 'Base currency Deriverse token registered ID' }),
});

const GetSpotContextArgsSchema = z.object({
  assetTokenId: nonNegativeInt,
  crncyTokenId: nonNegativeInt,
});

const GetInstrAccountByTagArgsSchema = z.object({
  assetTokenId: nonNegativeInt,
  crncyTokenId: nonNegativeInt,
  tag: nonNegativeInt,
});

const UpdateInstrDataArgsSchema = z.object({
  assetTokenId: nonNegativeInt,
  crncyTokenId: nonNegativeInt,
});

const DistribDividendsArgsSchema = z.object({
  instruments: z.array(nonNegativeInt).meta({ description: 'Instruments ID' }),
});

const GetClientSpotOrdersInfoArgsSchema = z.object({
  instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
  clientId: nonNegativeInt.meta({
    description: 'Temporary spot client ID. Use getClientData function to get this value',
  }),
});

const GetClientPerpOrdersInfoArgsSchema = z.object({
  instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
  clientId: nonNegativeInt.meta({
    description: 'Temporary perp client ID. Use getClientData function to get this value',
  }),
});

const GetClientSpotOrdersArgsSchema = z.object({
  instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
  bidsCount: nonNegativeInt.meta({
    description: 'Client spot bid orders count. Use getClientSpotOrdersInfo function to get this value',
  }),
  asksCount: nonNegativeInt.meta({
    description: 'Client spot ask orders count. Use getClientSpotOrdersInfo function to get this value',
  }),
  bidsEntry: nonNegativeInt.meta({
    description: 'Entrypoint in spot bid orders account. Use getClientSpotOrdersInfo function to get this value',
  }),
  asksEntry: nonNegativeInt.meta({
    description: 'Entrypoint in spot ask orders account. Use getClientSpotOrdersInfo function to get this value',
  }),
});

const GetClientPerpOrdersArgsSchema = z.object({
  instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
  bidsCount: nonNegativeInt.meta({
    description: 'Client perp bid orders count. Use getClientPerpOrdersInfo function to get this value',
  }),
  asksCount: nonNegativeInt.meta({
    description: 'Client perp ask orders count. Use getClientPerpOrdersInfo function to get this value',
  }),
  bidsEntry: nonNegativeInt.meta({
    description: 'Entrypoint in perp bid orders account. Use getClientPerpOrdersInfo function to get this value',
  }),
  asksEntry: nonNegativeInt.meta({
    description: 'Entrypoint in perp ask orders account. Use getClientPerpOrdersInfo function to get this value',
  }),
});

const VmInitActivateArgsSchema = z.object({
  vmAuthority: solanaAddress.meta({ description: 'VM mode authority address' }),
});

const VmFinalizeActivateArgsSchema = z.object({
  vmAuthority: solanaAddress.meta({ description: 'VM mode authority address' }),
});

const VmFinalizeDeactivateArgsSchema = z.object({
  vmAuthority: solanaAddress.meta({ description: 'VM mode authority address' }),
});

const VmInitWithdrawArgsSchema = z.object({
  tokenId: nonNegativeInt.meta({ description: 'Deriverse token registered ID' }),
  amount: positiveNumber.meta({ description: 'Amount to withdraw' }),
});

const VmInitWithdrawCancelArgsSchema = z.object({
  tokenId: nonNegativeInt.meta({ description: 'Deriverse token registered ID of pending withdrawal' }),
});

const VmInitWithdrawFinalizeArgsSchema = z.object({
  vmAuthority: solanaAddress.meta({ description: 'VM mode authority address' }),
  tokenId: nonNegativeInt.meta({ description: 'Deriverse token registered ID' }),
});

const VmChangeListArgsSchema = z.object({
  vmAuthority: solanaAddress.meta({ description: 'VM mode authority address' }),
  mask: nonNegativeInt.meta({ description: 'VM whitelist mask' }),
  whitelist: z.array(z.number()).optional().meta({ description: 'Instrument whitelist array' }),
});

const VmAddWithdrawalAddressArgsSchema = z.object({
  vmAuthority: solanaAddress.meta({ description: 'VM mode authority address' }),
  withdrawalTokenAccount: solanaAddress.meta({ description: 'Withdrawal destination token account' }),
});

const VmRemoveWithdrawalAddressArgsSchema = z.object({
  vmAuthority: solanaAddress.meta({ description: 'VM mode authority address' }),
  withdrawalAddress: solanaAddress.meta({ description: 'Withdrawal address to remove from whitelist' }),
});

const VmDirectWithdrawArgsSchema = z.object({
  tokenId: nonNegativeInt.meta({ description: 'Deriverse token registered ID' }),
  amount: positiveNumber.meta({ description: 'Amount to withdraw' }),
  withdrawalTokenAccount: solanaAddress.meta({ description: 'Withdrawal destination token account' }),
});

const KaminoReserveByMintArgsSchema = z.object({
  mint: solanaAddress.meta({ description: 'Reserve liquidity mint' }),
  lendingMarket: solanaAddress.optional().meta({ description: 'Kamino lending market' }),
});

const GetKaminoContextArgsSchema = z
  .object({
    instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
    lendingMarket: solanaAddress.optional().meta({ description: 'Kamino lending market' }),
  })
  .strict();

const KaminoInitInstrumentArgsSchema = z
  .object({
    instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
    lendingMarket: solanaAddress.optional().meta({ description: 'Kamino lending market' }),
  })
  .strict();

const KaminoInitObligationArgsSchema = z
  .object({
    lendingMarket: solanaAddress.optional().meta({ description: 'Kamino lending market' }),
    referrerUserMetadata: solanaAddress.optional().meta({ description: 'Kamino referrer user metadata account' }),
  })
  .strict();

const KaminoUpdateObligationsArgsSchema = z
  .object({
    lendingMarket: solanaAddress.optional().meta({ description: 'Kamino lending market' }),
  })
  .strict();

const KaminoChangePositionArgsSchema = z
  .object({
    instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
    assetIsCollateral: z
      .boolean()
      .meta({ description: 'Whether the instrument asset mint is the Kamino collateral side' }),
    collateralDelta: signedAmount.meta({ description: 'Signed collateral change' }),
    borrowDelta: signedAmount.meta({ description: 'Signed borrow change' }),
    customId: nonNegativeInt.optional().meta({ description: 'Custom ID' }),
    repayAll: z.boolean().optional(),
    withdrawAll: z.boolean().optional(),
    keepObligationAlive: z.boolean().optional(),
    lendingMarket: solanaAddress.optional().meta({ description: 'Kamino lending market' }),
  })
  .strict()
  .superRefine((args, ctx) => {
    if (args.repayAll && args.borrowDelta !== 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['borrowDelta'],
        message: 'repayAll requires borrowDelta to be 0',
      });
    }
    if (args.withdrawAll && args.collateralDelta !== 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['collateralDelta'],
        message: 'withdrawAll requires collateralDelta to be 0',
      });
    }
    if (args.keepObligationAlive && args.withdrawAll) {
      ctx.addIssue({
        code: 'custom',
        path: ['keepObligationAlive'],
        message: 'keepObligationAlive cannot be used together with withdrawAll',
      });
    }
    if (args.keepObligationAlive && args.collateralDelta === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['collateralDelta'],
        message: 'keepObligationAlive requires collateralDelta to be non-zero',
      });
    }
  });

const KaminoLookupTableAddressesArgsSchema = z.object({
  instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
  lendingMarket: solanaAddress.optional().meta({ description: 'Kamino lending market' }),
});

const KaminoObligationExistsArgsSchema = z
  .object({
    lendingMarket: solanaAddress.optional().meta({ description: 'Kamino lending market' }),
    obligation: solanaAddress.optional().meta({ description: 'Kamino obligation address' }),
  })
  .strict();

const KaminoAtaExistsArgsSchema = z.object({
  mint: solanaAddress.meta({ description: 'Token mint' }),
  owner: solanaAddress.optional().meta({ description: 'ATA owner' }),
  tokenProgram: solanaAddress.optional().meta({ description: 'Token program' }),
});

const KaminoInstrumentAccountsExistArgsSchema = z
  .object({
    instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
    lendingMarket: solanaAddress.optional().meta({ description: 'Kamino lending market' }),
  })
  .strict();

const GetKaminoClientStateArgsSchema = z
  .object({
    instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
    lendingMarket: solanaAddress.optional().meta({ description: 'Kamino lending market' }),
    obligation: solanaAddress.optional().meta({ description: 'Kamino obligation address' }),
  })
  .strict();

const GetKaminoClientStateFromBuffersArgsSchema = z
  .object({
    instrId: nonNegativeInt.meta({ description: 'Instrument ID' }),
    lendingMarket: solanaAddress.optional().meta({ description: 'Kamino lending market' }),
    collateralReserveData: base64EncodedDataResponse.meta({ description: 'Collateral reserve account data' }),
    debtReserveData: base64EncodedDataResponse.meta({ description: 'Debt reserve account data' }),
    obligationData: base64EncodedDataResponse.meta({ description: 'Kamino obligation account data' }),
    obligation: solanaAddress.optional().meta({ description: 'Kamino obligation address' }),
  })
  .strict();

export {
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
  KaminoChangePositionArgsSchema,
  KaminoLookupTableAddressesArgsSchema,
  KaminoObligationExistsArgsSchema,
  KaminoAtaExistsArgsSchema,
  KaminoInstrumentAccountsExistArgsSchema,
  GetKaminoClientStateArgsSchema,
  GetKaminoClientStateFromBuffersArgsSchema,
};
