import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  money,
  indianMobile,
  normalizePostedListing,
  sortProperties,
  emiPayment,
} from "../PropertyModel";
import { matches, filterDefaults, Costs } from "../Discovery";
const draft = {
  id: "new",
  title: "A posted home",
  price: "42000",
  area: "1200",
  location: [12.97, 77.63],
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
    });
    expect(p.deposit).toBe(24000);
    expect(p.baths).toBe(2);
    expect(p.occupancy).toBe("Twin sharing");
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
  it("accepts combined house/villa and exact bedrooms", () =>
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
    ).toBe(true));
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
