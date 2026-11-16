import { AccountRole, Address, getAddressDecoder, getAddressEncoder } from '@solana/kit';
import { Buffer } from 'buffer';
import {
  ORCA_WHIRLPOOL_PROGRAM_ID,
  MEMO_PROGRAM_ID,
  SYSTEM_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from '../constants';
import { orcaSwapData } from '../instruction_models';
import { TokenStateModel } from '../structure_models';
import { AccountType, AccountMeta, Instruction, Instrument, OrcaSwapArgs } from '../types';
import { AccountHelperContext } from './account-helpers';
import { orcaPriceToTick, orcaTickArrayStarts } from './orca-math';
import { SyncPdaCache } from './sync-pda';

const addressEncoder = getAddressEncoder();
const addressDecoder = getAddressDecoder();
const WHIRLPOOL_DISCRIMINATOR = Buffer.from([63, 149, 209, 12, 225, 128, 99, 9]);

export interface OrcaWhirlpool {
  address: Address;
  mintA: Address;
  mintB: Address;
  vaultA: Address;
  vaultB: Address;
  tickSpacing: number;
  oracle: Address;
}

export function decodeOrcaWhirlpool(address: Address, data: Buffer, pdas: SyncPdaCache): OrcaWhirlpool {
  if (data.length < 653 || !data.subarray(0, 8).equals(WHIRLPOOL_DISCRIMINATOR)) {
    throw new Error(`Invalid Orca Whirlpool data: ${address}`);
  }
  const tickSpacing = data.readUInt16LE(41);
  if (tickSpacing === 0) throw new Error(`Invalid Orca Whirlpool tick spacing: ${address}`);
  const readAddress = (offset: number) => addressDecoder.decode(data.subarray(offset, offset + 32));
  return {
    address,
    mintA: readAddress(101),
    mintB: readAddress(181),
    vaultA: readAddress(133),
    vaultB: readAddress(213),
    tickSpacing,
    oracle: pdas.get(ORCA_WHIRLPOOL_PROGRAM_ID, ['oracle', addressEncoder.encode(address)])[0],
  };
}

export function orcaInstrumentTokens(tokens: Map<number, TokenStateModel>, instr: Instrument) {
  const asset = tokens.get(instr.header.assetTokenId);
  const crncy = tokens.get(instr.header.crncyTokenId);
  if (!asset || !crncy) throw new Error('Orca instrument tokens not found');
  return { asset, crncy };
}

export function validateOrcaPair(pool: OrcaWhirlpool, asset: TokenStateModel, crncy: TokenStateModel): boolean {
  if (pool.mintA === asset.address && pool.mintB === crncy.address && asset.address !== crncy.address) return true;
  if (pool.mintB === asset.address && pool.mintA === crncy.address && asset.address !== crncy.address) return false;
  throw new Error('Orca Whirlpool mint pair does not match the instrument');
}

interface OrcaInstructionContext extends Pick<AccountHelperContext, 'programId' | 'version' | 'drvsAuthority'> {
  rootAccount: Address;
  signer: Address;
  clientPrimaryAccount: Address;
  clientVmActive: boolean;
  uiNumbers: boolean;
  tokens: Map<number, TokenStateModel>;
}

function encodeAmount(value: number, decimals: number, minimum: number, name: string): number {
  const encoded = Math.round(value * decimals);
  if (!Number.isSafeInteger(encoded) || encoded < minimum) {
    throw new RangeError(`${name} must resolve to a safe integer of at least ${minimum} in contract units`);
  }
  return encoded;
}

export function buildOrcaSwapInstruction(
  ctx: OrcaInstructionContext,
  args: OrcaSwapArgs,
  instr: Instrument,
  pool: OrcaWhirlpool,
  pdas: SyncPdaCache,
): Instruction {
  const { asset, crncy } = orcaInstrumentTokens(ctx.tokens, instr);
  const assetIsA = validateOrcaPair(pool, asset, crncy);
  const assetDecimals = asset.mask & 0xff;
  const crncyDecimals = crncy.mask & 0xff;
  const tick = orcaPriceToTick(args.price, assetDecimals, crncyDecimals, assetIsA);
  const aToB = !args.crncyInput === assetIsA;
  const ticks = orcaTickArrayStarts(tick, pool.tickSpacing, aToB, args.tickArrayCount).map(
    (start) =>
      pdas.get(ORCA_WHIRLPOOL_PROGRAM_ID, ['tick_array', addressEncoder.encode(pool.address), String(start)])[0],
  );
  const inputDecimals = args.crncyInput ? crncyDecimals : assetDecimals;
  const outputDecimals = args.crncyInput ? assetDecimals : crncyDecimals;
  const amount = encodeAmount(args.amount, ctx.uiNumbers ? 10 ** inputDecimals : 1, 1, 'Orca amount');
  const minAmountOut = encodeAmount(
    args.minAmountOut,
    ctx.uiNumbers ? 10 ** outputDecimals : 1,
    0,
    'Orca minAmountOut',
  );
  const tokenAccounts = (token: TokenStateModel): AccountMeta[] => {
    const seed = Buffer.from(addressEncoder.encode(token.address));
    seed.writeUInt32LE(ctx.version, 28);
    return [
      { address: token.address, role: AccountRole.READONLY },
      { address: token.programAddress, role: AccountRole.WRITABLE },
      {
        address: pdas.get(ctx.programId, [seed, addressEncoder.encode(ctx.drvsAuthority)])[0],
        role: AccountRole.READONLY,
      },
      {
        address: (token.mask & 0x80000000) !== 0 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID,
        role: AccountRole.READONLY,
      },
    ];
  };
  const accounts: AccountMeta[] = [
    { address: ctx.signer, role: AccountRole.WRITABLE_SIGNER },
    { address: ctx.rootAccount, role: AccountRole.READONLY },
    { address: ctx.clientPrimaryAccount, role: AccountRole.WRITABLE },
    { address: instr.address, role: AccountRole.WRITABLE },
    ...tokenAccounts(asset),
    ...tokenAccounts(crncy),
    { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
  ];
  if (ctx.clientVmActive) {
    const seed = Buffer.alloc(8);
    seed.writeUInt32LE(ctx.version, 0);
    seed.writeUInt32LE(AccountType.VM_CLIENT, 4);
    accounts.push({
      address: pdas.get(ctx.programId, [seed, addressEncoder.encode(ctx.signer)])[0],
      role: AccountRole.READONLY,
    });
  }
  accounts.push(
    { address: ORCA_WHIRLPOOL_PROGRAM_ID, role: AccountRole.READONLY },
    { address: MEMO_PROGRAM_ID, role: AccountRole.READONLY },
    { address: pool.address, role: AccountRole.WRITABLE },
    { address: pool.vaultA, role: AccountRole.WRITABLE },
    { address: pool.vaultB, role: AccountRole.WRITABLE },
    ...ticks.slice(0, 3).map((address) => ({ address, role: AccountRole.WRITABLE })),
    { address: pool.oracle, role: AccountRole.WRITABLE },
    ...ticks.slice(3).map((address) => ({ address, role: AccountRole.WRITABLE })),
  );
  return {
    programAddress: ctx.programId,
    accounts,
    data: orcaSwapData(90, args.crncyInput ? 1 : 0, args.instrId, amount, minAmountOut, args.tickArrayCount),
  };
}
