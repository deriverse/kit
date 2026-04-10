import {
  Address,
  Rpc,
  DataSlice,
  Commitment,
  SolanaRpcApiDevnet,
  SolanaRpcApiMainnet,
  getProgramDerivedAddress,
  getAddressEncoder,
  getBase64Encoder,
  Base58EncodedBytes,
} from '@solana/kit';
import bs58 from 'bs58';
import { Buffer } from 'buffer';

import { getInstrAccountByTagArgs } from '../types';
import { AccountType } from '../types/enums';
import { InstrAccountHeaderModel, TokenStateModel } from '../structure_models';

/**
 * Context needed for account helper functions
 */
export interface AccountHelperContext {
  rpc: Rpc<SolanaRpcApiDevnet> | Rpc<SolanaRpcApiMainnet>;
  programId: Address;
  version: number;
  commitment: Commitment;
  drvsAuthority: Address;
}

/**
 * Get program-derived account address by tag
 */
async function getAccountByTag(ctx: AccountHelperContext, tag: number): Promise<Address> {
  let buf = Buffer.alloc(8);
  buf.writeInt32LE(ctx.version, 0);
  buf.writeInt32LE(tag, 4);
  const address = (
    await getProgramDerivedAddress({
      programAddress: ctx.programId,
      seeds: [buf, getAddressEncoder().encode(ctx.drvsAuthority)],
    })
  )[0];
  return address;
}

/**
 * Get instrument account address by tag and token IDs
 */
async function getInstrAccountByTag(ctx: AccountHelperContext, args: getInstrAccountByTagArgs): Promise<Address> {
  let buf = Buffer.alloc(16);
  buf.writeInt32LE(ctx.version, 0);
  buf.writeInt32LE(args.tag, 4);
  buf.writeInt32LE(args.assetTokenId, 8);
  buf.writeInt32LE(args.crncyTokenId, 12);
  const address = (
    await getProgramDerivedAddress({
      programAddress: ctx.programId,
      seeds: [buf, getAddressEncoder().encode(ctx.drvsAuthority)],
    })
  )[0];
  return address;
}

/**
 * Get token account address for a mint
 */
async function getTokenAccount(ctx: AccountHelperContext, mint: Address): Promise<Address> {
  let buf = Buffer.from(getAddressEncoder().encode(mint).buffer);
  buf.writeInt32LE(ctx.version, 28);
  const address = (
    await getProgramDerivedAddress({
      programAddress: ctx.programId,
      seeds: [buf, getAddressEncoder().encode(ctx.drvsAuthority)],
    })
  )[0];
  return address;
}

/**
 * Get program token account PDA for a mint.
 */
async function getProgramTokenAccount(ctx: Pick<AccountHelperContext, 'programId' | 'version'>, mint: Address): Promise<Address> {
  let versionBuf = Buffer.alloc(4);
  versionBuf.writeUInt32LE(ctx.version, 0);
  const address = (
    await getProgramDerivedAddress({
      programAddress: ctx.programId,
      seeds: [getAddressEncoder().encode(mint), versionBuf],
    })
  )[0];
  return address;
}

/**
 * Get Token ID from mint public key if this token registered on Deriverse
 */
async function getTokenId(ctx: AccountHelperContext, mint: Address): Promise<number | null> {
  const tokenAddress = await getTokenAccount(ctx, mint);
  let info = await ctx.rpc
    .getAccountInfo(tokenAddress, {
      commitment: ctx.commitment,
      encoding: 'base64',
      dataSlice: { offset: TokenStateModel.OFFSET_ID, length: 4 },
    })
    .send();
  if (!info.value) {
    return null;
  } else {
    const data = Buffer.from(getBase64Encoder().encode(info.value.data[0]));
    return data.readUInt32LE(0);
  }
}

/**
 * Get instrument ID if this instrument registered on Deriverse
 */
