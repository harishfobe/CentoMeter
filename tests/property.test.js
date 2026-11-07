import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  money,
  indianMobile,
  normalizePostedListing,
  sortProperties,
  emiPayment,
} from "../src/PropertyModel";
import { matches, filterDefaults, Costs } from "../src/Discovery";
const draft = {
  id: "new",
  title: "A posted home",
  price: "42000",
  area: "1200",
  location: [11.0168, 76.9558],
  intent: "RENT",
  type: "Apartment",
};
describe("money", () => {
  it("formats crore and lakh without trailing zeroes", () => {
    expect(money(10000000)).toBe("₹1 Cr");
    expect(money("100000")).toBe("₹1 L");
    expect(money(12800000)).toBe("₹1.28 Cr");
    expect(money(42000)).toBe("₹42,000");
  });
  it("handles invalid values", () => {
    for (const x of [undefined, NaN, Infinity, "bad", Symbol("x")])
      expect(money(x)).toBe("—");
  });
});
describe("Indian phone validation", () => {
  it("accepts national and +91 formats", () => {
    for (const x of ["9000000000", "+91 90000-00000", "919000000000"])
      expect(indianMobile(x)).toBe("9000000000");
  });
  it("rejects incomplete, foreign and invalid numbers", () => {
    for (const x of [
      "",
      undefined,
      "5000000000",
      "90000",
      "+1 9000000000",
      "hello9000000000",
    ])
      expect(indianMobile(x)).toBe(null);
  });
});
describe("posted listings", () => {
  it.each(["Apartment", "PG", "Land"])(
    "normalizes %s with missing optional fields safely",
    (type) => {
      const p = normalizePostedListing({ ...draft, type });
      expect(p.mode).toBe("RENT");
      expect(p.deposit).toBe(null);
      expect(p.maintenance).toBe(null);
      expect(p.features).toEqual([]);
      expect(p.freshness).toBe("Just now");
      expect(() =>
        [
          p.bathroom,
          p.meals,
          p.occupancy,
          p.ac,
          p.floor,
          p.pets,
          p.subtype,
        ].map((x) => x.toLowerCase()),
      ).not.toThrow();
      expect(() => p.area.toLocaleString("en-IN")).not.toThrow();
      expect(() =>
        renderToStaticMarkup(React.createElement(Costs, { p, money })),
      ).not.toThrow();
    },
  );
  it("keeps supplied fields and normalizes numbers", () => {
    const p = normalizePostedListing({
      ...draft,
      type: "PG",
      deposit: "24000",
      maintenance: "1000",
      occupancy: "Twin sharing",
      features: ["Wi-Fi"],
      baths: "2",
      description: "  Quiet lane with morning light.  ",
    });
    expect(p.deposit).toBe(24000);
    expect(p.baths).toBe(2);
    expect(p.occupancy).toBe("Twin sharing");
    expect(p.description).toBe("Quiet lane with morning light.");
  });
  it("stores an empty About the property description when omitted", () => {
    expect(normalizePostedListing(draft).description).toBe("");
    expect(
      normalizePostedListing({ ...draft, description: "   " }).description,
    ).toBe("");
  });
  it("rejects invalid location and prices", () => {
    for (const patch of [
      { location: null },
      { location: [null, 77] },
      { location: [91, 77] },
      { price: "bad" },
      { area: 0 },
    ])
      expect(normalizePostedListing({ ...draft, ...patch })).toBe(null);
  });
});
describe("listing fit filters", () => {
  it("matches possession Ready now to Ready to move listings", async () => {
    const {
      matchesPossessionFilter,
      matchesFloorFilter,
    } = await import("../src/listingFit.js");
    expect(
      matchesPossessionFilter(
        { possessionStatus: "Ready to move", available: "Ready now" },
        "Ready now",
      ),
    ).toBe(true);
    expect(
      matchesPossessionFilter(
        { possessionStatus: "Ready to move" },
        "Ready to move",
      ),
    ).toBe(true);
    expect(
      matchesPossessionFilter(
        { possessionStatus: "Within 30 days" },
        "Under construction",
      ),
    ).toBe(true);
    expect(matchesFloorFilter("Ground", "Ground")).toBe(true);
    expect(matchesFloorFilter("2", "1–3")).toBe(true);
    expect(matchesFloorFilter("9", "4+")).toBe(true);
    expect(matchesFloorFilter("2", "4+")).toBe(false);
  });
  it("matches commercial Building subtype and facilities from sample data", () => {
    const commercial = {
      type: "Commercial",
      mode: "BUY",
      price: 28000000,
      beds: 0,
      furnishing: "Semi-furnished",
      available: "Ready now",
      possessionStatus: "Ready to move",
      subtype: "Building",
      facilities: ["Parking", "CCTV"],
      features: ["Parking", "CCTV"],
      area: 4000,
      seller: "Owner",
    };
    expect(
      matches(commercial, {
        ...filterDefaults,
        type: "Commercial",
        subtype: "Building",
        feature: "Parking",
        available: "Ready to move",
      }),
    ).toBe(true);
    expect(
      matches(commercial, {
        ...filterDefaults,
        type: "Commercial",
        subtype: "Office",
      }),
    ).toBe(false);
  });
  it("exposes RENT types without top-level Land and rent commercial subtypes", async () => {
    const { commercialSubtypesFor, normalizeCommercialSubtype } = await import(
      "../src/listingFit.js"
    );
    const { cardTypeLabel, propertyTypesFor } = await import(
      "../src/PropertyTypes.jsx"
    );
    expect(propertyTypesFor("RENT")).toEqual([
      "Independent House",
      "Villa",
      "Apartment",
      "Commercial",
      "PG",
    ]);
    expect(propertyTypesFor("RENT")).not.toContain("Land");
    expect(commercialSubtypesFor("RENT")).toEqual([
      "Land",
      "Shop",
      "Office Space",
    ]);
    expect(normalizeCommercialSubtype("Office", "RENT")).toBe("Office Space");
    expect(
      cardTypeLabel("Commercial", {
        mode: "RENT",
        subtype: "Office Space",
      }),
    ).toBe("Office Space");
    expect(
      cardTypeLabel("Commercial", { mode: "RENT", subtype: "Land" }),
    ).toBe("Commercial Land");
    expect(cardTypeLabel("Apartment")).toBe("Apartment / Flat");
  });
});

