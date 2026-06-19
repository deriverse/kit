# Changelog

## [1.0.69] - 2026-06-19

### Fixed

- **Kamino reserve discovery**: Select a dominant reserve when a duplicate Kamino reserve has nonzero but much smaller liquidity and caps for the same mint.

## [1.0.68] - 2026-06-17

### Fixed

- **Kamino reserve discovery**: Select the sole enabled reserve when a Kamino market has disabled duplicate reserves for the same liquidity mint.

## [1.0.67] - 2026-06-10

### Changed

- **Kamino change position ABI**: Added `userMetadata` and rent sysvar accounts to `kaminoChangePositionInstruction` account ordering so the on-chain processor can recreate a closed obligation.
- **Kamino logs**: Updated `KaminoChangePositionReportModel` to decode the new `withdrawAll` and `repayAll` log flags.

### Removed

- **Kamino change position args**: Removed the obsolete `keepObligationAlive` flag from `KaminoChangePositionArgs`.

## [1.0.66] - 2026-06-09

### Added

- **Kamino refresh reserves**: Added `kaminoRefreshReservesInstruction({ lendingMarket?, skipPriceUpdates? })` to build a KLend `refresh_reserves_batch` instruction for all active obligation reserves before refreshing obligations.

## [1.0.65] - 2026-06-09

### Changed

- **Kamino client state**: Deposits now report underlying liquidity token amounts while preserving exact cToken collateral amounts in `collateralAmount` and `collateralAmountRaw`.
- **Kamino position metadata**: Added liquidity mint, collateral mint, token program, and Deriverse token ID metadata to deposit and borrow entries.
- **Kamino risk fields**: Added fallback borrow valuation from reserve price when raw debt exists but the aggregate borrow market value is zero.
- **Kamino max withdraw**: `maxWithdrawEstimate` now reports underlying liquidity units and includes exact collateral raw amount.

## [1.0.64] - 2026-06-08

### Fixed

- **Kamino reserve decoding**: Corrected the collateral supply vault offset to skip the collateral mint total supply field in KLend reserve accounts.

## [1.0.63] - 2026-06-08

### Added

- **Kamino update obligations**: Added `kaminoUpdateObligationsInstruction({ lendingMarket? })` to build the KLend `refreshObligation` instruction by deriving the obligation PDA and reserve accounts automatically.

## [1.0.62] - 2026-06-08

### Changed

- **Kamino change position**: Added required `assetIsCollateral` to `kaminoChangePositionInstruction` args and use it to select collateral/debt reserve ordering, delta scaling, oracle ordering, and farm slots.
- **Kamino change position accounts**: Marked the instrument account writable for `kaminoChangePositionInstruction`.

## [1.0.61] - 2026-06-07

### Added

- **Kamino init instrument**: Added unified `kaminoInitInstrumentInstruction({ instrId, lendingMarket? })` for the new `protocol-v1` `kamino_init_instrument` instruction.
- **Kamino account checks**: Added `kaminoInstrumentAccountsExist({ instrId, lendingMarket? })` to check required init-instrument accounts except obligation.
- **Kamino logs**: Added `KaminoChangePositionReportModel` and `logsDecode` support for `LogType.kaminoChangePosition = 48`.

### Changed

- **Kamino init obligation**: `kaminoInitObligationInstruction` no longer requires `instrId` and no longer builds full Kamino instrument context.
- **Kamino init flow**: Replaced split token-account/farm init builders with the unified `kamino_init_instrument` flow.

### Removed

- **Kamino args cleanup**: Removed unused `instrId` from `KaminoObligationExistsArgs`.
- **Kamino split init API**: Removed `kaminoInitTokenAccountsInstruction`, `kaminoInitObligationFarmsInstruction`, and the old ATA-only `kaminoInstrumentAtasExist` API.

## [1.0.60] - 2026-06-06

### Added

