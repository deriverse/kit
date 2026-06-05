import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { Address } from '@solana/kit';
import { Buffer } from 'buffer';

import { TokenStateModel, InstrAccountHeaderModel, VmFlag } from '../../structure_models';
import { KLEND_PROGRAM_ID, SYSTEM_PROGRAM_ID } from '../../constants';
import {
  Instrument,
  VmAddKaminoArgs,
  VmRemoveKaminoArgs,
  ParsedKaminoInitObligationArgs,
  KaminoInitTokenAccountsArgs,
  ParsedKaminoInitObligationFarmsArgs,
  ParsedKaminoChangePositionArgs,
} from '../../types';

import {
  buildVmAddKaminoInstruction,
  buildVmRemoveKaminoInstruction,
  buildKaminoInitObligationInstruction,
  buildKaminoInitTokenAccountsInstruction,
  buildKaminoInitObligationFarmsInstructions,
  buildKaminoChangePositionInstruction,
  KaminoInstructionContext,
} from './instructions';
import { decodeObligation } from './obligation';
import { decodeReserve } from './reserve';

const decodeObligationMock = decodeObligation as unknown as Mock;
const decodeReserveMock = decodeReserve as unknown as Mock;

vi.mock('../account-helpers', () => ({
  findClientPrimaryAccount: vi.fn().mockResolvedValue('MockClientPrimary11111111111111' as Address),
  findClientVmAccount: vi.fn().mockResolvedValue('MockClientVm111111111111111111' as Address),
  findKaminoUserMetadata: vi.fn().mockResolvedValue('MockUserMetadata111111111111111' as Address),
  findKaminoObligation: vi.fn().mockResolvedValue('MockObligation11111111111111111' as Address),
  findKaminoLendingMarketAuthority: vi.fn().mockResolvedValue('MockLendingMarketAuth1111111111' as Address),
  findKaminoObligationFarmUserState: vi
    .fn()
    .mockResolvedValue('MockObligationFarm1111111111111' as Address),
  getProgramTokenAccount: vi.fn().mockResolvedValue('MockProgramTokenAccount11111111' as Address),
}));

vi.mock('../utils', () => ({
  findAssociatedTokenAddress: vi.fn().mockResolvedValue('MockATA1111111111111111111111111' as Address),
}));

vi.mock('./obligation', () => ({
  decodeObligation: vi.fn(),
}));

