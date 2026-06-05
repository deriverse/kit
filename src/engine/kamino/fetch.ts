import { Address, Commitment, Rpc, SolanaRpcApiDevnet, SolanaRpcApiMainnet } from '@solana/kit';
import { Buffer } from 'buffer';

import { KLEND_PROGRAM_ID } from '../../constants';
import { decodeObligation } from './obligation';
import {
  decodeReserve,
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

export { fetchObligationDecoded, fetchReservesDecoded };
export type { KaminoFetchContext };