describe("matches", () => {
  const p = {
    ...normalizePostedListing(draft),
    type: "Villa",
    beds: 3,
    features: ["Parking"],
    facing: "East",
  };
  it("keeps Independent House and Villa as distinct filters", () => {
    expect(
      matches(p, {
        ...filterDefaults,
        type: "Villa",
        beds: "2,3",
        min: 40000,
        max: 50000,
        feature: "Parking",
        facing: "East",
      }),
    ).toBe(true);
    expect(
      matches(p, {
        ...filterDefaults,
        type: "Independent House",
        beds: "2,3",
        min: 40000,
        max: 50000,
        feature: "Parking",
        facing: "East",
      }),
    ).toBe(false);
  });
  it("still honors legacy House filter for both types", () => {
    expect(
      matches(p, {
        ...filterDefaults,
        type: "House",
        beds: "2,3",
        min: 40000,
        max: 50000,
        feature: "Parking",
        facing: "East",
      }),
    ).toBe(true);
  });
  it("rejects mismatched type, budget, bedrooms and facing", () => {
    for (const patch of [
      { type: "Land" },
      { max: 10000 },
      { beds: "2" },
      { facing: "West" },
    ])
      expect(matches(p, { ...filterDefaults, ...patch })).toBe(false);
  });
  it("converts minimum land area in cents", () =>
    expect(
      matches(
        { ...p, type: "Land", area: 871.2 },
        { ...filterDefaults, minArea: 2, unit: "cent" },
      ),
    ).toBe(true));
  it("handles missing features", () =>
    expect(
      matches(
        { ...p, features: undefined },
        { ...filterDefaults, feature: "Parking" },
      ),
    ).toBe(false));
});

