import {
  commercialSubtypesFor,
  furnishingOptionsFor,
  POSSESSION_OPTIONS,
  RENT_AVAILABLE_OPTIONS,
  CONDITION_OPTIONS,
  DECLARATION_YES_NO_UNSURE,
  DECLARATION_YES_NO_NA_UNSURE,
} from "../listingFit";
import {
  PREFERRED_TENANTS,
  VILLA_AMENITIES,
  WATER_SOURCES,
} from "../propertyTypeIds";
// Posting UI descriptors mapped to existing repository fields, not a new property model.
// Source: listingFit.js, HouseVillaDetails.jsx, LandDetails.jsx, CommercialDetails.jsx, PgDetails.jsx.
export const present = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";
export const commercialTypes = (d) => commercialSubtypesFor(d.intent);
export const home = (d) =>
  ["Apartment", "Independent House", "Villa"].includes(d.type);
export const openLand = (d) =>
  d.type === "Land" || (d.type === "Commercial" && d.subtype === "Land");
export const areaBasis = (d) =>
  openLand(d)
    ? "Plot area"
    : d.type === "PG"
      ? "Room area"
      : d.type === "Commercial" && d.intent === "RENT"
        ? "Carpet area"
        : "Built-up area";
export const factors = { "sq ft": 1, cents: 435.6, acres: 43560 };
export const toSqft = (d) =>
  Number(d.area) * (openLand(d) ? factors[d.areaUnit] || 1 : 1);
const n = (key, label, extra = {}) => ({
  key,
  label,
  type: "number",
  optional: true,
  ...extra,
});
const t = (key, label, extra = {}) => ({
  key,
  label,
  type: "text",
  optional: true,
  ...extra,
});
const s = (key, label, values, extra = {}) => ({
  key,
  label,
  type: "select",
  values,
  optional: true,
  ...extra,
});
const multi = (key, label, values) => ({
  key,
  label,
  type: "multi",
  values,
  optional: true,
});
const g = (title, fields, { open = false, hint = "" } = {}) => ({
  title,
  fields,
  open,
  hint,
});
const facing = () =>
  s("facing", "Facing direction", [
    "North",
    "North-East",
    "East",
    "South-East",
    "South",
    "South-West",
    "West",
    "North-West",
  ]);
const possession = () =>
  s("possessionStatus", "Possession", POSSESSION_OPTIONS);
const available = () =>
  s("available", "Available from", RENT_AVAILABLE_OPTIONS);
const furnishing = (d) =>
  s("furnishing", "Furnishing", furnishingOptionsFor(d.type));
const tenant = () =>
  s("preferredTenant", "Preferred tenant", PREFERRED_TENANTS);
const water = () => s("water", "Water source", WATER_SOURCES);
const ownership = () =>
  s("ownershipType", "Ownership", ["Freehold", "Leasehold"]);
const age = () =>
  n("propertyAge", "Property age (years)", {
    integer: true,
    min: 0,
    hint: "Enter 0 for a new property.",
  });
const condition = () => s("condition", "Property condition", CONDITION_OPTIONS);
const parking = () =>
  n("carParking", "Car parking spaces", {
    integer: true,
    min: 0,
    hint: "Enter 0 if no car space is provided.",
  });
const rentRules = () =>
  g(
    "Availability & house rules",
    [available(), tenant(), s("pets", "Pets allowed", ["Yes", "No"])],
    { open: true },
  );
const access = (d) =>
  g(
    "Dimensions & access",
    [
      n("width", "Plot width (ft)", { min: 0.01 }),
      n("length", "Plot length (ft)", { min: 0.01 }),
      n("roadWidth", "Road width (ft)", { min: 0.01 }),
      facing(),
      ...(d.type === "Land"
        ? [
            s("roadAccess", "Road access", [
              "Public road",
              "Private road",
              "No direct access",
              "Not sure",
            ]),
          ]
        : []),
    ],
    {
      hint: "Not sure about a measurement? Leave it blank rather than guessing.",
    },
  );
