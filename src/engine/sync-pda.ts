import { Address, getAddressDecoder, getAddressEncoder, ProgramDerivedAddress, ReadonlyUint8Array } from '@solana/kit';
import { ed25519 } from '@noble/curves/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { Buffer } from 'buffer';

const addressEncoder = getAddressEncoder();
const addressDecoder = getAddressDecoder();
const PDA_MARKER = Buffer.from('ProgramDerivedAddress');

function isOnCurve(bytes: Uint8Array): boolean {
  try {
    // Match Kit's decompression: allow noncanonical y, reject x=0 with its sign bit set.
    const point = ed25519.Point.fromBytes(bytes, true);
    return !(point.X === BigInt(0) && (bytes[31] & 0x80) !== 0);
  } catch {
    return false;
  }
}

/** Instance-owned cache, shared by all synchronous Orca account derivations. */
export class SyncPdaCache {
  private addresses = new Map<string, ProgramDerivedAddress>();

  get(programAddress: Address, seeds: readonly (string | ReadonlyUint8Array)[]): ProgramDerivedAddress {
    if (seeds.length > 15) throw new RangeError('PDA requires at most 15 seeds before the bump');
    const bytes = seeds.map((seed) => (typeof seed === 'string' ? Buffer.from(seed) : Buffer.from([...seed])));
    if (bytes.some((seed) => seed.length > 32)) throw new RangeError('PDA seed exceeds 32 bytes');
    const key = `${programAddress}:${bytes.map((seed) => seed.toString('hex')).join(':')}`;
    const cached = this.addresses.get(key);
    if (cached) return cached;

    const programBytes = Buffer.from(addressEncoder.encode(programAddress));
    for (let bump = 255; bump > 0; bump--) {
      const hash = sha256(Buffer.concat([...bytes, Buffer.from([bump]), programBytes, PDA_MARKER]));
      if (isOnCurve(hash)) continue;
      const result = Object.freeze([addressDecoder.decode(hash), bump]) as ProgramDerivedAddress;
      this.addresses.set(key, result);
      return result;
    }
    throw new Error('Unable to find a viable program derived address bump');
  }
}
