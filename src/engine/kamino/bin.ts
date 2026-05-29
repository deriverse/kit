import { Address, getAddressDecoder } from '@solana/kit';
import { Buffer } from 'buffer';

import { NULL_PUBKEY, SYSTEM_PROGRAM_ID } from '../../constants';

const ADDR_DECODER = getAddressDecoder();
const SHIFT_64 = BigInt(64);

function readU128LE(buf: Buffer, offset: number): bigint {
  return buf.readBigUInt64LE(offset) + (buf.readBigUInt64LE(offset + 8) << SHIFT_64);
}

function readAddress(buf: Buffer, offset: number): Address {
  return ADDR_DECODER.decode(buf.subarray(offset, offset + 32));
}

function isPubkeySentinel(addr: Address): boolean {
  return addr === SYSTEM_PROGRAM_ID || addr === NULL_PUBKEY;
}

function readAddressOrNull(buf: Buffer, offset: number): Address | null {
  const addr = readAddress(buf, offset);
  return isPubkeySentinel(addr) ? null : addr;
}

export { readU128LE, readAddress, isPubkeySentinel, readAddressOrNull };