const disclosures = () =>
  g(
    "Registration & seller declarations",
    [
      multi("approvals", "Approval claimed by seller", ["DTCP", "RERA"]),
      t("reraNumber", "RERA registration number", {
        hint: "Only enter a known number. A seller claim is not CentoMeter verification.",
      }),
    ],
    { hint: "Optional. No ownership-document upload is required." },
  );

export function priceExtras(d) {
  const fields = [];
  if (d.intent === "RENT")
    fields.push(
      n("deposit", "Security deposit (₹)", { min: 0, money: true }),
      n("maintenance", "Monthly maintenance (₹)", { min: 0, money: true }),
    );
  else if (d.type === "Apartment")
    fields.push(
      n("maintenance", "Monthly maintenance (₹)", { min: 0, money: true }),
    );
  if (d.seller === "Agent")
    fields.push(n("brokerage", "Brokerage (₹)", { min: 0, money: true }));
  return fields;
}
export function detailGroups(d) {
  const rent = d.intent === "RENT";
  if (d.type === "Land")
    return [
      access(d),
      g(
        "Utilities & plot features",
        [
          s("water", "Water availability", [
            "Available",
            "Not available",
            "Not sure",
            ...WATER_SOURCES,
          ]),
          s("electricity", "Electricity", [
            "Available",
            "Not available",
            "Not sure",
          ]),
          ...(d.landType === "Agricultural"
            ? [
                s("irrigation", "Irrigation", [
                  "Available",
                  "Not available",
                  "Not sure",
                ]),
              ]
            : []),
          multi("features", "Plot features", [
            "Corner plot",
            "Road access",
            "Gated community",
            "Near main road",
            "Water connection",
            "Electricity connection",
          ]),
        ],
        { open: true },
      ),
      g("Ownership", [ownership()]),
      g(
        "Land declarations",
        [
          s("pattaAvailable", "Patta available", DECLARATION_YES_NO_UNSURE),
          s(
            "planningApproval",
            "Planning / layout approval",
            DECLARATION_YES_NO_NA_UNSURE,
          ),
          s("reraRegistered", "RERA registered", DECLARATION_YES_NO_NA_UNSURE),
        ],
        {
          hint: "These are seller-provided declarations and have not been independently verified by CentoMeter. No document upload is required.",
        },
      ),
      disclosures(),
    ];
  if (home(d)) {
    const apartment = d.type === "Apartment",
      villa = d.type === "Villa";
    const groups = [
      g(
        "Layout & configuration",
        [
          n("beds", "Bedrooms / BHK", {
            optional: false,
            integer: true,
            min: 0,
            hint: "Enter 0 for Studio / 1 RK. Enter an exact count for 5 or more bedrooms.",
          }),
          n("baths", "Bathrooms", { integer: true, min: 0 }),
          ...(apartment || villa
            ? [n("balconies", "Balconies", { integer: true, min: 0 })]
            : []),
          ...(!villa || !rent
            ? [
                n("carpetArea", "Carpet area (sq ft)", {
                  min: 0.01,
                  hint: "Optional usable internal area. Never estimate this from built-up area.",
                }),
              ]
            : []),
          ...(!apartment && (!villa || !rent)
            ? [
                n("plotArea", "Land / plot area (sq ft)", {
                  min: 0.01,
                  hint: "Separate from the built-up area you entered earlier.",
                }),
              ]
            : []),
        ],
        { open: true },
      ),
    ];
    if (apartment)
      groups.push(
        g(
          "Floor & parking",
          [
            t("floor", "Property floor", { placeholder: "e.g. Ground or 5" }),
            n("totalFloors", "Total building floors", {
              integer: true,
              min: 1,
            }),
            parking(),
            facing(),
          ],
          { open: true },
        ),
      );
    else
      groups.push(
        g(
          "Building & parking",
          [
            t("floorsLabel", "Floors", { placeholder: "e.g. G or G+1" }),
            parking(),
            facing(),
            ...(villa ? [] : [water()]),
          ],
          { open: true },
        ),
      );
    groups.push(
      g(
        "Furnishing & condition",
        [
          furnishing(d),
          ...(!rent ? [age(), condition(), possession(), ownership()] : []),
        ],
        { open: true },
      ),
    );
    if (villa)
      groups.push(
        g(
          "Gated community",
          [
            t("projectName", "Project / community name"),
            s("community", "Community", ["Gated"]),
            multi("features", "Community amenities", VILLA_AMENITIES),
          ],
          { open: true },
        ),
      );
    if (apartment)
      groups.push(
        g("Amenities", [
          multi("features", "Amenities", [
            "Parking",
            "Balcony",
            "Lift",
            "Power Backup",
            "Security",
            "Gym",
            "CCTV",
          ]),
        ]),
      );
    if (!apartment && !rent) groups.push(access(d));
    if (rent) groups.push(rentRules());
    if (!rent)
      groups.push(
        g("Registration", [
          t("reraNumber", "RERA registration number", {
            hint: "Optional. Enter it only if known; do not guess.",
          }),
        ]),
      );
    return groups;
  }
  if (d.type === "PG")
    return [
      g(
        "Room & bathroom",
        [
          s("bathroom", "Bathroom", ["Attached", "Shared"]),
          s("ac", "Air conditioning", ["Yes", "No"]),
          furnishing(d),
        ],
        { open: true },
      ),
      g(
        "Meals & recurring charges",
        [
          s("meals", "Meals", ["Included", "Not included"]),
          s("housekeeping", "Housekeeping", ["Included", "Not included"]),
          s("electricity", "Electricity charges", [
            "Included",
            "As per usage",
            "Extra",
          ]),
        ],
        { open: true },
      ),
      g(
        "Availability & stay",
        [
          available(),
          tenant(),
          s("noticePeriod", "Notice period", [
            "15 days",
            "1 month",
            "2 months",
          ]),
        ],
        { open: true },
      ),
      g(
        "Included services",
        [
          multi("services", "Services", [
            "Wi-Fi",
            "Laundry",
            "CCTV",
            "Security",
            "Power backup",
            "Two-wheeler parking",
          ]),
        ],
        { open: true },
      ),
    ];
  if (d.type === "Commercial") {
    if (openLand(d))
      return [
        g(
          "Land access",
          [
            s("roadAccess", "Road access", [
              "Main road",
              "Interior road",
              "Lane",
            ]),
            t("suitableFor", "Suitable for", {
              placeholder: "e.g. Commercial development",
            }),
          ],
          { open: true },
        ),
        g(
          "Utilities & parking",
          [
            s("parking", "Parking", [
              "Common",
              "Dedicated",
              "Available",
              "Not available",
            ]),
            s("powerBackup", "Power backup", ["Available", "Not available"]),
            s("waterSupply", "Water supply", ["Available", "Not available"]),
          ],
          { open: true },
        ),
        g("Availability", [available()], { open: true }),
      ];
    if (rent)
      return [
        g(
          "Space & access",
          [
            t("floor", "Floor", { placeholder: "e.g. Ground or 2" }),
            n("frontage", "Frontage (ft)", { min: 0.01 }),
            n("washrooms", "Washrooms", { integer: true, min: 0 }),
            s("parking", "Parking", [
              "Common",
              "Dedicated",
              "Available",
              "Not available",
            ]),
            t("suitableFor", "Suitable for", {
              placeholder:
                d.subtype === "Shop" ? "e.g. Retail / Showroom" : "e.g. Office",
            }),
          ],
          { open: true },
        ),
        g(
          "Fit-out & availability",
          [
            furnishing(d),
            s("powerBackup", "Power backup", ["Available", "Not available"]),
            available(),
          ],
          { open: true },
        ),
        g(
          "Facilities",
          [
            multi("facilities", "Facilities", [
              "CCTV",
              "Power backup",
              "Common parking",
              "Water supply",
              "Main road access",
            ]),
          ],
          { open: true },
        ),
      ];
    return [
      g(
        "Building & income",
        [
          t("floorsLabel", "Number of floors", { placeholder: "e.g. G+2" }),
          ...(d.subtype === "Building"
            ? [
                n("shopCount", "Number of shops", { integer: true, min: 0 }),
                n("monthlyRent", "Existing monthly rental income (₹)", {
                  min: 0,
                  money: true,
                  hint: "This is existing income, not the asking sale price.",
                }),
              ]
            : []),
          s("carParking", "Car parking", ["Available", "Not available"]),
          s("roadAccess", "Road access", [
            "Main road",
            "Interior road",
            "Lane",
          ]),
        ],
        { open: true },
      ),
      g(
        "Utilities & possession",
        [
          s("powerBackup", "Power backup", ["Available", "Not available"]),
          s("waterSupply", "Water supply", ["Available", "Not available"]),
          possession(),
          condition(),
          ownership(),
        ],
        { open: true },
      ),
      g(
        "Facilities",
        [
          multi("facilities", "Facilities", [
            "Parking",
            "CCTV",
            "Power backup",
            "Water supply",
            "Separate meters",
            "Main road access",
          ]),
        ],
        { open: true },
      ),
    ];
  }
  return [];
}

