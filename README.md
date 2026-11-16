# Deriverse SDK

TypeScript SDK for Deriverse on Solana. Built on [`@solana/kit`](https://www.npmjs.com/package/@solana/kit), `@deriverse/kit` helps load Deriverse account, market, and client state, build Deriverse instructions, and decode account and log data.

## Features

- **Spot and Swap**
  - Build spot order, cancel, mass-cancel, quote-replace, LP, and swap instructions
  - Query spot order books, market metadata, and client spot orders

- **Perpetuals**
  - Build perpetual deposit, withdrawal, order, cancel, mass-cancel, quote-replace, seat buy/sell, leverage-change, statistics-reset, and upgrade-to-perp instructions
  - Query perpetual order books, market metadata, client orders, and positions

- **Accounts and Data**
  - Discover Deriverse token, instrument, client, root, and community accounts
  - Query client balances, open orders, and account state
  - Decode Deriverse account models and transaction logs
  - Use exported Zod schemas for runtime argument validation

- **VM / Vault Mode**
  - Build activation, deactivation, whitelist, withdrawal, and direct-withdraw instructions

## Installation

```bash
npm install @deriverse/kit
```

## Solana Mainnet and Devnet Program IDs and Versions

### Mainnet

```bash
PROGRAM_ID=DRVSpZ2YUYYKgZP8XtLhAGtT1zYSCKzeHfb4DgRnrgqD
VERSION=1
```

### Devnet

```bash
PROGRAM_ID=CDESjex4EDBKLwx9ZPzVbjiHEHatasb5fhSJZMzNfvw2
VERSION=7
```

## Examples

A comprehensive example is available at [deriverse/kit-example](https://github.com/deriverse/kit-example).

### Orca swap

After initializing the engine and connecting a funded Deriverse client with `setSigner`, prepare each Whirlpool once:

```ts
import { address } from '@solana/kit';

const whirlpool = address('YOUR_WHIRLPOOL_ADDRESS');
await engine.prepareOrcaSwap({ instrId: 1, whirlpool });

// Synchronous: returns an Instruction without RPC requests or pool decoding.
const instruction = engine.orcaSwapInstruction({
  instrId: 1,
  whirlpool,
  price: 150, // Current Whirlpool price: UI currency per one asset.
  crncyInput: false, // Sell asset for currency; true sells currency for asset.
  amount: 1,
  minAmountOut: 149,
  tickArrayCount: 5, // Required: 3 directional arrays, or 5 with two supplemental arrays.
});
```

Supply an updated pool `price` on each build. It is always in UI units, including when `uiNumbers` is `false`,
and is used only to select tick arrays. Five-array mode uses the current array and two on either side.
With `uiNumbers: true` (the default), `amount` uses input-token UI units
and `minAmountOut` uses output-token UI units; with `false`, both amounts use integer token units.
The builder rejects amounts that cannot be represented as safe integers after conversion.

Pool metadata is cached for the engine's lifetime, including across signer changes. Repeated and concurrent
preparations share a single successful load and decode. Failed loads can be retried. Prepare a pool before building;
the synchronous builder throws if its metadata, client, or instrument is unavailable.

`engine.logsDecode(logs)` includes `OrcaSwapReportModel` (`LogType.orcaSwap`), containing `side`, `time`, `clientId`,
`instrId`, `amountIn`, `amountOut`, and `seqNo`. Side `0` is currency to asset; side `1` is asset to currency.
Amounts follow `uiNumbers`; without a known instrument, the decoder preserves integer token units.
As with the SDK's other i64 reports, decoded values use JavaScript `number` and require safe-integer range for exactness.

The caller supplies `minAmountOut`; no quote is calculated. Vault Mode requires the pool to be whitelisted already.
Automatic transfer-hook account resolution is not included.

## Development

### Prerequisites

- Node.js >=20.19.0, or a current Node.js 22+ release
- npm
- TypeScript is installed from dev dependencies

### Setup

1. Clone the repository:

```bash
git clone https://github.com/deriverse/kit.git
cd kit
```

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

4. Run checks:

```bash
npm test
npm run lint
npm run format:check
```

## License

Apache 2.0 License - see the [LICENSE](LICENSE) file for details.
