import { Address, Commitment, Rpc, SolanaRpcApiDevnet, SolanaRpcApiMainnet } from '@solana/kit';

import { KLEND_PROGRAM_ID } from '../../constants';
import { Instrument } from '../../types';
import {
  KaminoInstrumentAtasStatus,
  KaminoObligationStatus,
} from '../../types/kamino';
import { findKaminoObligation } from '../account-helpers';
import { findAssociatedTokenAddress, requireToken, tokenProgramFor } from '../utils';
import { TokenStateModel } from '../../structure_models';

interface KaminoChecksContext {
  rpc: Rpc<SolanaRpcApiDevnet> | Rpc<SolanaRpcApiMainnet>;
  commitment: Commitment;
  tokens: Map<number, TokenStateModel>;
  clientPrimary: Address;
}

async function checkKaminoInstrumentAtas(
  ctx: KaminoChecksContext,
  instr: Instrument,
): Promise<KaminoInstrumentAtasStatus> {
  const assetToken = requireToken(ctx.tokens, instr.header.assetTokenId);
  const crncyToken = requireToken(ctx.tokens, instr.header.crncyTokenId);
  const assetTokenProgram = tokenProgramFor(assetToken);
  const crncyTokenProgram = tokenProgramFor(crncyToken);

  const [assetAta, crncyAta] = await Promise.all([
    findAssociatedTokenAddress(ctx.clientPrimary, assetTokenProgram, assetToken.address),
    findAssociatedTokenAddress(ctx.clientPrimary, crncyTokenProgram, crncyToken.address),
  ]);

  const infos = await ctx.rpc
    .getMultipleAccounts([assetAta, crncyAta], { encoding: 'base64', commitment: ctx.commitment })
    .send();

  return {
    assetAta: { address: assetAta, exists: infos.value[0] !== null },
    crncyAta: { address: crncyAta, exists: infos.value[1] !== null },
  };
}

async function checkKaminoObligation(
  ctx: KaminoChecksContext,
  lendingMarket: Address,
): Promise<KaminoObligationStatus> {
  const obligation = await findKaminoObligation(ctx.clientPrimary, lendingMarket);
  const info = await ctx.rpc
    .getAccountInfo(obligation, { encoding: 'base64', commitment: ctx.commitment })
    .send();
  const exists = info.value !== null && info.value.owner === KLEND_PROGRAM_ID;
  return { obligation, exists };
}

export { checkKaminoInstrumentAtas, checkKaminoObligation };