export function applicableFields(d) {
  return [...priceExtras(d), ...detailGroups(d).flatMap((g) => g.fields)];
}
const numericKeys = new Set([
  "beds",
  "baths",
  "balconies",
  "totalFloors",
  "carpetArea",
  "plotArea",
  "width",
  "length",
  "roadWidth",
  "propertyAge",
  "shopCount",
  "monthlyRent",
  "washrooms",
  "frontage",
  "deposit",
  "maintenance",
  "brokerage",
]);
export function buildPayload(d) {
  const result = {
    intent: d.intent,
    mode: d.intent === "RENT" ? "RENT" : "BUY",
    type: d.type,
    seller: d.seller,
    posterRole: d.seller,
    title:
      d.title.trim() ||
      `${d.locality || d.city} · ${d.type === "Commercial" ? d.subtype : d.type === "Land" ? d.landType + " plot" : d.type}`,
    price: Number(d.price),
    area: toSqft(d),
    city: d.city,
    locality: d.locality,
    location: d.location,
    description: d.description.trim(),
    photos: [...d.photos],
    shareDefault:
      d.seller === "Agent"
        ? {
            ...d.shareDefault,
            mode: d.shareDefault?.mode === "radius" ? "radius" : "hidden",
          }
        : { mode: "exact" },
  };
  if (present(d.negotiable))
    result.negotiable = d.negotiable === true || d.negotiable === "true";
  if (d.type === "Land") {
    result.landType = d.landType;
    result.subtype = d.landType;
  }
  if (d.type === "Commercial") result.subtype = d.subtype;
  if (
    home(d) ||
    (d.type === "Commercial" && !openLand(d) && d.intent === "SELL")
  )
    result.builtUpArea = toSqft(d);
  if (d.type === "Commercial" && d.intent === "RENT" && !openLand(d))
    result.carpetArea = toSqft(d);
  if (d.type === "PG" && present(d.occupancy)) result.occupancy = d.occupancy;
  for (const f of applicableFields(d)) {
    const v = d[f.key];
    if (!present(v) || (Array.isArray(v) && !v.length)) continue;
    result[f.key] = numericKeys.has(f.key)
      ? Number(v)
      : Array.isArray(v)
        ? [...v]
        : v;
  }
  if (
    applicableFields(d).some((f) => f.key === "carParking") &&
    present(d.carParking) &&
    /^\d+$/.test(String(d.carParking))
  )
    result.carParking = Number(d.carParking);
  if (present(result.reraNumber)) result.reraNo = result.reraNumber;
  // Match the repository's services/facilities fields; do not merge unrelated option pools.
  return result;
}

