import { describe, it, expect } from 'vitest';
import { Address } from '@solana/kit';
import {
  getAccountByTag,
  getInstrAccountByTag,
  getTokenAccount,
  findClientPrimaryAccount,
  findClientCommunityAccount,
  AccountHelperContext,
} from './account-helpers';
import { AccountType } from '../types/enums';

// Mock context for testing PDA derivation
function createMockContext(overrides: Partial<AccountHelperContext> = {}): AccountHelperContext {
  return {
    rpc: {} as any,
    programId: 'DRVSvY68xD69Zwwgj9N8hRBu2eXvEzy8eejiVLNYGLti' as Address,
    version: 1,
    commitment: 'confirmed',
    drvsAuthority: 'DRVStQsAKhF8gpz1xLzWyk2Q1HKKF3g21tknXtHpVLab' as Address,
    ...overrides,
  };
}

describe('account-helpers', () => {
  describe('getAccountByTag', () => {
    it('returns a valid address', async () => {
      const ctx = createMockContext();
      const address = await getAccountByTag(ctx, AccountType.ROOT);
      expect(address).toBeDefined();
      expect(typeof address).toBe('string');
      expect(address.length).toBeGreaterThan(30);
    });

    it('returns consistent addresses for same inputs', async () => {
      const ctx = createMockContext();
      const address1 = await getAccountByTag(ctx, AccountType.ROOT);
      const address2 = await getAccountByTag(ctx, AccountType.ROOT);
      expect(address1).toBe(address2);
    });

    it('returns different addresses for different tags', async () => {
      const ctx = createMockContext();
      const addressRoot = await getAccountByTag(ctx, AccountType.ROOT);
      const addressCommunity = await getAccountByTag(ctx, AccountType.COMMUNITY);
      expect(addressRoot).not.toBe(addressCommunity);
    });

    it('returns different addresses for different versions', async () => {
      const ctx1 = createMockContext({ version: 1 });
      const ctx2 = createMockContext({ version: 2 });
      const address1 = await getAccountByTag(ctx1, AccountType.ROOT);
      const address2 = await getAccountByTag(ctx2, AccountType.ROOT);
      expect(address1).not.toBe(address2);
    });

    it('returns different addresses for different drvsAuthority', async () => {
      const ctx1 = createMockContext({
        drvsAuthority: 'DRVStQsAKhF8gpz1xLzWyk2Q1HKKF3g21tknXtHpVLab' as Address,
      });
      const ctx2 = createMockContext({
        drvsAuthority: '11111111111111111111111111111111' as Address,
      });
      const address1 = await getAccountByTag(ctx1, AccountType.ROOT);
      const address2 = await getAccountByTag(ctx2, AccountType.ROOT);
      expect(address1).not.toBe(address2);
    });
  });

  describe('getInstrAccountByTag', () => {
    it('returns a valid address', async () => {
      const ctx = createMockContext();
      const address = await getInstrAccountByTag(ctx, {
        tag: AccountType.INSTR,
        assetTokenId: 1,
        crncyTokenId: 0,
      });
      expect(address).toBeDefined();
      expect(typeof address).toBe('string');
      expect(address.length).toBeGreaterThan(30);
    });

    it('returns consistent addresses for same inputs', async () => {
      const ctx = createMockContext();
      const args = { tag: AccountType.INSTR, assetTokenId: 1, crncyTokenId: 0 };
      const address1 = await getInstrAccountByTag(ctx, args);
      const address2 = await getInstrAccountByTag(ctx, args);
      expect(address1).toBe(address2);
    });

    it('returns different addresses for different token pairs', async () => {
      const ctx = createMockContext();
      const address1 = await getInstrAccountByTag(ctx, {
        tag: AccountType.INSTR,
        assetTokenId: 1,
        crncyTokenId: 0,
      });
      const address2 = await getInstrAccountByTag(ctx, {
        tag: AccountType.INSTR,
        assetTokenId: 2,
        crncyTokenId: 0,
      });
      expect(address1).not.toBe(address2);
    });

    it('returns different addresses for different tags', async () => {
      const ctx = createMockContext();
      const address1 = await getInstrAccountByTag(ctx, {
        tag: AccountType.INSTR,
        assetTokenId: 1,
        crncyTokenId: 0,
      });
      const address2 = await getInstrAccountByTag(ctx, {
        tag: AccountType.SPOT_BIDS_TREE,
        assetTokenId: 1,
        crncyTokenId: 0,
      });
      expect(address1).not.toBe(address2);
    });
  });

  describe('getTokenAccount', () => {
    it('returns a valid address', async () => {
      const ctx = createMockContext();
      const mint = 'So11111111111111111111111111111111111111112' as Address;
      const address = await getTokenAccount(ctx, mint);
      expect(address).toBeDefined();
      expect(typeof address).toBe('string');
      expect(address.length).toBeGreaterThan(30);
    });

    it('returns consistent addresses for same mint', async () => {
      const ctx = createMockContext();
      const mint = 'So11111111111111111111111111111111111111112' as Address;
      const address1 = await getTokenAccount(ctx, mint);
      const address2 = await getTokenAccount(ctx, mint);
      expect(address1).toBe(address2);
    });

    it('returns different addresses for different mints', async () => {
      const ctx = createMockContext();
      const mint1 = 'So11111111111111111111111111111111111111112' as Address;
      const mint2 = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as Address;
      const address1 = await getTokenAccount(ctx, mint1);
      const address2 = await getTokenAccount(ctx, mint2);
      expect(address1).not.toBe(address2);
    });
  });

  describe('findClientPrimaryAccount', () => {
    it('returns a valid address', async () => {
      const ctx = createMockContext();
      const signer = 'DRVStQsAKhF8gpz1xLzWyk2Q1HKKF3g21tknXtHpVLab' as Address;
      const address = await findClientPrimaryAccount(ctx, signer);
      expect(address).toBeDefined();
      expect(typeof address).toBe('string');
      expect(address.length).toBeGreaterThan(30);
    });

    it('returns consistent addresses for same signer', async () => {
      const ctx = createMockContext();
      const signer = 'DRVStQsAKhF8gpz1xLzWyk2Q1HKKF3g21tknXtHpVLab' as Address;
      const address1 = await findClientPrimaryAccount(ctx, signer);
      const address2 = await findClientPrimaryAccount(ctx, signer);
      expect(address1).toBe(address2);
    });

    it('returns different addresses for different signers', async () => {
      const ctx = createMockContext();
      const signer1 = 'DRVStQsAKhF8gpz1xLzWyk2Q1HKKF3g21tknXtHpVLab' as Address;
      const signer2 = '11111111111111111111111111111111' as Address;
      const address1 = await findClientPrimaryAccount(ctx, signer1);
      const address2 = await findClientPrimaryAccount(ctx, signer2);
      expect(address1).not.toBe(address2);
    });

    it('only requires programId and version from context', async () => {
      // findClientPrimaryAccount uses Pick<AccountHelperContext, 'programId' | 'version'>
      const minimalCtx = {
        programId: 'DRVSvY68xD69Zwwgj9N8hRBu2eXvEzy8eejiVLNYGLti' as Address,
        version: 1,
      };
      const signer = 'DRVStQsAKhF8gpz1xLzWyk2Q1HKKF3g21tknXtHpVLab' as Address;
      const address = await findClientPrimaryAccount(minimalCtx, signer);
      expect(address).toBeDefined();
    });
  });

  describe('findClientCommunityAccount', () => {
    it('returns a valid address', async () => {
      const ctx = createMockContext();
      const signer = 'DRVStQsAKhF8gpz1xLzWyk2Q1HKKF3g21tknXtHpVLab' as Address;
      const address = await findClientCommunityAccount(ctx, signer);
      expect(address).toBeDefined();
      expect(typeof address).toBe('string');
      expect(address.length).toBeGreaterThan(30);
    });

    it('returns consistent addresses for same signer', async () => {
      const ctx = createMockContext();
      const signer = 'DRVStQsAKhF8gpz1xLzWyk2Q1HKKF3g21tknXtHpVLab' as Address;
      const address1 = await findClientCommunityAccount(ctx, signer);
      const address2 = await findClientCommunityAccount(ctx, signer);
      expect(address1).toBe(address2);
    });

    it('returns different addresses for different signers', async () => {
      const ctx = createMockContext();
      const signer1 = 'DRVStQsAKhF8gpz1xLzWyk2Q1HKKF3g21tknXtHpVLab' as Address;
      const signer2 = '11111111111111111111111111111111' as Address;
      const address1 = await findClientCommunityAccount(ctx, signer1);
      const address2 = await findClientCommunityAccount(ctx, signer2);
      expect(address1).not.toBe(address2);
    });

    it('returns different address than findClientPrimaryAccount for same signer', async () => {
      const ctx = createMockContext();
      const signer = 'DRVStQsAKhF8gpz1xLzWyk2Q1HKKF3g21tknXtHpVLab' as Address;
      const primaryAddress = await findClientPrimaryAccount(ctx, signer);
      const communityAddress = await findClientCommunityAccount(ctx, signer);
      expect(primaryAddress).not.toBe(communityAddress);
    });
  });
});
