import { AutoBuffer } from './auto_buffer';

export enum LogType {
  deposit = 1,
  withdraw = 2,
  perpDeposit = 3,
  perpWithdraw = 4,
  feesDeposit = 5,
  feesWithdraw = 6,
  spotLpTrade = 7,
  earnings = 8,
  drvsAirdrop = 9,
  spotPlaceOrder = 10,
  spotFillOrder = 11,
  spotNewOrder = 12,
  spotOrderCancel = 13,
  spotOrderRevoke = 14,
  spotFees = 15,
  spotPlaceMassCancel = 16,
  spotMassCancel = 17,
  perpPlaceOrder = 18,
  perpFillOrder = 19,
  perpNewOrder = 20,
  perpOrderCancel = 21,
  perpOrderRevoke = 22,
  perpFees = 23,
  perpFunding = 24,
  perpPlaceMassCancel = 25,
  perpMassCancel = 26,
  perpSocLoss = 27,
  perpChangeLeverage = 28,
}

export class PerpChangeLeverageReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 3 * 4; // 16 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_LEVERAGE = 1;
  static readonly OFFSET_CLIENT_ID = 4;
  static readonly OFFSET_INSTR_ID = 8;
  static readonly OFFSET_TIME = 12;

  tag: number;
  leverage: number;
  clientId: number;
  instrId: number;
  time: number;
  static fromBuffer(buffer: Buffer, offset?: number): PerpChangeLeverageReportModel {
    const result = new PerpChangeLeverageReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    result.leverage = autoBuffer.readU8();
    autoBuffer.readU16();
    result.clientId = autoBuffer.readU32();
    result.instrId = autoBuffer.readU32();
    result.time = autoBuffer.readU32();
    return result;
  }
}

export class DrvsAirdropReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 3 * 4 + 1 * 8; // 24 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_CLIENT_ID = 4;
  static readonly OFFSET_AMOUNT = 8;
  static readonly OFFSET_TIME = 16;

  tag: number;
  clientId: number;
  amount: number;
  time: number;
  static fromBuffer(buffer: Buffer, offset?: number): DrvsAirdropReportModel {
    const result = new DrvsAirdropReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    autoBuffer.readU8();
    autoBuffer.readU16();
    result.clientId = autoBuffer.readU32();
    result.amount = autoBuffer.readI64();
    result.time = autoBuffer.readU32();
    autoBuffer.readU32();
    return result;
  }
}

export class EarningsReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 3 * 4 + 1 * 8; // 24 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_CLIENT_ID = 4;
  static readonly OFFSET_TOKEN_ID = 8;
  static readonly OFFSET_TIME = 12;
  static readonly OFFSET_AMOUNT = 16;

  tag: number;
  clientId: number;
  tokenId: number;
  time: number;
  amount: number;
  static fromBuffer(buffer: Buffer, offset?: number): EarningsReportModel {
    const result = new EarningsReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    autoBuffer.readU8();
    autoBuffer.readU16();
    result.clientId = autoBuffer.readU32();
    result.tokenId = autoBuffer.readU32();
    result.time = autoBuffer.readU32();
    result.amount = autoBuffer.readI64();
    return result;
  }
}

export class DepositReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 3 * 4 + 1 * 8; // 24 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_CLIENT_ID = 4;
  static readonly OFFSET_TOKEN_ID = 8;
  static readonly OFFSET_TIME = 12;
  static readonly OFFSET_AMOUNT = 16;

  tag: number;
  clientId: number;
  tokenId: number;
  time: number;
  amount: number;
  static fromBuffer(buffer: Buffer, offset?: number): DepositReportModel {
    const result = new DepositReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    autoBuffer.readU8();
    autoBuffer.readU16();
    result.clientId = autoBuffer.readU32();
    result.tokenId = autoBuffer.readU32();
    result.time = autoBuffer.readU32();
    result.amount = autoBuffer.readI64();
    return result;
  }
}

