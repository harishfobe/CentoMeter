import { canonicalizePropertyType } from "../propertyTypeIds";
import { normalizeCommercialSubtype } from "../listingFit";
import {
  buildPayload,
  applicableFields,
  commercialTypes,
  toSqft,
} from "./postingFields";

export const postingSteps = [
  "Basics",
  "Price & area",
  "Property details",
  "Photos",
  "Location",
  "Review",
];

export function initialPostingData(
  source = {},
  { city = "Coimbatore", profile, agent, accountRole } = {},
) {
  const intent =
    source.intent === "RENT" || source.mode === "RENT" ? "RENT" : "SELL";
  const type = canonicalizePropertyType(source.type || "Land");
  const restored = { ...source };
  if (Object.keys(source).length && !source.postingFlowVersion)
    restored.areaUnit = "sq ft";
  return {
    title: "",
    description: "",
    price: "",
    area: "",
    areaUnit: "cents",
    beds: "",
    photos: [],
    features: [],
    landType: "Residential",
    city,
    locality: source.locality || source.address || "",
    location: null,
    seller: agent || accountRole === "agent" ? "Agent" : "Owner",
    shareDefault: { mode: "hidden", radiusM: 500 },
    whatsapp: "",
    ...restored,
    type,
    intent,
    postingFlowVersion: 2,
    contactName: source.contactName || profile?.name || agent?.name || "",
    contactPhone: source.contactPhone || profile?.phone || agent?.phone || "",
    ...(type === "Commercial"
      ? { subtype: normalizeCommercialSubtype(source.subtype, intent) }
      : {}),
  };
}

export function pinAddress(address = {}) {
  return {
    locality:
      address.village ||
      address.hamlet ||
      address.suburb ||
      address.neighbourhood ||
      address.quarter ||
      address.town ||
      "",
    city:
      address.city ||
      address.town ||
      address.municipality ||
      address.city_district ||
      "",
  };
}

export function listingFromPosting(data, id) {
  const result = buildPayload(data);
  // Preserve unrelated metadata on edits, while removing fields belonging to a different context.
  const legacy = { ...data };
  for (const key of ["builtUpArea", "carpetArea", "plotArea", "carParking"])
    delete legacy[key];
  const allKeys = new Set();
  for (const intent of ["SELL", "RENT"])
    for (const type of [
      "Land",
      "Apartment",
      "Independent House",
      "Villa",
      "PG",
      "Commercial",
    ]) {
      for (const subtype of type === "Commercial"
        ? commercialTypes({ intent })
        : [undefined])
        for (const field of applicableFields({
          intent,
          type,
          subtype,
          seller: "Agent",
        }))
          allKeys.add(field.key);
    }
  for (const key of allKeys) delete legacy[key];
  for (const key of ["landType", "subtype", "occupancy"])
    if (!(key in result)) delete legacy[key];
  if (data.seller !== "Agent")
    for (const key of ["agentId", "privacy", "approx"]) delete legacy[key];
  return {
    ...legacy,
    ...result,
    id,
    address: data.locality,
    areaUnit: "sq ft",
    area: toSqft(data),
    contactName: data.contactName.trim(),
    contactPhone: data.contactPhone,
    createdAt: data.createdAt || new Date().toISOString(),
    postedAt: data.postedAt || new Date().toISOString(),
  };
}
