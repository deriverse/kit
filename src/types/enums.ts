import { AccountType as GeneratedAccountType } from '../structure_models';

export { LogType } from '../logs_models';

export enum InstrMask {
  DRV = 0x10000000,
  READY_TO_DRV_UPGRADE = 0x20000000,
  PERP = 0x40000000,
  ORACLE = 0x80000000,
  READY_TO_PERP_UPGRADE = 0x1000000,
}

type CamelChar<S extends string> = S extends Uppercase<S>
  ? Lowercase<S> extends Uppercase<S>
    ? S // digits / non-letters: keep as-is, no underscore
    : `_${S}` // uppercase letter: prepend underscore
  : Uppercase<S>; // lowercase letter: uppercase it

type CamelToScreamingRest<S extends string> = S extends `${infer H}${infer T}`
  ? `${CamelChar<H>}${CamelToScreamingRest<T>}`
  : S;

type CamelToScreaming<S extends string> = S extends `${infer H}${infer T}`
  ? `${Uppercase<H>}${CamelToScreamingRest<T>}`
  : S;

type GeneratedAccountTypeKeys = Exclude<keyof typeof GeneratedAccountType, number | symbol>;

type AccountTypeShape = {
  readonly [K in GeneratedAccountTypeKeys as CamelToScreaming<K>]: (typeof GeneratedAccountType)[K];
};

export const AccountType = {
  CLIENT_COMMUNITY: GeneratedAccountType.clientCommunity,
  CLIENT_DRV: GeneratedAccountType.clientDrv,
  CLIENT_PRIMARY: GeneratedAccountType.clientPrimary,
  COMMUNITY: GeneratedAccountType.community,
  HOLDER: GeneratedAccountType.holder,
  ROOT: GeneratedAccountType.root,
  INSTR: GeneratedAccountType.instr,
  SPOT_ASK_ORDERS: GeneratedAccountType.spotAskOrders,
  SPOT_ASKS_TREE: GeneratedAccountType.spotAsksTree,
  SPOT_BID_ORDERS: GeneratedAccountType.spotBidOrders,
  SPOT_BIDS_TREE: GeneratedAccountType.spotBidsTree,
  SPOT_CLIENT_INFOS: GeneratedAccountType.spotClientInfos,
  SPOT_LINES: GeneratedAccountType.spotLines,
  SPOT_MAPS: GeneratedAccountType.spotMaps,
  TOKEN: GeneratedAccountType.token,
  PERP_ASK_ORDERS: GeneratedAccountType.perpAskOrders,
  PERP_ASKS_TREE: GeneratedAccountType.perpAsksTree,
  PERP_BID_ORDERS: GeneratedAccountType.perpBidOrders,
  PERP_BIDS_TREE: GeneratedAccountType.perpBidsTree,
  PERP_CLIENT_INFOS: GeneratedAccountType.perpClientInfos,
  PERP_CLIENT_INFOS2: GeneratedAccountType.perpClientInfos2,
  PERP_CLIENT_INFOS3: GeneratedAccountType.perpClientInfos3,
  PERP_CLIENT_INFOS4: GeneratedAccountType.perpClientInfos4,
  PERP_CLIENT_INFOS5: GeneratedAccountType.perpClientInfos5,
  PERP_LINES: GeneratedAccountType.perpLines,
  PERP_MAPS: GeneratedAccountType.perpMaps,
  PERP_LONG_PX_TREE: GeneratedAccountType.perpLongPxTree,
  PERP_SHORT_PX_TREE: GeneratedAccountType.perpShortPxTree,
  PERP_REBALANCE_TIME_TREE: GeneratedAccountType.perpRebalanceTimeTree,
  PRIVATE_CLIENTS: GeneratedAccountType.privateClients,
  VM_CLIENT: GeneratedAccountType.vmClient,
} as const satisfies AccountTypeShape;

export type AccountType = (typeof AccountType)[keyof typeof AccountType];
