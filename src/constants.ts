import { address } from '@solana/kit';
import { CandlesHeaderModel } from './structure_models';

export const VERSION = 1;
export const PROGRAM_ID = address('DRVSpZ2YUYYKgZP8XtLhAGtT1zYSCKzeHfb4DgRnrgqD');
export const MARKET_DEPTH = 20;

export const ADDRESS_LOOKUP_TABLE_PROGRAM_ID = address('AddressLookupTab1e1111111111111111111111111');
export const SYSTEM_PROGRAM_ID = address('11111111111111111111111111111111');
export const TOKEN_PROGRAM_ID = address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const TOKEN_2022_PROGRAM_ID = address('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
export const ASSOCIATED_TOKEN_PROGRAM_ID = address('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
export const STANDARD_MAPS_SIZE = 42184 + CandlesHeaderModel.LENGTH; // spot::memory_maps::MAPS_SIZE + CandlesHeader
export const EXTENDED_MAPS_SIZE = 68712 + CandlesHeaderModel.LENGTH; // extended_spot::memory_maps::MAPS_SIZE + CandlesHeader
export const DF = 1000000000;

export let dec = 1000000000;
export let lpDec = 10000;
export const nullOrder = 0xffff;

export function setDecimals(uiNumbers: boolean): void {
  if (!uiNumbers) {
    dec = 1;
    lpDec = 1;
  } else {
    dec = 1000000000;
    lpDec = 10000;
  }
}