export class FeesDepositReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 3 * 4 + 1 * 8; // 24 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_CLIENT_ID = 4;
  static readonly OFFSET_TOKEN_ID = 8;
  static readonly OFFSET_TIME = 12;
  static readonly OFFSET_AMOUNT = 16;

  tag: number;
  clientId: number;
  tokenId: number;
  time: number;
  amount: number;
  static fromBuffer(buffer: Buffer, offset?: number): FeesDepositReportModel {
    const result = new FeesDepositReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    autoBuffer.readU8();
    autoBuffer.readU16();
    result.clientId = autoBuffer.readU32();
    result.tokenId = autoBuffer.readU32();
    result.time = autoBuffer.readU32();
    result.amount = autoBuffer.readI64();
    return result;
  }
}

export class FeesWithdrawReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 3 * 4 + 1 * 8; // 24 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_CLIENT_ID = 4;
  static readonly OFFSET_TOKEN_ID = 8;
  static readonly OFFSET_TIME = 12;
  static readonly OFFSET_AMOUNT = 16;

  tag: number;
  clientId: number;
  tokenId: number;
  time: number;
  amount: number;
  static fromBuffer(buffer: Buffer, offset?: number): FeesWithdrawReportModel {
    const result = new FeesWithdrawReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    autoBuffer.readU8();
    autoBuffer.readU16();
    result.clientId = autoBuffer.readU32();
    result.tokenId = autoBuffer.readU32();
    result.time = autoBuffer.readU32();
    result.amount = autoBuffer.readI64();
    return result;
  }
}

export class PerpDepositReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 3 * 4 + 1 * 8; // 24 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_CLIENT_ID = 4;
  static readonly OFFSET_INSTR_ID = 8;
  static readonly OFFSET_TIME = 12;
  static readonly OFFSET_AMOUNT = 16;

  tag: number;
  clientId: number;
  instrId: number;
  time: number;
  amount: number;
  static fromBuffer(buffer: Buffer, offset?: number): PerpDepositReportModel {
    const result = new PerpDepositReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    autoBuffer.readU8();
    autoBuffer.readU16();
    result.clientId = autoBuffer.readU32();
    result.instrId = autoBuffer.readU32();
    result.time = autoBuffer.readU32();
    result.amount = autoBuffer.readI64();
    return result;
  }
}

export class WithdrawReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 3 * 4 + 1 * 8; // 24 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_CLIENT_ID = 4;
  static readonly OFFSET_TOKEN_ID = 8;
  static readonly OFFSET_TIME = 12;
  static readonly OFFSET_AMOUNT = 16;

  tag: number;
  clientId: number;
  tokenId: number;
  time: number;
  amount: number;
  static fromBuffer(buffer: Buffer, offset?: number): WithdrawReportModel {
    const result = new WithdrawReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    autoBuffer.readU8();
    autoBuffer.readU16();
    result.clientId = autoBuffer.readU32();
    result.tokenId = autoBuffer.readU32();
    result.time = autoBuffer.readU32();
    result.amount = autoBuffer.readI64();
    return result;
  }
}

export class PerpWithdrawReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 3 * 4 + 1 * 8; // 24 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_CLIENT_ID = 4;
  static readonly OFFSET_INSTR_ID = 8;
  static readonly OFFSET_TIME = 12;
  static readonly OFFSET_AMOUNT = 16;

  tag: number;
  clientId: number;
  instrId: number;
  time: number;
  amount: number;
  static fromBuffer(buffer: Buffer, offset?: number): PerpWithdrawReportModel {
    const result = new PerpWithdrawReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    autoBuffer.readU8();
    autoBuffer.readU16();
    result.clientId = autoBuffer.readU32();
    result.instrId = autoBuffer.readU32();
    result.time = autoBuffer.readU32();
    result.amount = autoBuffer.readI64();
    return result;
  }
}

