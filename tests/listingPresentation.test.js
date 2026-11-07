import { describe, expect, it } from "vitest";
import {
  areaWithBasis,
  brokerageLabel,
  brokerageAmount,
  configurationLabel,
  confirmedAvailability,
  furnishingLabel,
  isAffirmativeAvailability,
  knownMoveIn,
  mealsDisplay,
  mealsIncludedAffirmative,
  posterRole,
  priceWithBasis,
  recentlyConfirmedSafe,
  typeTransactionLine,
} from "../src/listingPresentation.js";
import { houseFloorsLabel } from "../src/HouseVillaDetails.jsx";
import { commercialFacilities } from "../src/CommercialDetails.jsx";
import { matchesPossessionFilter } from "../src/listingFit.js";
import { normalizePostedListing } from "../src/PropertyModel.js";
import { pgHighlightPills, pgSnapshotItems } from "../src/PgDetails.jsx";

describe("listing presentation accuracy", () => {
  it("keeps PG Not included negative everywhere", () => {
    expect(mealsDisplay("Not included")).toBe("Not included");
    expect(mealsIncludedAffirmative("Not included")).toBe(false);
    expect(mealsDisplay("Included")).toBe("Included");
    const snap = pgSnapshotItems({ meals: "Not included" });
    expect(snap.find((item) => item.label === "Meals")?.value).toBe(
      "Not included",
    );
    expect(pgHighlightPills({ meals: "Not included" })).not.toContain(
      "Meals included",
    );
  });

  it("never turns unknown brokerage into zero", () => {
    expect(brokerageLabel({})).toBe("Not provided");
    expect(brokerageLabel({ brokerage: null })).toBe("Not provided");
    expect(brokerageLabel({ brokerage: "" })).toBe("Not provided");
    expect(brokerageAmount({ brokerage: null })).toBeNull();
    expect(brokerageLabel({ brokerage: 0 })).toBe("No brokerage");
    expect(brokerageAmount({ brokerage: 0 })).toBe(0);
    expect(brokerageLabel({ brokerage: 25000 })).toBe("₹25,000");
  });

  it("does not create affirmative commercial badges from Not available", () => {
    expect(isAffirmativeAvailability("Not available")).toBe(false);
    expect(
      commercialFacilities({
        type: "Commercial",
        mode: "RENT",
        powerBackup: "Not available",
        waterSupply: "Not available",
        parking: "Not available",
        carParking: "Not available",
      }),
    ).not.toEqual(expect.arrayContaining(["Power backup", "Water supply"]));
  });

  it("keeps Ground floor as Ground, not G+1", () => {
    expect(houseFloorsLabel({ floor: "Ground" })).toBe("Ground");
    expect(houseFloorsLabel({ floor: "G" })).toBe("Ground");
    expect(houseFloorsLabel({ floorsLabel: "G+1" })).toBe("G+1");
  });

  it("leaves missing furnishing and bedrooms unknown", () => {
    expect(furnishingLabel({})).toBeNull();
    expect(furnishingLabel({ furnishing: "" })).toBeNull();
    expect(configurationLabel({ type: "Apartment" })).toBeNull();
    expect(configurationLabel({ type: "Apartment", beds: 2 })).toBe("2 BHK");
    const normalized = normalizePostedListing({
      id: "x1",
      title: "Test home",
      type: "Apartment",
      intent: "RENT",
      price: 28000,
      area: 1120,
      location: [11.0168, 76.9558],
      photos: ["/apartment.jpg"],
    });
    expect(normalized.furnishing).toBe("");
  });

  it("labels built-up distinctly from carpet area", () => {
    expect(
      areaWithBasis({
        type: "Apartment",
        builtUpArea: 1120,
        area: 1120,
        carpetArea: 900,
      }),
    ).toBe("1,120 sq ft built-up");
    expect(
      areaWithBasis({
        type: "Commercial",
        mode: "RENT",
        subtype: "Shop",
        carpetArea: 650,
        area: 650,
      }),
    ).toBe("650 sq ft carpet area");
  });

  it("does not match Under construction to Within 30 days", () => {
    expect(
      matchesPossessionFilter(
        { possessionStatus: "Under construction" },
        "Within 30 days",
      ),
    ).toBe(false);
  });

  it("keeps rental Shop review as Shop and RENT", () => {
    expect(
      typeTransactionLine({
        type: "Commercial",
        mode: "RENT",
        subtype: "Shop",
      }),
    ).toBe("Shop · For rent");
    expect(
      priceWithBasis({
        type: "Commercial",
        mode: "RENT",
        price: 35000,
      }),
    ).toBe("₹35,000 / month");
  });

  it("preserves owner/agent/builder poster role", () => {
    expect(posterRole({ seller: "Owner" })).toBe("Owner");
    expect(posterRole({ agentId: "a1" })).toBe("Agent");
    expect(posterRole({ seller: "Builder" })).toBe("Builder");
  });

  it("guards missing and future confirmedAt", () => {
    expect(confirmedAvailability({})).toBeNull();
    expect(confirmedAvailability({ confirmedAt: "1970-01-01T00:00:00.000Z" }))
      .toBeNull();
    expect(
      recentlyConfirmedSafe({
        confirmedAt: new Date(Date.now() + 86400000).toISOString(),
      }),
    ).toBe(false);
    const recent = confirmedAvailability({
      confirmedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    });
    expect(recent?.recentlyConfirmed).toBe(true);
  });

  it("computes known move-in only from known rental costs", () => {
    const full = knownMoveIn({
      mode: "RENT",
      price: 28000,
      maintenance: 2000,
      deposit: 84000,
      brokerage: 0,
    });
    expect(full.total).toBe(114000);
    expect(full.excluded).toEqual([]);
    const missingBrokerage = knownMoveIn({
      mode: "RENT",
      price: 28000,
      maintenance: 2000,
      deposit: 84000,
    });
    expect(missingBrokerage.total).toBe(114000);
    expect(missingBrokerage.excluded).toContain("brokerage");
  });
});
