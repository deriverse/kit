import {
  Address as SolanaAddress,
  SolanaRpcApiDevnet,
  SolanaRpcApiMainnet,
  Base64EncodedDataResponse,
  Rpc,
  getBase64Encoder,
  getProgramDerivedAddress,
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
  VmInitActivateArgs,
  VmFinalizeActivateArgs,
  VmFinalizeDeactivateArgs,
  VmInitWithdrawArgs,
  VmInitWithdrawFinalizeArgs,
  VmChangeListArgs,
  VmAddWithdrawalAddressArgs,
  VmRemoveWithdrawalAddressArgs,
  VmDirectWithdrawArgs,
  KaminoReserveByMintArgs,
  GetKaminoContextArgs,
  KaminoInitTokenAccountsArgs,
  KaminoInitObligationArgs,
  KaminoInitObligationFarmsArgs,
  KaminoChangePositionArgs,
  KaminoLookupTableAddressesArgs,
  KaminoObligationExistsArgs,
  KaminoAtaExistsArgs,
  KaminoInstrumentAtasExistArgs,
  GetKaminoClientStateArgs,
  KaminoContext,
  KaminoReserveInfo,
  KaminoLookupTableAddressesResponse,
  KaminoInstrumentAtasExistResponse,
  KaminoClientStateResponse,
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
  VmInitActivateArgsSchema,
  VmFinalizeActivateArgsSchema,
  VmFinalizeDeactivateArgsSchema,
  VmInitWithdrawArgsSchema,
  VmInitWithdrawFinalizeArgsSchema,
  VmChangeListArgsSchema,
  VmAddWithdrawalAddressArgsSchema,
  VmRemoveWithdrawalAddressArgsSchema,
  VmDirectWithdrawArgsSchema,
  KaminoReserveByMintArgsSchema,
  GetKaminoContextArgsSchema,
  KaminoInitTokenAccountsArgsSchema,
  KaminoInitObligationArgsSchema,
  KaminoInitObligationFarmsArgsSchema,
  KaminoChangePositionArgsSchema,
  KaminoLookupTableAddressesArgsSchema,
  KaminoObligationExistsArgsSchema,
  KaminoAtaExistsArgsSchema,
  KaminoInstrumentAtasExistArgsSchema,
  GetKaminoClientStateArgsSchema,
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
import {
  VERSION,
  PROGRAM_ID,
  MAIN_KAMINO_MARKET,
  MARKET_DEPTH,
  dec,
  lpDec,
  feeRateStep,
  poolRatioStep,
  setDecimals,
} from '../constants';
import {
  BaseCrncyRecordModel,
  ClientPrimaryAccountHeaderModel,
  CommunityAccountHeaderModel,
  InstrAccountHeaderModel,
  LineQuotesModel,
  RootStateModel,
  TokenStateModel,
  VmFlag,
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
import { getSpotContext as getSpotContextFn, getPerpContext as getPerpContextFn } from './context-builders';
import { tokenDec } from './utils';
import {
  ClientQueryContext,
  getClientData as getClientDataFn,
  getClientSpotOrdersInfo as getClientSpotOrdersInfoFn,
  getClientPerpOrdersInfo as getClientPerpOrdersInfoFn,
  getClientSpotOrders as getClientSpotOrdersFn,
  getClientPerpOrders as getClientPerpOrdersFn,
} from './client-queries';
import {
  buildDepositInstruction,
  buildWithdrawInstruction,
  buildNewInstrumentInstructions,
  buildSwapInstruction,
  buildNewRefLinkInstruction,
} from './instructions';
import {
  buildSpotLpInstruction,
  buildNewSpotOrderInstruction,
  buildSpotQuotesReplaceInstruction,
  buildSpotOrderCancelInstruction,
  buildSpotMassCancelInstruction,
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
} from './perp-instructions';
import {
  buildVmInitActivateInstruction,
  buildVmInitActivateCancelInstruction,
  buildVmFinalizeActivateInstruction,
  buildVmInitDeactivateInstruction,
  buildVmInitDeactivateCancelInstruction,
  buildVmFinalizeDeactivateInstruction,
  buildVmInitWithdrawInstruction,
  buildVmInitWithdrawCancelInstruction,
  buildVmInitWithdrawFinalizeInstruction,
  buildVmChangeListInstruction,
  buildVmAddWithdrawalAddressInstruction,
  buildVmRemoveWithdrawalAddressInstruction,
  buildVmDirectWithdrawInstruction,
} from './vm-instructions';
import {
  buildKaminoChangePositionInstruction,
  buildKaminoContext,
  buildKaminoInitObligationFarmsInstruction,
  buildKaminoInitObligationInstruction,
  buildKaminoInitTokenAccountsInstruction,
  buildVmAddKaminoInstruction,
  buildVmRemoveKaminoInstruction,
  findKaminoReserveByMint,
  getKaminoClientState as getKaminoClientStateFn,
  kaminoAtaExists as kaminoAtaExistsFn,
  kaminoInstrumentAtasExist as kaminoInstrumentAtasExistFn,
  kaminoLookupTableAddresses as kaminoLookupTableAddressesFn,
  kaminoMarketLut as kaminoMarketLutFn,
  kaminoObligationExists as kaminoObligationExistsFn,
  loadKaminoReserve,
} from './kamino-instructions';

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
  drvsAuthority: Address;
  clientPrimaryAccount: Address | null = null;
  clientCommunityAccount: Address | null = null;
  clientVmActive: boolean = false;
  private kaminoReserveAddressesByMarketMint = new Map<string, Address>();
  private kaminoContextsByClientInstrMarket = new Map<string, KaminoContext>();

  private rpc: Rpc<SolanaRpcApiDevnet> | Rpc<SolanaRpcApiMainnet>;
  private signer: Address | null = null;
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

  private getVmInstructionContext() {
    if (this.signer === null) {
      throw new Error('Wallet is not connected');
    }
    return {
      ...this.getAccountHelperContext(),
      tokens: this.tokens,
      uiNumbers: this.uiNumbers,
      signer: this.signer,
      rootAccount: this.rootAccount,
    };
  }

  private getKaminoInstructionContext() {
    if (this.signer === null) {
      throw new Error('Wallet is not connected');
    }
    return {
      ...this.getAccountHelperContext(),
      instruments: this.instruments,
      tokens: this.tokens,
      uiNumbers: this.uiNumbers,
      signer: this.signer,
      rootAccount: this.rootAccount,
      clientPrimaryAccount: this.clientPrimaryAccount,
      clientLutAddress: this.clientLutAddress,
      clientVmActive: this.clientVmActive,
      getKaminoReserveInfoByMint: this.getCachedKaminoReserveInfoByMint.bind(this),
    };
  }

  private getKaminoServiceContext() {
    return {
      ...this.getAccountHelperContext(),
      instruments: this.instruments,
      tokens: this.tokens,
      uiNumbers: this.uiNumbers,
      signer: this.signer ?? this.programId,
      rootAccount: this.rootAccount ?? this.programId,
      clientPrimaryAccount: this.clientPrimaryAccount,
      clientLutAddress: this.clientLutAddress,
      clientVmActive: this.clientVmActive,
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
      this.clientLutAddress = clientPrimaryAccountHeaderModel.lutAddress;
      this.clientVmActive = (clientPrimaryAccountHeaderModel.vmMask & VmFlag.active) !== 0;
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
    this.kaminoReserveAddressesByMarketMint.clear();
    this.kaminoContextsByClientInstrMarket.clear();
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
    this.kaminoContextsByClientInstrMarket.clear();
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
          this.clientVmActive = (clientPrimaryAccountHeaderModel.vmMask & VmFlag.active) !== 0;
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
      this.clientLutAddress = null;
      this.clientVmActive = false;
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
    const info = await this.rpc
      .getAccountInfo(instr.address, { commitment: this.commitment, encoding: 'base64' })
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
    header.shortEmaPx /= dec;
    header.midEmaPx /= dec;
    header.longEmaPx /= dec;
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
    header.spotFeeRate *= feeRateStep;
    header.spotPoolRatio *= poolRatioStep;
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

    const existingInstr = this.instruments.get(header.instrId);

    const instrAddress = existingInstr
      ? existingInstr.address
      : await getInstrAccountByTagFn(this.getAccountHelperContext(), {
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
  // VM (VAULT MODE) INSTRUCTIONS
  // ============================================

  async vmInitActivateInstruction(args: VmInitActivateArgs): Promise<Instruction> {
    const parsed = VmInitActivateArgsSchema.parse(args);
    await this.requireClient();
    return buildVmInitActivateInstruction(this.getVmInstructionContext(), parsed);
  }

  async vmInitActivateCancelInstruction(): Promise<Instruction> {
    await this.requireClient();
    return buildVmInitActivateCancelInstruction(this.getVmInstructionContext());
  }

  async vmFinalizeActivateInstruction(args: VmFinalizeActivateArgs): Promise<Instruction> {
    const parsed = VmFinalizeActivateArgsSchema.parse(args);
    await this.requireClient();
    return buildVmFinalizeActivateInstruction(this.getVmInstructionContext(), parsed);
  }

  async vmInitDeactivateInstruction(): Promise<Instruction> {
    await this.requireClient();
    return buildVmInitDeactivateInstruction(this.getVmInstructionContext());
  }

  async vmInitDeactivateCancelInstruction(): Promise<Instruction> {
    await this.requireClient();
    return buildVmInitDeactivateCancelInstruction(this.getVmInstructionContext());
  }

  async vmFinalizeDeactivateInstruction(args: VmFinalizeDeactivateArgs): Promise<Instruction> {
    const parsed = VmFinalizeDeactivateArgsSchema.parse(args);
    await this.requireClient();
    return buildVmFinalizeDeactivateInstruction(this.getVmInstructionContext(), parsed);
  }

  async vmInitWithdrawInstruction(args: VmInitWithdrawArgs): Promise<Instruction> {
    const parsed = VmInitWithdrawArgsSchema.parse(args);
    await this.requireClient();
    return buildVmInitWithdrawInstruction(this.getVmInstructionContext(), parsed);
  }

  async vmInitWithdrawCancelInstruction(): Promise<Instruction> {
    await this.requireClient();
    return buildVmInitWithdrawCancelInstruction(this.getVmInstructionContext());
  }

  async vmInitWithdrawFinalizeInstruction(args: VmInitWithdrawFinalizeArgs): Promise<Instruction> {
    const parsed = VmInitWithdrawFinalizeArgsSchema.parse(args);
    await this.requireClient();
    return buildVmInitWithdrawFinalizeInstruction(this.getVmInstructionContext(), parsed);
  }

  async vmChangeListInstruction(args: VmChangeListArgs): Promise<Instruction> {
    const parsed = VmChangeListArgsSchema.parse(args);
    await this.requireClient();
    return buildVmChangeListInstruction(this.getVmInstructionContext(), parsed);
  }

  async vmAddWithdrawalAddressInstruction(args: VmAddWithdrawalAddressArgs): Promise<Instruction> {
    const parsed = VmAddWithdrawalAddressArgsSchema.parse(args);
    await this.requireClient();
    return buildVmAddWithdrawalAddressInstruction(this.getVmInstructionContext(), parsed);
  }

  async vmRemoveWithdrawalAddressInstruction(args: VmRemoveWithdrawalAddressArgs): Promise<Instruction> {
    const parsed = VmRemoveWithdrawalAddressArgsSchema.parse(args);
    await this.requireClient();
    return buildVmRemoveWithdrawalAddressInstruction(this.getVmInstructionContext(), parsed);
  }

  async vmDirectWithdrawInstruction(args: VmDirectWithdrawArgs): Promise<Instruction> {
    const parsed = VmDirectWithdrawArgsSchema.parse(args);
    await this.requireClient();
    return buildVmDirectWithdrawInstruction(this.getVmInstructionContext(), parsed);
  }

  // ============================================
  // KAMINO INSTRUCTIONS & SERVICES
  // ============================================

  private kaminoReserveCacheKey(args: KaminoReserveByMintArgs): string {
    return `${args.lendingMarket ?? MAIN_KAMINO_MARKET}:${args.mint}`;
  }

  private async getCachedKaminoReserveAddressByMint(args: KaminoReserveByMintArgs): Promise<Address> {
    const key = this.kaminoReserveCacheKey(args);
    const cached = this.kaminoReserveAddressesByMarketMint.get(key);
    if (cached != null) {
      return cached;
    }
    const lendingMarket = args.lendingMarket ?? MAIN_KAMINO_MARKET;
    const reserve = await findKaminoReserveByMint(this.getKaminoServiceContext(), {
      mint: args.mint,
      lendingMarket,
    });
    this.kaminoReserveAddressesByMarketMint.set(key, reserve.address);
    return reserve.address;
  }

  private async getCachedKaminoReserveInfoByMint(args: KaminoReserveByMintArgs): Promise<KaminoReserveInfo> {
    const key = this.kaminoReserveCacheKey(args);
    const cached = this.kaminoReserveAddressesByMarketMint.get(key);
    if (cached != null) {
      return loadKaminoReserve(this.getKaminoServiceContext(), cached);
    }
    const lendingMarket = args.lendingMarket ?? MAIN_KAMINO_MARKET;
    const reserve = await findKaminoReserveByMint(this.getKaminoServiceContext(), {
      mint: args.mint,
      lendingMarket,
    });
    this.kaminoReserveAddressesByMarketMint.set(key, reserve.address);
    return reserve;
  }

  async getKaminoReserveByMint(args: KaminoReserveByMintArgs): Promise<Address> {
    const parsed = KaminoReserveByMintArgsSchema.parse(args);
    return this.getCachedKaminoReserveAddressByMint(parsed);
  }

  private kaminoContextCacheKey(args: GetKaminoContextArgs): string {
    if (this.clientPrimaryAccount == null) {
      throw new Error('Client primary account not found');
    }
    return `${this.clientPrimaryAccount}:${args.instrId}:${args.lendingMarket ?? MAIN_KAMINO_MARKET}`;
  }

  async refreshKaminoContext(args: GetKaminoContextArgs): Promise<KaminoContext> {
    const parsed = GetKaminoContextArgsSchema.parse(args);
    await this.requireClient();
    const kaminoCtx = await buildKaminoContext(this.getKaminoInstructionContext(), parsed);
    this.kaminoContextsByClientInstrMarket.set(this.kaminoContextCacheKey(parsed), kaminoCtx);
    return kaminoCtx;
  }

  private async getCachedKaminoContext(args: GetKaminoContextArgs): Promise<KaminoContext> {
    await this.requireClient();
    const cached = this.kaminoContextsByClientInstrMarket.get(this.kaminoContextCacheKey(args));
    if (cached != null) {
      return cached;
    }
    return this.refreshKaminoContext(args);
  }

  async vmAddKaminoInstruction(args: VmFinalizeActivateArgs): Promise<Instruction> {
    const parsed = VmFinalizeActivateArgsSchema.parse(args);
    await this.requireClient();
    return buildVmAddKaminoInstruction(this.getKaminoInstructionContext(), parsed);
  }

  async vmRemoveKaminoInstruction(args: VmFinalizeActivateArgs): Promise<Instruction> {
    const parsed = VmFinalizeActivateArgsSchema.parse(args);
    await this.requireClient();
    return buildVmRemoveKaminoInstruction(this.getKaminoInstructionContext(), parsed);
  }

  async kaminoInitTokenAccountsInstruction(args: KaminoInitTokenAccountsArgs): Promise<Instruction> {
    const parsed = KaminoInitTokenAccountsArgsSchema.parse(args);
    const kaminoCtx = await this.getCachedKaminoContext({ instrId: parsed.instrId });
    return buildKaminoInitTokenAccountsInstruction(this.getKaminoInstructionContext(), parsed, kaminoCtx);
  }

  async kaminoInitObligationInstruction(args: KaminoInitObligationArgs): Promise<Instruction> {
    const parsed = KaminoInitObligationArgsSchema.parse(args);
    const kaminoCtx = await this.getCachedKaminoContext({
      instrId: parsed.instrId,
      lendingMarket: parsed.lendingMarket,
    });
    return buildKaminoInitObligationInstruction(this.getKaminoInstructionContext(), parsed, kaminoCtx);
  }

  async kaminoInitObligationFarmsInstruction(args: KaminoInitObligationFarmsArgs): Promise<Instruction> {
    const parsed = KaminoInitObligationFarmsArgsSchema.parse(args);
    const kaminoCtx = await this.getCachedKaminoContext({
      instrId: parsed.instrId,
      lendingMarket: parsed.lendingMarket,
    });
    return buildKaminoInitObligationFarmsInstruction(this.getKaminoInstructionContext(), parsed, kaminoCtx);
  }

  async kaminoChangePositionInstruction(args: KaminoChangePositionArgs): Promise<Instruction> {
    const parsed = KaminoChangePositionArgsSchema.parse(args);
    await this.requireClient();
    const kaminoCtx = await this.getCachedKaminoContext({
      instrId: parsed.instrId,
      lendingMarket: parsed.lendingMarket,
    });
    return buildKaminoChangePositionInstruction(this.getKaminoInstructionContext(), parsed, kaminoCtx);
  }

  kaminoMarketLut(lendingMarket?: Address): Address | null {
    return kaminoMarketLutFn(lendingMarket);
  }

  async kaminoLookupTableAddresses(args: KaminoLookupTableAddressesArgs): Promise<KaminoLookupTableAddressesResponse> {
    const parsed = KaminoLookupTableAddressesArgsSchema.parse(args);
    const kaminoCtx = await this.getCachedKaminoContext({
      instrId: parsed.instrId,
      lendingMarket: parsed.lendingMarket,
    });
    return kaminoLookupTableAddressesFn(this.getKaminoInstructionContext(), parsed, kaminoCtx);
  }

  async kaminoObligationExists(args: KaminoObligationExistsArgs): Promise<boolean> {
    const parsed = KaminoObligationExistsArgsSchema.parse(args);
    await this.requireClient();
    return kaminoObligationExistsFn(this.getKaminoInstructionContext(), parsed);
  }

  async kaminoAtaExists(args: KaminoAtaExistsArgs): Promise<boolean> {
    const parsed = KaminoAtaExistsArgsSchema.parse(args);
    await this.requireClient();
    return kaminoAtaExistsFn(this.getKaminoInstructionContext(), parsed);
  }

  async kaminoInstrumentAtasExist(args: KaminoInstrumentAtasExistArgs): Promise<KaminoInstrumentAtasExistResponse> {
    const parsed = KaminoInstrumentAtasExistArgsSchema.parse(args);
    await this.requireClient();
    return kaminoInstrumentAtasExistFn(this.getKaminoInstructionContext(), parsed);
  }

  async getKaminoClientState(args: GetKaminoClientStateArgs): Promise<KaminoClientStateResponse> {
    const parsed = GetKaminoClientStateArgsSchema.parse(args);
    const kaminoCtx = await this.refreshKaminoContext({
      instrId: parsed.instrId,
      lendingMarket: parsed.lendingMarket,
    });
    return getKaminoClientStateFn(this.getKaminoInstructionContext(), parsed, kaminoCtx);
  }

  async getCachedKaminoClientState(args: GetKaminoClientStateArgs): Promise<KaminoClientStateResponse> {
    const parsed = GetKaminoClientStateArgsSchema.parse(args);
    const kaminoCtx = await this.getCachedKaminoContext({
      instrId: parsed.instrId,
      lendingMarket: parsed.lendingMarket,
    });
    return getKaminoClientStateFn(this.getKaminoInstructionContext(), parsed, kaminoCtx);
  }

  // ============================================
  // NEW INSTRUMENT INSTRUCTIONS
  // ============================================

  async newInstrumentInstructions(args: NewInstrumentArgs): Promise<Instruction[]> {
    const parsed = NewInstrumentArgsSchema.parse(args);
    return buildNewInstrumentInstructions(
      this.getPerpInstructionContext(),
      parsed,
      () => this.rpc.getSlot().send(),
      (address) => this.rpc.getAccountInfo(address).send(),
      (size) => this.rpc.getMinimumBalanceForRentExemption(size).send(),
    );
  }
}