export class SpotlpTradeReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 3 * 4 + 4 * 8; // 48 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_SIDE = 1;
  static readonly OFFSET_TIME = 4;
  static readonly OFFSET_CLIENT_ID = 8;
  static readonly OFFSET_INSTR_ID = 12;
  static readonly OFFSET_ORDER_ID = 16;
  static readonly OFFSET_QTY = 24;
  static readonly OFFSET_TOKENS = 32;
  static readonly OFFSET_CRNCY = 40;

  tag: number;
  side: number;
  time: number;
  clientId: number;
  instrId: number;
  orderId: number;
  qty: number;
  tokens: number;
  crncy: number;
  static fromBuffer(buffer: Buffer, offset?: number): SpotlpTradeReportModel {
    const result = new SpotlpTradeReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    result.side = autoBuffer.readU8();
    autoBuffer.readU16();
    result.time = autoBuffer.readU32();
    result.clientId = autoBuffer.readU32();
    result.instrId = autoBuffer.readU32();
    result.orderId = autoBuffer.readI64();
    result.qty = autoBuffer.readI64();
    result.tokens = autoBuffer.readI64();
    result.crncy = autoBuffer.readI64();
    return result;
  }
}

export class PerpFillOrderReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 1 * 4 + 5 * 8; // 48 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_SIDE = 1;
  static readonly OFFSET_CLIENT_ID = 4;
  static readonly OFFSET_ORDER_ID = 8;
  static readonly OFFSET_PERPS = 16;
  static readonly OFFSET_CRNCY = 24;
  static readonly OFFSET_PRICE = 32;
  static readonly OFFSET_REBATES = 40;

  tag: number;
  side: number;
  clientId: number;
  orderId: number;
  perps: number;
  crncy: number;
  price: number;
  rebates: number;
  static fromBuffer(buffer: Buffer, offset?: number): PerpFillOrderReportModel {
    const result = new PerpFillOrderReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    result.side = autoBuffer.readU8();
    autoBuffer.readU16();
    result.clientId = autoBuffer.readU32();
    result.orderId = autoBuffer.readI64();
    result.perps = autoBuffer.readI64();
    result.crncy = autoBuffer.readI64();
    result.price = autoBuffer.readI64();
    result.rebates = autoBuffer.readI64();
    return result;
  }
}

export class SpotFillOrderReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 1 * 4 + 5 * 8; // 48 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_SIDE = 1;
  static readonly OFFSET_CLIENT_ID = 4;
  static readonly OFFSET_ORDER_ID = 8;
  static readonly OFFSET_QTY = 16;
  static readonly OFFSET_CRNCY = 24;
  static readonly OFFSET_PRICE = 32;
  static readonly OFFSET_REBATES = 40;

  tag: number;
  side: number;
  clientId: number;
  orderId: number;
  qty: number;
  crncy: number;
  price: number;
  rebates: number;
  static fromBuffer(buffer: Buffer, offset?: number): SpotFillOrderReportModel {
    const result = new SpotFillOrderReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    result.side = autoBuffer.readU8();
    autoBuffer.readU16();
    result.clientId = autoBuffer.readU32();
    result.orderId = autoBuffer.readI64();
    result.qty = autoBuffer.readI64();
    result.crncy = autoBuffer.readI64();
    result.price = autoBuffer.readI64();
    result.rebates = autoBuffer.readI64();
    return result;
  }
}

export class PerpPlaceOrderReportModel {
  static readonly LENGTH = 4 * 1 + 5 * 4 + 3 * 8; // 48 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_IOC = 1;
  static readonly OFFSET_SIDE = 2;
  static readonly OFFSET_ORDER_TYPE = 3;
  static readonly OFFSET_CLIENT_ID = 4;
  static readonly OFFSET_ORDER_ID = 8;
  static readonly OFFSET_PERPS = 16;
  static readonly OFFSET_PRICE = 24;
  static readonly OFFSET_INSTR_ID = 32;
  static readonly OFFSET_LEVERAGE = 36;
  static readonly OFFSET_TIME = 40;

  tag: number;
  ioc: number;
  side: number;
  orderType: number;
  clientId: number;
  orderId: number;
  perps: number;
  price: number;
  instrId: number;
  leverage: number;
  time: number;
  static fromBuffer(buffer: Buffer, offset?: number): PerpPlaceOrderReportModel {
    const result = new PerpPlaceOrderReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    result.ioc = autoBuffer.readU8();
    result.side = autoBuffer.readU8();
    result.orderType = autoBuffer.readU8();
    result.clientId = autoBuffer.readU32();
    result.orderId = autoBuffer.readI64();
    result.perps = autoBuffer.readI64();
    result.price = autoBuffer.readI64();
    result.instrId = autoBuffer.readU32();
    result.leverage = autoBuffer.readU32();
    result.time = autoBuffer.readU32();
    autoBuffer.readU32();
    return result;
  }
}

