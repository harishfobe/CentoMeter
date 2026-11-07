import { describe, it, expect } from "vitest";
import properties from "../src/data/properties.json";
import agentListings from "../src/data/agentListings.json";
import privateLocations from "../private/demo-locations.json";
import {
  auditSampleData,
  formatAuditReport,
  findCityFieldCollisions,
  findMissingPrivacyFixtures,
} from "../tools/sampleDataInvariants.mjs";

describe("sample data CI guardrails", () => {
  it("passes the full audit on committed fixtures", () => {
    const report = auditSampleData({
      properties,
      agentListings,
      privateLocations,
    });
    expect(formatAuditReport(report)).toBe("Sample data invariants OK.");
    expect(report.ok).toBe(true);
  });

  it("names colliding titles so CI failures are actionable", () => {
    const collisions = findCityFieldCollisions(
      [
        {
          id: "a",
          city: "Coimbatore",
          title: "3 BHK Independent House",
          price: 1,
        },
        {
          id: "b",
          city: "Coimbatore",
          title: "3 BHK Independent House",
          price: 2,
        },
      ],
      "title",
    );
    expect(collisions).toEqual([
      {
        city: "Coimbatore",
        field: "title",
        value: "3 BHK Independent House",
        ids: ["a", "b"],
        count: 2,
      },
    ]);
  });

  it("flags agent listings missing private location fixtures", () => {
    expect(
      findMissingPrivacyFixtures(
        [{ id: "al-missing" }, { id: "al1" }],
        privateLocations,
      ),
    ).toEqual(["al-missing"]);
  });
});
