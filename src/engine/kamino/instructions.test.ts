import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Address } from '@solana/kit';
import { Buffer } from 'buffer';

import { TokenStateModel, InstrAccountHeaderModel, VmFlag } from '../../structure_models';
import {
  Instrument,
  VmAddKaminoArgs,
  VmRemoveKaminoArgs,
  KaminoInitObligationArgs,
  KaminoInitTokenAccountsArgs,
  KaminoInitObligationFarmsArgs,
  KaminoChangePositionArgs,
} from '../../types';

import {
  buildVmAddKaminoInstruction,
  buildVmRemoveKaminoInstruction,
  buildKaminoInitObligationInstruction,
  buildKaminoInitTokenAccountsInstruction,
  buildKaminoInitObligationFarmsInstruction,
  buildKaminoChangePositionInstruction,
  KaminoInstructionContext,
} from './instructions';

vi.mock('../account-helpers', () => ({
  findClientPrimaryAccount: vi.fn().mockResolvedValue('MockClientPrimary11111111111111' as Address),
  findClientVmAccount: vi.fn().mockResolvedValue('MockClientVm111111111111111111' as Address),
  findKaminoUserMetadata: vi.fn().mockResolvedValue('MockUserMetadata111111111111111' as Address),
  findKaminoLendingMarketAuthority: vi.fn().mockResolvedValue('MockLendingMarketAuth1111111111' as Address),
  findKaminoObligationFarmUserState: vi
    .fn()
    .mockResolvedValue('MockObligationFarm1111111111111' as Address),
  getProgramTokenAccount: vi.fn().mockResolvedValue('MockProgramTokenAccount11111111' as Address),
}));

vi.mock('../utils', () => ({
  findAssociatedTokenAddress: vi.fn().mockResolvedValue('MockATA1111111111111111111111111' as Address),
}));

function mockAddr(label: string): Address {
  const padded = (label + '1'.repeat(44)).slice(0, 44);
  return padded as Address;
}

function createMockToken(id: number): TokenStateModel {
  const token = new TokenStateModel();
  token.id = id;
  token.mask = 9; // decimals in low bits; no Token-2022 flag
  token.address = mockAddr(`Mint${id}`);
  token.programAddress = mockAddr(`Prog${id}`);
  return token;
}

function createMockInstrument(instrId: number, assetTokenId = 1, crncyTokenId = 0): Instrument {
  const header = new InstrAccountHeaderModel();
  header.instrId = instrId;
  header.assetTokenId = assetTokenId;
  header.crncyTokenId = crncyTokenId;
  return {
    address: mockAddr(`Instr${instrId}`),
    header,
    spotBids: [],
    spotAsks: [],
    perpBids: [],
    perpAsks: [],
  };
}

function createMockContext(overrides: Partial<KaminoInstructionContext> = {}): KaminoInstructionContext {
  const tokens = new Map<number, TokenStateModel>();
  tokens.set(0, createMockToken(0));
  tokens.set(1, createMockToken(1));
  return {
    rpc: {} as any,
    programId: mockAddr('PROG'),
    version: 1,
    commitment: 'confirmed',
    drvsAuthority: mockAddr('AUTH'),
    tokens,
    uiNumbers: true,
    signer: mockAddr('SIGN'),
    rootAccount: mockAddr('ROOT'),
    vmMask: 0,
    ...overrides,
  };
}

function defaultKaminoChangeArgs(): KaminoChangePositionArgs {
  const oracles = {
    pyth: mockAddr('pyth'),
    sbPrice: mockAddr('sbp'),
    sbTwap: mockAddr('sbt'),
    scope: mockAddr('scp'),
  };
  return {
    instrId: 1,
    borrowDelta: 100,
    collateralDelta: 50,
    customId: 7,
    lendingMarket: mockAddr('lm'),
    obligation: mockAddr('obl'),
    collReserve: mockAddr('cres'),
    collLiqMint: mockAddr('cmint'),
    collReserveLiqSupply: mockAddr('csup'),
    collReserveCollMint: mockAddr('ccmint'),
    collDestDepositColl: mockAddr('cdest'),
    collTokenProgram: mockAddr('ctok'),
    collLiqTokenProgram: mockAddr('cliq'),
    collOracles: oracles,
    debtReserve: mockAddr('dres'),
    debtLiqMint: mockAddr('dmint'),
    debtReserveSourceLiq: mockAddr('dsrc'),
    debtTokenProgram: mockAddr('dtok'),
    debtOracles: oracles,
  };
}