export class SpotPlaceOrderReportModel {
  static readonly LENGTH = 4 * 1 + 3 * 4 + 3 * 8; // 40 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_IOC = 1;
  static readonly OFFSET_SIDE = 2;
  static readonly OFFSET_ORDER_TYPE = 3;
  static readonly OFFSET_CLIENT_ID = 4;
  static readonly OFFSET_ORDER_ID = 8;
  static readonly OFFSET_QTY = 16;
  static readonly OFFSET_PRICE = 24;
  static readonly OFFSET_INSTR_ID = 32;
  static readonly OFFSET_TIME = 36;

  tag: number;
  ioc: number;
  side: number;
  orderType: number;
  clientId: number;
  orderId: number;
  qty: number;
  price: number;
  instrId: number;
  time: number;
  static fromBuffer(buffer: Buffer, offset?: number): SpotPlaceOrderReportModel {
    const result = new SpotPlaceOrderReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    result.ioc = autoBuffer.readU8();
    result.side = autoBuffer.readU8();
    result.orderType = autoBuffer.readU8();
    result.clientId = autoBuffer.readU32();
    result.orderId = autoBuffer.readI64();
    result.qty = autoBuffer.readI64();
    result.price = autoBuffer.readI64();
    result.instrId = autoBuffer.readU32();
    result.time = autoBuffer.readU32();
    return result;
  }
}

export class PerpPlaceMassCancelReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 3 * 4; // 16 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_CLIENT_ID = 4;
  static readonly OFFSET_INSTR_ID = 8;
  static readonly OFFSET_TIME = 12;

  tag: number;
  clientId: number;
  instrId: number;
  time: number;
  static fromBuffer(buffer: Buffer, offset?: number): PerpPlaceMassCancelReportModel {
    const result = new PerpPlaceMassCancelReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    autoBuffer.readU8();
    autoBuffer.readU16();
    result.clientId = autoBuffer.readU32();
    result.instrId = autoBuffer.readU32();
    result.time = autoBuffer.readU32();
    return result;
  }
}

export class SpotPlaceMassCancelReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 3 * 4; // 16 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_CLIENT_ID = 4;
  static readonly OFFSET_INSTR_ID = 8;
  static readonly OFFSET_TIME = 12;

  tag: number;
  clientId: number;
  instrId: number;
  time: number;
  static fromBuffer(buffer: Buffer, offset?: number): SpotPlaceMassCancelReportModel {
    const result = new SpotPlaceMassCancelReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    autoBuffer.readU8();
    autoBuffer.readU16();
    result.clientId = autoBuffer.readU32();
    result.instrId = autoBuffer.readU32();
    result.time = autoBuffer.readU32();
    return result;
  }
}

export class PerpMassCancelReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 1 * 4 + 3 * 8; // 32 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_SIDE = 1;
  static readonly OFFSET_ORDER_ID = 8;
  static readonly OFFSET_PERPS = 16;
  static readonly OFFSET_CRNCY = 24;

  tag: number;
  side: number;
  orderId: number;
  perps: number;
  crncy: number;
  static fromBuffer(buffer: Buffer, offset?: number): PerpMassCancelReportModel {
    const result = new PerpMassCancelReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    result.side = autoBuffer.readU8();
    autoBuffer.readU16();
    autoBuffer.readU32();
    result.orderId = autoBuffer.readI64();
    result.perps = autoBuffer.readI64();
    result.crncy = autoBuffer.readI64();
    return result;
  }
}

export class SpotMassCancelReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 1 * 4 + 3 * 8; // 32 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_SIDE = 1;
  static readonly OFFSET_ORDER_ID = 8;
  static readonly OFFSET_QTY = 16;
  static readonly OFFSET_CRNCY = 24;

  tag: number;
  side: number;
  orderId: number;
  qty: number;
  crncy: number;
  static fromBuffer(buffer: Buffer, offset?: number): SpotMassCancelReportModel {
    const result = new SpotMassCancelReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    result.side = autoBuffer.readU8();
    autoBuffer.readU16();
    autoBuffer.readU32();
    result.orderId = autoBuffer.readI64();
    result.qty = autoBuffer.readI64();
    result.crncy = autoBuffer.readI64();
    return result;
  }
}