- **Kamino support**: Added Kamino instruction builders through Deriverse `protocol-v1` instructions, including VM add/remove, obligation init, token account init, obligation farms init, and change-position.
- **Kamino context services**: Added reserve auto-discovery by instrument mints, reserve-address caching, client/instrument/market context caching, ALT discovery, obligation checks, ATA checks, and client state visualization.
- **Kamino websocket state**: Added `getKaminoClientStateFromBuffers` for refreshing client state from reserve and obligation accountSubscribe buffers without reserve/obligation RPC reads.

### Changed

- **Kamino reserve flow**: Removed manual reserve account inputs from the public flow; reserves are derived from instrument `assetMint` and `crncyMint`.
- **Kamino context refresh**: Replaced public `getKaminoContext` with `refreshKaminoContext` and cache-first methods for instruction builders and cached state reads.

## [1.0.57] - 2026-04-27

### Added
- **`New models`**: instruction_models && structure_models


## [1.0.55] - 2026-04-27

### Fixed

- **`buildSpotOrderCancelInstruction`**: Fixed account order

### Added

- **`bailOnOrderNotFound`**: New optional flag on `SpotQuotesReplaceArgs` and `PerpQuotesReplaceArgs`

### Removed

- **`SwapRefFeesReportModel`**: Dropped from `LogMessage` union and `LogsDecoder`

## [1.0.54] - 2026-04-23

### Changed

- **`buildSpotOrderCancelInstruction`**: OneSideContext

## [1.0.53] - 2026-04-17

### Changed

- **`getSpotPriceStep`**: Updated spot price step table, added optional `isSimilarAssets` parameter. When `true`, returns the flat SAM step (`0.00001`).

## [1.0.52] - 2026-04-10

### Changed

- **Deposit/Withdraw builders**: Moved `buildDepositInstruction` and `buildWithdrawInstruction` from `engine/spot-instructions.ts` to `engine/instructions.ts`
- **New Instrument builder**: Moved `buildNewInstrumentInstructions` from `engine/perp-instructions.ts` to `engine/instructions.ts`
- **Swap builder**: Moved `buildSwapInstruction` from `engine/spot-instructions.ts` to `engine/instructions.ts`
- **Ref Link builder**: Moved `buildNewRefLinkInstruction` from `engine/perp-instructions.ts` to `engine/instructions.ts`
- **`updateInstrDataFromBuffer`**: Added token decimal normalization for `lastTradeAssetTokens`, `lastTradeCrncyTokens`, `alltimeAssetTokens`, `alltimeCrncyTokens`, `perpAlltimeAssetTokens`, `perpAlltimeCrncyTokens`, `lpDayFees`, `lpPrevDayFees`, `lpAlltimeFees`, `shortEmaPx`, `midEmaPx`, `longEmaPx`
- **`updateInstrDataFromBuffer`**: Added scaling for new `spotFeeRate` (× `feeRateStep`) and `spotPoolRatio` (× `poolRatioStep`) fields
- **`updateInstrDataFromBuffer` / `updateInstrData`**: Cached `getInstrAccountByTagFn` result — reuses the address from `this.instruments` map on subsequent calls instead of re-deriving the PDA every time
- **Withdraw/Swap instructions**: Removed `drvsAuthority` from swap and withdraw and `rootAccount` from swap
- **`buildNewInstrumentInstructions`**: Asset program token account use now `getProgramTokenAccount` instead of keypair; account role changed from `WRITABLE_SIGNER` to `WRITABLE`
- **`NewInstrumentArgsSchema`**: Removed `newProgramAccountAddress` field
- **`buildVmRemoveWithdrawalAddressInstruction`**: removed `vmRemoveWithdrawalAddressData`
- **Constants**: Added `feeRateStep` (`0.0005`) and `poolRatioStep` (`0.025`);
- **`account-helpers.ts`**: Added `getProgramTokenAccount(ctx, mint)` helper
- **Upgraded npm packages**: @eslint/js, @types/node, @vitest/coverage-v8, eslint, prettier, typescript-eslint, vitest

