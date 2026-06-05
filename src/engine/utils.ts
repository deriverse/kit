import { Address, Base64EncodedDataResponse, getProgramDerivedAddress, getAddressEncoder } from '@solana/kit';
import { Buffer } from 'buffer';
import {
  OrderModel,
  SpotTradeAccountHeaderModel,
  PerpTradeAccountHeaderModel,
  TokenFlag,
  TokenStateModel,
} from '../structure_models';
import {
  ADDRESS_LOOKUP_TABLE_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  nullOrder,
} from '../constants';

/**
 * Get token decimal factor for UI number conversion
 */
export function tokenDec(tokens: Map<number, TokenStateModel>, tokenId: number, uiNumbers: boolean): number {
  if (uiNumbers) {
    const token = tokens.get(tokenId);
    if (token) {
      return Math.pow(10, token.mask & 0xff);
    }
  }
  return 1;
}

export function tokenProgramFor(token: TokenStateModel): Address {
  return (token.mask & TokenFlag.token2022) !== 0 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
}

export function requireToken(tokens: Map<number, TokenStateModel>, tokenId: number): TokenStateModel {
  const token = tokens.get(tokenId);
  if (!token) {
    throw new Error(`Token ${tokenId} not found`);
  }
  return token;
}

export const SAM_PRICE_STEP = 0.00001;

/**
 * Get price step between orderbook lines depending on curent price
 * @param price Current market price
 * @param isSimilarAssets Whether the instrument has the `SimilarAssets` flag set
 * @returns Price step
 */
export function getSpotPriceStep(price: number, isSimilarAssets: boolean = false): number {
  if (isSimilarAssets) {
    return SAM_PRICE_STEP;
  }
  if (price <= 0.00002) {
    return 0.000000001;
  } else if (price <= 0.00005) {
    return 0.000000002;
  } else if (price <= 0.0001) {
    return 0.000000005;
  } else if (price <= 0.0002) {
    return 0.00000001;
  } else if (price <= 0.0005) {
    return 0.00000002;
  } else if (price <= 0.001) {
    return 0.00000005;
  } else if (price <= 0.002) {
    return 0.0000001;
  } else if (price <= 0.005) {
    return 0.0000002;
  } else if (price <= 0.01) {
    return 0.0000005;
  } else if (price <= 0.02) {
    return 0.000001;
  } else if (price <= 0.05) {
    return 0.000002;
  } else if (price <= 0.1) {
    return 0.000005;
  } else if (price <= 0.2) {
    return 0.00001;
  } else if (price <= 0.5) {
    return 0.00002;
  } else if (price <= 1) {
    return 0.00005;
  } else if (price <= 2) {
    return 0.0001;
  } else if (price <= 5) {
    return 0.0002;
  } else if (price <= 10) {
    return 0.0005;
  } else if (price <= 20) {
    return 0.001;
  } else if (price <= 50) {
    return 0.002;
  } else if (price <= 100) {
    return 0.005;
  } else if (price <= 200) {
    return 0.01;
  } else if (price <= 500) {
    return 0.02;
  } else if (price <= 1000) {
    return 0.05;
  } else if (price <= 2000) {
    return 0.1;
  } else if (price <= 5000) {
    return 0.2;
  } else if (price <= 10000) {
    return 0.5;
  } else if (price <= 20000) {
    return 1;
  } else if (price <= 50000) {
    return 2;
  } else if (price <= 100000) {
    return 5;
  } else if (price <= 200000) {
    return 10;
  } else if (price <= 500000) {
    return 20;
  } else if (price <= 1000000) {
    return 50;
  } else if (price <= 2000000) {
    return 100;
  } else if (price <= 5000000) {
    return 200;
  } else {
    return 500;
  }
}

/**
 * Get price step between orderbook lines depending on curent price
 * @param price Current market price
 * @returns Price step
 */