export class PerpFeesReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 1 * 4 + 2 * 8; // 24 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_REF_CLIENT_ID = 4;
  static readonly OFFSET_FEES = 8;
  static readonly OFFSET_REF_PAYMENT = 16;

  tag: number;
  refClientId: number;
  fees: number;
  refPayment: number;
  static fromBuffer(buffer: Buffer, offset?: number): PerpFeesReportModel {
    const result = new PerpFeesReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    autoBuffer.readU8();
    autoBuffer.readU16();
    result.refClientId = autoBuffer.readU32();
    result.fees = autoBuffer.readI64();
    result.refPayment = autoBuffer.readI64();
    return result;
  }
}

export class SpotFeesReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 1 * 4 + 2 * 8; // 24 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_REF_CLIENT_ID = 4;
  static readonly OFFSET_FEES = 8;
  static readonly OFFSET_REF_PAYMENT = 16;

  tag: number;
  refClientId: number;
  fees: number;
  refPayment: number;
  static fromBuffer(buffer: Buffer, offset?: number): SpotFeesReportModel {
    const result = new SpotFeesReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    autoBuffer.readU8();
    autoBuffer.readU16();
    result.refClientId = autoBuffer.readU32();
    result.fees = autoBuffer.readI64();
    result.refPayment = autoBuffer.readI64();
    return result;
  }
}

export class PerpFundingReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 3 * 4 + 1 * 8; // 24 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_CLIENT_ID = 4;
  static readonly OFFSET_TIME = 8;
  static readonly OFFSET_FUNDING = 16;

  tag: number;
  clientId: number;
  time: number;
  funding: number;
  static fromBuffer(buffer: Buffer, offset?: number): PerpFundingReportModel {
    const result = new PerpFundingReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    autoBuffer.readU8();
    autoBuffer.readU16();
    result.clientId = autoBuffer.readU32();
    result.time = autoBuffer.readU32();
    autoBuffer.readU32();
    result.funding = autoBuffer.readI64();
    return result;
  }
}

export class PerpSocLossReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 1 * 4 + 1 * 8; // 16 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_CLIENT_ID = 4;
  static readonly OFFSET_SOC_LOSS = 8;

  tag: number;
  clientId: number;
  socLoss: number;
  static fromBuffer(buffer: Buffer, offset?: number): PerpSocLossReportModel {
    const result = new PerpSocLossReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    autoBuffer.readU8();
    autoBuffer.readU16();
    result.clientId = autoBuffer.readU32();
    result.socLoss = autoBuffer.readI64();
    return result;
  }
}

export class PerpNewOrderReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 1 * 4 + 2 * 8; // 24 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_SIDE = 1;
  static readonly OFFSET_PERPS = 8;
  static readonly OFFSET_CRNCY = 16;

  tag: number;
  side: number;
  perps: number;
  crncy: number;
  static fromBuffer(buffer: Buffer, offset?: number): PerpNewOrderReportModel {
    const result = new PerpNewOrderReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    result.side = autoBuffer.readU8();
    autoBuffer.readU16();
    autoBuffer.readU32();
    result.perps = autoBuffer.readI64();
    result.crncy = autoBuffer.readI64();
    return result;
  }
}

export class SpotNewOrderReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 1 * 4 + 2 * 8; // 24 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_SIDE = 1;
  static readonly OFFSET_QTY = 8;
  static readonly OFFSET_CRNCY = 16;

  tag: number;
  side: number;
  qty: number;
  crncy: number;
  static fromBuffer(buffer: Buffer, offset?: number): SpotNewOrderReportModel {
    const result = new SpotNewOrderReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    result.side = autoBuffer.readU8();
    autoBuffer.readU16();
    autoBuffer.readU32();
    result.qty = autoBuffer.readI64();
    result.crncy = autoBuffer.readI64();
    return result;
  }
}