## [1.0.51] - 2026-04-09

### Changed

- **Merged `SpotClientInfo2` into `SpotClientInfo`**: Single 64-byte account
- **Removed `SPOT_CLIENT_INFOS2` and `CANDLES` accounts** everywhere
- **Removed from `AccountType` enum**: `SPOT_CLIENT_INFOS2`, `SPOT_1M_CANDLES`, `SPOT_15M_CANDLES`, `SPOT_DAY_CANDLES`
- **Removed `COMMUNITY` account** in swap instructions 
- **Removed `feeTakerWallet` and `refFeeRate`** from swap instruction args
- **`STANDARD_MAPS_SIZE` and `EXTENDED_MAPS_SIZE`**: Increased by `CandlesHeaderModel.LENGTH`
- **`getClientSpotOrdersInfo`**: Now fetches a single account instead of two

## [1.0.50] - 2026-04-08

### Added

- **VM mode instructions**: Added full set of VM mode instruction builders (tags 63-80): activate, deactivate, withdraw, change whitelist, add/remove withdrawal address, direct withdraw

## [1.0.49] - 2026-03-17

### Changed

- **Client accounts now optional**: `clientPrimaryAccount` and `clientCommunityAccount` are nullable (`Address | null`) in `SpotInstructionContext` and `PerpInstructionContext`
- **`getSpotInstructionContext`**: Removed throws for null client accounts — only signer check remains
- **Instruction builders**: Each builder that needs client accounts validates at point of use via `requireClientPrimaryAccount` / `requireClientCommunityAccount` (shared from `account-helpers.ts`)
- **No client accounts required**: `buildSwapInstruction`, `buildUpgradeToPerpInstructions`, `buildNewInstrumentInstructions` work without client accounts set
- **`buildNewInstrumentInstructions`**: `minQty` is now scaled by the asset token's decimal factor
- **`NewInstrumentArgsSchema`**: `minQty` default changed from `0` to `1`

## [1.0.48] - 2026-03-17

### Fixed

- **`NewInstrumentArgs`**: Changed from `z.infer` to `z.input` so fields with defaults (`mask`, `minQty`, `fixedFeeRate`) are optional in the input type
- **`newInstrumentInstructions`**: Removed signer check
- **`ParsedNewInstrumentArgs`**: Added new type (`z.infer`) for internal use after parsing, ensuring defaults are resolved
- **`buildNewInstrumentInstructions`**: Maps account size now selected dynamically based on `InstrFlag.similarAssets` mask — standard (42,184) or extended (68,712)
- **Constants**: Added `STANDARD_MAPS_SIZE` and `EXTENDED_MAPS_SIZE`
- **Tests**: Updated log decoder test buffer helpers to match regenerated models (new `seqNo` and `customId` fields)

## [1.0.47] - 2026-03-12

### Changed

- **Log models**: Updated log models
- **Structure models**: Updated structure models
- **Rename**: `ChangePointsRecordModel` renamed to `ChangePointsReportModel`

## [1.0.46] - 2026-03-09

### Changed

- **`buildSwapInstruction`**: Use `getSpotOneSidedContext` instead of `getSpotContext`, reorder accounts, conditionally include `crncyTokenProgramId`, remove `feeTakerWallet` and token account lookups
- **`swapData`**: Removed `refFeeRate` parameter
- **`newInstrumentData`**: Added `mask`, `minQty`, `fixedFeeRate` parameters
- **`NewInstrumentArgsSchema`**: Added `mask`, `minQty`, `fixedFeeRate` fields
- **`InstrAccountHeaderModel`**: Renamed `emaPx` to `shortEmaPx`, added `swapFees`, `similarAssetsMinQty`, `fixedFeeRate`, `midEmaPx`, `longEmaPx` fields
- **New models**: `InstrFlag`, `TokenFlag`, `InstrMaskModel`, `InstrInputMaskModel`, `TokenMaskModel`, `PerpLossCoverageReportModel`
- **New instructions**: `withdrawSwapFeesData`, `setSAMMinQtyData`, `changeSAMFeesPolicyData`, `suspendInstrumentData`
- **`LogType`**: Added `perpLossCoverage`
- **`updateInstrDataFromBuffer`**: Divide `shortEmaPx`, `midEmaPx`, `longEmaPx` by `dec`

