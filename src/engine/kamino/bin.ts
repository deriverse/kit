import { Address, getAddressDecoder } from '@solana/kit';
import { Buffer } from 'buffer';

import { NULL_PUBKEY, SYSTEM_PROGRAM_ID } from '../../constants';

const ADDR_DECODER = getAddressDecoder();
const U64_BYTES = 8;
const U64_BITS = BigInt(64);

function readU128LE(buf: Buffer, offset: number): bigint {
  const low = buf.readBigUInt64LE(offset);
  const high = buf.readBigUInt64LE(offset + U64_BYTES);
  return low + (high << U64_BITS);
}

function readAddress(buf: Buffer, offset: number): Address {
  return ADDR_DECODER.decode(buf.subarray(offset, offset + ADDR_DECODER.fixedSize));
}

function isPubkeySentinel(addr: Address): boolean {
  return addr === SYSTEM_PROGRAM_ID || addr === NULL_PUBKEY;
}

export { readU128LE, readAddress, isPubkeySentinel };
