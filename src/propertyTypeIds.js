/** Canonical TN listing type ids → stored string values used in JSON / drafts. */
export const PROPERTY_TYPE = {
  independent_house: "Independent House",
  villa: "Villa",
  apartment: "Apartment",
  land: "Land",
  commercial: "Commercial",
  pg: "PG",
};

const TYPE_ALIASES = {
  independent_house: PROPERTY_TYPE.independent_house,
  "independent house": PROPERTY_TYPE.independent_house,
  gated_villa: PROPERTY_TYPE.villa,
  villa: PROPERTY_TYPE.villa,
  apartment: PROPERTY_TYPE.apartment,
  flat: PROPERTY_TYPE.apartment,
  land: PROPERTY_TYPE.land,
  plot: PROPERTY_TYPE.land,
  commercial: PROPERTY_TYPE.commercial,
  pg: PROPERTY_TYPE.pg,
};

/** Normalize snake_case / legacy aliases to Title Case storage values. */
export function canonicalizePropertyType(type) {
  if (type == null || type === "All") return type;
  const raw = String(type).trim();
  if (!raw) return raw;
  if (Object.values(PROPERTY_TYPE).includes(raw)) return raw;
  const lower = raw.toLowerCase();
  if (TYPE_ALIASES[lower]) return TYPE_ALIASES[lower];
  if (TYPE_ALIASES[raw]) return TYPE_ALIASES[raw];
  return raw;
}

export const WATER_SOURCES = ["Siruvani", "Corporation", "Borewell"];

export const PREFERRED_TENANTS = [
  "Family",
  "Family / Professionals",
  "Working professionals",
  "Bachelor",
  "Company",
  "Anyone",
];

export const VILLA_AMENITIES = [
  "Clubhouse",
  "Security",
  "Pool",
  "Power Backup",
];

export const isIndependentHouse = (type) =>
  canonicalizePropertyType(type) === PROPERTY_TYPE.independent_house;

export const isVilla = (type) =>
  canonicalizePropertyType(type) === PROPERTY_TYPE.villa;

export const isApartment = (type) =>
  canonicalizePropertyType(type) === PROPERTY_TYPE.apartment;

export const isHouseOrVillaType = (type) =>
  isIndependentHouse(type) || isVilla(type);
