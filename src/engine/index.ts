import {
  Address as SolanaAddress,
  SolanaRpcApiDevnet,
  SolanaRpcApiMainnet,
  Base64EncodedDataResponse,
  Rpc,
  getBase64Encoder,
  getProgramDerivedAddress,
  getAddressEncoder,
  Commitment,
} from '@solana/kit';
import { Buffer } from 'buffer';

import {
  Instrument,
  CommunityData,
  GetClientSpotOrdersInfoResponse,
  GetClientSpotOrdersArgs,
  GetClientSpotOrdersResponse,
  GetClientPerpOrdersInfoResponse,
  GetClientPerpOrdersArgs,
  GetClientPerpOrdersResponse,
  GetClientDataResponse,
  GetClientSpotOrdersInfoArgs,
  GetClientPerpOrdersInfoArgs,
  getInstrAccountByTagArgs,
  SpotLpArgs,
  NewSpotOrderArgs,
  DepositArgs,
  WithdrawArgs,
  SpotQuotesReplaceArgs,
  SpotOrderCancelArgs,
  SpotMassCancelArgs,
  InstrId,
  PerpDepositArgs,
  NewPerpOrderArgs,
  PerpQuotesReplaceArgs,
  PerpOrderCancelArgs,
  PerpMassCancelArgs,
  PerpChangeLeverageArgs,
  PerpStatisticsResetArgs,
  NewInstrumentArgs,
  PerpBuySeatArgs,
  SwapArgs,
  PerpSellSeatArgs,
  LogMessage,
  DepositArgsSchema,
  WithdrawArgsSchema,
  NewSpotOrderArgsSchema,
  SpotQuotesReplaceArgsSchema,
  SwapArgsSchema,
  SpotOrderCancelArgsSchema,
  SpotMassCancelArgsSchema,
  SpotLpArgsSchema,
  PerpDepositArgsSchema,
  PerpBuySeatArgsSchema,
  PerpSellSeatArgsSchema,
  NewPerpOrderArgsSchema,
  PerpQuotesReplaceArgsSchema,
  PerpOrderCancelArgsSchema,
  PerpMassCancelArgsSchema,
  PerpChangeLeverageArgsSchema,
  PerpStatisticsResetArgsSchema,
  NewInstrumentArgsSchema,
  InstrIdSchema,
  GetClientSpotOrdersInfoArgsSchema,
  GetClientPerpOrdersInfoArgsSchema,
  GetClientSpotOrdersArgsSchema,
  GetClientPerpOrdersArgsSchema,
  EngineArgsSchema,
  AccountMeta,
  Instruction,
} from '../types';
import { AccountType } from '../types/enums';
import { VERSION, PROGRAM_ID, MARKET_DEPTH, dec, lpDec, setDecimals } from '../constants';
import {
  BaseCrncyRecordModel,
  ClientPrimaryAccountHeaderModel,
  CommunityAccountHeaderModel,
  InstrAccountHeaderModel,
  LineQuotesModel,
  RootStateModel,
  TokenStateModel,
} from '../structure_models';

import { decodeTransactionLogs } from './logs-decoder';
import {
  getAccountByTag as getAccountByTagFn,
  getInstrAccountByTag as getInstrAccountByTagFn,
  getTokenAccount as getTokenAccountFn,
  getTokenId as getTokenIdFn,
  getInstrId as getInstrIdFn,
  findAccountsByTag,
  findClientPrimaryAccount,
  findClientCommunityAccount,
  AccountHelperContext,
} from './account-helpers';
import {
  getSpotContext as getSpotContextFn,
  getPerpContext as getPerpContextFn,
  getSpotCandles as getSpotCandlesFn,
} from './context-builders';
import { tokenDec } from './utils';
import {
  ClientQueryContext,
  getClientData as getClientDataFn,
  getClientSpotOrdersInfo as getClientSpotOrdersInfoFn,
  getClientPerpOrdersInfo as getClientPerpOrdersInfoFn,
  getClientSpotOrders as getClientSpotOrdersFn,
  getClientPerpOrders as getClientPerpOrdersFn,
} from './client-queries';
import { buildDepositInstruction, buildWithdrawInstruction } from './instructions';
import {
  buildSpotLpInstruction,
  buildNewSpotOrderInstruction,
  buildSpotQuotesReplaceInstruction,
  buildSpotOrderCancelInstruction,
  buildSpotMassCancelInstruction,
  buildSwapInstruction,
} from './spot-instructions';
import {
  buildUpgradeToPerpInstructions,
  buildPerpDepositInstruction,
  buildPerpBuySeatInstruction,
  buildPerpSellSeatInstruction,
  buildNewPerpOrderInstruction,
  buildPerpQuotesReplaceInstruction,
  buildPerpOrderCancelInstruction,
  buildPerpMassCancelInstruction,
  buildPerpChangeLeverageInstruction,
  buildPerpStatisticsResetInstruction,
  buildNewRefLinkInstruction,
  buildNewInstrumentInstructions,
} from './perp-instructions';