describe("property ordering", () => {
  const items = [
    {
      id: "a",
      type: "Land",
      mode: "BUY",
      price: 1000000,
      area: 1000,
      postedAt: "2026-10-01",
    },
    {
      id: "b",
      type: "Land",
      mode: "BUY",
      price: 2000000,
      area: 10000,
      postedAt: "2026-10-02",
    },
  ];
  it("uses selected land unit for price sorting", () => {
    expect(sortProperties(items, "low", "total")[0].id).toBe("a");
    expect(sortProperties(items, "low", "cent")[0].id).toBe("b");
    expect(sortProperties(items, "high", "sqft")[0].id).toBe("a");
  });
  it("sorts recommended/newest and per-square-foot", () => {
    for (const mode of ["recommended", "newest", "sqft"])
      expect(sortProperties(items, mode)[0].id).toBe("b");
  });
});

describe("EMI estimate", () => {
  it("handles interest and zero interest", () => {
    expect(emiPayment(1000000, 9, 20)).toBeCloseTo(8997.26, 2);
    expect(emiPayment(120000, 0, 10)).toBe(1000);
  });
  it("rejects invalid amounts and terms", () => {
    expect(emiPayment(-1, 9, 20)).toBe(null);
    expect(emiPayment(1000, 9, 0)).toBe(null);
    expect(emiPayment(1000, 31, 20)).toBe(null);
  });
  it("is buy-only for every property type", async () => {
    const { showsEmi, EmiCalculator } = await import(
      "../src/PropertyExtras.jsx"
    );
    for (const type of [
      "Independent House",
      "Villa",
      "Apartment",
      "Commercial",
      "PG",
      "Land",
    ]) {
      expect(showsEmi({ mode: "RENT", type, price: 100000 })).toBe(false);
      expect(showsEmi({ mode: "BUY", type, price: 100000 })).toBe(true);
      expect(
        renderToStaticMarkup(
          React.createElement(EmiCalculator, {
            p: { mode: "RENT", type, price: 100000 },
          }),
        ),
      ).toBe("");
    }
    expect(showsEmi({ mode: "RENT" })).toBe(false);
    expect(showsEmi(null)).toBe(false);
    expect(
      renderToStaticMarkup(
        React.createElement(EmiCalculator, {
          p: { mode: "BUY", type: "Apartment", price: 1000000 },
        }),
      ),
    ).toContain("EMI calculator");
  });
});

describe("commercial property details", () => {
  it("builds the reference commercial buy detail rows in order", async () => {
    const {
      buildCommercialDetailRows,
      commercialTypeEyebrow,
      commercialBuyPriceMeta,
      commercialHighlightPills,
      commercialFacilities,
      usesCommercialDetailLayout,
    } = await import("../src/CommercialDetails.jsx");
    const listing = {
      type: "Commercial",
      mode: "BUY",
      subtype: "Building",
      area: 4000,
      builtUpArea: 4000,
      floorsLabel: "G+2",
      shopCount: 6,
      monthlyRent: 165000,
      carParking: "Available",
      roadAccess: "Main road",
      powerBackup: "Available",
      waterSupply: "Available",
      possessionStatus: "Ready to move",
      condition: "Resale",
      ownershipType: "Freehold",
      negotiable: true,
      price: 28000000,
      facilities: [
        "Parking",
        "CCTV",
        "Power backup",
        "Water supply",
        "Separate meters",
        "Main road access",
      ],
      commercialHighlights: [
        "6 shops",
        "Rental income",
        "Main road access",
        "Parking available",
      ],
    };
    expect(usesCommercialDetailLayout(listing)).toBe(true);
    expect(commercialTypeEyebrow(listing)).toBe(
      "FOR SALE · COMMERCIAL · BUILDING",
    );
    expect(commercialBuyPriceMeta(listing)).toEqual({
      perSqft: "₹7,000 / sqft",
      negotiable: true,
    });
    const rows = buildCommercialDetailRows(listing).filter(
      (row) => row.value != null,
    );
    expect(rows.map((row) => row.label)).toEqual([
      "Property type",
      "Built-up area",
      "Number of floors",
      "Number of shops",
      "Monthly rental income",
      "Car parking",
      "Road access",
      "Power backup",
      "Water supply",
      "Possession",
      "Condition",
      "Ownership",
      "Price negotiable",
    ]);
    expect(rows.find((row) => row.label === "Monthly rental income").value).toBe(
      "₹1.65 L / month",
    );
    expect(commercialHighlightPills(listing)).toEqual([
      "6 shops",
      "Rental income",
      "Main road access",
      "Parking available",
    ]);
    expect(commercialFacilities(listing)).toEqual(listing.facilities);
  });
});

