import {
  Address, SolanaRpcApiDevnet, SolanaRpcApiMainnet, address, DataSlice,  Base64EncodedDataResponse,
  Rpc, getBase64Encoder, getProgramDerivedAddress, getAddressEncoder, IAccountMeta, AccountRole,  IInstruction,
  createAddressWithSeed, createNoopSigner, Commitment
} from "@solana/kit";
import { getCreateAccountWithSeedInstruction } from '@solana-program/system';
import { encode } from 'bs58';
import { Buffer } from 'buffer';

import {
  Instrument, GetClientSpotOrdersInfoResponse, GetClientSpotOrdersArgs, GetClientSpotOrdersResponse,
  SpotOrderCancelArgs, ClientTokenData, ClientLpData, ClientSpotData, GetClientDataResponse,
  GetClientSpotOrdersInfoArgs, SpotLpArgs, AccountType, getInstrAccountByTagArgs, GetInstrIdArgs,
  VERSION, PROGRAM_ID, MARKET_DEPTH, NewSpotOrderArgs, DepositArgs, updateInstrDataArgs, WithdrawArgs,
  SpotQuotesReplaceArgs, SpotMassCancelArgs, InstrId, InstrMask, GetClientPerpOrdersInfoArgs,
  GetClientPerpOrdersInfoResponse, GetClientPerpOrdersArgs, GetClientPerpOrdersResponse, PerpDepositArgs,
  NewPerpOrderArgs, PerpQuotesReplaceArgs, PerpOrderCancelArgs, PerpMassCancelArgs, PerpForcedCloseArgs,
  CommunityData, LogMessage, PerpChangeLeverageArgs, PerpStatisticsResetArgs, EngineArgs,
  NewInstrumentArgs
} from './types';

import {
  BaseCrncyRecordModel, ClientCommunityAccountHeaderModel, ClientCommunityRecordModel, ClientPrimaryAccountHeaderModel,
  CommunityAccountHeaderModel, InstrAccountHeaderModel, LineQuotesModel, OrderModel, PerpClientInfo2Model,
  PerpClientInfo3Model, PerpClientInfo4Model, PerpClientInfo5Model, PerpClientInfoModel, PerpTradeAccountHeaderModel,
  RootStateModel, SpotClientInfo2Model, SpotClientInfoModel, SpotTradeAccountHeaderModel,
  TokenStateModel
} from "./structure_models";
 
import {
  depositData, newInstrumentData, newPerpOrderData, newSpotOrderData, perpChangeLeverageData, perpDepositData,
  perpForcedCloseData, perpMassCancelData, perpOrderCancelData, perpQuotesReplaceData, perpStatisticsResetData,
  spotLpData, spotMassCancelData, spotOrderCancelData, spotQuotesReplaceData, upgradeToPerpData, withdrawData
} from "./instruction_models";
import { decode } from 'base64-arraybuffer';
import {
  DepositReportModel, DrvsAirdropReportModel, EarningsReportModel, FeesDepositReportModel,
  FeesWithdrawReportModel, LogType, PerpChangeLeverageReportModel, PerpDepositReportModel, PerpFeesReportModel,
  PerpFillOrderReportModel, PerpFundingReportModel, PerpMassCancelReportModel, PerpNewOrderReportModel,
  PerpOrderCancelReportModel, PerpOrderRevokeReportModel, PerpPlaceMassCancelReportModel, PerpPlaceOrderReportModel,
  PerpSocLossReportModel, PerpWithdrawReportModel, SpotFeesReportModel, SpotFillOrderReportModel, SpotlpTradeReportModel,
  SpotMassCancelReportModel, SpotNewOrderReportModel, SpotOrderCancelReportModel, SpotOrderRevokeReportModel,
  SpotPlaceMassCancelReportModel, SpotPlaceOrderReportModel, WithdrawReportModel
} from "./logs_models";
export * from './types';
export * from './logs_models';

