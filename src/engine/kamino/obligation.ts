import { Address } from '@solana/kit';
import { Buffer } from 'buffer';

import { isPubkeySentinel, readAddress, readAddressOrNull, readU128LE } from './bin';

const OBLIGATION_DISCRIMINATOR = Buffer.from([168, 206, 141, 106, 88, 76, 172, 167]);

const OBLIGATION_HEADER_BYTES = 8 + 16 + 32 + 32;

const DEPOSIT_SLOTS = 8;
const DEPOSIT_SIZE = 32 + 8 + 16 + 8 + 9 * 8;
const DEPOSITS_OFFSET = OBLIGATION_HEADER_BYTES;
const DEPOSITS_END = DEPOSITS_OFFSET + DEPOSIT_SLOTS * DEPOSIT_SIZE;

const BORROW_SLOTS = 5;
const BORROW_SIZE = 32 + 48 + 8 + 16 + 16 + 16 + 8 + 7 * 8;
const BORROWS_OFFSET = DEPOSITS_END + 8 + 16;
const REFERRER_OFFSET = BORROWS_OFFSET + BORROW_SLOTS * BORROW_SIZE + 16 + 16 + 16 + 16 + 13 + 1 + 1 + 1;

interface ObligationDeposit {
  reserve: Address;
  depositedCTokens: bigint;
}

interface ObligationBorrow {
  reserve: Address;
  borrowedAmountSf: bigint;
}

interface DecodedObligation {
  address: Address;
  lastUpdateSlot: bigint;
  lendingMarket: Address;
  owner: Address;
  depositReserves: Address[];
  borrowReserves: Address[];
  deposits: ObligationDeposit[];
  borrows: ObligationBorrow[];
  referrer: Address | null;
}

function decodeObligation(obligationAddress: Address, raw: Buffer): DecodedObligation {
  if (raw.length < 8 + REFERRER_OFFSET + 32) {
    throw new Error(`Obligation ${obligationAddress} too short: ${raw.length}`);
  }
  if (!raw.subarray(0, 8).equals(OBLIGATION_DISCRIMINATOR)) {
    throw new Error(`Obligation ${obligationAddress} has wrong discriminator`);
  }
  const body = raw.subarray(8);

  const lastUpdateSlot = body.readBigUInt64LE(8);
  const lendingMarket = readAddress(body, 8 + 16);
  const owner = readAddress(body, 8 + 16 + 32);

  const depositReserves: Address[] = [];
  const deposits: ObligationDeposit[] = [];
  for (let i = 0; i < DEPOSIT_SLOTS; i++) {
    const slot = DEPOSITS_OFFSET + i * DEPOSIT_SIZE;
    const reserve = readAddress(body, slot);
    if (isPubkeySentinel(reserve)) continue;
    depositReserves.push(reserve);
    deposits.push({ reserve, depositedCTokens: body.readBigUInt64LE(slot + 32) });
  }

  const borrowReserves: Address[] = [];
  const borrows: ObligationBorrow[] = [];
  for (let i = 0; i < BORROW_SLOTS; i++) {
    const slot = BORROWS_OFFSET + i * BORROW_SIZE;
    const reserve = readAddress(body, slot);
    if (isPubkeySentinel(reserve)) continue;
    borrowReserves.push(reserve);
    borrows.push({ reserve, borrowedAmountSf: readU128LE(body, slot + 88) });
  }

  const referrer = readAddressOrNull(body, REFERRER_OFFSET);

  return {
    address: obligationAddress,
    lastUpdateSlot,
    lendingMarket,
    owner,
    depositReserves,
    borrowReserves,
    deposits,
    borrows,
    referrer,
  };
}

export { decodeObligation };
export type { DecodedObligation, ObligationDeposit, ObligationBorrow };