## [1.0.45] - 2026-03-09

### Changed

- **`SwapArgsSchema`**: `limitPrice` now accept `0`
- **`SwapArgsSchema`**: `refFeeRate` and `minAmountOut` are now optional (default to `0`)

## [1.0.44] - 2026-03-05

### Changed

- **`depositData`**: Added `customId` parameter
- **`withdrawData`**: Added `customId` parameter
- **`spotQuotesReplaceData`/`perpQuotesReplaceData`**: Added `bump` and `orderType` parameters

## [1.0.43] - 2026-02-24

### Fixed

- **Spot/Perp quotes replace**: Fixed bid/ask side mask — bid is now 0 and ask is 1 (was inverted)

### Changed

- **`buildQuotesMask`**: Extracted shared mask-building logic from perp and spot quotes replace into a reusable utility function with unit tests

## [1.0.42] - 2025-02-20

### Changed

- **Spot/Perp quotes replace**: Replaced fixed bid/ask fields with dynamic `orders` array (up to 12 `QuoteOrder` entries with `newPrice`, `newQty`, `oldId`, `side`); instruction data now uses `QuoteMask` header + appended order entries

### Added

- **VM log models**: Added transaction log decoding for VM operations — `VmInitActivate`, `VmInitActivateCancel`, `VmFinalizeActivate`, `VmInitDeactivate`, `VmInitDeactivateCancel`, `VmFinalizeDeactivate`, `VmChangeList`, `VmInitWithdraw`, `VmInitWithdrawCancel`, `VmInitWithdrawFinalize`
- **Swap log models**: Added `PlaceSwapOrderReportModel`, `SwapRefFeesReportModel`, `ChangePointsRecordModel`
- **LogMessage type**: Added `MoveSpotAvailFundsReportModel` to the `LogMessage` union
- **Swap args**: Added `refFeeRate`, `minAmountOut`, `feeTakerWallet` fields to `SwapArgs`; fee taker accounts appended to swap instruction when `feeTakerWallet` is set
- **New instruction builders**: `cleanCandlesData`, `vmInitWithdrawData`, `vmChangeWhitelistData`
- **New constant**: `MAX_SWAP_FEE_RATE` (0.0002)
- **New model**: `DiscriminatorModel`, `AssetType` enum

### Changed

- **Structure models**: Regenerated and reordered models; removed `ClientSpotModel`, `ClientPerpModel`, stale `futuresXxx` account types, and `OrderType.forcedClose`
- **`ClientPrimaryAccountHeaderModel`**: Consolidated `vmInstr0`..`vmInstr7` into `vmInstrs: number[]`
- **Instruction models**: `newOperatorData`, `newRootAccountData` now accept `version`; `setVarianceData` now accepts `instrId`; `setInstrReadyForPerpUpgradeData` removed `variance` param; `swapData` extended to include `refFeeRate` and `minAmountOut`
- **`SwapOrderReportModel`**: Renamed to `PlaceSwapOrderReportModel`, extended with `swapRefRate`
- **`perpSeatReserve`**: Updated formula to use `MAX_SUPPLY` (262,200) and `INIT_SEAT_PRICE`

### Fixed

- **perpSellSeatInstruction**: Fixed slippage price calculation — was using `perpClientsCount + 1` instead of `perpClientsCount` for sell-side reserve
- **perpChangeLeverageInstruction**: Fixed swapped `leverage` and `instrId` parameters in `perpChangeLeverageData` call
- **perpBuySeatInstruction**: Added missing community account to instruction keys