export class PerpOrderCancelReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 3 * 4 + 3 * 8; // 40 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_SIDE = 1;
  static readonly OFFSET_CLIENT_ID = 4;
  static readonly OFFSET_INSTR_ID = 8;
  static readonly OFFSET_TIME = 12;
  static readonly OFFSET_ORDER_ID = 16;
  static readonly OFFSET_PERPS = 24;
  static readonly OFFSET_CRNCY = 32;

  tag: number;
  side: number;
  clientId: number;
  instrId: number;
  time: number;
  orderId: number;
  perps: number;
  crncy: number;
  static fromBuffer(buffer: Buffer, offset?: number): PerpOrderCancelReportModel {
    const result = new PerpOrderCancelReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    result.side = autoBuffer.readU8();
    autoBuffer.readU16();
    result.clientId = autoBuffer.readU32();
    result.instrId = autoBuffer.readU32();
    result.time = autoBuffer.readU32();
    result.orderId = autoBuffer.readI64();
    result.perps = autoBuffer.readI64();
    result.crncy = autoBuffer.readI64();
    return result;
  }
}

export class SpotOrderCancelReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 3 * 4 + 3 * 8; // 40 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_SIDE = 1;
  static readonly OFFSET_CLIENT_ID = 4;
  static readonly OFFSET_INSTR_ID = 8;
  static readonly OFFSET_TIME = 12;
  static readonly OFFSET_ORDER_ID = 16;
  static readonly OFFSET_QTY = 24;
  static readonly OFFSET_CRNCY = 32;

  tag: number;
  side: number;
  clientId: number;
  instrId: number;
  time: number;
  orderId: number;
  qty: number;
  crncy: number;
  static fromBuffer(buffer: Buffer, offset?: number): SpotOrderCancelReportModel {
    const result = new SpotOrderCancelReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    result.side = autoBuffer.readU8();
    autoBuffer.readU16();
    result.clientId = autoBuffer.readU32();
    result.instrId = autoBuffer.readU32();
    result.time = autoBuffer.readU32();
    result.orderId = autoBuffer.readI64();
    result.qty = autoBuffer.readI64();
    result.crncy = autoBuffer.readI64();
    return result;
  }
}

export class PerpOrderRevokeReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 1 * 4 + 3 * 8; // 32 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_SIDE = 1;
  static readonly OFFSET_CLIENT_ID = 4;
  static readonly OFFSET_ORDER_ID = 8;
  static readonly OFFSET_PERPS = 16;
  static readonly OFFSET_CRNCY = 24;

  tag: number;
  side: number;
  clientId: number;
  orderId: number;
  perps: number;
  crncy: number;
  static fromBuffer(buffer: Buffer, offset?: number): PerpOrderRevokeReportModel {
    const result = new PerpOrderRevokeReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    result.side = autoBuffer.readU8();
    autoBuffer.readU16();
    result.clientId = autoBuffer.readU32();
    result.orderId = autoBuffer.readI64();
    result.perps = autoBuffer.readI64();
    result.crncy = autoBuffer.readI64();
    return result;
  }
}

export class SpotOrderRevokeReportModel {
  static readonly LENGTH = 2 * 1 + 1 * 2 + 1 * 4 + 3 * 8; // 32 bytes

  static readonly OFFSET_TAG = 0;
  static readonly OFFSET_SIDE = 1;
  static readonly OFFSET_CLIENT_ID = 4;
  static readonly OFFSET_ORDER_ID = 8;
  static readonly OFFSET_QTY = 16;
  static readonly OFFSET_CRNCY = 24;

  tag: number;
  side: number;
  clientId: number;
  orderId: number;
  qty: number;
  crncy: number;
  static fromBuffer(buffer: Buffer, offset?: number): SpotOrderRevokeReportModel {
    const result = new SpotOrderRevokeReportModel();
    let autoBuffer = new AutoBuffer(buffer, offset);
    result.tag = autoBuffer.readU8();
    result.side = autoBuffer.readU8();
    autoBuffer.readU16();
    result.clientId = autoBuffer.readU32();
    result.orderId = autoBuffer.readI64();
    result.qty = autoBuffer.readI64();
    result.crncy = autoBuffer.readI64();
    return result;
  }
}

