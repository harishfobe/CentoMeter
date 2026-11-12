import { describe, expect, it } from "vitest";
import { filterDefaults, matches } from "../src/Discovery";
import { activeBudget, applyBudget } from "../src/budgetFilters";

describe("budget chips", () => {
  it("toggles a buy band on the shared min and max fields", () => {
    const band = { id: "under-50l", label: "Under ₹50L", min: 0, max: 5000000 };
    const on = applyBudget(filterDefaults, band, "BUY");
    expect(on).toMatchObject({ min: 0, max: 5000000, pricePer: "" });
    expect(activeBudget(on, "BUY")?.id).toBe("under-50l");
    expect(applyBudget(on, band, "BUY")).toMatchObject({
      min: 0,
      max: 0,
      pricePer: "",
    });
  });

  it("matches land rates per cent and zero brokerage only when asked", () => {
    const plot = {
      type: "Land",
      mode: "BUY",
      price: 7549250,
      area: 2460,
      seller: "Owner",
      brokerage: 0,
      features: ["Road access", "DTCP Approved"],
    };
    expect(
      matches(plot, {
        ...filterDefaults,
        type: "Land",
        max: 1500000,
        pricePer: "cent",
      }),
    ).toBe(true);
    expect(
      matches(plot, {
        ...filterDefaults,
        type: "Land",
        min: 2500000,
        pricePer: "cent",
      }),
    ).toBe(false);
    expect(
      matches(
        { ...plot, type: "Apartment", mode: "RENT", price: 20000, brokerage: 0 },
        { ...filterDefaults, brokerage: "None" },
      ),
    ).toBe(true);
    expect(
      matches(
        { ...plot, type: "Apartment", mode: "RENT", price: 20000, brokerage: 5000 },
        { ...filterDefaults, brokerage: "None" },
      ),
    ).toBe(false);
  });
});
