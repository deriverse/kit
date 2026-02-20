import { LineQuotesModel } from '../structure_models';
import { EstimateResult } from '../types/responses';

export enum OrderSide {
  Bid = 0,
  Ask = 1,
}

const MAX_I64 = Number.MAX_SAFE_INTEGER;

export class FillEstimateEngine {
  poolAssetTokens: number;
  poolCrncyTokens: number;
  bidLines: LineQuotesModel[];
  askLines: LineQuotesModel[];
  private _df: number;
  private _px: number | null = null; // last price (for impact), null if not filled

  constructor(
    poolAssetTokens: number,
    poolCrncyTokens: number,
    bidLines: LineQuotesModel[],
    askLines: LineQuotesModel[],
    assetTokensDecimals: number,
    crncyTokensDecimals: number,
  ) {
    this.poolAssetTokens = poolAssetTokens;
    this.poolCrncyTokens = poolCrncyTokens;
    this.bidLines = bidLines;
    this.askLines = askLines;
    const dc = 9 + assetTokensDecimals - crncyTokensDecimals;
    let df = 1;
    for (let i = 0; i < dc; ++i) {
      df *= 10;
    }
    this._df = df;
  }

  private changePx(tradedQty: number, tradedSum: number, side: OrderSide): void {
    const lastPx = (tradedSum * this._df) / tradedQty;
    if (this._px === null) {
      this._px = lastPx;
    } else if (side === OrderSide.Bid) {
      if (lastPx < this._px) {
        this._px = lastPx;
      }
    } else if (lastPx > this._px) {
      this._px = lastPx;
    }
  }

  private getAmmPx(k: number, qty: number, side: OrderSide): number {
    if (side === OrderSide.Bid) {
      const newPoolAssetTokens = this.poolAssetTokens + qty;
      return (k * this._df) / (newPoolAssetTokens * newPoolAssetTokens);
    } else {
      if (qty > this.poolAssetTokens) {
        return MAX_I64;
      } else {
        const newPoolAssetTokens = this.poolAssetTokens - qty;
        return (k * this._df) / (newPoolAssetTokens * newPoolAssetTokens);
      }
    }
  }

  private getAmmSum(k: number, qty: number, side: OrderSide): number {
    if (side === OrderSide.Bid) {
      if (this.poolAssetTokens === 0) {
        return 0;
      } else {
        return Math.max(0, this.poolCrncyTokens - k / (this.poolAssetTokens + qty));
      }
    } else {
      const newPoolAssetTokens = this.poolAssetTokens - qty;
      if (newPoolAssetTokens <= 0) {
        return 0;
      } else {
        return Math.max(0, k / newPoolAssetTokens - this.poolCrncyTokens);
      }
    }
  }

  private getAmmQty(k: number, price: number, side: OrderSide): number {
    const t = Math.sqrt((k * this._df) / price);
    if (side === OrderSide.Bid) {
      return Math.max(0, t - this.poolAssetTokens);
    } else {
      return Math.max(0, this.poolAssetTokens - t);
    }
  }

  private changePoolAssetTokens(qty: number, side: OrderSide): void {
    if (side === OrderSide.Bid) {
      this.poolAssetTokens += qty;
    } else {
      this.poolAssetTokens -= qty;
    }
  }

  private changePoolCrncyTokens(qty: number, side: OrderSide): void {
    if (side === OrderSide.Bid) {
      this.poolCrncyTokens -= qty;
    } else {
      this.poolCrncyTokens += qty;
    }
  }

  private ammLastLine(ammPx: number, linePx: number, side: OrderSide): boolean {
    if (side === OrderSide.Bid) {
      return ammPx >= linePx;
    } else {
      return ammPx <= linePx;
    }
  }

  private lineIsUnreachable(price: number, linePx: number, side: OrderSide): boolean {
    if (side === OrderSide.Bid) {
      return price > linePx;
    } else {
      return price < linePx;
    }
  }

  private ammCoverLine(ammPx: number, price: number, linePx: number, side: OrderSide): boolean {
    if (side === OrderSide.Bid) {
      return Math.max(ammPx, price) <= linePx;
    } else {
      return Math.min(ammPx, price) >= linePx;
    }
  }

  private ammPartialFill(ammPx: number, price: number, side: OrderSide): boolean {
    return side === OrderSide.Bid ? ammPx < price : ammPx > price;
  }

  private fill(
    line: LineQuotesModel,
    remainingQty: number,
    sumCurrencyTokens: number,
    side: OrderSide,
  ): { remainingQty: number; sumCurrencyTokens: number } {
    const tradedQty = line.qty >= remainingQty ? remainingQty : line.qty;
    const tradedSum = (tradedQty * line.px) / this._df;
    this.changePx(tradedQty, tradedSum, side);
    return {
      remainingQty: remainingQty - tradedQty,
      sumCurrencyTokens: sumCurrencyTokens + tradedSum,
    };
  }