type Address = SolanaAddress<string>;

/**
 * Main class to operate with Deriverse
 * @property {number} originalClientId Deriverse main client ID
 * @property {AddressLookupTableAccount} lut Root address lookup table account
 * @property {AddressLookupTableAccount} clientLut Client address lookup table account
 * @property {Map<number, Token>} tokens Tokens data
 * @property {Map<number, Instrument>} instruments Instruments data
 */
export class Engine {
  programId: Address;
  rootAccount: Address;
  communityAccount: Address;
  commitment: Commitment;
  version: number;
  rootStateModel!: RootStateModel;
  community!: CommunityData;
  tokens!: Map<number, TokenStateModel>;
  instruments!: Map<number, Instrument>;
  originalClientId: number | null = null;
  clientLutAddress: Address | null = null;
  privateMode: boolean = false;

  private rpc: Rpc<SolanaRpcApiDevnet> | Rpc<SolanaRpcApiMainnet>;
  private drvsAuthority: Address;
  private signer: Address | null = null;
  private clientPrimaryAccount: Address | null = null;
  private clientCommunityAccount: Address | null = null;
  private refClientPrimaryAccount: Address | null = null;
  private refClientCommunityAccount: Address | null = null;
  private uiNumbers: boolean;

  /**
   * @param rpc @solana/kit rpc
   */
  constructor(
    rpc: Rpc<SolanaRpcApiDevnet> | Rpc<SolanaRpcApiMainnet>,
    args?: {
      programId?: Address;
      version?: number;
      commitment?: Commitment;
      uiNumbers?: boolean;
    },
  ) {
    if (args) EngineArgsSchema.parse(args);
    this.rpc = rpc;
    this.programId = args?.programId ?? PROGRAM_ID;
    this.version = args?.version ?? VERSION;
    this.commitment = args?.commitment ?? 'confirmed';
    this.uiNumbers = args?.uiNumbers ?? true;

    setDecimals(this.uiNumbers);
  }

  // ============================================
  // CONTEXT HELPERS (internal)
  // ============================================

  private getAccountHelperContext(): AccountHelperContext {
    return {
      rpc: this.rpc,
      programId: this.programId,
      version: this.version,
      commitment: this.commitment,
      drvsAuthority: this.drvsAuthority,
    };
  }

  private getSpotInstructionContext() {
    if (this.signer === null) {
      throw new Error('Wallet is not connected');
    }
    if (this.clientPrimaryAccount === null) {
      throw new Error('Client primary account not found');
    }
    if (this.clientCommunityAccount === null) {
      throw new Error('Client community account not found');
    }
    return {
      ...this.getAccountHelperContext(),
      instruments: this.instruments,
      tokens: this.tokens,
      uiNumbers: this.uiNumbers,
      signer: this.signer,
      rootAccount: this.rootAccount,
      clientPrimaryAccount: this.clientPrimaryAccount,
      clientCommunityAccount: this.clientCommunityAccount,
      refClientPrimaryAccount: this.refClientPrimaryAccount,
      refClientCommunityAccount: this.refClientCommunityAccount,
      privateMode: this.privateMode,
    };
  }

  private getPerpInstructionContext() {
    return {
      ...this.getSpotInstructionContext(),
      rootStateModel: this.rootStateModel,
    };
  }

  private getClientQueryContext(): ClientQueryContext {
    return {
      ...this.getAccountHelperContext(),
      instruments: this.instruments,
      tokens: this.tokens,
      uiNumbers: this.uiNumbers,
      clientPrimaryAccount: this.clientPrimaryAccount,
      clientCommunityAccount: this.clientCommunityAccount,
      originalClientId: this.originalClientId,
    };
  }