export function getPerpPriceStep(price: number): number {
  if (price <= 0.00005) {
    return 0.000000001;
  } else if (price <= 0.0001) {
    return 0.000000002;
  } else if (price <= 0.0002) {
    return 0.000000005;
  } else if (price <= 0.0005) {
    return 0.00000001;
  } else if (price <= 0.001) {
    return 0.00000002;
  } else if (price <= 0.002) {
    return 0.00000005;
  } else if (price <= 0.005) {
    return 0.0000001;
  } else if (price <= 0.01) {
    return 0.0000002;
  } else if (price <= 0.02) {
    return 0.0000005;
  } else if (price <= 0.05) {
    return 0.000001;
  } else if (price <= 0.1) {
    return 0.000002;
  } else if (price <= 0.2) {
    return 0.000005;
  } else if (price <= 0.5) {
    return 0.00001;
  } else if (price <= 1) {
    return 0.00002;
  } else if (price <= 2) {
    return 0.00005;
  } else if (price <= 5) {
    return 0.0001;
  } else if (price <= 10) {
    return 0.0002;
  } else if (price <= 20) {
    return 0.0005;
  } else if (price <= 50) {
    return 0.001;
  } else if (price <= 100) {
    return 0.002;
  } else if (price <= 200) {
    return 0.005;
  } else if (price <= 500) {
    return 0.01;
  } else if (price <= 1000) {
    return 0.02;
  } else if (price <= 2000) {
    return 0.05;
  } else if (price <= 5000) {
    return 0.1;
  } else if (price <= 10000) {
    return 0.2;
  } else if (price <= 20000) {
    return 0.5;
  } else if (price <= 50000) {
    return 1;
  } else if (price <= 100000) {
    return 2;
  } else if (price <= 200000) {
    return 5;
  } else if (price <= 500000) {
    return 10;
  } else if (price <= 1000000) {
    return 20;
  } else if (price <= 2000000) {
    return 50;
  } else if (price <= 5000000) {
    return 100;
  } else if (price <= 10000000) {
    return 200;
  } else if (price <= 20000000) {
    return 500;
  } else {
    return 1000;
  }
}

const MAX_SUPPLY = 262_200;
const INIT_SEAT_PRICE = 1.0;

export function perpSeatReserve(activeUsers: number): number {
  const differenceToMax = MAX_SUPPLY - activeUsers;
  if (differenceToMax <= 0) {
    throw new Error('Active users cannot exceed MAX_SUPPLY');
  }
  return (MAX_SUPPLY * INIT_SEAT_PRICE * activeUsers) / differenceToMax;
}

export function getMultipleSpotOrders(
  data: Base64EncodedDataResponse,
  firstEntry: number,
  clientId: number,
): Array<OrderModel> {
  let orders: Array<OrderModel> = [];
  let entry = firstEntry;
  while (entry != nullOrder) {
    const offset = entry * 64 + SpotTradeAccountHeaderModel.LENGTH;
    const order = OrderModel.fromBuffer(data, offset);
    if (order.origClientId != clientId) {
      break;
    }
    orders.push(order);
    entry = order.clNext;
  }
  return orders;
}

export function getMultiplePerpOrders(
  data: Base64EncodedDataResponse,
  firstEntry: number,
  clientId: number,
): Array<OrderModel> {
  let orders: Array<OrderModel> = [];
  let entry = firstEntry;
  while (entry != nullOrder) {
    const offset = entry * 64 + PerpTradeAccountHeaderModel.LENGTH;
    const order = OrderModel.fromBuffer(data, offset);
    if (order.origClientId != clientId) {
      break;
    }
    orders.push(order);
    entry = order.clNext;
  }
  return orders;
}

export async function findAssociatedTokenAddress(
  owner: Address,
  tokenProgramId: Address,
  mint: Address,
): Promise<Address> {
  const address = (
    await getProgramDerivedAddress({
      programAddress: ASSOCIATED_TOKEN_PROGRAM_ID,
      seeds: [
        getAddressEncoder().encode(owner),
        getAddressEncoder().encode(tokenProgramId),
        getAddressEncoder().encode(mint),
      ],
    })
  )[0];
  return address;
}

export function buildQuotesMask(orders: { side: number }[]): number {
  let mask = orders.length & 0b1111;
  for (let i = 0; i < orders.length; i++) {
    if (orders[i].side === 1) {
      mask |= 1 << (4 + i);
    }
  }
  return mask;
}

export async function getLookupTableAddress(authority: Address, slot: number): Promise<Address> {
  let buf = Buffer.alloc(8);
  buf.writeBigInt64LE(BigInt(slot), 0);
  const address = (
    await getProgramDerivedAddress({
      programAddress: ADDRESS_LOOKUP_TABLE_PROGRAM_ID,
      seeds: [getAddressEncoder().encode(authority), buf],
    })
  )[0];
  return address;
}