describe("pg listing details", () => {
  it("builds the reference rent PG detail rows and services", async () => {
    const {
      buildPgDetailRows,
      pgHighlightPills,
      pgRentPriceMeta,
      pgServices,
      pgTypeEyebrow,
      usesPgDetailLayout,
    } = await import("../src/PgDetails.jsx");
    const listing = {
      type: "PG",
      mode: "RENT",
      price: 9500,
      deposit: 10000,
      occupancy: "Twin sharing",
      bathroom: "Attached",
      ac: "Yes",
      meals: "Included",
      furnishing: "Fully furnished",
      housekeeping: "Included",
      electricity: "As per usage",
      available: "Ready now",
      preferredTenant: "Working professionals",
      noticePeriod: "1 month",
      services: [
        "Wi-Fi",
        "Laundry",
        "CCTV",
        "Security",
        "Power backup",
        "Two-wheeler parking",
      ],
      pgHighlights: [
        "Meals included",
        "Wi-Fi",
        "Housekeeping",
        "Attached bathroom",
      ],
    };
    expect(usesPgDetailLayout(listing)).toBe(true);
    expect(pgTypeEyebrow(listing)).toBe("FOR RENT · PG");
    expect(pgRentPriceMeta(listing)).toBe("Meals included · ₹10,000 deposit");
    const rows = buildPgDetailRows(listing).filter((row) => row.value != null);
    expect(rows.map((row) => row.label)).toEqual([
      "Occupancy",
      "Bathroom",
      "Air conditioning",
      "Meals",
      "Furnishing",
      "Housekeeping",
      "Electricity",
      "Available from",
      "Preferred tenant",
      "Notice period",
    ]);
    expect(rows.find((row) => row.label === "Available from").value).toBe(
      "Immediately",
    );
    expect(pgHighlightPills(listing)).toEqual(listing.pgHighlights);
    expect(pgServices(listing)).toEqual(listing.services);
  });
});

