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
