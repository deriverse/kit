export function newOperatorData(tag: number, version: number): Buffer {
  let buf = Buffer.alloc(8);
  buf.writeUint8(tag, 0);
  buf.writeUint8(0, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(version, 4);
  return buf;
}

export function newRootAccountData(tag: number, version: number, lutSlot: number): Buffer {
  let buf = Buffer.alloc(12);
  buf.writeUint8(tag, 0);
  buf.writeUint8(0, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(version, 4);
  buf.writeUint32LE(lutSlot, 8);
  return buf;
}

export function newSpotOrderData(tag: number, ioc: number, orderType: number, side: number, instrId: number, price: number, amount: number): Buffer {
  let buf = Buffer.alloc(24);
  buf.writeUint8(tag, 0);
  buf.writeUint8(ioc, 1);
  buf.writeUint8(orderType, 2);
  buf.writeUint8(side, 3);
  buf.writeUint32LE(instrId, 4);
  buf.writeBigInt64LE(BigInt(price), 8);
  buf.writeBigInt64LE(BigInt(amount), 16);
  return buf;
}

export function newPerpOrderData(tag: number, ioc: number, leverage: number, orderType: number, side: number, instrId: number, price: number, amount: number): Buffer {
  let buf = Buffer.alloc(32);
  buf.writeUint8(tag, 0);
  buf.writeUint8(ioc, 1);
  buf.writeUint8(leverage, 2);
  buf.writeUint8(orderType, 3);
  buf.writeUint8(side, 4);
  buf.writeUint8(0, 5);
  buf.writeUint16LE(0, 6);
  buf.writeUint32LE(0, 8);
  buf.writeUint32LE(instrId, 12);
  buf.writeBigInt64LE(BigInt(price), 16);
  buf.writeBigInt64LE(BigInt(amount), 24);
  return buf;
}

export function perpChangeLeverageData(tag: number, leverage: number, instrId: number): Buffer {
  let buf = Buffer.alloc(8);
  buf.writeUint8(tag, 0);
  buf.writeUint8(leverage, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(instrId, 4);
  return buf;
}

export function perpStatisticsResetData(tag: number, instrId: number): Buffer {
  let buf = Buffer.alloc(8);
  buf.writeUint8(tag, 0);
  buf.writeUint8(0, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(instrId, 4);
  return buf;
}

export function spotOrderCancelData(tag: number, side: number, instrId: number, orderId: number): Buffer {
  let buf = Buffer.alloc(16);
  buf.writeUint8(tag, 0);
  buf.writeUint8(side, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(instrId, 4);
  buf.writeBigInt64LE(BigInt(orderId), 8);
  return buf;
}

export function spotMassCancelData(tag: number, instrId: number): Buffer {
  let buf = Buffer.alloc(8);
  buf.writeUint8(tag, 0);
  buf.writeUint8(0, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(instrId, 4);
  return buf;
}

export function spotLpData(tag: number, side: number, instrId: number, amount: number): Buffer {
  let buf = Buffer.alloc(16);
  buf.writeUint8(tag, 0);
  buf.writeUint8(side, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(instrId, 4);
  buf.writeBigInt64LE(BigInt(amount), 8);
  return buf;
}

export function newInstrumentData(tag: number, crncyTokenId: number, lutSlot: number, price: number): Buffer {
  let buf = Buffer.alloc(24);
  buf.writeUint8(tag, 0);
  buf.writeUint8(0, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(0, 4);
  buf.writeUint32LE(crncyTokenId, 8);
  buf.writeUint32LE(lutSlot, 12);
  buf.writeBigInt64LE(BigInt(price), 16);
  return buf;
}

export function depositData(tag: number, competitionId: number, depositAll: number, tokenId: number, amount: number, lutSlot: number, refId: number): Buffer {
  let buf = Buffer.alloc(24);
  buf.writeUint8(tag, 0);
  buf.writeUint8(competitionId, 1);
  buf.writeUint8(depositAll, 2);
  buf.writeUint8(0, 3);
  buf.writeUint32LE(tokenId, 4);
  buf.writeBigInt64LE(BigInt(amount), 8);
  buf.writeUint32LE(lutSlot, 16);
  buf.writeUint32LE(refId, 20);
  return buf;
}

export function feesDepositData(tag: number, tokenId: number, amount: number): Buffer {
  let buf = Buffer.alloc(16);
  buf.writeUint8(tag, 0);
  buf.writeUint8(0, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(tokenId, 4);
  buf.writeBigInt64LE(BigInt(amount), 8);
  return buf;
}

export function feesWithdrawData(tag: number, tokenId: number, amount: number): Buffer {
  let buf = Buffer.alloc(16);
  buf.writeUint8(tag, 0);
  buf.writeUint8(0, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(tokenId, 4);
  buf.writeBigInt64LE(BigInt(amount), 8);
  return buf;
}

export function perpDepositData(tag: number, instrId: number, amount: number): Buffer {
  let buf = Buffer.alloc(16);
  buf.writeUint8(tag, 0);
  buf.writeUint8(0, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(instrId, 4);
  buf.writeBigInt64LE(BigInt(amount), 8);
  return buf;
}

export function moveSpotAvailFundsData(tag: number, instrId: number): Buffer {
  let buf = Buffer.alloc(8);
  buf.writeUint8(tag, 0);
  buf.writeUint8(0, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(instrId, 4);
  return buf;
}

export function perpWithdrawData(tag: number, instrId: number, amount: number): Buffer {
  let buf = Buffer.alloc(16);
  buf.writeUint8(tag, 0);
  buf.writeUint8(0, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(instrId, 4);
  buf.writeBigInt64LE(BigInt(amount), 8);
  return buf;
}

export function withdrawData(tag: number, tokenId: number, amount: number): Buffer {
  let buf = Buffer.alloc(16);
  buf.writeUint8(tag, 0);
  buf.writeUint8(0, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(tokenId, 4);
  buf.writeBigInt64LE(BigInt(amount), 8);
  return buf;
}

export function swapData(tag: number, side: number, instrId: number, price: number, amount: number): Buffer {
  let buf = Buffer.alloc(24);
  buf.writeUint8(tag, 0);
  buf.writeUint8(side, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(instrId, 4);
  buf.writeBigInt64LE(BigInt(price), 8);
  buf.writeBigInt64LE(BigInt(amount), 16);
  return buf;
}

export function spotQuotesReplaceData(tag: number, instrId: number, newBidPrice: number, newBidQty: number, oldBidOrderId: number, newAskPrice: number, newAskQty: number, oldAskOrderId: number): Buffer {
  let buf = Buffer.alloc(56);
  buf.writeUint8(tag, 0);
  buf.writeUint8(0, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(instrId, 4);
  buf.writeBigInt64LE(BigInt(newBidPrice), 8);
  buf.writeBigInt64LE(BigInt(newBidQty), 16);
  buf.writeBigInt64LE(BigInt(oldBidOrderId), 24);
  buf.writeBigInt64LE(BigInt(newAskPrice), 32);
  buf.writeBigInt64LE(BigInt(newAskQty), 40);
  buf.writeBigInt64LE(BigInt(oldAskOrderId), 48);
  return buf;
}

export function perpQuotesReplaceData(tag: number, instrId: number, newBidPrice: number, newBidQty: number, oldBidOrderId: number, newAskPrice: number, newAskQty: number, oldAskOrderId: number): Buffer {
  let buf = Buffer.alloc(56);
  buf.writeUint8(tag, 0);
  buf.writeUint8(0, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(instrId, 4);
  buf.writeBigInt64LE(BigInt(newBidPrice), 8);
  buf.writeBigInt64LE(BigInt(newBidQty), 16);
  buf.writeBigInt64LE(BigInt(oldBidOrderId), 24);
  buf.writeBigInt64LE(BigInt(newAskPrice), 32);
  buf.writeBigInt64LE(BigInt(newAskQty), 40);
  buf.writeBigInt64LE(BigInt(oldAskOrderId), 48);
  return buf;
}

export function votingData(tag: number, choice: number, votingCounter: number): Buffer {
  let buf = Buffer.alloc(8);
  buf.writeUint8(tag, 0);
  buf.writeUint8(choice, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(votingCounter, 4);
  return buf;
}

export function airdropData(tag: number, ratio: number): Buffer {
  let buf = Buffer.alloc(16);
  buf.writeUint8(tag, 0);
  buf.writeUint8(0, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(0, 4);
  return buf;
}

export function upgradeToPerpData(tag: number, instrId: number): Buffer {
  let buf = Buffer.alloc(8);
  buf.writeUint8(tag, 0);
  buf.writeUint8(0, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(instrId, 4);
  return buf;
}

export function setInstrOracleFeedData(tag: number, instrId: number, variance: number): Buffer {
  let buf = Buffer.alloc(16);
  buf.writeUint8(tag, 0);
  buf.writeUint8(0, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(instrId, 4);
  return buf;
}

export function setInstrReadyForPerpUpgradeData(tag: number, instrId: number, variance: number): Buffer {
  let buf = Buffer.alloc(16);
  buf.writeUint8(tag, 0);
  buf.writeUint8(0, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(instrId, 4);
  return buf;
}

export function newTokenData(tag: number, crncy: number, needInitialization: number): Buffer {
  let buf = Buffer.alloc(8);
  buf.writeUint8(tag, 0);
  buf.writeUint8(crncy, 1);
  buf.writeUint8(needInitialization, 2);
  buf.writeUint8(0, 3);
  buf.writeUint32LE(0, 4);
  return buf;
}

export function perpOrderCancelData(tag: number, side: number, instrId: number, orderId: number): Buffer {
  let buf = Buffer.alloc(16);
  buf.writeUint8(tag, 0);
  buf.writeUint8(side, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(instrId, 4);
  buf.writeBigInt64LE(BigInt(orderId), 8);
  return buf;
}

export function perpMassCancelData(tag: number, instrId: number): Buffer {
  let buf = Buffer.alloc(8);
  buf.writeUint8(tag, 0);
  buf.writeUint8(0, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(instrId, 4);
  return buf;
}

export function perpForcedCloseData(tag: number, instrId: number): Buffer {
  let buf = Buffer.alloc(8);
  buf.writeUint8(tag, 0);
  buf.writeUint8(0, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(instrId, 4);
  return buf;
}

export function changeRefProgramData(tag: number, refProgramDuration: number, refLinkDuration: number, refDiscount: number, refRatio: number): Buffer {
  let buf = Buffer.alloc(32);
  buf.writeUint8(tag, 0);
  buf.writeUint8(0, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(0, 4);
  buf.writeUint32LE(refProgramDuration, 8);
  buf.writeUint32LE(refLinkDuration, 12);
  return buf;
}

export function buyMarketSeatData(tag: number, instrId: number, amount: number): Buffer {
  let buf = Buffer.alloc(16);
  buf.writeUint8(tag, 0);
  buf.writeUint8(0, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(instrId, 4);
  buf.writeBigInt64LE(BigInt(amount), 8);
  return buf;
}

export function sellMarketSeatData(tag: number, instrId: number): Buffer {
  let buf = Buffer.alloc(8);
  buf.writeUint8(tag, 0);
  buf.writeUint8(0, 1);
  buf.writeUint16LE(0, 2);
  buf.writeUint32LE(instrId, 4);
  return buf;
}