async function getInstrId(
  ctx: AccountHelperContext,
  args: { assetTokenId: number; crncyTokenId: number },
): Promise<number | null> {
  const instrAddress = await getInstrAccountByTag(ctx, {
    assetTokenId: args.assetTokenId,
    crncyTokenId: args.crncyTokenId,
    tag: AccountType.INSTR,
  });
  let info = await ctx.rpc
    .getAccountInfo(instrAddress, {
      commitment: ctx.commitment,
      encoding: 'base64',
      dataSlice: { offset: InstrAccountHeaderModel.OFFSET_INSTR_ID, length: 4 },
    })
    .send();
  if (info.value == null) {
    return null;
  } else {
    const data = Buffer.from(getBase64Encoder().encode(info.value.data[0]));
    return data.readUInt32LE(0);
  }
}

/**
 * Find accounts by tag (used during initialization)
 */
async function findAccountsByTag(ctx: AccountHelperContext, tag: number, dataSlice?: DataSlice) {
  let tagBuf = Buffer.alloc(8);
  tagBuf.writeUInt32LE(tag, 0);
  tagBuf.writeUInt32LE(ctx.version, 4);
  let accounts = await ctx.rpc
    .getProgramAccounts(ctx.programId, {
      encoding: 'base64',
      dataSlice: dataSlice,
      filters: [
        {
          memcmp: {
            offset: BigInt(0),
            encoding: 'base58',
            bytes: bs58.encode(tagBuf) as Base58EncodedBytes,
          },
        },
      ],
    })
    .send();
  return accounts;
}

/**
 * Find client primary account PDA
 */
async function findClientPrimaryAccount(
  ctx: Pick<AccountHelperContext, 'programId' | 'version'>,
  signer: Address,
): Promise<Address> {
  let tagBuf = Buffer.alloc(8);
  tagBuf.writeUint32LE(ctx.version, 0);
  tagBuf.writeUint32LE(AccountType.CLIENT_PRIMARY, 4);
  const address = (
    await getProgramDerivedAddress({
      programAddress: ctx.programId,
      seeds: [tagBuf, getAddressEncoder().encode(signer)],
    })
  )[0];
  return address;
}

/**
 * Find client community account PDA
 */
async function findClientCommunityAccount(
  ctx: Pick<AccountHelperContext, 'programId' | 'version'>,
  signer: Address,
): Promise<Address> {
  let tagBuf = Buffer.alloc(8);
  tagBuf.writeUint32LE(ctx.version, 0);
  tagBuf.writeUint32LE(AccountType.CLIENT_COMMUNITY, 4);
  const address = (
    await getProgramDerivedAddress({
      programAddress: ctx.programId,
      seeds: [tagBuf, getAddressEncoder().encode(signer)],
    })
  )[0];
  return address;
}

async function findClientVmAccount(
  ctx: Pick<AccountHelperContext, 'programId' | 'version'>,
  signer: Address,
): Promise<Address> {
  let tagBuf = Buffer.alloc(8);
  tagBuf.writeUint32LE(ctx.version, 0);
  tagBuf.writeUint32LE(AccountType.VM_CLIENT, 4);
  const address = (
    await getProgramDerivedAddress({
      programAddress: ctx.programId,
      seeds: [tagBuf, getAddressEncoder().encode(signer)],
    })
  )[0];
  return address;
}

function requireClientPrimaryAccount(ctx: { clientPrimaryAccount: Address | null }): Address {
  if (ctx.clientPrimaryAccount === null) throw new Error('Client primary account not found');
  return ctx.clientPrimaryAccount;
}

function requireClientCommunityAccount(ctx: { clientCommunityAccount: Address | null }): Address {
  if (ctx.clientCommunityAccount === null) throw new Error('Client community account not found');
  return ctx.clientCommunityAccount;
}

export {
  getAccountByTag,
  getInstrAccountByTag,
  getTokenAccount,
  getProgramTokenAccount,
  getTokenId,
  getInstrId,
  findAccountsByTag,
  findClientPrimaryAccount,
  findClientCommunityAccount,
  findClientVmAccount,
  requireClientPrimaryAccount,
  requireClientCommunityAccount,
};