vi.mock('./reserve', () => ({
  decodeReserve: vi.fn(),
  RESERVE_DISCRIMINATOR: Buffer.from([43, 242, 204, 202, 26, 247, 59, 127]),
  RESERVE_LENDING_MARKET_OFFSET: BigInt(8 + 24),
  RESERVE_LIQ_MINT_OFFSET: BigInt(8 + 120),
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
  const account = { owner: KLEND_PROGRAM_ID, data: ['', 'base64'] };
  const rpc = {
    getAccountInfo: () => ({ send: async () => ({ value: account }) }),
    getMultipleAccounts: (addrs: Address[]) => ({
      send: async () => ({ value: addrs.map(() => account) }),
    }),
    getProgramAccounts: (_program: Address, config: any) => ({
      send: async () => {
        const mintFilter = config.filters.find((f: any) => f.memcmp.offset === BigInt(8 + 120));
        const pubkey = mintFilter?.memcmp.bytes === MINT_ASSET ? COLL_RES : DEBT_RES;
        return [{ pubkey, account: { data: ['', 'base64'] } }];
      },
    }),
  };
  return {
    rpc: rpc as any,
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

function defaultKaminoChangeArgs(): ParsedKaminoChangePositionArgs {
  return {
    instrId: 1,
    borrowDelta: 100,
    collateralDelta: 50,
    customId: 7,
    lendingMarket: mockAddr('lm'),
  };
}

// Instrument 1 prices asset token 1 (Mint1) against crncy token 0 (Mint0).
const COLL_RES = mockAddr('cres');
const DEBT_RES = mockAddr('dres');
const EXTRA_RES = mockAddr('xres');
const MINT_ASSET = mockAddr('Mint1');
const MINT_CRNCY = mockAddr('Mint0');
const MINT_OTHER = mockAddr('Mint9');

function makeReserve(addr: Address, mint: Address) {
  return {
    address: addr,
    lastUpdateSlot: BigInt(0),
    lendingMarket: mockAddr('lm'),
    // Sentinel farms -> no farm legs (keeps the base account count at 39).
    farmCollateral: SYSTEM_PROGRAM_ID,
    farmDebt: SYSTEM_PROGRAM_ID,
    liquidity: {
      mint,
      supplyVault: mockAddr('sup'),
      feeVault: mockAddr('fee'),
      tokenProgram: mockAddr('tprog'),
      mintDecimals: 6,
      availableAmount: BigInt(0),
      borrowedAmountSf: BigInt(0),
      accumulatedProtocolFeesSf: BigInt(0),
      accumulatedReferrerFeesSf: BigInt(0),
    },
    collateral: { mint: mockAddr('ccmint'), supplyVault: mockAddr('cdest'), mintTotalSupply: BigInt(0) },
    config: { loanToValuePct: 0, borrowFactorPct: BigInt(0) },
    oracles: {
      pyth: mockAddr('pyth'),
      switchboardPrice: mockAddr('sbp'),
      switchboardTwap: mockAddr('sbt'),
      scope: mockAddr('scp'),
    },
  };
}

const RESERVE_MINTS = new Map<Address, Address>([
  [COLL_RES, MINT_ASSET],
  [DEBT_RES, MINT_CRNCY],
  [EXTRA_RES, MINT_OTHER],
]);

function setupChangePositionMocks(
  depositReserves: Address[] = [COLL_RES],
  borrowReserves: Address[] = [DEBT_RES],
): void {
  decodeObligationMock.mockReturnValue({
    address: mockAddr('obl'),
    lastUpdateSlot: BigInt(0),
    lendingMarket: mockAddr('lm'),
    owner: mockAddr('owner'),
    depositReserves,
    borrowReserves,
    deposits: [],
    borrows: [],
    referrer: null,
  });
  decodeReserveMock.mockImplementation((addr: Address) =>
    makeReserve(addr, RESERVE_MINTS.get(addr) ?? MINT_OTHER),
  );
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
    const args: ParsedKaminoInitObligationArgs = {
      instrId: 1,
      lendingMarket: mockAddr('lm'),
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

  describe('buildKaminoInitObligationFarmsInstructions', () => {
    const args: ParsedKaminoInitObligationFarmsArgs = {
      instrId: 1,
      collateralToken: 'asset',
      lendingMarket: mockAddr('lm'),
    };

    beforeEach(() => {
      decodeReserveMock.mockImplementation((addr: Address) => ({
        ...makeReserve(addr, MINT_ASSET),
        farmCollateral: mockAddr('cfarm'),
        farmDebt: mockAddr('dfarm'),
      }));
    });

    it('emits one tag-86 instruction per side, 14 accounts each when VM is inactive', async () => {
      const ctx = createMockContext({ vmMask: 0 });

      const ixs = await buildKaminoInitObligationFarmsInstructions(ctx, args, createMockInstrument(1));

      expect(ixs).toHaveLength(2);
      expect(ixs.every((ix) => ix.accounts!.length === 14)).toBe(true);
      expect(ixs.every((ix) => (ix.data as Buffer)[0] === 86)).toBe(true);
    });

    it('emits collateral (side 0) then debt (side 1)', async () => {
      const ctx = createMockContext();

      const ixs = await buildKaminoInitObligationFarmsInstructions(ctx, args, createMockInstrument(1));

      expect((ixs[0].data as Buffer)[1]).toBe(0);
      expect((ixs[1].data as Buffer)[1]).toBe(1);
    });

    it('skips a side whose reserve has no farm', async () => {
      decodeReserveMock.mockImplementation((addr: Address) => ({
        ...makeReserve(addr, MINT_ASSET),
        farmCollateral: SYSTEM_PROGRAM_ID,
        farmDebt: mockAddr('dfarm'),
      }));
      const ctx = createMockContext();

      const ixs = await buildKaminoInitObligationFarmsInstructions(ctx, args, createMockInstrument(1));

      expect(ixs).toHaveLength(1);
      expect((ixs[0].data as Buffer)[1]).toBe(1);
    });
  });

  describe('buildKaminoChangePositionInstruction', () => {
    it('produces tag 85 with 39 accounts when VM is inactive and no extras', async () => {
      setupChangePositionMocks();
      const ctx = createMockContext({ vmMask: 0 });
      const args = defaultKaminoChangeArgs();

      const ix = await buildKaminoChangePositionInstruction(ctx, args, createMockInstrument(1));

      expect(ix.accounts!.length).toBe(39);
      expect((ix.data as Buffer)[0]).toBe(85);
    });

    it('inserts the VM account when VmFlag.active is set', async () => {
      setupChangePositionMocks();
      const ctx = createMockContext({ vmMask: VmFlag.active });
      const args = defaultKaminoChangeArgs();

      const ix = await buildKaminoChangePositionInstruction(ctx, args, createMockInstrument(1));

      expect(ix.accounts!.length).toBe(40);
    });

    it('appends a 5-tuple per extra reserve the obligation references', async () => {
      // Obligation references an extra deposit reserve whose mint is not part of the instrument.
      setupChangePositionMocks([COLL_RES, EXTRA_RES], [DEBT_RES]);
      const ctx = createMockContext({ vmMask: 0 });
      const args = defaultKaminoChangeArgs();

      const ix = await buildKaminoChangePositionInstruction(ctx, args, createMockInstrument(1));

      expect(ix.accounts!.length).toBe(39 + 5);
    });

    it('throws when no obligation leg matches the instrument mints', async () => {
      // Both legs are unrelated reserves -> neither matches the instrument's asset/crncy mints.
      setupChangePositionMocks([EXTRA_RES], [EXTRA_RES]);
      const ctx = createMockContext({ vmMask: 0 });
      const args = defaultKaminoChangeArgs();

      await expect(
        buildKaminoChangePositionInstruction(ctx, args, createMockInstrument(1)),
      ).rejects.toThrow(/collateral/i);
    });
  });
});
