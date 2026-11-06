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