  private async requireClient(): Promise<void> {
    if (!(await this.checkClient())) {
      throw new Error('Client account not found');
    }
  }

  private requireInstrument(instrId: number): Instrument {
    const instr = this.instruments.get(instrId);
    if (instr === undefined) {
      throw new Error('Instrument not found');
    }
    return instr;
  }

  private async getSpotInstrumentWithUpdate(instrId: number): Promise<Instrument> {
    let instr = this.instruments.get(instrId);
    if (instr?.header.mapsAddress == undefined) {
      await this.updateInstrData({ instrId });
      instr = this.requireInstrument(instrId);
    }
    return instr;
  }

  private async getPerpInstrumentWithUpdate(instrId: number): Promise<Instrument> {
    let instr = this.instruments.get(instrId);
    if (instr?.header.perpMapsAddress == undefined) {
      await this.updateInstrData({ instrId });
      instr = this.requireInstrument(instrId);
    }
    return instr;
  }

  private async checkClient(): Promise<boolean> {
    if (this.signer === null) {
      throw new Error('Wallet not connected');
    }
    if (this.clientPrimaryAccount != null) {
      return true;
    }
    const clientPrimaryAccount = await findClientPrimaryAccount(
      { programId: this.programId, version: this.version },
      this.signer,
    );
    try {
      const info = await this.rpc
        .getAccountInfo(clientPrimaryAccount, { commitment: this.commitment, encoding: 'base64' })
        .send();
      if (info.value == null) {
        return false;
      }
      const clientPrimaryAccountHeaderModel = ClientPrimaryAccountHeaderModel.fromBuffer(info.value.data);
      this.clientPrimaryAccount = clientPrimaryAccount;
      this.clientCommunityAccount = await findClientCommunityAccount(
        { programId: this.programId, version: this.version },
        this.signer,
      );
      this.originalClientId = clientPrimaryAccountHeaderModel.id;
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  // ============================================
  // LOGS DECODING
  // ============================================

  logsDecode(data: readonly string[]): LogMessage[] {
    return decodeTransactionLogs(data, {
      instruments: this.instruments,
      tokens: this.tokens,
      uiNumbers: this.uiNumbers,
    });
  }

  // ============================================
  // INITIALIZATION METHODS
  // ============================================

  async initialize(): Promise<boolean> {
    try {
      this.drvsAuthority = (await getProgramDerivedAddress({ programAddress: this.programId, seeds: ['ndxnt'] }))[0];
      const ctx = this.getAccountHelperContext();
      this.rootAccount = await getAccountByTagFn(ctx, AccountType.ROOT);
      this.communityAccount = await getAccountByTagFn(ctx, AccountType.COMMUNITY);
      const infos = await this.rpc
        .getMultipleAccounts([this.rootAccount, this.communityAccount], {
          commitment: this.commitment,
          encoding: 'base64',
        })
        .send();
      if (infos.value == null || infos.value[0] == null || infos.value[1] == null) {
        throw new Error('Initialization failed: getMultipleAccountsInfo');
      }
      this.rootStateModel = RootStateModel.fromBuffer(infos.value[0].data);
      this.tokens = new Map();
      this.instruments = new Map();
      this.privateMode = (this.rootStateModel.mask & 1) != 0;
      const tokenAccounts = await findAccountsByTag(ctx, AccountType.TOKEN);
      tokenAccounts.forEach((t) => {
        let tokenStateModel = TokenStateModel.fromBuffer(t.account.data);
        this.tokens.set(tokenStateModel.id, tokenStateModel);
      });
      const instrAccounts = await findAccountsByTag(ctx, AccountType.INSTR, {
        offset: 8,
        length: 16,
      });
      instrAccounts.forEach((response) => {
        const buffer = Buffer.from(getBase64Encoder().encode(response.account.data[0]));
        let instrAccountHeaderModel = new InstrAccountHeaderModel();
        instrAccountHeaderModel.instrId = buffer.readUint32LE(0);
        instrAccountHeaderModel.assetTokenId = buffer.readUint32LE(4);
        instrAccountHeaderModel.crncyTokenId = buffer.readUint32LE(8);
        instrAccountHeaderModel.mask = buffer.readUint32LE(12);
        this.instruments.set(instrAccountHeaderModel.instrId, {
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
    } catch (err) {
      console.error('Initialization failed:', err);
      return false;
    }
  }

  async addToken(tokenAccount: Address) {
    const info = await this.rpc
      .getAccountInfo(tokenAccount, { commitment: this.commitment, encoding: 'base64' })
      .send();
    if (info.value == null) {
      throw new Error('Add Token Failed: getAccountInfo');
    }
    const tokenStateModel = TokenStateModel.fromBuffer(info.value.data);
    if (
      tokenStateModel.id > this.rootStateModel.tokensCount ||
      tokenStateModel.tag != AccountType.TOKEN ||
      tokenStateModel.version != this.version
    ) {
      throw new Error('Invalid Token Account');
    }
    this.tokens.set(tokenStateModel.id, tokenStateModel);
  }

  async addInstr(instrAccount: Address) {
    const info = await this.rpc
      .getAccountInfo(instrAccount, { commitment: this.commitment, encoding: 'base64' })
      .send();
    if (info.value == null) {
      throw new Error('Add Instrument Failed: getAccountInfo');
    }
    const instrAccountHeaderModel = InstrAccountHeaderModel.fromBuffer(info.value.data);
    if (
      instrAccountHeaderModel.instrId > this.rootStateModel.instrCount ||
      instrAccountHeaderModel.tag != AccountType.INSTR ||
      instrAccountHeaderModel.version != this.version
    ) {
      throw new Error('Invalid Instrument Account');
    }
    this.instruments.set(instrAccountHeaderModel.instrId, {
      address: instrAccount,
      header: instrAccountHeaderModel,
      spotBids: [],
      spotAsks: [],
      perpBids: [],
      perpAsks: [],
    });
  }

  async setSigner(signer: Address) {
    this.signer = signer;
    const clientPrimaryAccount = await findClientPrimaryAccount(
      { programId: this.programId, version: this.version },
      signer,
    );
    let exists = false;
    try {
      const info = await this.rpc
        .getAccountInfo(clientPrimaryAccount, { commitment: this.commitment, encoding: 'base64' })
        .send();
      if (info.value) {
        const clientPrimaryAccountHeaderModel = ClientPrimaryAccountHeaderModel.fromBuffer(info.value.data);
        if (clientPrimaryAccountHeaderModel.walletAddress == signer) {
          this.clientPrimaryAccount = clientPrimaryAccount;
          this.clientCommunityAccount = await findClientCommunityAccount(
            { programId: this.programId, version: this.version },
            signer,
          );
          this.originalClientId = clientPrimaryAccountHeaderModel.id;
          this.clientLutAddress = clientPrimaryAccountHeaderModel.lutAddress;
          let date = Math.floor(new Date().valueOf() / 1000);
          if (date < clientPrimaryAccountHeaderModel.refProgramExpiration) {
            this.refClientPrimaryAccount = clientPrimaryAccountHeaderModel.refAddress;
            if (!this.refClientPrimaryAccount) throw new Error('Ref client account address not found');
            let refInfo = await this.rpc
              .getAccountInfo(this.refClientPrimaryAccount, {
                commitment: this.commitment,
                encoding: 'base64',
              })
              .send();
            if (refInfo.value == null) throw new Error('Ref client account not found');
            const refClientPrimaryAccountHeaderModel = ClientPrimaryAccountHeaderModel.fromBuffer(refInfo.value.data);
            this.refClientCommunityAccount = await findClientCommunityAccount(
              { programId: this.programId, version: this.version },
              refClientPrimaryAccountHeaderModel.walletAddress,
            );
          }
          exists = true;
        }
      }
    } catch (err) {
      console.error(err);
      throw new Error('Wallet connection failed');
    }
    if (!exists) {
      this.clientPrimaryAccount = null;
      this.originalClientId = null;
    }
  }

  // ============================================
  // ACCOUNT & STATE UPDATE METHODS
  // ============================================

  updateCommunityFromBuffer(data: Base64EncodedDataResponse) {
    let baseCrncyRecords = new Map();
    let communityAccountHeaderModel = CommunityAccountHeaderModel.fromBuffer(data);
    const drvsDec = tokenDec(this.tokens, 0, this.uiNumbers);
    communityAccountHeaderModel.prevVotingSupply /= drvsDec;
    communityAccountHeaderModel.votingSupply /= drvsDec;
    communityAccountHeaderModel.drvsTokens /= drvsDec;
    for (let i = 0; i < communityAccountHeaderModel.count; ++i) {
      let record = BaseCrncyRecordModel.fromBuffer(
        data,
        CommunityAccountHeaderModel.LENGTH + i * BaseCrncyRecordModel.LENGTH,
      );
      record.funds /= tokenDec(this.tokens, record.crncyTokenId, this.uiNumbers);
      baseCrncyRecords.set(record.crncyTokenId, record);
    }
    this.community = {
      header: communityAccountHeaderModel,
      data: baseCrncyRecords,
    };
  }

  async updateCommunity() {
    const info = await this.rpc
      .getAccountInfo(this.communityAccount, { commitment: this.commitment, encoding: 'base64' })
      .send();
    if (info.value == null) {
      throw new Error('Community Account: GetAccountInfo Failed');
    }
    this.updateCommunityFromBuffer(info.value.data);
  }

  updateRootFromBuffer(data: Base64EncodedDataResponse) {
    this.rootStateModel = RootStateModel.fromBuffer(data);
  }

  async updateRoot() {
    const info = await this.rpc
      .getAccountInfo(this.rootAccount, { commitment: this.commitment, encoding: 'base64' })
      .send();
    if (info.value == null) {
      throw new Error('Root Account: GetAccountInfo Failed');
    }
    this.updateRootFromBuffer(info.value.data);
  }

  async getInstrAccountByTag(args: getInstrAccountByTagArgs): Promise<Address> {
    return getInstrAccountByTagFn(this.getAccountHelperContext(), args);
  }

  async getAccountByTag(tag: number): Promise<Address> {
    return getAccountByTagFn(this.getAccountHelperContext(), tag);
  }

  async getTokenAccount(mint: Address): Promise<Address> {
    return getTokenAccountFn(this.getAccountHelperContext(), mint);
  }

  async getTokenId(mint: Address): Promise<number | null> {
    return getTokenIdFn(this.getAccountHelperContext(), mint);
  }

  async getInstrId(args: { assetTokenId: number; crncyTokenId: number }): Promise<number | null> {
    return getInstrIdFn(this.getAccountHelperContext(), args);
  }

  instrLut(args: InstrId): Address {
    return this.requireInstrument(args.instrId).header.lutAddress;
  }

  async updateInstrData(args: InstrId) {
    const instr = this.instruments.get(args.instrId);
    if (!instr) {
      throw new Error('Instrument not found!');
    }
    const ctx = this.getAccountHelperContext();
    let instrAccount = await getInstrAccountByTagFn(ctx, {
      assetTokenId: instr.header.assetTokenId,
      crncyTokenId: instr.header.crncyTokenId,
      tag: AccountType.INSTR,
    });
    const info = await this.rpc
      .getAccountInfo(instrAccount, { commitment: this.commitment, encoding: 'base64' })
      .send();

    if (info.value == null) {
      throw new Error('updateInstrData: getAccountInfo failed');
    }
    await this.updateInstrDataFromBuffer(info.value.data);
  }

  async updateInstrDataFromBuffer(data: Base64EncodedDataResponse) {
    let header = InstrAccountHeaderModel.fromBuffer(data);
    header.ps /= lpDec;
    const assetTokenDec = tokenDec(this.tokens, header.assetTokenId, this.uiNumbers);
    const crncyTokenDec = tokenDec(this.tokens, header.crncyTokenId, this.uiNumbers);
    header.assetTokens /= assetTokenDec;
    header.crncyTokens /= crncyTokenDec;
    header.protocolFees /= crncyTokenDec;
    header.lastAssetTokens /= assetTokenDec;
    header.lastCrncyTokens /= crncyTokenDec;
    header.dayAssetTokens /= assetTokenDec;
    header.dayCrncyTokens /= crncyTokenDec;
    header.prevDayAssetTokens /= assetTokenDec;
    header.prevDayCrncyTokens /= crncyTokenDec;
    header.perpLastTradeAssetTokens /= assetTokenDec;
    header.perpLastTradeCrncyTokens /= crncyTokenDec;
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
    header.perpLongSpotPriceForWithdrowal /= dec;
    header.perpShortSpotPriceForWithdrowal /= dec;
    header.poolFees /= crncyTokenDec;
    header.lastTradeAssetTokens /= assetTokenDec;
    header.lastTradeCrncyTokens /= crncyTokenDec;
    header.alltimeAssetTokens /= assetTokenDec;
    header.alltimeCrncyTokens /= crncyTokenDec;
    header.perpAlltimeAssetTokens /= assetTokenDec;
    header.perpAlltimeCrncyTokens /= crncyTokenDec;
    header.lpDayFees /= crncyTokenDec;
    header.lpPrevDayFees /= crncyTokenDec;
    header.lpAlltimeFees /= crncyTokenDec;
    header.emaPx /= dec;
    let spotBids: Array<LineQuotesModel> = [];
    let spotAsks: Array<LineQuotesModel> = [];
    let perpBids: Array<LineQuotesModel> = [];
    let perpAsks: Array<LineQuotesModel> = [];
    for (let i = 0; i < MARKET_DEPTH; ++i) {
      const offset = InstrAccountHeaderModel.LENGTH + i * 16;
      let line = LineQuotesModel.fromBuffer(data, offset);
      if (line.px == 0) {
        break;
      }
      line.px /= dec;
      line.qty /= assetTokenDec;
      spotBids.push(line);
    }
    for (let i = 0; i < MARKET_DEPTH; ++i) {
      const offset = InstrAccountHeaderModel.LENGTH + i * 16 + 16 * MARKET_DEPTH;
      let line = LineQuotesModel.fromBuffer(data, offset);
      if (line.px == 0) {
        break;
      }
      line.px /= dec;
      line.qty /= assetTokenDec;
      spotAsks.push(line);
    }
    for (let i = 0; i < MARKET_DEPTH; ++i) {
      const offset = InstrAccountHeaderModel.LENGTH + i * 16 + 16 * MARKET_DEPTH * 2;
      let line = LineQuotesModel.fromBuffer(data, offset);
      if (line.px == 0) {
        break;
      }
      line.px /= dec;
      line.qty /= assetTokenDec;
      perpBids.push(line);
    }
    for (let i = 0; i < MARKET_DEPTH; ++i) {
      const offset = InstrAccountHeaderModel.LENGTH + i * 16 + 16 * MARKET_DEPTH * 3;
      let line = LineQuotesModel.fromBuffer(data, offset);
      if (line.px == 0) {
        break;
      }
      line.px /= dec;
      line.qty /= assetTokenDec;
      perpAsks.push(line);
    }

    const ctx = this.getAccountHelperContext();
    
    const instrAddress = await getInstrAccountByTagFn(ctx, {
      assetTokenId: header.assetTokenId,
      crncyTokenId: header.crncyTokenId,
      tag: AccountType.INSTR,
    });
    
    this.instruments.set(header.instrId, {
      address: instrAddress,
      header: header,
      spotBids: spotBids,
      spotAsks: spotAsks,
      perpBids: perpBids,
      perpAsks: perpAsks,
    });
  }

  // ============================================
  // CONTEXT BUILDER METHODS
  // ============================================

  async getSpotContext(instrAccountHeaderModel: InstrAccountHeaderModel): Promise<AccountMeta[]> {
    return getSpotContextFn(this.getAccountHelperContext(), instrAccountHeaderModel);
  }

  async getPerpContext(instrAccountHeaderModel: InstrAccountHeaderModel): Promise<AccountMeta[]> {
    return getPerpContextFn(this.getAccountHelperContext(), instrAccountHeaderModel);
  }

  async getSpotCandles(instrAccountHeaderModel: InstrAccountHeaderModel): Promise<AccountMeta[]> {
    return getSpotCandlesFn(this.getAccountHelperContext(), instrAccountHeaderModel);
  }

  // ============================================
  // CLIENT DATA QUERY METHODS
  // ============================================

  async getClientData(): Promise<GetClientDataResponse> {
    await this.requireClient();
    return getClientDataFn(this.getClientQueryContext());
  }

  async getClientSpotOrdersInfo(args: GetClientSpotOrdersInfoArgs): Promise<GetClientSpotOrdersInfoResponse> {
    GetClientSpotOrdersInfoArgsSchema.parse(args);
    return getClientSpotOrdersInfoFn(this.getClientQueryContext(), args);
  }

  async getClientPerpOrdersInfo(args: GetClientPerpOrdersInfoArgs): Promise<GetClientPerpOrdersInfoResponse> {
    GetClientPerpOrdersInfoArgsSchema.parse(args);
    return getClientPerpOrdersInfoFn(this.getClientQueryContext(), args);
  }

  async getClientSpotOrders(args: GetClientSpotOrdersArgs): Promise<GetClientSpotOrdersResponse> {
    GetClientSpotOrdersArgsSchema.parse(args);
    return getClientSpotOrdersFn(this.getClientQueryContext(), args);
  }

  async getClientPerpOrders(args: GetClientPerpOrdersArgs): Promise<GetClientPerpOrdersResponse> {
    GetClientPerpOrdersArgsSchema.parse(args);
    return getClientPerpOrdersFn(this.getClientQueryContext(), args);
  }

  // ============================================
  // DEPOSIT & WITHDRAW INSTRUCTIONS
  // ============================================

  async depositInstruction(args: DepositArgs): Promise<Instruction> {
    DepositArgsSchema.parse(args);
    const exists = await this.checkClient();
    return buildDepositInstruction(this.getSpotInstructionContext(), args, exists, () => this.rpc.getSlot().send());
  }

  async withdrawInstruction(args: WithdrawArgs): Promise<Instruction> {
    WithdrawArgsSchema.parse(args);
    await this.requireClient();
    return buildWithdrawInstruction(this.getSpotInstructionContext(), args);
  }

  // ============================================
  // SPOT TRADING INSTRUCTIONS
  // ============================================

  async spotLpInstruction(args: SpotLpArgs): Promise<Instruction> {
    SpotLpArgsSchema.parse(args);
    await this.requireClient();
    await this.updateInstrData({ instrId: args.instrId });
    const instr = this.requireInstrument(args.instrId);
    return buildSpotLpInstruction(this.getSpotInstructionContext(), args, instr);
  }

  async newSpotOrderInstruction(args: NewSpotOrderArgs): Promise<Instruction> {
    NewSpotOrderArgsSchema.parse(args);
    await this.requireClient();
    const instr = await this.getSpotInstrumentWithUpdate(args.instrId);
    return buildNewSpotOrderInstruction(this.getSpotInstructionContext(), args, instr);
  }

  async spotQuotesReplaceInstruction(args: SpotQuotesReplaceArgs): Promise<Instruction> {
    SpotQuotesReplaceArgsSchema.parse(args);
    await this.requireClient();
    const instr = await this.getSpotInstrumentWithUpdate(args.instrId);
    return buildSpotQuotesReplaceInstruction(this.getSpotInstructionContext(), args, instr);
  }

  async spotOrderCancelInstruction(args: SpotOrderCancelArgs): Promise<Instruction> {
    SpotOrderCancelArgsSchema.parse(args);
    await this.requireClient();
    const instr = await this.getSpotInstrumentWithUpdate(args.instrId);
    return buildSpotOrderCancelInstruction(this.getSpotInstructionContext(), args, instr);
  }

  async spotMassCancelInstruction(args: SpotMassCancelArgs): Promise<Instruction> {
    SpotMassCancelArgsSchema.parse(args);
    await this.requireClient();
    const instr = await this.getSpotInstrumentWithUpdate(args.instrId);
    return buildSpotMassCancelInstruction(this.getSpotInstructionContext(), args, instr);
  }

  async swapInstruction(args: SwapArgs): Promise<Instruction> {
    SwapArgsSchema.parse(args);
    const assetTokenId = await this.getTokenId(args.assetMint);
    const crncyTokenId = await this.getTokenId(args.crncyMint);
    if (assetTokenId === null) {
      throw new Error('Asset token not found!');
    }
    if (crncyTokenId === null) {
      throw new Error('Crncy token not found!');
    }
    const instrId = await this.getInstrId({ assetTokenId, crncyTokenId });
    if (instrId === null) {
      throw new Error('Instruction not found!');
    }
    const instr = await this.getSpotInstrumentWithUpdate(instrId);
    return buildSwapInstruction(this.getSpotInstructionContext(), args, instr);
  }

  // ============================================
  // PERP TRADING INSTRUCTIONS
  // ============================================

  async upgradeToPerpInstructions(args: InstrId): Promise<Instruction[]> {
    InstrIdSchema.parse(args);
    if (this.signer == null) {
      throw new Error('Wallet is not connected');
    }
    if (this.instruments.get(args.instrId) == null) {
      throw new Error('Invalid Instr ID');
    }
    await this.updateInstrData({ instrId: args.instrId });
    const instr = this.requireInstrument(args.instrId);
    return buildUpgradeToPerpInstructions(this.getPerpInstructionContext(), args, instr, (size) =>
      this.rpc.getMinimumBalanceForRentExemption(size).send(),
    );
  }

  async perpDepositInstruction(args: PerpDepositArgs): Promise<Instruction> {
    PerpDepositArgsSchema.parse(args);
    await this.requireClient();
    const instr = await this.getPerpInstrumentWithUpdate(args.instrId);
    return buildPerpDepositInstruction(this.getPerpInstructionContext(), args, instr);
  }

  async perpBuySeatInstruction(args: PerpBuySeatArgs): Promise<Instruction> {
    PerpBuySeatArgsSchema.parse(args);
    await this.requireClient();
    await this.updateInstrData({ instrId: args.instrId });
    const instr = this.requireInstrument(args.instrId);
    return buildPerpBuySeatInstruction(this.getPerpInstructionContext(), args, instr);
  }

  async perpSellSeatInstruction(args: PerpSellSeatArgs): Promise<Instruction> {
    PerpSellSeatArgsSchema.parse(args);
    await this.requireClient();
    await this.updateInstrData({ instrId: args.instrId });
    const instr = this.requireInstrument(args.instrId);
    return buildPerpSellSeatInstruction(this.getPerpInstructionContext(), args, instr);
  }

  async newPerpOrderInstruction(args: NewPerpOrderArgs): Promise<Instruction> {
    NewPerpOrderArgsSchema.parse(args);
    await this.requireClient();
    const instr = await this.getPerpInstrumentWithUpdate(args.instrId);
    return buildNewPerpOrderInstruction(this.getPerpInstructionContext(), args, instr);
  }

  async perpQuotesReplaceInstruction(args: PerpQuotesReplaceArgs): Promise<Instruction> {
    PerpQuotesReplaceArgsSchema.parse(args);
    await this.requireClient();
    const instr = await this.getPerpInstrumentWithUpdate(args.instrId);
    return buildPerpQuotesReplaceInstruction(this.getPerpInstructionContext(), args, instr);
  }

  async perpOrderCancelInstruction(args: PerpOrderCancelArgs): Promise<Instruction> {
    PerpOrderCancelArgsSchema.parse(args);
    await this.requireClient();
    const instr = await this.getPerpInstrumentWithUpdate(args.instrId);
    return buildPerpOrderCancelInstruction(this.getPerpInstructionContext(), args, instr);
  }

  async perpMassCancelInstruction(args: PerpMassCancelArgs): Promise<Instruction> {
    PerpMassCancelArgsSchema.parse(args);
    await this.requireClient();
    const instr = await this.getPerpInstrumentWithUpdate(args.instrId);
    return buildPerpMassCancelInstruction(this.getPerpInstructionContext(), args, instr);
  }

  async newRefLinkInstruction(): Promise<Instruction> {
    await this.requireClient();
    return buildNewRefLinkInstruction(this.getPerpInstructionContext());
  }

  async perpChangeLeverageInstruction(args: PerpChangeLeverageArgs): Promise<Instruction> {
    PerpChangeLeverageArgsSchema.parse(args);
    await this.requireClient();
    const instr = await this.getPerpInstrumentWithUpdate(args.instrId);
    return buildPerpChangeLeverageInstruction(this.getPerpInstructionContext(), args, instr);
  }

  async perpStatisticsResetInstruction(args: PerpStatisticsResetArgs): Promise<Instruction> {
    PerpStatisticsResetArgsSchema.parse(args);
    await this.requireClient();
    const instr = await this.getPerpInstrumentWithUpdate(args.instrId);
    return buildPerpStatisticsResetInstruction(this.getPerpInstructionContext(), args, instr);
  }

  // ============================================
  // NEW INSTRUMENT INSTRUCTIONS
  // ============================================

  async newInstrumentInstructions(args: NewInstrumentArgs): Promise<Instruction[]> {
    NewInstrumentArgsSchema.parse(args);
    if (this.signer == null) {
      throw new Error('Wallet is not connected');
    }
    return buildNewInstrumentInstructions(
      this.getPerpInstructionContext(),
      args,
      () => this.rpc.getSlot().send(),
      (address) => this.rpc.getAccountInfo(address).send(),
      (size) => this.rpc.getMinimumBalanceForRentExemption(size).send(),
    );
  }
}
