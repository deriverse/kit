import { Address, Base58EncodedBytes, Commitment, Rpc, SolanaRpcApiDevnet, SolanaRpcApiMainnet } from '@solana/kit';
import bs58 from 'bs58';
import { Buffer } from 'buffer';

import { KLEND_PROGRAM_ID } from '../../constants';
import { decodeObligation } from './obligation';
import {
  decodeReserve,
  RESERVE_DISCRIMINATOR,
  RESERVE_LENDING_MARKET_OFFSET,
  RESERVE_LIQ_MINT_OFFSET,
} from './reserve';
import { DecodedObligation, DecodedReserve } from '../../types/kamino';

interface KaminoFetchContext {
  rpc: Rpc<SolanaRpcApiDevnet> | Rpc<SolanaRpcApiMainnet>;
  commitment: Commitment;
}

async function fetchObligationDecoded(ctx: KaminoFetchContext, obligationAddress: Address): Promise<DecodedObligation> {
  const info = await ctx.rpc
    .getAccountInfo(obligationAddress, { encoding: 'base64', commitment: ctx.commitment })
    .send();
  if (!info.value) {
    throw new Error(`Obligation ${obligationAddress} not found`);
  }
  if (info.value.owner !== KLEND_PROGRAM_ID) {
    throw new Error(`Obligation ${obligationAddress} not owned by Kamino lend`);
  }
  const [b64] = info.value.data as [string, 'base64'];
  return decodeObligation(obligationAddress, Buffer.from(b64, 'base64'));
}

async function fetchReservesDecoded(
  ctx: KaminoFetchContext,
  reserveAddresses: readonly Address[],
): Promise<Map<Address, DecodedReserve>> {
  const out = new Map<Address, DecodedReserve>();
  if (reserveAddresses.length === 0) return out;
  const infos = await ctx.rpc
    .getMultipleAccounts(reserveAddresses as Address[], {
      encoding: 'base64',
      commitment: ctx.commitment,
    })
    .send();
  infos.value.forEach((info, i) => {
    const addr = reserveAddresses[i];
    if (!info) throw new Error(`Reserve ${addr} not found`);
    if (info.owner !== KLEND_PROGRAM_ID) {
      throw new Error(`Reserve ${addr} not owned by Kamino lend`);
    }
    const [b64] = info.data as [string, 'base64'];
    out.set(addr, decodeReserve(addr, Buffer.from(b64, 'base64')));
  });
  return out;
}

async function fetchReserveForMint(
  ctx: KaminoFetchContext,
  lendingMarket: Address,
  mint: Address,
): Promise<{ address: Address; reserve: DecodedReserve } | null> {
  const accounts = await ctx.rpc
    .getProgramAccounts(KLEND_PROGRAM_ID, {
      encoding: 'base64',
      commitment: ctx.commitment,
      filters: [
        {
          memcmp: {
            offset: BigInt(0),
            encoding: 'base58',
            bytes: bs58.encode(RESERVE_DISCRIMINATOR) as Base58EncodedBytes,
          },
        },
        {
          memcmp: {
            offset: RESERVE_LENDING_MARKET_OFFSET,
            encoding: 'base58',
            bytes: lendingMarket as string as Base58EncodedBytes,
          },
        },
        {
          memcmp: { offset: RESERVE_LIQ_MINT_OFFSET, encoding: 'base58', bytes: mint as string as Base58EncodedBytes },
        },
      ],
    })
    .send();
  if (!accounts || accounts.length === 0) return null;
  const acc = accounts[0];
  const [b64] = acc.account.data as [string, 'base64'];
  return { address: acc.pubkey, reserve: decodeReserve(acc.pubkey, Buffer.from(b64, 'base64')) };
}

export { fetchObligationDecoded, fetchReservesDecoded, fetchReserveForMint };
export type { KaminoFetchContext };
