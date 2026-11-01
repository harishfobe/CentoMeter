import React from "react";
import { it, expect, vi, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  listings,
  publicListing,
  defaults,
  filterListings,
} from "../src/lib/agents";
import {
  getExactLocation,
  setAccessRequests,
  safeSearchArea,
  publicShare,
} from "../src/lib/locationAccess";
import { readLocal, writeLocal } from "../src/Discovery";
import {
  requestLocation,
  viewerId,
  snapshot,
  decideRequest,
} from "../src/lib/agentStore";
import ListingCard from "../src/components/agent/ListingCard";
afterEach(() => vi.unstubAllGlobals());
it("renders every locked listing without precise coordinate payloads", () => {
  for (const p of listings) {
    setAccessRequests([
      { propertyId: p.id, viewerId: "test", status: "approved" },
    ]);
    const point = getExactLocation(p.id, "test");
    setAccessRequests([]);
    expect(getExactLocation(p.id, "test")).toBeNull();
    const data = JSON.stringify(publicListing(p));
    const html = renderToStaticMarkup(
      <ListingCard p={p} onOpen={() => {}} onSave={() => {}} />,
    );
    for (const coord of point) {
      const token = String(coord).replaceAll(".", "\.");
      expect(data).not.toMatch(new RegExp("[:,\[]" + token + "[,\]}]"));
      expect(html).not.toContain("destination=" + coord);
    }
    expect(publicShare(p, "https://example.test/#agent/a")).not.toContain(
      point.join(","),
    );
    expect(
      safeSearchArea(
        { viewport: { center: point }, bounds: [point], nearPlace: { point } },
        true,
      ),
    ).toEqual({ viewport: null, bounds: null, nearPlace: null });
  }
});
it("returns a clear empty filter result", () =>
  expect(filterListings(listings, { ...defaults, min: 1e15 })).toEqual([]));
it("remains usable when localStorage throws", () => {
  vi.stubGlobal("localStorage", {
    getItem() {
      throw Error("blocked");
    },
    setItem() {
      throw Error("blocked");
    },
  });
  expect(readLocal("x", [])).toEqual([]);
  expect(writeLocal("x", {})).toBe(false);
});
it("runs the typed request, approval and revocation workflow", () => {
  const p = listings[2];
  expect(() =>
    requestLocation(p, {
      name: "Buyer",
      phone: "+91 90000 00000",
      consent: false,
    }),
  ).toThrow();
  const r = requestLocation(
    p,
    { name: "Buyer", phone: "09000000000", consent: true },
    "ig",
  );
  expect(snapshot().requests[0].buyer.phone).toBe("9000000000");
  expect(getExactLocation(p.id, viewerId)).toBeNull();
  decideRequest(r.id, "approved", 24);
  expect(getExactLocation(p.id, viewerId)).toHaveLength(2);
  decideRequest(r.id, "revoked");
  expect(getExactLocation(p.id, viewerId)).toBeNull();
});