const ADDRESS_LOOKUP_TABLE_PROGRAM_ID = address("AddressLookupTab1e1111111111111111111111111");
const SYSTEM_PROGRAM_ID = address("11111111111111111111111111111111");
const TOKEN_PROGRAM_ID = address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const TOKEN_2022_PROGRAM_ID = address('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
const ASSOCIATED_TOKEN_PROGRAM_ID = address('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
let dec = 1000000000;
let lpDec = 10000;
const nullOrder = 0xFFFF;

/**
 * Get price step between orderbook lines depending on curent price
 * @param price Current market price
 * @returns Price step 
 */
export function getPriceStep(price: number): number {
  if (price <= 0.00001) {
    return 0.000000001;
  }
  else if (price <= 0.00002) {
    return 0.000000002;
  }
  else if (price <= 0.00005) {
    return 0.000000005;
  }
  else if (price <= 0.0001) {
    return 0.00000001;
  }
  else if (price <= 0.0002) {
    return 0.00000002;
  }
  else if (price <= 0.0005) {
    return 0.00000005;
  }
  else if (price <= 0.001) {
    return 0.0000001;
  }
  else if (price <= 0.002) {
    return 0.0000002;
  }
  else if (price <= 0.005) {
    return 0.0000005;
  }
  else if (price <= 0.01) {
    return 0.000001;
  }
  else if (price <= 0.02) {
    return 0.000002;
  }
  else if (price <= 0.05) {
    return 0.000005;
  }
  else if (price <= 0.1) {
    return 0.00001;
  }
  else if (price <= 0.2) {
    return 0.00002;
  }
  else if (price <= 0.5) {
    return 0.00005;
  }
  else if (price <= 1) {
    return 0.0001;
  }
  else if (price <= 2) {
    return 0.0002;
  }
  else if (price <= 5) {
    return 0.0005;
  }
  else if (price <= 10) {
    return 0.001;
  }
  else if (price <= 20) {
    return 0.002;
  }
  else if (price <= 50) {
    return 0.005;
  }
  else if (price <= 100) {
    return 0.01;
  }
  else if (price <= 200) {
    return 0.02;
  }
  else if (price <= 500) {
    return 0.05;
  }
  else if (price <= 1000) {
    return 0.1;
  }
  else if (price <= 2000) {
    return 0.2;
  }
  else if (price <= 5000) {
    return 0.5;
  }
  else if (price <= 10000) {
    return 1;
  }
  else if (price <= 20000) {
    return 2;
  }
  else if (price <= 50000) {
    return 5;
  }
  else if (price <= 100000) {
    return 10;
  }
  else if (price <= 200000) {
    return 20;
  }
  else if (price <= 500000) {
    return 50;
  }
  else if (price <= 1000000) {
    return 100;
  }
  else if (price <= 2000000) {
    return 200;
  }
  else if (price <= 5000000) {
    return 500;
  }
  else {
    return 1000;
  }
}

async function findAssociatedTokenAddress(owner: Address, tokenProgramId: Address, mint: Address): Promise<Address> {
  const address = (await getProgramDerivedAddress({
    programAddress: ASSOCIATED_TOKEN_PROGRAM_ID,
    seeds: [
      getAddressEncoder().encode(owner),
      getAddressEncoder().encode(tokenProgramId),
      getAddressEncoder().encode(mint),
    ]
  }))[0];
  return address;
}

function getMultipleSpotOrders(data: Base64EncodedDataResponse, firstEntry: number, clientId: number): Array<OrderModel> {
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

function getMultiplePerpOrders(data: Base64EncodedDataResponse, firstEntry: number, clientId: number): Array<OrderModel> {
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

async function getLookupTableAddress(authority: Address, slot: number): Promise<Address> {
  let buf = Buffer.alloc(8);
  buf.writeBigInt64LE(BigInt(slot), 0);
  const address = (await getProgramDerivedAddress({
    programAddress: ADDRESS_LOOKUP_TABLE_PROGRAM_ID,
    seeds: [getAddressEncoder().encode(authority), buf]
  }))[0];
  return address;
}

/**
 * Main class to operate with Deriverse
 * @property {number} originalClientId Deriverse main client ID
 * @property {AddressLookupTableAccount} lut Root address lookup table account
 * @property {AddressLookupTableAccount} clientLut Client address lookup table account
 * @property {Map<number, Token>} tokens Tokens data 
 * @property {Map<number, Instrument>} instruments Instruments data
 */
export class Engine {
  programId: Address<any>;
  rootStateModel: RootStateModel;
  community: CommunityData;
  private rpc: Rpc<SolanaRpcApiDevnet> | Rpc<SolanaRpcApiMainnet>;
  private drvsAuthority: Address<any>;
  rootAccount: Address<any>;
  communityAccount: Address<any>;
  private signer?: Address<any>;
  originalClientId?: number;
  private clientPrimaryAccount?: Address<any>;
  private clientCommunityAccount?: Address<any>;
  clientLutAddress?: Address<any>;
  private refClientPrimaryAccount?: Address<any>;
  private refClientCommunityAccount?: Address<any>;
  tokens: Map<number, TokenStateModel>;
  instruments: Map<number, Instrument>;
  version: number;
  commitment: Commitment;
  private uiNumbers: boolean;

  /**
   * @param rpc @solana/kit rpc
   */
  constructor(rpc: Rpc<any>, args?: EngineArgs) {
    
    this.rpc = rpc;
    if (args == undefined || args.programId == null || args.programId == undefined) {
      this.programId = PROGRAM_ID;
    }
    else {
      this.programId = args.programId;
    }
    if (args == undefined || args.version == null || args.version == undefined) {
      this.version = VERSION;
    }
    else {
      this.version = args.version;
    }
    if (args == undefined || args.commitment == null || args.commitment == undefined) {
      this.commitment = 'confirmed';
    }
    else {
      this.commitment = args.commitment;
    }
    if (args == undefined || args.uiNumbers == null || args.uiNumbers == undefined) {
      this.uiNumbers = true;
    }
    else {
      this.uiNumbers = args.uiNumbers;
    }
    if (!this.uiNumbers) {
      dec = 1;
      lpDec = 1;
    }
  }
  
  logsDecode(data: readonly string[]): LogMessage[] {
    let assetTokenDec = 1;
    let crncyTokenDec = 1;
    let logs = [];
    for (var log of data) {
      if (!log.startsWith("Program data: ")) {
        continue;
      }
      const buffer = Buffer.from(decode(log.substring(14)));
      switch (buffer[0]) {
        case LogType.deposit: {
          if (buffer.length == DepositReportModel.LENGTH) {
            let report = DepositReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              crncyTokenDec = this.tokenDec(report.tokenId);
              report.amount /= crncyTokenDec;
            }
            logs.push(report);
          }
          break;
        }
        case LogType.withdraw: {
          if (buffer.length == WithdrawReportModel.LENGTH) {
            let report = WithdrawReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              crncyTokenDec = this.tokenDec(report.tokenId);
              report.amount /= crncyTokenDec;
            }
            logs.push(report);
          }
          break;
        }
        case LogType.perpDeposit: {
          if (buffer.length == PerpDepositReportModel.LENGTH) {
            let report = PerpDepositReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              const instrInfo = this.instruments.get(report.instrId);
              if (instrInfo) {
                crncyTokenDec = this.tokenDec(instrInfo.header.crncyTokenId);
                report.amount /= crncyTokenDec;
              }
            }
            logs.push(report);
          }
          break;
        }
        case LogType.perpWithdraw: {
          if (buffer.length == PerpWithdrawReportModel.LENGTH) {
            let report = PerpWithdrawReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              const instrInfo = this.instruments.get(report.instrId);
              if (instrInfo) {
                crncyTokenDec = this.tokenDec(instrInfo.header.crncyTokenId);
                report.amount /= crncyTokenDec;
              }
            }
            logs.push(report);
          }
          break;
        }
        case LogType.feesDeposit: {
          if (buffer.length == FeesDepositReportModel.LENGTH) {
            let report = FeesDepositReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              crncyTokenDec = this.tokenDec(report.tokenId);
              report.amount /= crncyTokenDec;
            }
            logs.push(report);
          }
          break;
        }
        case LogType.feesWithdraw: {
          if (buffer.length == FeesWithdrawReportModel.LENGTH) {
            let report = FeesWithdrawReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              crncyTokenDec = this.tokenDec(report.tokenId);
              report.amount /= crncyTokenDec;
            }
            logs.push(report);
          }
          break;
        }
        case LogType.spotLpTrade: {
          if (buffer.length == SpotlpTradeReportModel.LENGTH) {
            let report = SpotlpTradeReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              const instrInfo = this.instruments.get(report.instrId);
              if (instrInfo) {
                assetTokenDec = this.tokenDec(instrInfo.header.assetTokenId);
                crncyTokenDec = this.tokenDec(instrInfo.header.crncyTokenId);
                report.qty /= lpDec;
                report.tokens /= assetTokenDec;
                report.crncy /= crncyTokenDec;
              }
            }
            logs.push(report);
          }
          break;
        }
        case LogType.earnings: {
          if (buffer.length == EarningsReportModel.LENGTH) {
            let report = EarningsReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              crncyTokenDec = this.tokenDec(report.tokenId);
              report.amount /= crncyTokenDec;
            }
            logs.push(report);
          }
          break;
        }
        case LogType.drvsAirdrop: {
          if (buffer.length == DrvsAirdropReportModel.LENGTH) {
            let report = DrvsAirdropReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              crncyTokenDec = this.tokenDec(0);
              report.amount /= crncyTokenDec;
            }
            logs.push(report);
          }
          break;
        }
        case LogType.spotPlaceOrder: {
          if (buffer.length == SpotPlaceOrderReportModel.LENGTH) {
            let report = SpotPlaceOrderReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              const instrInfo = this.instruments.get(report.instrId);
              if (instrInfo) {
                assetTokenDec = this.tokenDec(instrInfo.header.assetTokenId);
                crncyTokenDec = this.tokenDec(instrInfo.header.crncyTokenId);
                report.qty /= assetTokenDec;
              }
              report.price /= dec;
            }
            logs.push(report);
          }
          break;
        }
        case LogType.spotFillOrder: {
          if (buffer.length == SpotFillOrderReportModel.LENGTH) {
            let report = SpotFillOrderReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              report.qty /= assetTokenDec;
              report.crncy /= crncyTokenDec;
              report.rebates /= crncyTokenDec;
              report.price /= dec;
            }
            logs.push(report);
          }
          break;
        }
        case LogType.spotNewOrder: {
          if (buffer.length == SpotNewOrderReportModel.LENGTH) {
            let report = SpotNewOrderReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              report.qty /= assetTokenDec;
              report.crncy /= crncyTokenDec;
            }
            logs.push(report);
          }
          break;
        }
        case LogType.spotOrderCancel: {
          if (buffer.length == SpotOrderCancelReportModel.LENGTH) {
            let report = SpotOrderCancelReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              const instrInfo = this.instruments.get(report.instrId);
              if (instrInfo) {
                assetTokenDec = this.tokenDec(instrInfo.header.assetTokenId);
                crncyTokenDec = this.tokenDec(instrInfo.header.crncyTokenId);
                report.qty /= assetTokenDec;
                report.crncy /= crncyTokenDec;
              }
            }
            logs.push(report);
          }
          break;
        }
        case LogType.spotOrderRevoke: {
          if (buffer.length == SpotOrderRevokeReportModel.LENGTH) {
            let report = SpotOrderRevokeReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              report.qty /= assetTokenDec;
              report.crncy /= crncyTokenDec;
            }
            logs.push(report);
          }
          break;
        }
        case LogType.spotFees: {
          if (buffer.length == SpotFeesReportModel.LENGTH) {
            let report = SpotFeesReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              report.fees /= crncyTokenDec;
              report.refPayment /= crncyTokenDec;
            }
            logs.push(report);
          }
          break;
        }
        case LogType.spotPlaceMassCancel: {
          if (buffer.length == SpotPlaceMassCancelReportModel.LENGTH) {
            let report = SpotPlaceMassCancelReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              const instrInfo = this.instruments.get(report.instrId);
              if (instrInfo) {
                assetTokenDec = this.tokenDec(instrInfo.header.assetTokenId);
                crncyTokenDec = this.tokenDec(instrInfo.header.crncyTokenId);
              }
            }
            logs.push(report);
          }
          break;
        }
        case LogType.spotMassCancel: {
          if (buffer.length == SpotMassCancelReportModel.LENGTH) {
            let report = SpotMassCancelReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              report.qty /= assetTokenDec;
              report.crncy /= crncyTokenDec;
            }
            logs.push(report);
          }
          break;
        }
        case LogType.perpPlaceOrder: {
          if (buffer.length == PerpPlaceOrderReportModel.LENGTH) {
            let report = PerpPlaceOrderReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              const instrInfo = this.instruments.get(report.instrId);
              if (instrInfo) {
                assetTokenDec = this.tokenDec(instrInfo.header.assetTokenId);
                crncyTokenDec = this.tokenDec(instrInfo.header.crncyTokenId);
                report.perps /= assetTokenDec;
              }
              report.price /= dec;
            }
            logs.push(report);
          }
          break;
        }
        case LogType.perpFillOrder: {
          if (buffer.length == PerpFillOrderReportModel.LENGTH) {
            let report = PerpFillOrderReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              report.perps /= assetTokenDec;
              report.crncy /= crncyTokenDec;
              report.rebates /= crncyTokenDec;
              report.price /= dec;
            }
            logs.push(report);
          }
          break;
        }
        case LogType.perpNewOrder: {
          if (buffer.length == PerpNewOrderReportModel.LENGTH) {
            let report = PerpNewOrderReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              report.perps /= assetTokenDec;
              report.crncy /= crncyTokenDec;
            }
            logs.push(report);
          }
          break;
        }
        case LogType.perpOrderCancel: {
          if (buffer.length == PerpOrderCancelReportModel.LENGTH) {
            let report = PerpOrderCancelReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              const instrInfo = this.instruments.get(report.instrId);
              if (instrInfo) {
                assetTokenDec = this.tokenDec(instrInfo.header.assetTokenId);
                crncyTokenDec = this.tokenDec(instrInfo.header.crncyTokenId);
                report.perps /= assetTokenDec;
                report.crncy /= crncyTokenDec;
              }
            }
            logs.push(report);
          }
          break;
        }
        case LogType.perpOrderRevoke: {
          if (buffer.length == PerpOrderRevokeReportModel.LENGTH) {
            let report = PerpOrderRevokeReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              report.perps /= assetTokenDec;
              report.crncy /= crncyTokenDec;
            }
            logs.push(report);
          }
          break;
        }
        case LogType.perpFees: {
          if (buffer.length == PerpFeesReportModel.LENGTH) {
            let report = PerpFeesReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              report.fees /= crncyTokenDec;
              report.refPayment /= crncyTokenDec;
            }
            logs.push(report);
          }
          break;
        }
        case LogType.perpPlaceMassCancel: {
          if (buffer.length == PerpPlaceMassCancelReportModel.LENGTH) {
            let report = PerpPlaceMassCancelReportModel.fromBuffer(buffer);
            logs.push(report);
          }
          break;
        }
        case LogType.perpMassCancel: {
          if (buffer.length == PerpMassCancelReportModel.LENGTH) {
            let report = PerpMassCancelReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              report.perps /= assetTokenDec;
              report.crncy /= crncyTokenDec;
            }
            logs.push(report);
          }
          break;
        }
        case LogType.perpFunding: {
          if (buffer.length == PerpFundingReportModel.LENGTH) {
            let report = PerpFundingReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              report.funding /= crncyTokenDec;
            }
            logs.push(report);
          }
          break;
        }
        case LogType.perpSocLoss: {
          if (buffer.length == PerpSocLossReportModel.LENGTH) {
            let report = PerpSocLossReportModel.fromBuffer(buffer);
            if (this.uiNumbers) {
              report.socLoss /= crncyTokenDec;
            }
            logs.push(report);
          }
          break;
        }
        case LogType.perpChangeLeverage: {
          if (buffer.length == PerpChangeLeverageReportModel.LENGTH) {
            let report = PerpChangeLeverageReportModel.fromBuffer(buffer);
            logs.push(report);
          }
          break;
        }
      }
    }
    return logs;
  }
  
  private async findAccountsByTag(tag: number, dataSlice?: DataSlice) {
    let tagBuf = Buffer.alloc(8);
    tagBuf.writeUInt32LE(tag, 0);
    tagBuf.writeUInt32LE(this.version, 4);
    let accounts = await this.rpc.getProgramAccounts(this.programId,
      {
        encoding: 'base64',
        dataSlice: dataSlice,
        filters: [
          {
            memcmp: {
              offset: BigInt(0),
              encoding: 'base58',
              bytes: encode(tagBuf),
            },
          },
        ],
  
      }
    ).send();
    return accounts;
  }
  
  /**
   * After creation you have to initialize Engine
   */
  
  async initialize(): Promise<boolean> {
    try {
      this.drvsAuthority = (await getProgramDerivedAddress({ programAddress: this.programId, seeds: ["ndxnt"] }))[0];
      this.rootAccount = await this.getAccountByTag(AccountType.ROOT);
      this.communityAccount = await this.getAccountByTag(AccountType.COMMUNITY);
      const infos = await this.rpc.getMultipleAccounts([this.rootAccount, this.communityAccount],
        {
          commitment: this.commitment,
          encoding: 'base64'
        }
      ).send();
      if (infos == null) {
        throw new Error("Initialization failed: getMultipleAccountsInfo");
      }
      this.rootStateModel = RootStateModel.fromBuffer(infos.value[0].data);
      this.tokens = new Map();
      this.instruments = new Map();
      const tokenAccounts = await this.findAccountsByTag(AccountType.TOKEN);
      tokenAccounts.forEach((t) => {
        let tokenStateModel = TokenStateModel.fromBuffer(t.account.data)
        this.tokens.set(tokenStateModel.id,
          tokenStateModel
        );
      });
      const instrAccounts = await this.findAccountsByTag(AccountType.INSTR, { offset: 8, length: 16 });
      instrAccounts.forEach((response) => {
        const buffer = Buffer.from(getBase64Encoder().encode(response.account.data[0]));
        let instrAccountHeaderModel = new InstrAccountHeaderModel();
        instrAccountHeaderModel.id = buffer.readUint32LE(0);
        instrAccountHeaderModel.assetTokenId = buffer.readUint32LE(4);
        instrAccountHeaderModel.crncyTokenId = buffer.readUint32LE(8);
        instrAccountHeaderModel.mask = buffer.readUint32LE(12);
        this.instruments.set(instrAccountHeaderModel.id, {
          address: response.pubkey,
          header: instrAccountHeaderModel,
          spotBids: [],
          spotAsks: [],
          perpBids: [],
          perpAsks: [],
        });
      });
      this.updateCommunityFromBuffer(infos.value[1].data);
      return true;
    }
    catch (err) {
      console.log("Initialization failed:", err);
      return false;
    }
  }

  async addToken(tokenAccount: Address) {
    const info = await this.rpc.getAccountInfo(tokenAccount, { commitment: this.commitment, encoding: 'base64' }).send();
    if (info == null) {
      throw new Error("Add Token Failed: getAccountInfo");
    }
    const tokenStateModel = TokenStateModel.fromBuffer(info.value.data);
    if (tokenStateModel.id > this.rootStateModel.tokensCount ||
      tokenStateModel.tag != AccountType.TOKEN ||
      tokenStateModel.version != this.version) {
      throw new Error("Invalid Token Account");
    }
    this.tokens.set(tokenStateModel.id,
      tokenStateModel
    );
  }

  async addInstr(instrAccount: Address) {
    const info = await this.rpc.getAccountInfo(instrAccount, { commitment: this.commitment, encoding: 'base64' }).send();
    if (info == null) {
      throw new Error("Add Instrument Failed: getAccountInfo");
    }
    const instrAccountHeaderModel = InstrAccountHeaderModel.fromBuffer(info.value.data);
    if (instrAccountHeaderModel.id > this.rootStateModel.instrCount ||
      instrAccountHeaderModel.tag != AccountType.INSTR ||
      instrAccountHeaderModel.version != this.version) {
      throw new Error("Invalid Instrument Account");
    }
    this.instruments.set(instrAccountHeaderModel.id, {
      address: instrAccount,
      header: instrAccountHeaderModel,
      spotBids: [],
      spotAsks: [],
      perpBids: [],
      perpAsks: [],
    });
  }

  updateCommunityFromBuffer(data: Base64EncodedDataResponse) {
    let baseCrncyRecords = new Map();
    let communityAccountHeaderModel = CommunityAccountHeaderModel.fromBuffer(data);
    const drvsDec = this.tokenDec(0);
    communityAccountHeaderModel.prevVotingSupply /= drvsDec;
    communityAccountHeaderModel.votingSupply /= drvsDec;
    communityAccountHeaderModel.drvsTokens /= drvsDec;
    for (var i = 0; i < communityAccountHeaderModel.count; ++i) {
      let record = BaseCrncyRecordModel.fromBuffer(data, CommunityAccountHeaderModel.LENGTH + i * BaseCrncyRecordModel.LENGTH);
      record.funds /= this.tokenDec(record.crncyTokenId);
      baseCrncyRecords.set(record.crncyTokenId, record);
    }
    this.community = {
      header: communityAccountHeaderModel,
      data: baseCrncyRecords
    };
  }

  async updateCommunity() {
    const info = await this.rpc.getAccountInfo(this.communityAccount, { commitment: this.commitment, encoding: 'base64' }).send();
    if (info == null) {
      throw new Error("Community Account: GetAccountInfo Failed");
    }
    this.updateCommunityFromBuffer(info.value.data);
  }

  updateRootFromBuffer(data: Base64EncodedDataResponse) {
    this.rootStateModel = RootStateModel.fromBuffer(data);
  }

  async updateRoot() {
    const info = await this.rpc.getAccountInfo(this.rootAccount, { commitment: this.commitment, encoding: 'base64' }).send();
    if (info == null) {
      throw new Error("Root Account: GetAccountInfo Failed");
    }
    this.updateRootFromBuffer(info.value.data);
  }

  async getInstrAccountByTag(args: getInstrAccountByTagArgs): Promise<Address> {
    let buf = Buffer.alloc(16);
    buf.writeInt32LE(this.version, 0);
    buf.writeInt32LE(args.tag, 4);
    buf.writeInt32LE(args.assetTokenId, 8);
    buf.writeInt32LE(args.crncyTokenId, 12);
    const address = (await getProgramDerivedAddress({
      programAddress: this.programId,
      seeds: [buf, getAddressEncoder().encode(this.drvsAuthority)]
    }))[0];
    return address;
  }

  async getAccountByTag(tag: number): Promise<Address> {
    let buf = Buffer.alloc(8);
    buf.writeInt32LE(this.version, 0);
    buf.writeInt32LE(tag, 4);
    const address = (await getProgramDerivedAddress({
      programAddress: this.programId,
      seeds: [buf, getAddressEncoder().encode(this.drvsAuthority)]
    }))[0];
    return address;
  }

  async getSpotContext(instrAccountHeaderModel: InstrAccountHeaderModel): Promise<IAccountMeta[]> {
    return [
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.INSTR
        }),
        role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.SPOT_BIDS_TREE
        }),
        role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.SPOT_ASKS_TREE
        }),
        role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.SPOT_BID_ORDERS
        }),
        role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.SPOT_ASK_ORDERS
        }),
        role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.SPOT_LINES
        }),
        role: AccountRole.WRITABLE
      },
      {
        address: instrAccountHeaderModel.mapsAddress,
        role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.SPOT_CLIENT_INFOS
        }),
        role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.SPOT_CLIENT_INFOS2
        }),
        role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.SPOT_CLIENT_ACCOUNTS
        }),
        role: AccountRole.WRITABLE
      },
    ]
  }

  async getPerpContext(instrAccountHeaderModel: InstrAccountHeaderModel): Promise<IAccountMeta[]> {
    return [
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.INSTR
        }),
        role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.PERP_BIDS_TREE
        }),
        role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.PERP_ASKS_TREE
        }),
        role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.PERP_BID_ORDERS
        }),
        role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.PERP_ASK_ORDERS
        }),
        role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.PERP_LINES
        }),
        role: AccountRole.WRITABLE
      },
      {
        address: instrAccountHeaderModel.perpMapsAddress,
        role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.PERP_CLIENT_INFOS
        }),
        role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.PERP_CLIENT_INFOS2
        }),
        role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.PERP_CLIENT_INFOS3
        }),
        role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.PERP_CLIENT_INFOS4
        }),
        role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.PERP_CLIENT_INFOS5
        }),
        role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.PERP_CLIENT_ACCOUNTS
        }),
        role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.PERP_LONG_PX_TREE
        }),
        role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.PERP_SHORT_PX_TREE
        }),
        role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.PERP_REBALANCE_TIME_TREE
        }),
        role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.PERP_PRIORITY_TREE
        }),
        role: AccountRole.WRITABLE
      },

    ]
  }

  async getSpotCandles(instrAccountHeaderModel: InstrAccountHeaderModel): Promise<IAccountMeta[]> {
    return [
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.SPOT_1M_CANDLES
        }),
        role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.SPOT_15M_CANDLES
        }),
        role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instrAccountHeaderModel.assetTokenId,
          crncyTokenId: instrAccountHeaderModel.crncyTokenId,
          tag: AccountType.SPOT_DAY_CANDLES
        }),
        role: AccountRole.WRITABLE
      },
    ]
  }

  async getTokenAccount(mint: Address): Promise<Address> {
    let buf = Buffer.from(getAddressEncoder().encode(mint).buffer);
    buf.writeInt32LE(this.version, 28);
    const address = (await getProgramDerivedAddress({
      programAddress: this.programId,
      seeds: [buf, getAddressEncoder().encode(this.drvsAuthority)]
    }))[0];
    return address;
  }

  /**
   * Get Token ID from mint public key if this token registered on Deriverse
   * @param mint Public key
   * @returns Token ID
   */
  async getTokenId(mint: Address): Promise<number | null> {
    const tokenAddress = await this.getTokenAccount(mint);
    let info = await this.rpc.getAccountInfo(tokenAddress,
      { commitment: this.commitment, encoding: 'base64', dataSlice: { offset: TokenStateModel.OFFSET_ID, length: 4 } }).send();
    if (!info.value) {
      return null;
    }
    else {
      const data = Buffer.from(getBase64Encoder().encode(info.value.data[0]));
      return data.readUInt32LE(0);
    }
  }

  /**
   * Get intrument ID if this instrument registered on Deriverse
   * @param args Base crncy Token ID and asset token ID
   * @returns Instrument ID
   */
  async getInstrId(args: GetInstrIdArgs): Promise<number | null> {
    let buf = Buffer.alloc(16);
    buf.writeInt32LE(this.version, 0);
    buf.writeInt32LE(AccountType.INSTR, 4);
    buf.writeInt32LE(args.assetTokenId, 8);
    buf.writeInt32LE(args.crncyTokenId, 12);
    const instrAddress = await this.getInstrAccountByTag({
      assetTokenId: args.assetTokenId,
      crncyTokenId: args.crncyTokenId,
      tag: AccountType.INSTR
    })
    let info = await this.rpc.getAccountInfo(instrAddress,
      { commitment: this.commitment, encoding: 'base64', dataSlice: { offset: InstrAccountHeaderModel.OFFSET_ID, length: 4 } }).send();
    if (info == null) {
      return null;
    }
    else {
      const data = Buffer.from(getBase64Encoder().encode(info.value.data[0]));
      return data.readUInt32LE(0);
    }
  }

  /**
   * Assignes client public key to Engine
   * @param signer Client public key
   */
  async setSigner(signer: Address<any>) {
    this.signer = signer;
    let buf = Buffer.alloc(8);
    buf.writeUint32LE(this.version, 0);
    buf.writeUint32LE(AccountType.CLIENT_PRIMARY, 4);
    const clientPrimaryAccount = await this.findClientPrimaryAccount(signer)
    let exists = false;
    try {
      const info = await this.rpc.getAccountInfo(clientPrimaryAccount,
        {
          commitment: this.commitment,
          encoding: 'base64'
        }).send();
      if (info.value) {
        const clientPrimaryAccountHeaderModel = ClientPrimaryAccountHeaderModel.fromBuffer(info.value.data);
        if (clientPrimaryAccountHeaderModel.walletAddress == signer) {
          this.clientPrimaryAccount = clientPrimaryAccount;
          this.clientCommunityAccount = clientPrimaryAccountHeaderModel.communityAddress;
          this.originalClientId = clientPrimaryAccountHeaderModel.id;
          this.clientLutAddress = clientPrimaryAccountHeaderModel.lutAddress;
          let date = Math.floor((new Date()).valueOf() / 1000);
          if (date < clientPrimaryAccountHeaderModel.refProgramExpiration) {
            this.refClientPrimaryAccount = clientPrimaryAccountHeaderModel.refAddress;
            let refInfo = await this.rpc.getAccountInfo(this.refClientPrimaryAccount,
              {
                commitment: this.commitment,
                encoding: 'base64'
              }).send();
            const refClientPrimaryAccountHeaderModel = ClientPrimaryAccountHeaderModel.fromBuffer(refInfo.value.data);
            this.refClientCommunityAccount =
              await this.findClientCommunityAccount(refClientPrimaryAccountHeaderModel.walletAddress)
          }
          exists = true;
        }
      }
    }
    catch (err) {
      console.log(err);
      throw new Error("Wallet connection failed");
    }
    if (!exists) {
      this.clientPrimaryAccount = null;
      this.originalClientId = null;
    }
  }

  private async findClientPrimaryAccount(wallet?: Address): Promise<Address> {
    let tagBuf = Buffer.alloc(8);
    tagBuf.writeUint32LE(this.version, 0);
    tagBuf.writeUint32LE(AccountType.CLIENT_PRIMARY, 4);
    let source = (wallet == null || wallet == undefined) ? this.signer : wallet;
    const address = (await getProgramDerivedAddress({
      programAddress: this.programId,
      seeds: [tagBuf, getAddressEncoder().encode(source)]
    }))[0];
    return address;
  }

  private async findClientCommunityAccount(wallet?: Address): Promise<Address> {
    let tagBuf = Buffer.alloc(8);
    tagBuf.writeUint32LE(this.version, 0);
    tagBuf.writeUint32LE(AccountType.CLIENT_COMMUNITY, 4);
    let source = (wallet == null || wallet == undefined) ? this.signer : wallet;
    const address = (await getProgramDerivedAddress({
      programAddress: this.programId,
      seeds: [tagBuf, getAddressEncoder().encode(source)]
    }))[0];
    return address;
  }

  private async findClientDrvAccount(): Promise<Address> {
    let tagBuf = Buffer.alloc(8);
    tagBuf.writeUint32LE(this.version, 0);
    tagBuf.writeUint32LE(AccountType.CLIENT_DRV, 4);
    const address = (await getProgramDerivedAddress({
      programAddress: this.programId,
      seeds: [tagBuf, getAddressEncoder().encode(this.signer)]
    }))[0];
    return address;
  }

  private async checkClient(): Promise<boolean> {
    if (this.signer == null) {
      throw new Error("Wallet not connected");
    }
    if (this.clientPrimaryAccount != null) {
      return true;
    }
    const clientPrimaryAccount = await this.findClientPrimaryAccount();
    try {
      const info = await this.rpc.getAccountInfo(clientPrimaryAccount,
        {
          commitment: this.commitment,
          encoding: 'base64'
        }).send();
      if (info == null) {
        return false;
      }
      const clientPrimaryAccountHeaderModel = ClientPrimaryAccountHeaderModel.fromBuffer(info.value.data);
      this.clientPrimaryAccount = clientPrimaryAccount;
      this.clientCommunityAccount = clientPrimaryAccountHeaderModel.communityAddress
      this.originalClientId = clientPrimaryAccountHeaderModel.id;
      return true;
    }
    catch (err) {
      console.log(err);
      return false;
    }
  }

  /**
   * Unpack client accounts
   * @returns All client data that are in client accounts
   */
  async getClientData(): Promise<GetClientDataResponse> {
    if (!(await this.checkClient())) {
      throw new Error("Client account not found");
    }
    const infos = await this.rpc.getMultipleAccounts([this.clientPrimaryAccount, this.clientCommunityAccount],
      {
        commitment: this.commitment,
        encoding: 'base64'
      }).send();
    if (infos == null) {
      throw new Error("GetClientData: GetAccountInfo failed");
    }
    const clientPrimaryAccountHeaderModel = ClientPrimaryAccountHeaderModel.fromBuffer(infos.value[0].data);
    let clientCommunityAccountHeaderModel = ClientCommunityAccountHeaderModel.fromBuffer(infos.value[1].data);
    const primaryData = Buffer.from(getBase64Encoder().encode(infos.value[0].data[0]));
    let tokens: Map<number, ClientTokenData> = new Map();
    let lp: Map<number, ClientLpData> = new Map();
    let spot: Map<number, ClientSpotData> = new Map();
    let perp: Map<number, ClientSpotData> = new Map();
    for (var i = 0; i < clientPrimaryAccountHeaderModel.assetsCount; ++i) {
      const offset = ClientPrimaryAccountHeaderModel.LENGTH + i * 16;
      const assetInfo = primaryData.readUint32LE(offset);
      const tag = assetInfo >> 24;
      const id = assetInfo & 0xFFFFFF;
      if (tag == 1) {
        tokens.set(id, {
          tokenId: id,
          amount: Number(primaryData.readBigInt64LE(offset + 8)) / this.tokenDec(id)
        })
      }
      else if (tag == 2) {
        lp.set(id, {
          instrId: id,
          amount: Number(primaryData.readBigInt64LE(offset + 8)) / lpDec
        })
      }
      else if (tag == 3) {
        const clientId = primaryData.readUint32LE(offset + 4);
        const slot = primaryData.readUint32LE(offset + 8);
        spot.set(id, {
          instrId: id,
          clientId: clientId,
          slot: slot
        })
      }
      else if (tag == 4) {
        const clientId = primaryData.readUint32LE(offset + 4);
        const slot = primaryData.readUint32LE(offset + 8);
        perp.set(id, {
          instrId: id,
          clientId: clientId,
          slot: slot
        })
      }
    }
    let clientCommunityRecords = new Map();
    for (var i = 0; i < clientCommunityAccountHeaderModel.count; ++i) {
      const offset = ClientCommunityAccountHeaderModel.LENGTH + ClientCommunityRecordModel.LENGTH * i;
      let clientCommunityRecordModel = ClientCommunityRecordModel.fromBuffer(infos.value[1].data, offset);
      const crncyDec = this.tokenDec(clientCommunityRecordModel.crncyTokenId);
      clientCommunityRecordModel.dividendsValue /= crncyDec;
      clientCommunityRecordModel.feesPrepayment /= crncyDec;
      clientCommunityRecordModel.refPayments /= crncyDec;
      clientCommunityRecords.set(clientCommunityRecordModel.crncyTokenId, clientCommunityRecordModel);
    }
    const drvsDec = this.tokenDec(0);
    clientCommunityAccountHeaderModel.drvsTokens /= drvsDec;
    clientCommunityAccountHeaderModel.currentVotingTokens /= drvsDec;
    clientCommunityAccountHeaderModel.lastVotingTokens /= drvsDec;
    return {
      clientId: clientPrimaryAccountHeaderModel.id,
      mask: clientPrimaryAccountHeaderModel.mask,
      points: clientPrimaryAccountHeaderModel.points,
      slot: clientPrimaryAccountHeaderModel.slot,
      spotTrades: clientPrimaryAccountHeaderModel.spotTrades,
      lpTrades: clientPrimaryAccountHeaderModel.lpTrades,
      perpTrades: clientPrimaryAccountHeaderModel.perpTrades,
      tokens: tokens,
      lp: lp,
      spot: spot,
      perp: perp,
      refProgram: {
        address: clientPrimaryAccountHeaderModel.refAddress,
        expiration: clientPrimaryAccountHeaderModel.refProgramExpiration,
        clientId: clientPrimaryAccountHeaderModel.refClientId,
        disount: clientPrimaryAccountHeaderModel.refProgramDiscount,
        ratio: clientPrimaryAccountHeaderModel.refProgramRatio,
      },
      community: {
        header: clientCommunityAccountHeaderModel,
        data: clientCommunityRecords
      },
      refLinks: [
        {
          id: clientPrimaryAccountHeaderModel.firstRefLinkId,
          expiration: clientPrimaryAccountHeaderModel.firstRefLinkExpiration,
          discount: clientPrimaryAccountHeaderModel.firstRefLinkDiscount,
          ratio: clientPrimaryAccountHeaderModel.firstRefLinkRatio
        },
        {
          id: clientPrimaryAccountHeaderModel.secondRefLinkId,
          expiration: clientPrimaryAccountHeaderModel.secondRefLinkExpiration,
          discount: clientPrimaryAccountHeaderModel.secondRefLinkDiscount,
          ratio: clientPrimaryAccountHeaderModel.secondRefLinkRatio
        }
      ],
    }
  }

  private tokenDec(tokenId: number) {
    if (this.uiNumbers) {
      const token = this.tokens.get(tokenId);
      if (token) {
        return Math.pow(10, token.mask & 0xFF);
      }
      else {
        return 1;
      }
    }
    else {
      return 1;
    }
  }

  /**
   * Get general information about open orders in particular instrument (spot)
   * @param args Contains data from getClientData function
   * @returns General information about open orders (spot) 
   */
  async getClientSpotOrdersInfo(args: GetClientSpotOrdersInfoArgs): Promise<GetClientSpotOrdersInfoResponse> {
    const instr = this.instruments.get(args.instrId);
    if (instr == undefined) {
      throw new Error("Invalid Instrument ID");
    }
    const clientInfosAccount = await this.getInstrAccountByTag({
      assetTokenId: instr.header.assetTokenId,
      crncyTokenId: instr.header.crncyTokenId,
      tag: AccountType.SPOT_CLIENT_INFOS
    });
    const clientInfos2Account = await this.getInstrAccountByTag({
      assetTokenId: instr.header.assetTokenId,
      crncyTokenId: instr.header.crncyTokenId,
      tag: AccountType.SPOT_CLIENT_INFOS2
    });
    const infos = await this.rpc.getMultipleAccounts(
      [clientInfosAccount, clientInfos2Account],
      {
        commitment: this.commitment,
        encoding: 'base64',
        dataSlice: {
          offset: SpotTradeAccountHeaderModel.LENGTH + 32 * args.clientId,
          length: 32
        }
      }
    ).send();
    if (infos.value[0] == null || infos.value[1] == null) {
      throw new Error("Orders Info Not Found");
    }
    const data = Buffer.from(getBase64Encoder().encode(infos.value[0].data[0]));
    const data1 = Buffer.from(getBase64Encoder().encode(infos.value[1].data[0]));
    return {
      contextSlot: Number(infos.context.slot),
      bidSlot: data1.readUint32LE(SpotClientInfo2Model.OFFSET_BID_SLOT),
      askSlot: data1.readUint32LE(SpotClientInfo2Model.OFFSET_ASK_SLOT),
      bidsEntry: data.readUint16LE(SpotClientInfoModel.OFFSET_BIDS_ENTRY),
      bidsCount: data.readUint16LE(SpotClientInfoModel.OFFSET_BIDS_ENTRY + 2),
      asksEntry: data.readUint16LE(SpotClientInfoModel.OFFSET_ASKS_ENTRY),
      asksCount: data.readUint16LE(SpotClientInfoModel.OFFSET_ASKS_ENTRY + 2),
      tempAssetTokens: Number(data.readBigInt64LE(SpotClientInfoModel.OFFSET_AVAIL_ASSET_TOKENS)) /
        this.tokenDec(instr.header.assetTokenId),
      tempCrncyTokens: Number(data.readBigInt64LE(SpotClientInfoModel.OFFSET_AVAIL_CRNCY_TOKENS)) /
        this.tokenDec(instr.header.crncyTokenId),
      inOrdersAssetTokens: Number(data1.readBigInt64LE(SpotClientInfo2Model.OFFSET_IN_ORDERS_ASSET_TOKENS)) /
        this.tokenDec(instr.header.assetTokenId),
      inOrdersCrncyTokens: Number(data1.readBigInt64LE(SpotClientInfo2Model.OFFSET_IN_ORDERS_CRNCY_TOKENS)) /
        this.tokenDec(instr.header.crncyTokenId),
    }
  }

  /**
   * Get general information about open orders in particular instrument (perp)
   * @param args Contains data from getClientData function
   * @returns General information about open orders (perp) 
   */
  async getClientPerpOrdersInfo(args: GetClientPerpOrdersInfoArgs): Promise<GetClientPerpOrdersInfoResponse> {
    const instr = this.instruments.get(args.instrId);
    if (instr == undefined) {
      throw new Error("Invalid Instrument ID");
    }
    const clientInfosAccount = await this.getInstrAccountByTag({
      assetTokenId: instr.header.assetTokenId,
      crncyTokenId: instr.header.crncyTokenId,
      tag: AccountType.PERP_CLIENT_INFOS
    });
    const clientInfos2Account = await this.getInstrAccountByTag({
      assetTokenId: instr.header.assetTokenId,
      crncyTokenId: instr.header.crncyTokenId,
      tag: AccountType.PERP_CLIENT_INFOS2
    });
    const clientInfos3Account = await this.getInstrAccountByTag({
      assetTokenId: instr.header.assetTokenId,
      crncyTokenId: instr.header.crncyTokenId,
      tag: AccountType.PERP_CLIENT_INFOS3
    });
    const clientInfos4Account = await this.getInstrAccountByTag({
      assetTokenId: instr.header.assetTokenId,
      crncyTokenId: instr.header.crncyTokenId,
      tag: AccountType.PERP_CLIENT_INFOS4
    });
    const clientInfos5Account = await this.getInstrAccountByTag({
      assetTokenId: instr.header.assetTokenId,
      crncyTokenId: instr.header.crncyTokenId,
      tag: AccountType.PERP_CLIENT_INFOS5
    });
    const infos = await this.rpc.getMultipleAccounts(
      [clientInfosAccount, clientInfos2Account, clientInfos3Account, clientInfos4Account, clientInfos5Account],
      {
        commitment: this.commitment,
        encoding: 'base64',
        dataSlice:
        {
          offset: SpotTradeAccountHeaderModel.LENGTH + 32 * args.clientId,
          length: 32
        }
      }
    ).send();
    if (infos.value[0] == null || infos.value[1] == null || infos.value[2] == null ||
      infos.value[3] == null || infos.value[4] == null) {
      throw new Error("Orders Info Not Found");
    }
    const clientInfoModel = PerpClientInfoModel.fromBuffer(infos.value[0].data);
    const clientInfo2Model = PerpClientInfo2Model.fromBuffer(infos.value[1].data);
    const clientInfo3Model = PerpClientInfo3Model.fromBuffer(infos.value[2].data);
    const clientInfo4Model = PerpClientInfo4Model.fromBuffer(infos.value[3].data);
    const clientInfo5Model = PerpClientInfo5Model.fromBuffer(infos.value[4].data);
    return {
      contextSlot: Number(infos.context.slot),
      bidSlot: clientInfo2Model.bidSlot,
      askSlot: clientInfo2Model.askSlot,
      bidsEntry: clientInfo3Model.bidsEntry & 0xFFFF,
      bidsCount: clientInfo3Model.bidsEntry >> 16,
      asksEntry: clientInfo3Model.asksEntry & 0xFFFF,
      asksCount: clientInfo3Model.asksEntry >> 16,
      perps: clientInfoModel.perps,
      funds: clientInfoModel.funds,
      inOrdersPerps: clientInfoModel.inOrdersPerps,
      inOrdersFunds: clientInfoModel.inOrdersFunds,
      fees: clientInfo3Model.fees,
      rebates: clientInfo3Model.rebates,
      result: clientInfo2Model.result,
      cost: clientInfo2Model.cost,
      mask: clientInfo2Model.mask,
      socLossFunds: clientInfo4Model.socLossFunds,
      fundingFunds: clientInfo5Model.fundingFunds,
      lossCoverage: clientInfo4Model.lossCoverage
    }
  }

  /**
   * Get list of open orders (spot) in particular instrument
   * @param args Contains data from getClientSpotOrdersInfo
   * @returns List of open orders
   */
  async getClientSpotOrders(args: GetClientSpotOrdersArgs): Promise<GetClientSpotOrdersResponse> {
    const instr = this.instruments.get(args.instrId);
    const bidOrdersAccount = await this.getInstrAccountByTag({
      assetTokenId: instr.header.assetTokenId,
      crncyTokenId: instr.header.crncyTokenId,
      tag: AccountType.SPOT_BID_ORDERS
    });
    const askOrdersAccount = await this.getInstrAccountByTag({
      assetTokenId: instr.header.assetTokenId,
      crncyTokenId: instr.header.crncyTokenId,
      tag: AccountType.SPOT_ASK_ORDERS
    });
    const assetTokenDec = this.tokenDec(instr.header.assetTokenId);
    const crncyTokenDec = this.tokenDec(instr.header.crncyTokenId);
    if (args.bidsCount > 1 && args.asksCount > 1) {
      let infos = await this.rpc.getMultipleAccounts(
        [bidOrdersAccount, askOrdersAccount], { commitment: this.commitment, encoding: 'base64' }).send();
      let bids = getMultipleSpotOrders(infos.value[0].data, args.bidsEntry, this.originalClientId);
      for (let i = 0; i < bids.length; ++i) {
        bids[i].qty /= assetTokenDec;
        bids[i].sum /= crncyTokenDec;
      }
      let asks = getMultipleSpotOrders(infos.value[1].data, args.asksEntry, this.originalClientId);
      for (let i = 0; i < asks.length; ++i) {
        asks[i].qty /= assetTokenDec;
        asks[i].sum /= crncyTokenDec;
      }
      return {
        contextSlot: Number(infos.context.slot),
        bids: bids,
        asks: asks
      }
    }
    let bids: Array<OrderModel> = [];
    let asks: Array<OrderModel> = [];
    let bidContextSlot = 0;
    let askContextSlot = 0;
    if (args.bidsCount > 1) {
      let info = await this.rpc.getAccountInfo(bidOrdersAccount,
        {
          commitment: this.commitment,
          encoding: 'base64'
        }).send();
      bidContextSlot = Number(info.context.slot);
      bids = getMultipleSpotOrders(info.value.data, args.bidsEntry, this.originalClientId);
    }
    else if (args.bidsCount == 1) {
      let info = await this.rpc.getAccountInfo(bidOrdersAccount,
        {
          commitment: this.commitment,
          encoding: 'base64',
          dataSlice:
          {
            offset: args.bidsEntry * 64 + SpotTradeAccountHeaderModel.LENGTH,
            length: 64
          }
        }).send();
      const order = OrderModel.fromBuffer(info.value.data);
      if (order.origClientId == this.originalClientId) {
        bids = [order];
      }
      bidContextSlot = Number(info.context.slot);
    }
    if (args.asksCount > 1) {
      let info = await this.rpc.getAccountInfo(askOrdersAccount,
        {
          commitment: this.commitment,
          encoding: 'base64'
        }).send();
      askContextSlot = Number(info.context.slot);
      asks = getMultipleSpotOrders(info.value.data, args.bidsEntry, this.originalClientId);
    }
    else if (args.asksCount == 1) {
      let info = await this.rpc.getAccountInfo(askOrdersAccount,
        {
          commitment: this.commitment,
          encoding: 'base64',
          dataSlice: {
            offset: args.asksEntry * 64 + SpotTradeAccountHeaderModel.LENGTH,
            length: 64
          }
        }).send();
      const order = OrderModel.fromBuffer(info.value.data);
      if (order.origClientId == this.originalClientId) {
        asks = [order];
      }
      askContextSlot = Number(info.context.slot);
    }
    for (let i = 0; i < bids.length; ++i) {
      bids[i].qty /= assetTokenDec;
      bids[i].sum /= crncyTokenDec;
    }
    for (let i = 0; i < asks.length; ++i) {
      asks[i].qty /= assetTokenDec;
      asks[i].sum /= crncyTokenDec;
    }
    let contextSlot = 0;
    if (bidContextSlot > 0 || askContextSlot > 0) {
      if (bidContextSlot == 0) {
        contextSlot = askContextSlot;
      }
      else if (askContextSlot == 0) {
        contextSlot = bidContextSlot;
      }
      else {
        contextSlot = Math.min(bidContextSlot, askContextSlot);
      }
    }
    return {
      contextSlot: contextSlot,
      bids: bids,
      asks: asks
    }
  }

  /**
   * Get list of open orders (perp) in particular instrument
   * @param args Contains data from getClientSpotOrdersInfo
   * @returns List of open orders
   */
  async getClientPerpOrders(args: GetClientPerpOrdersArgs): Promise<GetClientPerpOrdersResponse> {
    const instr = this.instruments.get(args.instrId);
    const bidOrdersAccount = await this.getInstrAccountByTag({
      assetTokenId: instr.header.assetTokenId,
      crncyTokenId: instr.header.crncyTokenId,
      tag: AccountType.PERP_BID_ORDERS
    });
    const askOrdersAccount = await this.getInstrAccountByTag({
      assetTokenId: instr.header.assetTokenId,
      crncyTokenId: instr.header.crncyTokenId,
      tag: AccountType.PERP_ASK_ORDERS
    });
    const assetTokenDec = this.tokenDec(instr.header.assetTokenId);
    const crncyTokenDec = this.tokenDec(instr.header.crncyTokenId);
    if (args.bidsCount > 1 && args.asksCount > 1) {
      let infos = await this.rpc.getMultipleAccounts(
        [bidOrdersAccount, askOrdersAccount], { commitment: this.commitment, encoding: 'base64' }).send();
      let bids = getMultiplePerpOrders(infos.value[0].data, args.bidsEntry, this.originalClientId);
      for (let i = 0; i < bids.length; ++i) {
        bids[i].qty /= assetTokenDec;
        bids[i].sum /= crncyTokenDec;
      }
      let asks = getMultiplePerpOrders(infos.value[1].data, args.asksEntry, this.originalClientId);
      for (let i = 0; i < asks.length; ++i) {
        asks[i].qty /= assetTokenDec;
        asks[i].sum /= crncyTokenDec;
      }
      return {
        contextSlot: Number(infos.context.slot),
        bids: bids,
        asks: asks
      }
    }
    let bids: OrderModel[] = [];
    let asks: OrderModel[] = [];
    let bidContextSlot = 0;
    let askContextSlot = 0;
    if (args.bidsCount > 1) {
      let info = await this.rpc.getAccountInfo(bidOrdersAccount, { commitment: this.commitment, encoding: 'base64' }).send();
      bidContextSlot = Number(info.context.slot);
      bids = getMultiplePerpOrders(info.value.data, args.bidsEntry, this.originalClientId);
    }
    else if (args.bidsCount == 1) {
      let info = await this.rpc.getAccountInfo(bidOrdersAccount,
        {
          commitment: this.commitment,
          encoding: 'base64',
          dataSlice:
          {
            offset: args.bidsEntry * 64 + PerpTradeAccountHeaderModel.LENGTH,
            length: 64
          }
        }).send();
      const order = OrderModel.fromBuffer(info.value.data);
      if (order.origClientId == this.originalClientId) {
        bids = [order];
      }
      bidContextSlot = Number(info.context.slot);
    }
    if (args.asksCount > 1) {
      let info = await this.rpc.getAccountInfo(askOrdersAccount, { commitment: this.commitment, encoding: 'base64' }).send();
      askContextSlot = Number(info.context.slot);
      asks = getMultiplePerpOrders(info.value.data, args.bidsEntry, this.originalClientId);
    }
    else if (args.asksCount == 1) {
      let info = await this.rpc.getAccountInfo(askOrdersAccount,
        {
          commitment: this.commitment,
          encoding: 'base64',
          dataSlice:
          {
            offset: args.asksEntry * 64 + PerpTradeAccountHeaderModel.LENGTH,
            length: 64
          }
        }).send();
      const order = OrderModel.fromBuffer(info.value.data);
      if (order.origClientId == this.originalClientId) {
        asks = [order];
      }
      askContextSlot = Number(info.context.slot);
    }
    for (let i = 0; i < bids.length; ++i) {
      bids[i].qty /= assetTokenDec;
      bids[i].sum /= crncyTokenDec;
    }
    for (let i = 0; i < asks.length; ++i) {
      asks[i].qty /= assetTokenDec;
      asks[i].sum /= crncyTokenDec;
    }
    let contextSlot = 0;
    if (bidContextSlot > 0 || askContextSlot > 0) {
      if (bidContextSlot == 0) {
        contextSlot = askContextSlot;
      }
      else if (askContextSlot == 0) {
        contextSlot = bidContextSlot;
      }
      else {
        contextSlot = Math.min(bidContextSlot, askContextSlot);
      }
    }
    return {
      contextSlot: contextSlot,
      bids: bids,
      asks: asks
    }
  }

  /**
   * Unpack market data to Engine fields, you can use this function to subscribe to Solana account
   * @param buf Engine Instrument Dynamic Account data
   */
  async updateInstrDataFromBuffer(data: Base64EncodedDataResponse) {
    let header = InstrAccountHeaderModel.fromBuffer(data);
    header.ps /= lpDec;
    const assetTokenDec = this.tokenDec(header.assetTokenId);
    const crncyTokenDec = this.tokenDec(header.crncyTokenId);
    header.assetTokens /= assetTokenDec;
    header.crncyTokens /= crncyTokenDec;
    header.protocolFees /= crncyTokenDec;
    header.lastAssetTokens /= assetTokenDec;
    header.lastCrncyTokens /= crncyTokenDec;
    header.dayAssetTokens /= assetTokenDec;
    header.dayCrncyTokens /= crncyTokenDec;
    header.prevDayAssetTokens /= assetTokenDec;
    header.prevDayCrncyTokens /= crncyTokenDec;
    header.perpLastAssetTokens /= assetTokenDec;
    header.perpLastCrncyTokens /= crncyTokenDec;
    header.perpDayAssetTokens /= assetTokenDec;
    header.perpDayCrncyTokens /= crncyTokenDec;
    header.fixingAssetTokens /= assetTokenDec;
    header.fixingCrncyTokens /= crncyTokenDec;
    header.perpFundingFunds /= crncyTokenDec;
    header.perpInsuranceFund /= crncyTokenDec;
    header.perpOpenInt /= assetTokenDec;
    header.perpSocLossFunds /= crncyTokenDec;
    header.perpPrevDayAssetTokens /= assetTokenDec;
    header.perpPrevDayCrncyTokens /= crncyTokenDec;
    header.bestBid /= dec;
    header.bestAsk /= dec;
    header.dayHigh /= dec;
    header.dayLow /= dec;
    header.perpBestBid /= dec;
    header.perpBestAsk /= dec;
    header.perpDayHigh /= dec;
    header.perpDayLow /= dec;
    header.lastPx /= dec;
    header.perpUnderlyingPx /= dec;
    header.lastClose /= dec;
    header.fixingPx /= dec;
    header.perpLastClose /= dec;
    header.perpLastPx /= dec;
    header.lastHourPx /= dec;
    header.perpSpotPriceForWithdrowal /= dec;
    header.poolFees /= crncyTokenDec;
    let spotBids: Array<LineQuotesModel> = [];
    let spotAsks: Array<LineQuotesModel> = [];
    let perpBids: Array<LineQuotesModel> = [];
    let perpAsks: Array<LineQuotesModel> = [];
    for (var i = 0; i < MARKET_DEPTH; ++i) {
      const offset = InstrAccountHeaderModel.LENGTH + i * 16;
      let line = LineQuotesModel.fromBuffer(data, offset);
      if (line.px == 0) {
        break;
      }
      line.px /= dec;
      line.qty /= assetTokenDec;
      spotBids.push(line)
    }
    for (var i = 0; i < MARKET_DEPTH; ++i) {
      const offset = InstrAccountHeaderModel.LENGTH + i * 16 + 16 * MARKET_DEPTH;
      let line = LineQuotesModel.fromBuffer(data, offset);
      if (line.px == 0) {
        break;
      }
      line.px /= dec;
      line.qty /= assetTokenDec;
      spotAsks.push(line)
    }
    for (var i = 0; i < MARKET_DEPTH; ++i) {
      const offset = InstrAccountHeaderModel.LENGTH + i * 16 + 16 * MARKET_DEPTH * 2;
      let line = LineQuotesModel.fromBuffer(data, offset);
      if (line.px == 0) {
        break;
      }
      line.px /= dec;
      line.qty /= assetTokenDec;
      perpBids.push(line)
    }
    for (var i = 0; i < MARKET_DEPTH; ++i) {
      const offset = InstrAccountHeaderModel.LENGTH + i * 16 + 16 * MARKET_DEPTH * 3;
      let line = LineQuotesModel.fromBuffer(data, offset);
      if (line.px == 0) {
        break;
      }
      line.px /= dec;
      line.qty /= assetTokenDec;
      perpAsks.push(line)
    }
    let pattern = Buffer.alloc(16);
    pattern.writeInt32LE(this.version, 0);
    pattern.writeInt32LE(AccountType.INSTR, 4);
    pattern.writeInt32LE(header.assetTokenId, 8);
    pattern.writeInt32LE(header.crncyTokenId, 12);
    const instrAddress =
      (await getProgramDerivedAddress({
        programAddress: this.programId,
        seeds: [pattern, getAddressEncoder().encode(this.drvsAuthority)]
      }))[0];
    this.instruments.set(header.id, {
      address: instrAddress,
      header: header,
      spotBids: spotBids,
      spotAsks: spotAsks,
      perpBids: perpBids,
      perpAsks: perpAsks
    });
  }

  /**
   * Get AddressLookupTableAccount to compile Versioned Transaction with this instrument (spot + derivatives)
   * @param args Instrument ID
   * @returns AddressLookupTableAccount for instrument
   */
  instrLut(args: InstrId): Address {
    return this.instruments.get(args.instrId).header.lutAddress;
  }

  /**
   * Update market data on Engine fields
   * @param args Instrument ID
   */
  async updateInstrData(args: InstrId) {
    const instr = this.instruments.get(args.instrId);
    let instrAccount = await this.getInstrAccountByTag({
      assetTokenId: instr.header.assetTokenId,
      crncyTokenId: instr.header.crncyTokenId,
      tag: AccountType.INSTR
    });
    const info = await this.rpc.getAccountInfo(instrAccount, { commitment: this.commitment, encoding: 'base64' }).send();
    await this.updateInstrDataFromBuffer(info.value.data);
  }

  /**
    * Build instruction to deposit SPL tokens
    * @param args Order data
    * @returns Transaction instruction
    */
  async depositInstruction(args: DepositArgs): Promise<any> {
    const exists = await this.checkClient();
    if (this.signer == null) {
      throw new Error("Wallet is not connected");
    }
    const token = this.tokens.get(args.tokenId);
    const tokenProgramId = (token.mask & 0x80000000) != 0 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
    const clientTokenAccount = await findAssociatedTokenAddress(this.signer, tokenProgramId, token.address);
    let keys = [
      { address: this.signer, role: AccountRole.READONLY_SIGNER },
      { address: clientTokenAccount, role: AccountRole.WRITABLE },
      { address: token.programAddress, role: AccountRole.WRITABLE },
      { address: token.address, role: AccountRole.READONLY },
      { address: this.rootAccount, role: exists ? AccountRole.READONLY : AccountRole.WRITABLE },
      { address: await this.getTokenAccount(token.address), role: AccountRole.READONLY },
      { address: await this.findClientPrimaryAccount(), role: AccountRole.WRITABLE },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
      { address: tokenProgramId, role: AccountRole.READONLY },
    ];
    if (exists) {
      if (args.tokenId == 0) {
        keys.push(
          { address: await this.getAccountByTag(AccountType.COMMUNITY), role: AccountRole.WRITABLE }
        );
        keys.push(
          { address: this.clientCommunityAccount, role: AccountRole.WRITABLE }
        );
      }
      return {
        accounts: keys,
        programAddress: this.programId,
        data: depositData(7, args.tokenId, args.amount * this.tokenDec(args.tokenId), 0, 0)
      };
    }
    else {
      const slot = Number((await this.rpc.getSlot().send())) - 1;
      const lutAddress = await getLookupTableAddress(this.signer, slot);
      const clientCommunityAccount = await this.findClientCommunityAccount();
      keys.push(
        { address: await this.findClientDrvAccount(), role: AccountRole.WRITABLE }
      );
      keys.push(
        { address: clientCommunityAccount, role: AccountRole.WRITABLE }
      );
      keys.push(
        { address: lutAddress, role: AccountRole.WRITABLE }
      );
      keys.push(
        { address: ADDRESS_LOOKUP_TABLE_PROGRAM_ID, role: AccountRole.WRITABLE }
      );
      if (args.tokenId == 0) {
        keys.push(
          { address: await this.getAccountByTag(AccountType.COMMUNITY), role: AccountRole.WRITABLE }
        );
        keys.push(
          { address: clientCommunityAccount, role: AccountRole.WRITABLE }
        );
      }
      let refId: number;
      if (args.refId != null && args.refId != undefined) {
        refId = args.refId;
        if (args.refWallet == null || args.refWallet == undefined) {
          throw new Error("Ref Wallet Not Found");
        }
        keys.push(
          { address: await this.findClientPrimaryAccount(args.refWallet), role: AccountRole.WRITABLE }
        );
        keys.push(
          { address: await this.findClientCommunityAccount(args.refWallet), role: AccountRole.WRITABLE }
        );
      }
      else {
        refId = 0;
      }
      return {
        accounts: keys,
        programAddress: this.programId,
        data: depositData(7, args.tokenId, args.amount * this.tokenDec(args.tokenId), slot, refId)
      };
    }
  }

  /**
   * Build instruction to withdraw SPL tokens
   * @param args Order data
   * @returns Transaction instruction
   */
  async withdrawInstruction(args: WithdrawArgs): Promise<any> {
    if (!(await this.checkClient())) {
      throw new Error("Client account not found");
    }
    const token = this.tokens.get(args.tokenId);
    const tokenProgramId = (token.mask & 0x80000000) != 0 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
    const clientTokenAccount = await findAssociatedTokenAddress(this.signer, tokenProgramId, token.address);
    let keys = [
      { address: this.signer, role: AccountRole.READONLY_SIGNER },
      { address: clientTokenAccount, role: AccountRole.WRITABLE },
      { address: token.programAddress, role: AccountRole.WRITABLE },
      { address: token.address, role: AccountRole.READONLY },
      { address: this.rootAccount, role: AccountRole.READONLY },
      { address: await this.getTokenAccount(token.address), role: AccountRole.READONLY },
      { address: this.clientPrimaryAccount, role: AccountRole.WRITABLE },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
      { address: tokenProgramId, role: AccountRole.READONLY },
      { address: this.drvsAuthority, role: AccountRole.READONLY },
      { address: ASSOCIATED_TOKEN_PROGRAM_ID, role: AccountRole.WRITABLE },
    ];
    if (args.spot != undefined) {
      keys.push({ address: await this.findClientDrvAccount(), role: AccountRole.READONLY });
      for (var i = 0; i < args.spot.length; ++i) {
        const instr = this.instruments.get(args.spot[i].instrId);
        if (instr.header.assetTokenId == args.tokenId || instr.header.crncyTokenId == args.tokenId) {
          keys.push({ address: instr.header.mapsAddress, role: AccountRole.READONLY });
          keys.push({
            address: await this.getInstrAccountByTag(
              {
                assetTokenId: instr.header.assetTokenId,
                crncyTokenId: instr.header.crncyTokenId,
                tag: AccountType.SPOT_CLIENT_INFOS
              }),
            role: AccountRole.READONLY
          });
        }
      }
    }
    if (args.tokenId == 0) {
      keys.push(
        { address: await this.getAccountByTag(AccountType.COMMUNITY), role: AccountRole.READONLY }
      );
      keys.push(
        { address: await this.clientCommunityAccount, role: AccountRole.READONLY }
      );
    }
    return {
      accounts: keys,
      programAddress: this.programId,
      data: withdrawData(8, args.tokenId, args.amount * this.tokenDec(args.tokenId))
    };
  }

  /**
   * Build instruction to trade spot LP tokens in particular instrument
   * @param args Order data
   * @returns Trabsaction instruction
   */
  async spotLpInstruction(args: SpotLpArgs): Promise<any> {
    if (!(await this.checkClient())) {
      throw new Error("Client account not found");
    }
    const instr = this.instruments.get(args.instrId);
    let keys = [
      { address: this.signer, role: AccountRole.READONLY_SIGNER },
      { address: this.rootAccount, role: AccountRole.READONLY },
      {
        address: await this.getInstrAccountByTag({
          assetTokenId: instr.header.assetTokenId,
          crncyTokenId: instr.header.crncyTokenId,
          tag: AccountType.INSTR
        }),
        role: AccountRole.WRITABLE
      },
      { address: this.clientPrimaryAccount, role: AccountRole.WRITABLE },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    ];
    if (instr.header.assetTokenId == 0) {
      keys.push(
        { address: await this.getAccountByTag(AccountType.COMMUNITY), role: AccountRole.WRITABLE }
      );
      keys.push(
        { address: this.clientCommunityAccount, role: AccountRole.WRITABLE }
      );
    }
    return {
      accounts: keys,
      programAddress: this.programId,
      data: spotLpData(14, args.side, args.instrId, Math.round(args.amount * lpDec)),
    };
  }

  /**
   * Build instruction to add new spot order in particular instrument
   * @param args Order data
   * @returns Transaction instruction
   */
  async newSpotOrderInstruction(
    args: NewSpotOrderArgs
  ): Promise<any> {
    if (!(await this.checkClient())) {
      throw new Error("Client account not found");
    }
    let instr = this.instruments.get(args.instrId);
    let buf = newSpotOrderData(
      12,
      args.ioc == null || args.ioc == undefined ? 0 : args.ioc,
      args.orderType == null || args.orderType == undefined ? 0 : args.orderType,
      args.side,
      args.instrId,
      Math.round(args.price * 1000000000),
      Math.round(args.qty * this.tokenDec(instr.header.assetTokenId))
    );
    let keys = [
      { address: this.signer, role: AccountRole.READONLY_SIGNER },
      { address: this.rootAccount, role: AccountRole.READONLY },
      { address: await this.findClientPrimaryAccount(), role: AccountRole.WRITABLE },
      { address: await this.findClientCommunityAccount(), role: AccountRole.WRITABLE },
      ... await this.getSpotContext(instr.header),
      ... await this.getSpotCandles(instr.header),
      {
        address: await this.getAccountByTag(AccountType.COMMUNITY),
        role: instr.header.assetTokenId == 0 ? AccountRole.WRITABLE : AccountRole.READONLY
      },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    ];
    if (this.refClientPrimaryAccount != null && this.refClientPrimaryAccount != undefined) {
      keys.push(
        { address: this.refClientPrimaryAccount, role: AccountRole.WRITABLE }
      );
      keys.push(
        { address: this.refClientCommunityAccount, role: AccountRole.WRITABLE }
      );
    }
    return {
      accounts: keys, programAddress: this.programId, data: buf
    };
  }

  /**
   * Build instruction to spot quotes replacement in particular instrument
   * @param args Order data
   * @returns Transaction instruction
   */
  async spotQuotesReplaceInstruction(
    args: SpotQuotesReplaceArgs
  ): Promise<any> {
    if (!(await this.checkClient())) {
      throw new Error("Client account not found");
    }
    let instr = this.instruments.get(args.instrId);
    let assetTokenDecFactor = this.tokenDec(instr.header.assetTokenId);
    let buf = spotQuotesReplaceData(
      34,
      args.instrId,
      Math.round(args.newBidPrice * 1000000000),
      Math.round(args.newBidQty * assetTokenDecFactor),
      args.bidOrderIdToCancel,
      Math.round(args.newAskPrice * 1000000000),
      Math.round(args.newAskQty * assetTokenDecFactor),
      args.askOrderIdToCancel
    );
    let keys = [
      { address: this.signer, role: AccountRole.READONLY_SIGNER },
      { address: this.rootAccount, role: AccountRole.READONLY },
      { address: await this.findClientPrimaryAccount(), role: AccountRole.WRITABLE },
      { address: await this.findClientCommunityAccount(), role: AccountRole.WRITABLE },
      ... await this.getSpotContext(instr.header),
      ... await this.getSpotCandles(instr.header),
      {
        address: await this.getAccountByTag(AccountType.COMMUNITY),
        role: instr.header.assetTokenId == 0 ? AccountRole.WRITABLE : AccountRole.READONLY
      },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    ];
    if (this.refClientPrimaryAccount != null && this.refClientPrimaryAccount != undefined) {
      keys.push(
        { address: this.refClientPrimaryAccount, role: AccountRole.WRITABLE }
      );
      keys.push(
        { address: this.refClientCommunityAccount, role: AccountRole.WRITABLE }
      );
    }
    return {
      accounts: keys, programAddress: this.programId, data: buf
    };
  }

  /**
   * Build instruction to cancel spot order in particular instrument
   * @param args Order data
   * @returns Transaction instruction
   */
  async spotOrderCancelInstruction(args: SpotOrderCancelArgs): Promise<any> {
    if (!(await this.checkClient())) {
      throw new Error("Client account not found");
    }
    let instr = this.instruments.get(args.instrId);
    const drvs = instr.header.assetTokenId == 0;
    let keys = [
      { address: this.signer, role: AccountRole.READONLY_SIGNER },
      { address: this.rootAccount, role: AccountRole.READONLY },
      { address: this.clientPrimaryAccount, role: AccountRole.WRITABLE },
      ... await this.getSpotContext(instr.header),
      {
        address: await this.getAccountByTag(AccountType.COMMUNITY),
        role: drvs ? AccountRole.WRITABLE : AccountRole.READONLY
      },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    ];
    if (drvs) {
      keys.push(
        { address: await this.findClientCommunityAccount(), role: AccountRole.WRITABLE },
      );
    }
    return {
      accounts: keys,
      programAddress: this.programId,
      data: spotOrderCancelData(13, args.side, args.instrId, args.orderId),
    };
  }

  /**
   * Build instruction for spot mass cancel in particular instrument
   * @param args Order data
   * @returns Transaction instruction
   */
  async spotMassCancelInstruction(args: SpotMassCancelArgs): Promise<any> {
    if (!(await this.checkClient())) {
      throw new Error("Client account not found");
    }
    const instr = this.instruments.get(args.instrId);
    const drvs = instr.header.assetTokenId == 0;
    let keys = [
      { address: this.signer, role: AccountRole.READONLY_SIGNER },
      { address: this.rootAccount, role: AccountRole.READONLY },
      { address: this.clientPrimaryAccount, role: AccountRole.WRITABLE },
      ... await this.getSpotContext(instr.header),
      {
        address: await this.getAccountByTag(AccountType.COMMUNITY),
        role: drvs ? AccountRole.WRITABLE : AccountRole.READONLY
      },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    ];
    if (drvs) {
      keys.push(
        { address: await this.findClientCommunityAccount(), role: AccountRole.WRITABLE },
      );
    }
    return {
      accounts: keys,
      programAddress: this.programId,
      data: spotMassCancelData(15, args.instrId),
    };
  }

  /**
     * Build upgrade to PERP instructions
     * @param args Order data
     * @returns Transaction instruction
     */
  async upgradeToPerpInstructions(args: InstrId): Promise<any[]> {
    if (this.signer == null) {
      throw new Error("Wallet is not connected");
    }
    let instr = this.instruments.get(args.instrId);
    if (instr == null) {
      throw new Error("Invalid Instr ID");
    }
    await this.updateInstrData({
      instrId: args.instrId
    });
    instr = this.instruments.get(args.instrId);
    if ((instr.header.mask & InstrMask.READY_TO_PERP_UPGRADE) == 0) {
      throw new Error("Impossible to upgrade");
    }
    if ((instr.header.mask & InstrMask.PERP) != 0) {
      throw new Error("Instr already upgraded");
    }
    const perpMapsAccountSeed =
      this.version.toString() + "_" +
      AccountType.PERP_MAPS.toString() + "_" +
      instr.header.assetTokenId.toString() + "_" +
      instr.header.crncyTokenId.toString();
    const perpMapsAccount = await createAddressWithSeed({
      baseAddress: this.signer,
      programAddress: this.programId,
      seed: perpMapsAccountSeed
    });
    const perpMapsAccountSize = 175336;
    const perpMapsAccountLamports = await this.rpc.getMinimumBalanceForRentExemption(BigInt(perpMapsAccountSize)).send();
    const createMapsAccountIx = getCreateAccountWithSeedInstruction({
      payer: this.signer,
      baseAccount: this.signer,
      base: this.signer,
      newAccount: perpMapsAccount,
      seed: perpMapsAccountSeed,
      space: perpMapsAccountSize,
      programAddress: this.programId,
      amount: perpMapsAccountLamports,
    });
    let keys = [
      { address: this.signer, role: AccountRole.READONLY_SIGNER },
      { address: this.rootAccount, role: AccountRole.WRITABLE },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: instr.header.assetTokenId,
            crncyTokenId: instr.header.crncyTokenId,
            tag: AccountType.INSTR
          }), role: AccountRole.WRITABLE
      },
      { address: instr.header.lutAddress, role: AccountRole.WRITABLE },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
      { address: ADDRESS_LOOKUP_TABLE_PROGRAM_ID, role: AccountRole.READONLY },
      { address: this.drvsAuthority, role: AccountRole.READONLY },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: instr.header.assetTokenId,
            crncyTokenId: instr.header.crncyTokenId,
            tag: AccountType.PERP_BIDS_TREE
          }), role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: instr.header.assetTokenId,
            crncyTokenId: instr.header.crncyTokenId,
            tag: AccountType.PERP_ASKS_TREE
          }), role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: instr.header.assetTokenId,
            crncyTokenId: instr.header.crncyTokenId,
            tag: AccountType.PERP_BID_ORDERS
          }), role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: instr.header.assetTokenId,
            crncyTokenId: instr.header.crncyTokenId,
            tag: AccountType.PERP_ASK_ORDERS
          }), role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: instr.header.assetTokenId,
            crncyTokenId: instr.header.crncyTokenId,
            tag: AccountType.PERP_LINES
          }), role: AccountRole.WRITABLE
      },
      {
        address: perpMapsAccount, role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: instr.header.assetTokenId,
            crncyTokenId: instr.header.crncyTokenId,
            tag: AccountType.PERP_CLIENT_INFOS
          }), role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: instr.header.assetTokenId,
            crncyTokenId: instr.header.crncyTokenId,
            tag: AccountType.PERP_CLIENT_INFOS2
          }), role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: instr.header.assetTokenId,
            crncyTokenId: instr.header.crncyTokenId,
            tag: AccountType.PERP_CLIENT_INFOS3
          }), role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: instr.header.assetTokenId,
            crncyTokenId: instr.header.crncyTokenId,
            tag: AccountType.PERP_CLIENT_INFOS4
          }), role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: instr.header.assetTokenId,
            crncyTokenId: instr.header.crncyTokenId,
            tag: AccountType.PERP_CLIENT_INFOS5
          }), role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: instr.header.assetTokenId,
            crncyTokenId: instr.header.crncyTokenId,
            tag: AccountType.PERP_CLIENT_ACCOUNTS
          }), role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: instr.header.assetTokenId,
            crncyTokenId: instr.header.crncyTokenId,
            tag: AccountType.PERP_LONG_PX_TREE
          }), role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: instr.header.assetTokenId,
            crncyTokenId: instr.header.crncyTokenId,
            tag: AccountType.PERP_SHORT_PX_TREE
          }), role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: instr.header.assetTokenId,
            crncyTokenId: instr.header.crncyTokenId,
            tag: AccountType.PERP_REBALANCE_TIME_TREE
          }), role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: instr.header.assetTokenId,
            crncyTokenId: instr.header.crncyTokenId,
            tag: AccountType.PERP_PRIORITY_TREE
          }), role: AccountRole.WRITABLE
      },
    ];
    const upgradeIx = {
      accounts: keys,
      programAddress: this.programId,
      data: upgradeToPerpData(10, args.instrId)
    };
    return [createMapsAccountIx, upgradeIx];
  }

  /**
   * Build instruction for perp deposit in particular instrument
   * @param args Order data
   * @returns Transaction instruction
   */
  async perpDepositInstruction(args: PerpDepositArgs): Promise<any> {
    if (!(await this.checkClient())) {
      throw new Error("Client account not found");
    }
    const instr = this.instruments.get(args.instrId);
    let keys = [
      { address: this.signer, role: AccountRole.READONLY_SIGNER },
      { address: this.rootAccount, role: AccountRole.READONLY },
      { address: this.clientPrimaryAccount, role: AccountRole.WRITABLE },
      ... await this.getPerpContext(instr.header),
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    ];
    return {
      accounts: keys,
      programAddress: this.programId,
      data: perpDepositData(11, args.instrId, args.amount * this.tokenDec(instr.header.crncyTokenId)),
    };
  }

  /**
   * Build instruction for new perp order in particular instrument
   * @param args Order data
   * @returns Transaction instruction
   */
  async newPerpOrderInstruction(args: NewPerpOrderArgs): Promise<any> {
    if (!(await this.checkClient())) {
      throw new Error("Client account not found");
    }
    const instr = this.instruments.get(args.instrId);
    let keys = [
      { address: this.signer, role: AccountRole.READONLY_SIGNER },
      { address: this.rootAccount, role: AccountRole.READONLY },
      { address: this.clientPrimaryAccount, role: AccountRole.WRITABLE },
      { address: this.clientCommunityAccount, role: AccountRole.WRITABLE },
      ... await this.getPerpContext(instr.header),
      { address: await this.getAccountByTag(AccountType.COMMUNITY), role: AccountRole.READONLY },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    ];
    if (this.refClientPrimaryAccount != null && this.refClientPrimaryAccount != undefined) {
      keys.push(
        { address: this.refClientPrimaryAccount, role: AccountRole.WRITABLE }
      );
      keys.push(
        { address: this.refClientCommunityAccount, role: AccountRole.WRITABLE }
      );
    }
    return {
      accounts: keys,
      programAddress: this.programId,
      data: newPerpOrderData(
        19,
        args.ioc == null || args.ioc == undefined ? 0 : args.ioc,
        args.leverage == null || args.leverage == undefined ? 0 : args.leverage,
        args.orderType == null || args.orderType == undefined ? 0 : args.orderType,
        args.side,
        args.instrId,
        args.price * 1000000000,
        args.qty * this.tokenDec(instr.header.assetTokenId)),
    };
  }

  /**
   * Build instruction for perp quotes replace in particular instrument
   * @param args Order data
   * @returns Transaction instruction
   */
  async perpQuotesReplaceInstruction(args: PerpQuotesReplaceArgs): Promise<any> {
    if (!(await this.checkClient())) {
      throw new Error("Client account not found");
    }
    const instr = this.instruments.get(args.instrId);
    let assetTokenDecFactor = this.tokenDec(instr.header.assetTokenId);
    let buf = perpQuotesReplaceData(
      42,
      args.instrId,
      Math.round(args.newBidPrice * 1000000000),
      Math.round(args.newBidQty * assetTokenDecFactor),
      args.bidOrderIdToCancel,
      Math.round(args.newAskPrice * 1000000000),
      Math.round(args.newAskQty * assetTokenDecFactor),
      args.askOrderIdToCancel
    );
    let keys = [
      { address: this.signer, role: AccountRole.READONLY_SIGNER },
      { address: this.rootAccount, role: AccountRole.READONLY },
      { address: this.clientPrimaryAccount, role: AccountRole.WRITABLE },
      { address: this.clientCommunityAccount, role: AccountRole.WRITABLE },
      ... await this.getPerpContext(instr.header),
      { address: await this.getAccountByTag(AccountType.COMMUNITY), role: AccountRole.READONLY },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    ];
    if (this.refClientPrimaryAccount != null && this.refClientPrimaryAccount != undefined) {
      keys.push(
        { address: this.refClientPrimaryAccount, role: AccountRole.WRITABLE }
      );
      keys.push(
        { address: this.refClientCommunityAccount, role: AccountRole.WRITABLE }
      );
    }
    return {
      accounts: keys,
      programAddress: this.programId,
      data: buf,
    };
  }

  /**
   * Build instruction for perp order cancel in particular instrument
   * @param args Order data
   * @returns Transaction instruction
   */
  async perpOrderCancelInstruction(args: PerpOrderCancelArgs): Promise<any> {
    if (!(await this.checkClient())) {
      throw new Error("Client account not found");
    }
    const instr = this.instruments.get(args.instrId);
    let keys = [
      { address: this.signer, role: AccountRole.READONLY_SIGNER },
      { address: this.rootAccount, role: AccountRole.READONLY },
      { address: this.clientPrimaryAccount, role: AccountRole.WRITABLE },
      ... await this.getPerpContext(instr.header),
      { address: await this.getAccountByTag(AccountType.COMMUNITY), role: AccountRole.READONLY },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    ];
    return {
      accounts: keys,
      programAddress: this.programId,
      data: perpOrderCancelData(30, args.side, args.instrId, args.orderId),
    };
  }

  /**
   * Build instruction for perp mass cancel in particular instrument
   * @param args Order data
   * @returns Transaction instruction
   */
  async perpMassCancelInstruction(args: PerpMassCancelArgs): Promise<any> {
    if (!(await this.checkClient())) {
      throw new Error("Client account not found");
    }
    const instr = this.instruments.get(args.instrId);
    let keys = [
      { address: this.signer, role: AccountRole.READONLY_SIGNER },
      { address: this.rootAccount, role: AccountRole.READONLY },
      { address: this.clientPrimaryAccount, role: AccountRole.WRITABLE },
      ... await this.getPerpContext(instr.header),
      { address: await this.getAccountByTag(AccountType.COMMUNITY), role: AccountRole.READONLY },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    ];
    return {
      accounts: keys,
      programAddress: this.programId,
      data: perpMassCancelData(36, args.instrId),
    };
  }

  /**
   * Build instruction for perp forced close in particular instrument
   * @param args Order data
   * @returns Transaction instruction
   */
  async perpForcedCloseInstruction(args: PerpForcedCloseArgs): Promise<IInstruction> {
    if (!(await this.checkClient())) {
      throw new Error("Client account not found");
    }
    const instr = this.instruments.get(args.instrId);
    let keys = [
      { address: this.signer, role: AccountRole.READONLY_SIGNER },
      { address: this.rootAccount, role: AccountRole.READONLY },
      { address: args.clientPrimaryAccount, role: AccountRole.WRITABLE },
      ... await this.getPerpContext(instr.header),
      { address: await this.getAccountByTag(AccountType.COMMUNITY), role: AccountRole.READONLY },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    ];
    return {
      accounts: keys,
      programAddress: this.programId,
      data: perpForcedCloseData(38, args.instrId),
    };
  }

  /**
   * Build instruction for new referral link
   * @returns Transaction instruction
  */
  async newRefLinkInstruction(): Promise<any> {
    if (!(await this.checkClient())) {
      throw new Error("Client account not found");
    }
    let buf = Buffer.alloc(1);
    buf.writeUInt8(45, 0);
    let keys = [
      { address: this.signer, role: AccountRole.READONLY_SIGNER },
      { address: this.rootAccount, role: AccountRole.WRITABLE },
      { address: this.clientPrimaryAccount, role: AccountRole.WRITABLE },
    ];
    return {
      accounts: keys,
      programAddress: this.programId,
      data: buf,
    };
  }

  /**
   * Build instruction for change leverage in particular instrument
   * @param args Transaction data
   * @returns Transaction instruction
   */
  async perpChangeLeverageInstruction(args: PerpChangeLeverageArgs): Promise<any> {
    if (!(await this.checkClient())) {
      throw new Error("Client account not found");
    }
    const instr = this.instruments.get(args.instrId);
    let keys = [
      { address: this.signer, role: AccountRole.READONLY_SIGNER },
      { address: this.rootAccount, role: AccountRole.READONLY },
      { address: this.clientPrimaryAccount, role: AccountRole.WRITABLE },
      ... await this.getPerpContext(instr.header),
      { address: await this.getAccountByTag(AccountType.COMMUNITY), role: AccountRole.READONLY },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    ];
    return {
      accounts: keys,
      programAddress: this.programId,
      data: perpChangeLeverageData(37, args.instrId, args.leverage),
    };
  }

  /**
   * Build instruction for statistics reset in particular instrument
   * @param args Transaction data
   * @returns Transaction instruction
   */
  async perpStatisticsResetInstruction(args: PerpStatisticsResetArgs): Promise<any> {
    if (!(await this.checkClient())) {
      throw new Error("Client account not found");
    }
    const instr = this.instruments.get(args.instrId);
    let keys = [
      { address: this.signer, role: AccountRole.READONLY_SIGNER },
      { address: this.rootAccount, role: AccountRole.READONLY },
      { address: this.clientPrimaryAccount, role: AccountRole.WRITABLE },
      ... await this.getPerpContext(instr.header),
      { address: await this.getAccountByTag(AccountType.COMMUNITY), role: AccountRole.READONLY },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    ];
    return {
      accounts: keys,
      programAddress: this.programId,
      data: perpStatisticsResetData(46, args.instrId),
    };
  }

  /**
     * Build new instrument instructions
     * @param args New instrument data
     * @returns Transaction instruction
     */
  async newInstrumentInstructions(args: NewInstrumentArgs): Promise<any[]> {
    if (this.signer == null) {
      throw new Error("Wallet is not connected");
    }
    if (args.initialPrice <= 0) {
      throw new Error("Invalid initial price");
    }
    const assetInfo = await this.rpc.getAccountInfo(args.assetMint).send();
    if (!assetInfo.value) {
      throw new Error("Asset mint not found");
    }
    const tokenProgramId = assetInfo.value.owner == TOKEN_2022_PROGRAM_ID ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
    const crncyTokenId = await this.getTokenId(args.crncyMint);
    const id = await this.getTokenId(args.assetMint);
    const newAssetTokenId = id == null;
    const assetTokenId = newAssetTokenId ? this.rootStateModel.tokensCount: id;
    if (!crncyTokenId) {
      throw new Error("Currency mint not found");
    }
    const mapsAccountSeed =
      this.version.toString() + "_" +
      AccountType.SPOT_MAPS.toString() + "_" +
      assetTokenId.toString() + "_" +
      crncyTokenId.toString();
    const mapsAccount = await createAddressWithSeed({
      baseAddress: this.signer,
      programAddress: this.programId,
      seed: mapsAccountSeed
    });
    const mapsAccountSize = 42184;
    const mapsAccountLamports = await this.rpc.getMinimumBalanceForRentExemption(BigInt(mapsAccountSize)).send();
    const createMapsAccountIx = getCreateAccountWithSeedInstruction({
      payer: this.signer,
      baseAccount: this.signer,
      base: this.signer,
      newAccount: mapsAccount,
      seed: mapsAccountSeed,
      space: mapsAccountSize,
      programAddress: this.programId,
      amount: mapsAccountLamports,
    });
    const slot = Number((await this.rpc.getSlot().send())) - 1;
    const lutAddress = await getLookupTableAddress(this.drvsAuthority, slot);
    let keys = [
      { address: this.signer, role: AccountRole.READONLY_SIGNER },
      { address: this.rootAccount, role: AccountRole.WRITABLE },
      { address: await this.getTokenAccount(args.assetMint), role: newAssetTokenId ? AccountRole.WRITABLE : AccountRole.READONLY },
      { address: await this.getTokenAccount(args.crncyMint), role: AccountRole.READONLY },
      { address: newAssetTokenId ? args.newProgramAccountAddress : this.tokens.get(assetTokenId)!.programAddress, role: newAssetTokenId ? AccountRole.WRITABLE_SIGNER : AccountRole.READONLY },
      { address: args.assetMint, role: AccountRole.READONLY },
      { address: lutAddress, role: AccountRole.WRITABLE },
      { address: tokenProgramId, role: AccountRole.READONLY },
      { address: ADDRESS_LOOKUP_TABLE_PROGRAM_ID, role: AccountRole.READONLY },
      { address: this.drvsAuthority, role: AccountRole.READONLY },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: assetTokenId,
            crncyTokenId: crncyTokenId,
            tag: AccountType.INSTR
          }), role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: assetTokenId,
            crncyTokenId: crncyTokenId,
            tag: AccountType.SPOT_BIDS_TREE
          }), role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: assetTokenId,
            crncyTokenId: crncyTokenId,
            tag: AccountType.SPOT_ASKS_TREE
          }), role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: assetTokenId,
            crncyTokenId: crncyTokenId,
            tag: AccountType.SPOT_BID_ORDERS
          }), role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: assetTokenId,
            crncyTokenId: crncyTokenId,
            tag: AccountType.SPOT_ASK_ORDERS
          }), role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: assetTokenId,
            crncyTokenId: crncyTokenId,
            tag: AccountType.SPOT_LINES
          }), role: AccountRole.WRITABLE
      },
      {
        address: mapsAccount, role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: assetTokenId,
            crncyTokenId: crncyTokenId,
            tag: AccountType.SPOT_CLIENT_INFOS
          }), role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: assetTokenId,
            crncyTokenId: crncyTokenId,
            tag: AccountType.SPOT_CLIENT_INFOS2
          }), role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: assetTokenId,
            crncyTokenId: crncyTokenId,
            tag: AccountType.SPOT_CLIENT_ACCOUNTS
          }), role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: assetTokenId,
            crncyTokenId: crncyTokenId,
            tag: AccountType.SPOT_1M_CANDLES
          }), role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: assetTokenId,
            crncyTokenId: crncyTokenId,
            tag: AccountType.SPOT_15M_CANDLES
          }), role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: assetTokenId,
            crncyTokenId: crncyTokenId,
            tag: AccountType.SPOT_DAY_CANDLES
          }), role: AccountRole.WRITABLE
      },
      {
        address: await this.getInstrAccountByTag(
          {
            assetTokenId: assetTokenId,
            crncyTokenId: crncyTokenId,
            tag: AccountType.INSTR_TRACE
          }), role: AccountRole.WRITABLE
      },
    ];
    const upgradeIx = {
      accounts: keys,
      programAddress: this.programId,
      data: newInstrumentData(9, crncyTokenId, slot, args.initialPrice * 1000000000)
    };
    return [createMapsAccountIx, upgradeIx];
  }

}