describe("apartment property details", () => {
  it("builds the reference apartment detail rows in order", async () => {
    const { buildApartmentDetailRows } = await import(
      "../src/HouseVillaDetails.jsx"
    );
    const rows = buildApartmentDetailRows({
      type: "Apartment",
      mode: "BUY",
      area: 1150,
      builtUpArea: 1150,
      carpetArea: 920,
      beds: 2,
      baths: 2,
      balconies: 1,
      floor: 5,
      totalFloors: 12,
      facing: "East",
      furnishing: "Semi-furnished",
      propertyAge: 3,
      condition: "Resale",
      carParking: 1,
      possessionStatus: "Ready to move",
      ownershipType: "Freehold",
      maintenance: 2500,
      negotiable: true,
    }).filter((row) => row.value != null);
    expect(rows.map((row) => row.label)).toEqual([
      "Built-up area",
      "Carpet area",
      "Configuration",
      "Bathrooms",
      "Balconies",
      "Floor",
      "Facing",
      "Furnishing",
      "Property age",
      "Condition",
      "Car parking",
      "Possession",
      "Ownership",
      "Maintenance",
      "Price negotiable",
    ]);
    expect(rows.find((row) => row.label === "Floor").value).toBe("5 of 12");
    expect(rows.find((row) => row.label === "Configuration").value).toBe(
      "2 BHK",
    );
    expect(rows.find((row) => row.label === "Maintenance").value).toBe(
      "₹2,500 / month",
    );
  });

  it("builds the reference rent Apartment detail rows in order", async () => {
    const {
      buildRentApartmentDetailRows,
      usesHomeDetailLayout,
    } = await import("../src/HouseVillaDetails.jsx");
    const listing = {
      type: "Apartment",
      mode: "RENT",
      builtUpArea: 1150,
      carpetArea: 920,
      beds: 2,
      baths: 2,
      balconies: 1,
      floor: 5,
      totalFloors: 12,
      facing: "East",
      furnishing: "Semi-furnished",
      carParking: 1,
      available: "Ready now",
      preferredTenant: "Family / Professionals",
      pets: "Not specified",
    };
    expect(usesHomeDetailLayout(listing)).toBe(true);
    const rows = buildRentApartmentDetailRows(listing).filter(
      (row) => row.value != null,
    );
    expect(rows.map((row) => row.label)).toEqual([
      "Built-up area",
      "Carpet area",
      "Configuration",
      "Bathrooms",
      "Balconies",
      "Floor",
      "Facing",
      "Furnishing",
      "Car parking",
      "Available from",
      "Preferred tenant",
      "Pets",
    ]);
    expect(rows.find((row) => row.label === "Built-up area").value).toBe(
      "1,150 sqft",
    );
    expect(rows.find((row) => row.label === "Carpet area").value).toBe(
      "920 sqft",
    );
    expect(rows.find((row) => row.label === "Floor").value).toBe("5 of 12");
    expect(rows.find((row) => row.label === "Car parking").value).toBe(
      "1 car",
    );
    expect(rows.find((row) => row.label === "Available from").value).toBe(
      "Immediately",
    );
    expect(rows.find((row) => row.label === "Preferred tenant").value).toBe(
      "Family / Professionals",
    );
  });
});

describe("rent villa property details", () => {
  it("builds the reference rent Villa detail rows in order", async () => {
    const { buildRentVillaDetailRows } = await import(
      "../src/HouseVillaDetails.jsx"
    );
    const rows = buildRentVillaDetailRows({
      type: "Villa",
      mode: "RENT",
      builtUpArea: 2100,
      beds: 3,
      baths: 3,
      balconies: 2,
      facing: "East",
      furnishing: "Semi-furnished",
      carParking: 2,
      community: "Gated",
      available: "Ready now",
      preferredTenant: "Family",
      pets: "Allowed",
    }).filter((row) => row.value != null);
    expect(rows.map((row) => row.label)).toEqual([
      "Built-up area",
      "Configuration",
      "Bathrooms",
      "Balconies",
      "Facing",
      "Furnishing",
      "Car parking",
      "Community",
      "Available from",
      "Preferred tenant",
      "Pets",
    ]);
    expect(rows.find((row) => row.label === "Built-up area").value).toBe(
      "2,100 sqft",
    );
    expect(rows.find((row) => row.label === "Configuration").value).toBe(
      "3 BHK",
    );
    expect(rows.find((row) => row.label === "Balconies").value).toBe("2");
    expect(rows.find((row) => row.label === "Car parking").value).toBe(
      "2 cars",
    );
    expect(rows.find((row) => row.label === "Community").value).toBe("Gated");
    expect(rows.find((row) => row.label === "Available from").value).toBe(
      "Immediately",
    );
  });
});

