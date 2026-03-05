# Changelog

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
