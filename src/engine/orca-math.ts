// Canonical Whirlpool Q64.64 tick factors:
// https://github.com/orca-so/whirlpools/blob/main/rust-sdk/core/src/math/tick.rs
export const ORCA_MIN_TICK = -443636;
export const ORCA_MAX_TICK = 443636;
const Q64 = 2 ** 64;
const POSITIVE_FACTORS = [
  '79232123823359799118286999567',
  '79236085330515764027303304731',
  '79244008939048815603706035061',
  '79259858533276714757314932305',
  '79291567232598584799939703904',
  '79355022692464371645785046466',
  '79482085999252804386437311141',
  '79736823300114093921829183326',
  '80248749790819932309965073892',
  '81282483887344747381513967011',
  '83390072131320151908154831281',
  '87770609709833776024991924138',
  '97234110755111693312479820773',
  '119332217159966728226237229890',
  '179736315981702064433883588727',
  '407748233172238350107850275304',
  '2098478828474011932436660412517',
  '55581415166113811149459800483533',
  '38992368544603139932233054999993551',
].map(BigInt);
const NEGATIVE_FACTORS = [
  '18445821805675392311',
  '18444899583751176498',
  '18443055278223354162',
  '18439367220385604838',
  '18431993317065449817',
  '18417254355718160513',
  '18387811781193591352',
  '18329067761203520168',
  '18212142134806087854',
  '17980523815641551639',
  '17526086738831147013',
  '16651378430235024244',
  '15030750278693429944',
  '12247334978882834399',
  '8131365268884726200',
  '3584323654723342297',
  '696457651847595233',
  '26294789957452057',
  '37481735321082',
].map(BigInt);

/** Integer Whirlpool tick math, also used to correct floating-point logarithm estimates. */
export function orcaTickSqrtPrice(tick: number): bigint {
  const positive = tick >= 0;
  const shift = BigInt(positive ? 96 : 64);
  const factors = positive ? POSITIVE_FACTORS : NEGATIVE_FACTORS;
  let ratio = BigInt(1) << shift;
  const absolute = Math.abs(tick);
  for (let bit = 0; bit < factors.length; bit++) {
    if ((absolute & (1 << bit)) !== 0) ratio = (ratio * factors[bit]) >> shift;
  }
  return positive ? ratio >> BigInt(32) : ratio;
}

const MIN_SQRT = orcaTickSqrtPrice(ORCA_MIN_TICK);
const MAX_SQRT = orcaTickSqrtPrice(ORCA_MAX_TICK);

/** Price is always UI currency/asset, even when amounts are in contract units. */
export function orcaPriceToTick(
  price: number,
  assetDecimals: number,
  crncyDecimals: number,
  assetIsA: boolean,
): number {
  if (!Number.isFinite(price) || price <= 0) throw new RangeError('Orca price must be finite and positive');
  const decimalsA = assetIsA ? assetDecimals : crncyDecimals;
  const decimalsB = assetIsA ? crncyDecimals : assetDecimals;
  const rawPrice = (assetIsA ? price : 1 / price) * 10 ** (decimalsB - decimalsA);
  const sqrt = Math.sqrt(rawPrice) * Q64;
  if (!Number.isFinite(sqrt) || sqrt < Number(MIN_SQRT) || sqrt > Number(MAX_SQRT)) {
    throw new RangeError('Orca price is outside the supported tick range');
  }
  // Clamp rounding at the endpoints when converting the caller's floating-point price.
  const encoded = BigInt(Math.floor(sqrt));
  const sqrtPrice = encoded < MIN_SQRT ? MIN_SQRT : encoded > MAX_SQRT ? MAX_SQRT : encoded;
  let tick = Math.max(ORCA_MIN_TICK, Math.min(ORCA_MAX_TICK, Math.floor(Math.log(rawPrice) / Math.log1p(0.0001))));
  while (tick > ORCA_MIN_TICK && orcaTickSqrtPrice(tick) > sqrtPrice) tick--;
  while (tick < ORCA_MAX_TICK && orcaTickSqrtPrice(tick + 1) <= sqrtPrice) tick++;
  return tick;
}

export function orcaTickArrayStarts(tick: number, spacing: number, aToB: boolean, count: 3 | 5): number[] {
  const span = 88 * spacing;
  const base = Math.floor((tick + (count === 3 && !aToB ? spacing : 0)) / span) * span;
  const offsets = count === 5 ? [0, 1, 2, -1, -2] : aToB ? [0, -1, -2] : [0, 1, 2];
  const min = Math.floor(ORCA_MIN_TICK / span) * span;
  const max = Math.floor(ORCA_MAX_TICK / span) * span;
  return offsets.map((offset) => Math.max(min, Math.min(max, base + offset * span)));
}