## [1.0.40] - 2025-01-23

### Breaking Changes

- **TypeScript Configuration**: Enabled `strictNullChecks` - code consuming this SDK may need updates if relying on implicit null handling
- **Removed re-export**: `VERSION`, `PROGRAM_ID`, `MARKET_DEPTH` are no longer exported from `types/index.ts` - import directly from `@deriverse/kit` instead

### Added

- **Runtime Validation**: Added Zod schemas for all public API arguments
  - All method arguments are now validated at runtime with descriptive error messages
  - Exported schemas (`DepositArgsSchema`, `NewSpotOrderArgsSchema`, etc.) for consumer-side validation
- **Comprehensive Test Suite**: Added Vitest-based tests with coverage for:
  - `Engine` class initialization and methods
  - Account helpers
  - Client queries
  - Context builders
  - Log decoder
  - Spot and perp instructions
  - Utility functions
  - Zod schemas validation
- **Developer Tooling**:
  - ESLint configuration for code quality
  - Prettier configuration for consistent formatting
  - New npm scripts: `lint`, `lint:fix`, `format`, `format:check`, `test`, `test:watch`, `test:coverage`

### Changed

- **Architecture Refactor**: Modularized the monolithic `Engine` class into focused modules:
  - `engine/account-helpers.ts` - Account discovery and PDA derivation
  - `engine/client-queries.ts` - Client data fetching methods
  - `engine/context-builders.ts` - Market context construction
  - `engine/logs-decoder.ts` - Transaction log parsing
  - `engine/spot-instructions.ts` - Spot trading instruction builders
  - `engine/perp-instructions.ts` - Perpetual trading instruction builders
  - `engine/utils.ts` - Shared utility functions
- **Type Organization**: Reorganized types into dedicated files:
  - `types/enums.ts` - `InstrMask`, `AccountType`, `LogType`
  - `types/engine-args.ts` - Method argument interfaces
  - `types/responses.ts` - Response type definitions
  - `types/log-message.ts` - Log message types
  - `types/schemas.ts` - Zod validation schemas
- **Cleaner Exports**: Simplified `src/index.ts` - re-exports from organized modules
- **Constants**: Moved `VERSION`, `PROGRAM_ID`, `MARKET_DEPTH` to dedicated `constants.ts`

### Fixed

- Improved type safety throughout the codebase with strict null checks
- Removed duplicated code across instruction builders
- Fixed `getMultipleSpotOrders` and `getMultiplePerpOrders` using `args.bidsEntry` instead of `args.asksEntry` when fetching asks orders
- Fixed typo: renamed `disount` to `discount` in `refProgramDiscount` response field
- **Critical**: Fixed `perpChangeLeverageData` call with swapped parameters - `instrId` and `leverage` were passed in wrong order

### Dependencies

- Added `zod` (^4.3.5) for runtime validation
- Added development dependencies:
  - `vitest` (^4.0.17) - Testing framework
  - `eslint` (^9.39.2) - Linting
  - `prettier` (^3.8.1) - Code formatting
  - `typescript-eslint` (^8.53.1) - TypeScript ESLint integration
- Updated npm packages to latest versions

### Migration Guide

If upgrading from 1.0.39:

1. **Null Checks**: Review any code that may pass `null` or `undefined` where the SDK expects defined values
2. **Validation Errors**: Method calls with invalid arguments will now throw Zod validation errors instead of failing silently or with unclear errors
3. **Import Paths**: If you were importing from internal paths, update to use the public exports from `@deriverse/kit`

```typescript
// Zod schemas are now available for pre-validation
import { DepositArgsSchema } from '@deriverse/kit';

const result = DepositArgsSchema.safeParse(userInput);
if (!result.success) {
  console.error(result.error.issues);
}
```