describe('kamino instruction builders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildVmAddKaminoInstruction', () => {
    it('produces tag 81 with 5 accounts', async () => {
      const ctx = createMockContext();
      const args: VmAddKaminoArgs = { vmAuthority: mockAddr('vmAuth') };

      const ix = await buildVmAddKaminoInstruction(ctx, args);

      expect(ix.programAddress).toBe(ctx.programId);
      expect(ix.accounts!.length).toBe(5);
      expect((ix.data as Buffer)[0]).toBe(81);
    });
  });

  describe('buildVmRemoveKaminoInstruction', () => {
    it('produces tag 82 with 4 accounts', async () => {
      const ctx = createMockContext();
      const args: VmRemoveKaminoArgs = { vmAuthority: mockAddr('vmAuth') };

      const ix = await buildVmRemoveKaminoInstruction(ctx, args);

      expect(ix.programAddress).toBe(ctx.programId);
      expect(ix.accounts!.length).toBe(4);
      expect((ix.data as Buffer)[0]).toBe(82);
    });
  });

  describe('buildKaminoInitObligationInstruction', () => {
    const args: KaminoInitObligationArgs = {
      instrId: 1,
      lendingMarket: mockAddr('lm'),
      obligation: mockAddr('obl'),
    };

    it('produces tag 83 with 11 accounts when VM is inactive', async () => {
      const ctx = createMockContext({ vmMask: 0 });

      const ix = await buildKaminoInitObligationInstruction(ctx, args, mockAddr('instr'));

      expect(ix.accounts!.length).toBe(11);
      expect((ix.data as Buffer)[0]).toBe(83);
    });

    it('inserts the VM account when VmFlag.active is set (12 accounts)', async () => {
      const ctx = createMockContext({ vmMask: VmFlag.active });

      const ix = await buildKaminoInitObligationInstruction(ctx, args, mockAddr('instr'));

      expect(ix.accounts!.length).toBe(12);
    });
  });

  describe('buildKaminoInitTokenAccountsInstruction', () => {
    const args: KaminoInitTokenAccountsArgs = { instrId: 1 };

    it('produces tag 84 with 12 accounts when VM is inactive', async () => {
      const ctx = createMockContext({ vmMask: 0 });
      const instr = createMockInstrument(1, 1, 0);

      const ix = await buildKaminoInitTokenAccountsInstruction(ctx, args, instr);

      expect(ix.accounts!.length).toBe(12);
      expect((ix.data as Buffer)[0]).toBe(84);
    });

    it('inserts the VM account when VmFlag.active is set (13 accounts)', async () => {
      const ctx = createMockContext({ vmMask: VmFlag.active });
      const instr = createMockInstrument(1, 1, 0);

      const ix = await buildKaminoInitTokenAccountsInstruction(ctx, args, instr);

      expect(ix.accounts!.length).toBe(13);
    });
  });

  describe('buildKaminoInitObligationFarmsInstruction', () => {
    const args: KaminoInitObligationFarmsArgs = {
      instrId: 1,
      side: 0,
      lendingMarket: mockAddr('lm'),
      obligation: mockAddr('obl'),
      reserve: mockAddr('reserve'),
      reserveFarmState: mockAddr('rfs'),
    };

    it('produces tag 86 with 14 accounts when VM is inactive', async () => {
      const ctx = createMockContext({ vmMask: 0 });

      const ix = await buildKaminoInitObligationFarmsInstruction(ctx, args, mockAddr('instr'));

      expect(ix.accounts!.length).toBe(14);
      expect((ix.data as Buffer)[0]).toBe(86);
    });

    it('encodes the side byte at offset 1', async () => {
      const ctx = createMockContext();

      const ixCollat = await buildKaminoInitObligationFarmsInstruction(ctx, args, mockAddr('instr'));
      const ixDebt = await buildKaminoInitObligationFarmsInstruction(
        ctx,
        { ...args, side: 1 },
        mockAddr('instr'),
      );

      expect((ixCollat.data as Buffer)[1]).toBe(0);
      expect((ixDebt.data as Buffer)[1]).toBe(1);
    });
  });

  describe('buildKaminoChangePositionInstruction', () => {
    it('produces tag 85 with 39 accounts when VM is inactive and no extras', async () => {
      const ctx = createMockContext({ vmMask: 0 });
      const args = defaultKaminoChangeArgs();

      const ix = await buildKaminoChangePositionInstruction(ctx, args, mockAddr('instr'));

      expect(ix.accounts!.length).toBe(39);
      expect((ix.data as Buffer)[0]).toBe(85);
    });

    it('inserts the VM account when VmFlag.active is set', async () => {
      const ctx = createMockContext({ vmMask: VmFlag.active });
      const args = defaultKaminoChangeArgs();

      const ix = await buildKaminoChangePositionInstruction(ctx, args, mockAddr('instr'));

      expect(ix.accounts!.length).toBe(40);
    });

    it('appends a 5-tuple per extra reserve', async () => {
      const ctx = createMockContext({ vmMask: 0 });
      const args: KaminoChangePositionArgs = {
        ...defaultKaminoChangeArgs(),
        extraReserves: [
          {
            reserve: mockAddr('xres'),
            oracles: {
              pyth: mockAddr('xpyth'),
              sbPrice: mockAddr('xsbp'),
              sbTwap: mockAddr('xsbt'),
              scope: mockAddr('xscp'),
            },
          },
        ],
      };

      const ix = await buildKaminoChangePositionInstruction(ctx, args, mockAddr('instr'));

      expect(ix.accounts!.length).toBe(39 + 5);
    });
  });
});
