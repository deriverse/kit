# Changelog

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
