/** Mode-aware budget bands and quick chips on top of the shared filter state. */

const LAKH = 100000;
const CRORE = 10000000;

export const BUDGET_BANDS = {
  BUY: [
    { id: "under-50l", label: "Under ₹50L", min: 0, max: 50 * LAKH },
    { id: "50-80l", label: "₹50–80L", min: 50 * LAKH, max: 80 * LAKH },
    { id: "80l-1.5cr", label: "₹80L–1.5Cr", min: 80 * LAKH, max: 1.5 * CRORE },
    { id: "1.5cr-plus", label: "₹1.5Cr+", min: 1.5 * CRORE, max: 0 },
  ],
  RENT: [
    { id: "under-10k", label: "Under ₹10k", min: 0, max: 10000 },
    { id: "10-20k", label: "₹10–20k", min: 10000, max: 20000 },
    { id: "20-35k", label: "₹20–35k", min: 20000, max: 35000 },
    { id: "35k-plus", label: "₹35k+", min: 35000, max: 0 },
  ],
  LAND: [
    {
      id: "under-10l-cent",
      label: "Under ₹10L/cent",
      min: 0,
      max: 10 * LAKH,
      pricePer: "cent",
    },
    {
      id: "10-15l-cent",
      label: "₹10–15L/cent",
      min: 10 * LAKH,
      max: 15 * LAKH,
      pricePer: "cent",
    },
    {
      id: "15-25l-cent",
      label: "₹15–25L/cent",
      min: 15 * LAKH,
      max: 25 * LAKH,
      pricePer: "cent",
    },
    {
      id: "25l-plus-cent",
      label: "₹25L+/cent",
      min: 25 * LAKH,
      max: 0,
      pricePer: "cent",
    },
  ],
};

export const budgetKind = (mode, type) =>
  type === "Land" ? "LAND" : mode === "RENT" ? "RENT" : "BUY";

export const budgetBandsFor = (mode, type) => BUDGET_BANDS[budgetKind(mode, type)];

export function activeBudget(filters, mode) {
  const pricePer = filters.pricePer || "";
  return (
    budgetBandsFor(mode, filters.type).find(
      (band) =>
        Number(filters.min) === band.min &&
        Number(filters.max) === band.max &&
        pricePer === (band.pricePer || ""),
    ) || null
  );
}

export function applyBudget(filters, band, mode) {
  const current = activeBudget(filters, mode);
  if (current?.id === band.id) {
    return { ...filters, min: 0, max: 0, pricePer: "" };
  }
  return {
    ...filters,
    min: band.min,
    max: band.max,
    pricePer: band.pricePer || "",
  };
}

/** Quick chips only for fields present on sample listings. */
export function quickFiltersFor({ mode, type }) {
  const chips = [
    { id: "owner", label: "Owner only", key: "seller", value: "Owner" },
    {
      id: "ready",
      label: "Ready to move",
      key: "available",
      value: "Ready to move",
    },
  ];
  if (mode === "RENT") {
    chips.push({
      id: "brokerage",
      label: "No brokerage",
      key: "brokerage",
      value: "None",
    });
  }
  if (type === "Land") {
    chips.push(
      {
        id: "road",
        label: "Road access",
        key: "feature",
        value: "Road access",
      },
      { id: "dtcp", label: "DTCP", key: "feature", value: "DTCP Approved" },
    );
  }
  return chips;
}