  estimate(qty: number, price: number, side: OrderSide): EstimateResult {
    this._px = null;
    const k = this.poolAssetTokens * this.poolCrncyTokens;
    const lines = side === OrderSide.Bid ? this.bidLines : this.askLines;
    const depth = lines.length;
    let remainingQty = qty;
    let sumCurrencyTokens = 0;
    let tradedQty: number = 0;
    let tradedSum: number = 0;
    let i = 0;

    while (true) {
      const ammPx = this.getAmmPx(k, remainingQty, side);

      if (i === depth) {
        if (this.ammPartialFill(ammPx, price, side)) {
          tradedQty = this.getAmmQty(k, price, side);
          tradedSum = this.getAmmSum(k, tradedQty, side);
          if (tradedQty === 0 || tradedSum === 0) {
            break;
          }
        } else {
          tradedSum = this.getAmmSum(k, remainingQty, side);
          if (tradedSum === 0) {
            break;
          }
          tradedQty = remainingQty;
        }
        remainingQty -= tradedQty;
        sumCurrencyTokens += tradedSum;
        this.changePoolAssetTokens(tradedQty, side);
        this.changePoolCrncyTokens(tradedSum, side);
        this.changePx(tradedQty, tradedSum, side);
        break;
      }

      const line = lines[i];

      if (remainingQty <= line.qty) {
        if (this.ammLastLine(ammPx, line.px, side)) {
          if (this.ammPartialFill(ammPx, price, side)) {
            tradedQty = this.getAmmQty(k, price, side);
            tradedSum = this.getAmmSum(k, tradedQty, side);
            if (tradedQty === 0 || tradedSum === 0) {
              break;
            }
          } else {
            tradedSum = this.getAmmSum(k, remainingQty, side);
            if (tradedSum === 0) {
              break;
            }
            tradedQty = remainingQty;
          }
          remainingQty -= tradedQty;
          sumCurrencyTokens += tradedSum;
          this.changePoolAssetTokens(tradedQty, side);
          this.changePoolCrncyTokens(tradedSum, side);
        } else if (this.lineIsUnreachable(price, line.px, side)) {
          tradedQty = this.getAmmQty(k, price, side);
          tradedSum = this.getAmmSum(k, tradedQty, side);
          if (tradedQty === 0 || tradedSum === 0) {
            break;
          }
          remainingQty -= tradedQty;
          sumCurrencyTokens += tradedSum;
          this.changePoolAssetTokens(tradedQty, side);
          this.changePoolCrncyTokens(tradedSum, side);
        } else {
          tradedQty = this.getAmmQty(k, line.px, side);
          tradedSum = this.getAmmSum(k, tradedQty, side);
          if (tradedQty !== 0 && tradedSum !== 0) {
            remainingQty -= tradedQty;
            sumCurrencyTokens += tradedSum;
            this.changePoolAssetTokens(tradedQty, side);
            this.changePoolCrncyTokens(tradedSum, side);
          }
          if (remainingQty > 0) {
            const result = this.fill(line, remainingQty, sumCurrencyTokens, side);
            remainingQty = result.remainingQty;
            sumCurrencyTokens = result.sumCurrencyTokens;
          }
        }
        if (tradedQty !== 0 && tradedSum !== 0) {
          this.changePx(tradedQty, tradedSum, side);
        }
        break;
      } else {
        const nextAmmPx = this.getAmmPx(k, remainingQty - line.qty, side);
        if (this.ammCoverLine(nextAmmPx, price, line.px, side)) {
          const result = this.fill(line, remainingQty, sumCurrencyTokens, side);
          remainingQty = result.remainingQty;
          sumCurrencyTokens = result.sumCurrencyTokens;
          ++i;
          continue;
        }
        tradedQty = this.getAmmQty(k, line.px > price ? price : line.px, side);
        if (remainingQty < tradedQty) {
          tradedQty = remainingQty;
        }
        tradedSum = this.getAmmSum(k, tradedQty, side);
        if (tradedQty !== 0 && tradedSum !== 0) {
          remainingQty -= tradedQty;
          sumCurrencyTokens += tradedSum;
          this.changePoolAssetTokens(tradedQty, side);
          this.changePoolCrncyTokens(tradedSum, side);
          this.changePx(tradedQty, tradedSum, side);
        }
        if (this.ammCoverLine(ammPx, price, line.px, side)) {
          const result = this.fill(line, remainingQty, sumCurrencyTokens, side);
          remainingQty = result.remainingQty;
          sumCurrencyTokens = result.sumCurrencyTokens;
        }
        break;
      }
    }

    return {
      remainingQty,
      sumCurrencyTokens,
      px: this._px,
    };
  }
}
