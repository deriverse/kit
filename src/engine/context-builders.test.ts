import { describe, it, expect } from 'vitest';
import { Address, AccountRole } from '@solana/kit';
import { getSpotContext, getPerpContext } from './context-builders';
import { AccountHelperContext } from './account-helpers';
import { InstrAccountHeaderModel } from '../structure_models';

// Mock context for testing
function createMockContext(): AccountHelperContext {
  return {
    rpc: {} as any,
    programId: 'DRVSvY68xD69Zwwgj9N8hRBu2eXvEzy8eejiVLNYGLti' as Address,
    version: 1,
    commitment: 'confirmed',
    drvsAuthority: 'DRVStQsAKhF8gpz1xLzWyk2Q1HKKF3g21tknXtHpVLab' as Address,
  };
}

// Create a mock instrument header
function createMockInstrHeader(overrides: Partial<InstrAccountHeaderModel> = {}): InstrAccountHeaderModel {
  const header = new InstrAccountHeaderModel();
  header.instrId = 1;
  header.assetTokenId = 1;
  header.crncyTokenId = 0;
  header.mapsAddress = '11111111111111111111111111111111' as Address;
  header.perpMapsAddress = '22222222222222222222222222222222' as Address;
  Object.assign(header, overrides);
  return header;
}

describe('context-builders', () => {
  describe('getSpotContext', () => {
    it('returns array of account metas', async () => {
      const ctx = createMockContext();
      const header = createMockInstrHeader();
      const accounts = await getSpotContext(ctx, header);

      expect(Array.isArray(accounts)).toBe(true);
      expect(accounts.length).toBe(8); // INSTR + BIDS_TREE + ASKS_TREE + BID_ORDERS + ASK_ORDERS + LINES + MAPS + CLIENT_INFOS
    });

    it('all accounts are writable', async () => {
      const ctx = createMockContext();
      const header = createMockInstrHeader();
      const accounts = await getSpotContext(ctx, header);

      accounts.forEach((account) => {
        expect(account.role).toBe(AccountRole.WRITABLE);
      });
    });

    it('includes mapsAddress from header', async () => {
      const ctx = createMockContext();
      const mapsAddress = 'TestMapsAddress111111111111111111' as Address;
      const header = createMockInstrHeader({ mapsAddress });
      const accounts = await getSpotContext(ctx, header);

      // mapsAddress should be at index 6 (7th element)
      expect(accounts[6].address).toBe(mapsAddress);
    });

    it('returns consistent accounts for same inputs', async () => {
      const ctx = createMockContext();
      const header = createMockInstrHeader();
      const accounts1 = await getSpotContext(ctx, header);
      const accounts2 = await getSpotContext(ctx, header);

      expect(accounts1.length).toBe(accounts2.length);
      for (let i = 0; i < accounts1.length; i++) {
        expect(accounts1[i].address).toBe(accounts2[i].address);
        expect(accounts1[i].role).toBe(accounts2[i].role);
      }
    });

    it('returns different accounts for different token pairs', async () => {
      const ctx = createMockContext();
      const header1 = createMockInstrHeader({ assetTokenId: 1, crncyTokenId: 0 });
      const header2 = createMockInstrHeader({ assetTokenId: 2, crncyTokenId: 0 });
      const accounts1 = await getSpotContext(ctx, header1);
      const accounts2 = await getSpotContext(ctx, header2);

      // INSTR address should be different
      expect(accounts1[0].address).not.toBe(accounts2[0].address);
    });
  });

  describe('getPerpContext', () => {
    it('returns array of account metas', async () => {
      const ctx = createMockContext();
      const header = createMockInstrHeader();
      const accounts = await getPerpContext(ctx, header);

      expect(Array.isArray(accounts)).toBe(true);
      // INSTR + BIDS_TREE + ASKS_TREE + BID_ORDERS + ASK_ORDERS + LINES + PERP_MAPS +
      // CLIENT_INFOS + CLIENT_INFOS2 + CLIENT_INFOS3 + CLIENT_INFOS4 + CLIENT_INFOS5 +
      // LONG_PX_TREE + SHORT_PX_TREE + REBALANCE_TIME_TREE
      expect(accounts.length).toBe(15);
    });

    it('all accounts are writable', async () => {
      const ctx = createMockContext();
      const header = createMockInstrHeader();
      const accounts = await getPerpContext(ctx, header);

      accounts.forEach((account) => {
        expect(account.role).toBe(AccountRole.WRITABLE);
      });
    });

    it('includes perpMapsAddress from header', async () => {
      const ctx = createMockContext();
      const perpMapsAddress = 'PerpMapsAddress11111111111111111' as Address;
      const header = createMockInstrHeader({ perpMapsAddress });
      const accounts = await getPerpContext(ctx, header);

      // perpMapsAddress should be at index 6 (7th element)
      expect(accounts[6].address).toBe(perpMapsAddress);
    });

    it('has more accounts than spot context', async () => {
      const ctx = createMockContext();
      const header = createMockInstrHeader();
      const spotAccounts = await getSpotContext(ctx, header);
      const perpAccounts = await getPerpContext(ctx, header);

      expect(perpAccounts.length).toBeGreaterThan(spotAccounts.length);
    });
  });
});
