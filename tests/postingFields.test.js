import { test } from "vitest";
import assert from "node:assert/strict";
import {
  buildPayload,
  changeContext,
  detailGroups,
  commercialTypes,
  validateDetails,
} from "../src/lib/postingFields";
const base = {
  intent: "SELL",
  type: "Apartment",
  seller: "Owner",
  area: "1200",
  areaUnit: "sq ft",
  price: "6800000",
  title: "",
  description: "",
  photos: [],
  shareDefault: { mode: "hidden", radiusM: 500 },
  city: "Coimbatore",
  locality: "Test locality",
  location: [11, 77],
  beds: "0",
};
test("Apartment preserves studio, carpet area, floor, balconies and zero maintenance", () => {
  const p = buildPayload({
    ...base,
    carpetArea: "900",
    floor: "5",
    totalFloors: "12",
    balconies: "2",
    baths: "2",
    maintenance: "0",
    propertyAge: "0",
  });
  assert.equal(p.beds, 0);
  assert.equal(p.carpetArea, 900);
  assert.equal(p.builtUpArea, 1200);
  assert.equal(p.maintenance, 0);
  assert.equal(p.propertyAge, 0);
});
test("Independent house keeps plot area distinct from built-up", () => {
  const p = buildPayload({
    ...base,
    type: "Independent House",
    area: "1800",
    plotArea: "2400",
    water: "Borewell",
    roadWidth: "30",
  });
  assert.equal(p.builtUpArea, 1800);
  assert.equal(p.plotArea, 2400);
  assert.equal(p.water, "Borewell");
  assert.equal(p.roadWidth, 30);
});
test("Rental villa carries community and house rules without sale-only values", () => {
  const p = buildPayload({
    ...base,
    type: "Villa",
    intent: "RENT",
    projectName: "Sunrise",
    community: "Gated",
    features: ["Security"],
    pets: "No",
    preferredTenant: "Family",
    condition: "Resale",
    ownershipType: "Freehold",
  });
  assert.equal(p.projectName, "Sunrise");
  assert.equal(p.pets, "No");
  assert.equal(p.preferredTenant, "Family");
  assert.ok(!("condition" in p));
  assert.ok(!("ownershipType" in p));
});
test("Agricultural land converts acres without bedroom/furnishing leakage", () => {
  const p = buildPayload({
    ...base,
    type: "Land",
    landType: "Agricultural",
    area: "1.2",
    areaUnit: "acres",
    furnishing: "Fully furnished",
    width: "40",
    length: "60",
  });
  assert.equal(p.area, 52272);
  assert.equal(p.width, 40);
  assert.ok(!("beds" in p));
  assert.ok(!("furnishing" in p));
});
test("Commercial rental land never contains enclosed-space inputs", () => {
  const d = {
    ...base,
    type: "Commercial",
    subtype: "Land",
    intent: "RENT",
    furnishing: "Bare shell",
    floor: "Ground",
    washrooms: "1",
    carpetArea: "900",
  };
  const keys = detailGroups(d).flatMap((g) => g.fields.map((f) => f.key));
  for (const key of [
    "beds",
    "furnishing",
    "floor",
    "washrooms",
    "carpetArea",
  ]) {
    assert.ok(!keys.includes(key));
    assert.ok(!(key in buildPayload(d)));
  }
});
test("Rental office uses carpet area and keeps bare shell, washrooms and frontage", () => {
  const p = buildPayload({
    ...base,
    type: "Commercial",
    subtype: "Office Space",
    intent: "RENT",
    area: "650",
    furnishing: "Bare shell",
    washrooms: "1",
    frontage: "18",
    floor: "Ground",
    facilities: ["CCTV"],
  });
  assert.equal(p.area, 650);
  assert.equal(p.carpetArea, 650);
  assert.ok(!("builtUpArea" in p));
  assert.equal(p.furnishing, "Bare shell");
  assert.equal(p.washrooms, 1);
  assert.equal(p.frontage, 18);
});
test("Commercial building income is distinct from the asking price", () => {
  const p = buildPayload({
    ...base,
    type: "Commercial",
    subtype: "Building",
    price: "28000000",
    shopCount: "6",
    monthlyRent: "165000",
    floorsLabel: "G+2",
  });
  assert.equal(p.price, 28000000);
  assert.equal(p.monthlyRent, 165000);
  assert.equal(p.shopCount, 6);
  assert.deepEqual(commercialTypes(base), [
    "Building",
    "Office",
    "Shop",
    "Warehouse",
  ]);
});
test("PG preserves services and policies, excluding bedrooms/facing", () => {
  const p = buildPayload({
    ...base,
    type: "PG",
    intent: "RENT",
    occupancy: "Private room",
    bathroom: "Attached",
    meals: "Not included",
    housekeeping: "Included",
    electricity: "As per usage",
    noticePeriod: "1 month",
    services: ["Wi-Fi"],
    facing: "East",
  });
  assert.equal(p.occupancy, "Private room");
  assert.equal(p.bathroom, "Attached");
  assert.equal(p.meals, "Not included");
  assert.ok(!("beds" in p));
  assert.ok(!("facing" in p));
});
test("Switching type preserves valid price/location and clears invalid home fields", () => {
  const change = changeContext(
    {
      ...base,
      carpetArea: "900",
      floor: "5",
      balconies: "2",
      furnishing: "Fully furnished",
    },
    "type",
    "Land",
  );
  assert.equal(change.data.price, base.price);
  assert.deepEqual(change.data.location, base.location);
  assert.equal(change.data.area, "");
  assert.ok(!("floor" in change.data));
  assert.ok(change.notice.includes("cleared"));
});
test("Unknown and zero are distinct; dimensions, exact counts and carpet validate", () => {
  assert.ok(
    !("deposit" in buildPayload({ ...base, intent: "RENT", deposit: "" })),
  );
  assert.equal(
    buildPayload({ ...base, intent: "RENT", deposit: "0" }).deposit,
    0,
  );
  assert.ok(validateDetails({ ...base, beds: "2.5" }).beds);
  assert.ok(validateDetails({ ...base, carpetArea: "1300" }).carpetArea);
  assert.ok(
    validateDetails({ ...base, type: "Land", width: "40", length: "" }).length,
  );
  assert.ok(
    !validateDetails({ ...base, type: "PG", width: "40", length: "" }).length,
  );
});
