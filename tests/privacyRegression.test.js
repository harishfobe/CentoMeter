import { it, expect } from "vitest";
import {
  accessStatus,
  requestFor,
  setAccessViewer,
  exactLocation,
  isLocationLocked,
  approximatePoint,
} from "../src/lib/locationAccess";
import { canRequest } from "../src/lib/agentStore";
import listings from "../src/data/agentListings.json";
import privateLocations from "../private/demo-locations.json";
it("locks every listing to its buyer, regardless of id prefix", () => {
  const p = { ...listings[0], id: "posted-any-id" };
  const requests = [
    {
      propertyId: p.id,
      agentId: p.agentId,
      viewerId: "one",
      status: "approved",
    },
  ];
  setAccessViewer("two");
  expect(requestFor(requests, p.id)).toBeUndefined();
  expect(isLocationLocked(p, requests)).toBe(true);
  expect(exactLocation(p, requests)).toBeNull();
  setAccessViewer("one");
  expect(isLocationLocked(p, requests)).toBe(false);
});
it("recognises revocation and applies the cooldown", () => {
  const now = Date.now(),
    r = {
      propertyId: "x",
      viewerId: "buyer",
      status: "revoked",
      repliedAt: new Date(now).toISOString(),
    };
  expect(accessStatus(r)).toBe("revoked");
  expect(canRequest([r], "x", "buyer", now)).toContain("24 hours");
});
it("does not expose the same reversible offset for sample listings", () => {
  const offsets = listings.map((p) =>
    p.approx
      .map((v, i) => Number((v - privateLocations[p.id].point[i]).toFixed(8)))
      .join(","),
  );
  expect(new Set(offsets).size).toBe(listings.length);
  const a = approximatePoint([12, 77], 500),
    b = approximatePoint([12, 77], 500);
  expect(a).not.toEqual(b);
});

it("places sample approximations between 20% and 60% of their radius", () => {
  for (const p of listings) {
    const point = privateLocations[p.id].point;
    const north = (p.approx[0] - point[0]) * 111320,
      east =
        (p.approx[1] - point[1]) *
        111320 *
        Math.cos((point[0] * Math.PI) / 180);
    const ratio = Math.hypot(north, east) / p.privacy.radiusM;
    expect(ratio).toBeGreaterThanOrEqual(0.2);
    expect(ratio).toBeLessThanOrEqual(0.6);
  }
});