export function validateDetails(d) {
  const errors = {};
  for (const f of applicableFields(d)) {
    const value = d[f.key];
    if (!f.optional && !present(value))
      errors[f.key] = `Enter ${f.label.toLowerCase()}.`;
    if (
      f.type === "number" &&
      present(value) &&
      (!Number.isFinite(Number(value)) ||
        Number(value) < (f.min ?? 0) ||
        (f.integer && !Number.isInteger(Number(value))))
    )
      errors[f.key] =
        `Enter ${f.integer ? "a whole number" : "a number"} ${f.min > 0 ? "greater than zero" : "of zero or more"}.`;
    if (f.type === "select" && present(value) && !f.values.includes(value))
      errors[f.key] = "Choose one of the available options.";
  }
  if (
    applicableFields(d).some((f) => f.key === "carpetArea") &&
    present(d.carpetArea) &&
    Number(d.carpetArea) > toSqft(d) &&
    home(d)
  )
    errors.carpetArea = "Carpet area cannot exceed the built-up area.";
  if (
    present(d.floor) &&
    /^\d+$/.test(d.floor) &&
    present(d.totalFloors) &&
    Number(d.floor) > Number(d.totalFloors)
  )
    errors.floor = "Property floor cannot exceed total building floors.";
  if (
    applicableFields(d).some((f) => f.key === "width") &&
    (present(d.width) || present(d.length)) &&
    (!present(d.width) || !present(d.length))
  )
    errors[present(d.width) ? "length" : "width"] =
      "Enter both dimensions, or leave both blank.";
  return errors;
}

