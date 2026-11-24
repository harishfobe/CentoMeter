import { it, expect } from "vitest";
import {
  initialPostingData,
  listingFromPosting,
  pinAddress,
} from "../src/lib/postingContext";

it("fills login contact fields but preserves edits and legacy square-foot areas", () => {
  const profile = { name: "Login name", phone: "9876543210" };
  expect(
    initialPostingData({}, { profile, accountRole: "agent" }),
  ).toMatchObject({
    contactName: profile.name,
    contactPhone: profile.phone,
    seller: "Agent",
    areaUnit: "cents",
  });
  const d = initialPostingData(
    { type: "Land", area: 2440, contactName: "Contact override" },
    { profile },
  );
  expect(d).toMatchObject({
    contactName: "Contact override",
    contactPhone: profile.phone,
    areaUnit: "sq ft",
    area: 2440,
  });
});
it("pin labels use the returned village and never fabricate an address", () => {
  expect(
    pinAddress({
      village: "Kovilpalayam",
      suburb: "Other",
      city: "Coimbatore",
    }),
  ).toEqual({ locality: "Kovilpalayam", city: "Coimbatore" });
  expect(pinAddress({ city: "Chennai" })).toEqual({
    locality: "",
    city: "Chennai",
  });
});
it("owner edits remove agent gating, stale area basis and brokerage while retaining metadata", () => {
  const data = initialPostingData({
    type: "Commercial",
    intent: "RENT",
    subtype: "Office Space",
    area: 800,
    builtUpArea: 950,
    carParking: 2,
    brokerage: 4000,
    agentId: "a1",
    approx: [11, 77],
    privacy: { mode: "hidden" },
    seller: "Owner",
    customReference: "keep",
    locality: "Kovilpalayam",
  });
  const p = listingFromPosting(data, 1);
  expect(p).toMatchObject({
    shareDefault: { mode: "exact" },
    carpetArea: 800,
    customReference: "keep",
    address: "Kovilpalayam",
  });
  for (const key of [
    "agentId",
    "approx",
    "privacy",
    "brokerage",
    "builtUpArea",
    "carParking",
  ])
    expect(p).not.toHaveProperty(key);
});
it("agent outputs keep gating and disclose brokerage without changing exact pin privacy", () => {
  const data = initialPostingData({
    type: "Land",
    intent: "SELL",
    seller: "Agent",
    price: 4000000,
    area: 2440,
    brokerage: 0,
    shareDefault: { mode: "radius", radiusM: 500 },
    location: [11, 77],
  });
  expect(listingFromPosting(data, 2)).toMatchObject({
    brokerage: 0,
    shareDefault: { mode: "radius", radiusM: 500 },
  });
});
