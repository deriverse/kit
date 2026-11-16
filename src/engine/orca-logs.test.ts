import { describe, expect, it } from 'vitest';
import { Buffer } from 'buffer';
import { decodeTransactionLogs } from './logs-decoder';
import { InstrAccountHeaderModel, TokenStateModel } from '../structure_models';
import { LogType, OrcaSwapReportModel } from '../logs_models';
import { Instrument, LogMessage } from '../types';

function reportBuffer(side: number) {
  const buffer = Buffer.alloc(40);
  buffer[0] = 49;
  buffer[1] = side;
  buffer.writeUInt16LE(1234, 2); // Padding is ignored.
  buffer.writeUInt32LE(1_800_000_000, 4);
  buffer.writeUInt32LE(123, 8);
  buffer.writeUInt32LE(7, 12);
  buffer.writeBigInt64LE(BigInt(2_500_000_000), 16);
  buffer.writeBigInt64LE(BigInt(1_750_000_000), 24);
  buffer.writeBigInt64LE(BigInt('4294967301'), 32);
  return buffer;
}

function context(uiNumbers = true) {
  const header = Object.assign(new InstrAccountHeaderModel(), { instrId: 7, assetTokenId: 1, crncyTokenId: 2 });
  const instrument = { header } as Instrument;
  const asset = Object.assign(new TokenStateModel(), { id: 1, mask: 9 });
  const crncy = Object.assign(new TokenStateModel(), { id: 2, mask: 6 });
  return {
    instruments: new Map([[7, instrument]]),
    tokens: new Map([
      [1, asset],
      [2, crncy],
    ]),
    uiNumbers,
  };
}

const log = (buffer: Buffer) => `Program data: ${buffer.toString('base64')}`;

describe('Orca swap logs', () => {
  it('decodes the Rust byte layout and signed i64 seqNo with an offset', () => {
    const buffer = reportBuffer(1);
    buffer.writeBigInt64LE(BigInt('-4294967301'), 32);
    const report: LogMessage = OrcaSwapReportModel.fromBuffer(Buffer.concat([Buffer.alloc(5), buffer]), 5);
    expect(report).toBeInstanceOf(OrcaSwapReportModel);
    expect(report).toEqual({
      tag: LogType.orcaSwap,
      side: 1,
      time: 1_800_000_000,
      clientId: 123,
      instrId: 7,
      amountIn: 2_500_000_000,
      amountOut: 1_750_000_000,
      seqNo: -4294967301,
    });
    expect(OrcaSwapReportModel.LENGTH).toBe(40);
    expect(OrcaSwapReportModel.OFFSET_AMOUNT_IN).toBe(16);
    expect(OrcaSwapReportModel.OFFSET_AMOUNT_OUT).toBe(24);
    expect(OrcaSwapReportModel.OFFSET_SEQ_NO).toBe(32);
  });

  it.each([0, 1])('normalizes both amounts for side %i', (side) => {
    const [report] = decodeTransactionLogs([log(reportBuffer(side))], context()) as OrcaSwapReportModel[];
    expect(report.amountIn).toBe(side === 0 ? 2500 : 2.5);
    expect(report.amountOut).toBe(side === 0 ? 1.75 : 1750);
    expect(report.seqNo).toBe(4294967301);
  });

  it('preserves contract units when uiNumbers is false or the instrument is unknown', () => {
    const raw = context(false);
    const unknown = context();
    unknown.instruments.clear();
    for (const ctx of [raw, unknown]) {
      const [report] = decodeTransactionLogs([log(reportBuffer(1))], ctx) as OrcaSwapReportModel[];
      expect(report.amountIn).toBe(2_500_000_000);
      expect(report.amountOut).toBe(1_750_000_000);
    }
  });

  it('ignores malformed lengths and unrelated logs and discards failed transactions', () => {
    const valid = log(reportBuffer(1));
    expect(
      decodeTransactionLogs(
        [
          log(reportBuffer(0).subarray(0, 39)),
          log(Buffer.concat([reportBuffer(0), Buffer.alloc(1)])),
          'Program invoke',
        ],
        context(),
      ),
    ).toEqual([]);
    expect(decodeTransactionLogs(['Program invoke', valid, 'Program success'], context())).toHaveLength(1);
    expect(decodeTransactionLogs([valid, 'Program returned error: swap failed'], context())).toEqual([]);
  });
});