export function changeContext(d, key, value) {
  const next = { ...d, [key]: value };
  const notes = [];
  if (key === "intent" && d.intent !== value) {
    next.price = "";
    notes.push("Enter the price for the new transaction.");
    if (value === "RENT" && next.type === "Land") {
      next.type = "Commercial";
      next.subtype = "Land";
      notes.push("Rental land is listed under Commercial · Land.");
    }
    if (value === "SELL" && next.type === "PG") {
      next.type = "Apartment";
      notes.push(
        "PG is available for rent only; choose the sale property type.",
      );
    }
  }
  if (
    next.type === "Commercial" &&
    !commercialTypes(next).includes(next.subtype)
  )
    next.subtype = commercialTypes(next)[0];
  const oldBasis = areaBasis(d),
    newBasis = areaBasis(next);
  if (oldBasis !== newBasis) {
    next.area = "";
    next.areaUnit = openLand(next) ? "cents" : "sq ft";
    notes.push("Area cleared because its measurement basis changed.");
  }
  if (!(next.intent === "SELL" && home(next)) && next.seller === "Builder") {
    next.seller = "Owner";
    notes.push("Builder role is available only for homes for sale.");
  }
  const allowed = new Set(applicableFields(next).map((f) => f.key));
  const previous = new Set(applicableFields(d).map((f) => f.key));
  let removed = 0;
  for (const field of previous)
    if (!allowed.has(field) && present(next[field])) {
      delete next[field];
      removed++;
    }
  if (next.type !== "PG") delete next.occupancy;
  if (next.type !== "Land") delete next.landType;
  if (next.type === "Land" && !next.landType) next.landType = "Residential";
  if (next.areaUnit === "acres" && next.landType !== "Agricultural") {
    if (Number(next.area) > 0) next.area = String(toSqft(next));
    next.areaUnit = "sq ft";
    notes.push("Area converted to square feet for this property.");
  }
  if (next.type !== "Commercial") delete next.subtype;
  for (const f of applicableFields(next))
    if (
      f.type === "select" &&
      present(next[f.key]) &&
      !f.values.includes(next[f.key])
    ) {
      delete next[f.key];
      removed++;
    }
  for (const f of applicableFields(next)) {
    if (f.type === "multi" && Array.isArray(next[f.key]))
      next[f.key] = next[f.key].filter((v) => f.values.includes(v));
    if (
      f.type === "number" &&
      present(next[f.key]) &&
      !Number.isFinite(Number(next[f.key]))
    ) {
      delete next[f.key];
      removed++;
    }
  }
  if (removed)
    notes.push("Details that do not apply to this property were cleared.");
  return { data: next, notice: notes.join(" ") };
}