describe("rent home header below photo", () => {
  it("formats maintenance, deposit, and posted lines for rent homes", async () => {
    const {
      houseRentMaintenanceLabel,
      houseRentDepositLabel,
      housePostedLabel,
      houseTypeEyebrow,
      isRentHomeDetail,
    } = await import("../src/HouseVillaDetails.jsx");
    const listing = {
      type: "Independent House",
      mode: "RENT",
      price: 28000,
      maintenance: 1500,
      deposit: 120000,
      postedAt: "2026-11-06",
    };
    expect(isRentHomeDetail(listing)).toBe(true);
    expect(houseTypeEyebrow(listing)).toBe("FOR RENT · INDEPENDENT HOUSE");
    expect(houseRentMaintenanceLabel(listing)).toBe("+ ₹1,500 maintenance");
    expect(houseRentDepositLabel(listing)).toBe("₹1.2 L deposit");
    expect(housePostedLabel(listing)).toBe("Posted 6 Nov 2026");
    expect(
      houseRentMaintenanceLabel({ ...listing, maintenance: 0 }),
    ).toBeNull();
    expect(houseRentDepositLabel({ ...listing, deposit: null })).toBeNull();
  });
});

describe("rent independent house property details", () => {
  it("builds the reference rent Independent House detail rows in order", async () => {
    const { buildRentIndependentHouseDetailRows } = await import(
      "../src/HouseVillaDetails.jsx"
    );
    const rows = buildRentIndependentHouseDetailRows({
      type: "Independent House",
      mode: "RENT",
      plotArea: 2400,
      builtUpArea: 1850,
      beds: 3,
      baths: 3,
      floorsLabel: "G+1",
      facing: "East",
      furnishing: "Semi-furnished",
      carParking: 2,
      water: "Borewell + Corporation",
      available: "Ready now",
      preferredTenant: "Family",
      pets: "Allowed",
    }).filter((row) => row.value != null);
    expect(rows.map((row) => row.label)).toEqual([
      "Plot area",
      "Built-up area",
      "Configuration",
      "Bathrooms",
      "Floors",
      "Facing",
      "Furnishing",
      "Car parking",
      "Water",
      "Available from",
      "Preferred tenant",
      "Pets",
    ]);
    expect(rows.find((row) => row.label === "Plot area").value).toBe(
      "2,400 sqft",
    );
    expect(rows.find((row) => row.label === "Built-up area").value).toBe(
      "1,850 sqft",
    );
    expect(rows.find((row) => row.label === "Configuration").value).toBe(
      "3 BHK",
    );
    expect(rows.find((row) => row.label === "Floors").value).toBe("G + 1");
    expect(rows.find((row) => row.label === "Car parking").value).toBe(
      "2 cars",
    );
    expect(rows.find((row) => row.label === "Available from").value).toBe(
      "Immediately",
    );
    expect(rows.find((row) => row.label === "Preferred tenant").value).toBe(
      "Family",
    );
  });
});

describe("house vs villa differentiation", () => {
  it("canonicalizes independent_house and villa ids", async () => {
    const { canonicalizePropertyType, PROPERTY_TYPE } = await import(
      "../src/propertyTypeIds.js"
    );
    expect(canonicalizePropertyType("independent_house")).toBe(
      PROPERTY_TYPE.independent_house,
    );
    expect(canonicalizePropertyType("villa")).toBe(PROPERTY_TYPE.villa);
  });
  it("builds distinct card specs and chips", async () => {
    const {
      houseCardTypeTag,
      houseCardSpecLine,
      houseCardChips,
    } = await import("../src/HouseVillaDetails.jsx");
    const house = {
      type: "Independent House",
      plotArea: 1995,
      builtUpArea: 2440,
      water: "Borewell",
      beds: 3,
    };
    const villa = { type: "Villa", builtUpArea: 3300, beds: 4 };
    expect(houseCardTypeTag(house.type)).toBe("Independent House");
    expect(houseCardSpecLine(house)).toMatch(/Cents Land/);
    expect(houseCardSpecLine(house)).toMatch(/Built-up/);
    expect(houseCardChips(house)).toEqual(["Private Land", "Borewell"]);
    expect(houseCardTypeTag(villa.type)).toBe("Gated Villa");
    expect(houseCardSpecLine(villa)).toBe("3,300 sq.ft • 4 BHK");
    expect(houseCardChips(villa)).toEqual([
      "Gated Community",
      "24/7 Security",
    ]);
  });
});
