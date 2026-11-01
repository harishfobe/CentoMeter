// One cent is 1/100 acre. Keep conversion and displayed pricing on one basis.
export const SQFT_PER_CENT = 435.6;
export const toCents = (area) => Number(area) / SQFT_PER_CENT;
export const toSqft = (cents) =>
  Math.round(Number(cents) * SQFT_PER_CENT * 100) / 100;
export const positive = (value) =>
  Number.isFinite(Number(value)) && Number(value) > 0;
export const landNumber = (value) =>
  Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 });
export const landArea = (area) =>
  positive(area)
    ? `${landNumber(area)} sq ft · ${landNumber(toCents(area))} cents`
    : "Not specified";
export const landDimensions = (p) =>
  positive(p.length) && positive(p.width)
    ? `${landNumber(p.length)} × ${landNumber(p.width)} ft`
    : "Not specified";
