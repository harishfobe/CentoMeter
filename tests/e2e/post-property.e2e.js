import { test, expect } from "@playwright/test";
const cases = [
  [
    "Residential plot",
    "SELL",
    "Land",
    "Residential",
    ["width", "length", "roadWidth", "water", "electricity"],
    ["beds", "furnishing", "floor"],
  ],
  [
    "Agricultural land",
    "SELL",
    "Land",
    "Agricultural",
    ["width", "length", "water", "electricity"],
    ["beds", "baths", "floor"],
  ],
  [
    "Commercial land sale",
    "SELL",
    "Land",
    "Commercial",
    ["width", "length", "roadWidth"],
    ["beds", "furnishing"],
  ],
  [
    "Apartment sale",
    "SELL",
    "Apartment",
    "",
    [
      "beds",
      "baths",
      "carpetArea",
      "floor",
      "totalFloors",
      "balconies",
      "carParking",
      "propertyAge",
    ],
    ["plotArea", "water"],
  ],
  [
    "House sale",
    "SELL",
    "Independent House",
    "",
    ["beds", "plotArea", "water", "floorsLabel", "carParking", "roadWidth"],
    ["floor"],
  ],
  [
    "Villa sale",
    "SELL",
    "Villa",
    "",
    ["projectName", "community", "carpetArea", "propertyAge"],
    ["floor"],
  ],
  [
    "Building sale",
    "SELL",
    "Commercial",
    "Building",
    ["shopCount", "monthlyRent", "floorsLabel", "carParking", "roadAccess"],
    ["beds", "furnishing"],
  ],
  [
    "Office sale",
    "SELL",
    "Commercial",
    "Office",
    ["floorsLabel", "carParking", "roadAccess"],
    ["shopCount", "monthlyRent", "beds"],
  ],
  [
    "Shop sale",
    "SELL",
    "Commercial",
    "Shop",
    ["floorsLabel", "carParking"],
    ["beds", "monthlyRent"],
  ],
  [
    "Warehouse sale",
    "SELL",
    "Commercial",
    "Warehouse",
    ["floorsLabel", "powerBackup"],
    ["beds", "shopCount"],
  ],
  [
    "Apartment rent",
    "RENT",
    "Apartment",
    "",
    [
      "beds",
      "baths",
      "floor",
      "balconies",
      "preferredTenant",
      "pets",
      "available",
    ],
    ["propertyAge", "condition"],
  ],
  [
    "House rent",
    "RENT",
    "Independent House",
    "",
    ["plotArea", "water", "floorsLabel", "preferredTenant", "pets"],
    ["propertyAge", "ownershipType"],
  ],
  [
    "Villa rent",
    "RENT",
    "Villa",
    "",
    ["projectName", "community", "balconies", "preferredTenant", "pets"],
    ["propertyAge", "plotArea"],
  ],
  [
    "Commercial land rent",
    "RENT",
    "Commercial",
    "Land",
    ["roadAccess", "suitableFor", "parking", "waterSupply", "available"],
    ["beds", "furnishing", "floor", "washrooms", "frontage"],
  ],
  [
    "Shop rent",
    "RENT",
    "Commercial",
    "Shop",
    ["floor", "frontage", "washrooms", "furnishing", "parking", "available"],
    ["beds", "shopCount"],
  ],
  [
    "Office rent",
    "RENT",
    "Commercial",
    "Office Space",
    ["floor", "frontage", "washrooms", "furnishing", "parking"],
    ["beds", "propertyAge"],
  ],
  [
    "PG",
    "RENT",
    "PG",
    "",
    [
      "bathroom",
      "ac",
      "furnishing",
      "meals",
      "housekeeping",
      "electricity",
      "noticePeriod",
      "preferredTenant",
    ],
    ["beds", "facing", "carParking"],
  ],
];

test("all 17 property contexts keep inputs and review in sync without dropdowns", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.route("**/tile.openstreetmap.org/**", (r) => r.abort());
  await page.goto("/#post");
  for (const [name, intent, type, sub, included, excluded] of cases) {
    await page.evaluate(
      ({ intent, type, sub }) => {
        localStorage.setItem(
          "centometer-session",
          JSON.stringify({
            signedIn: true,
            role: "user",
            profile: {
              name: "Test owner",
              email: "owner@example.com",
              phone: "9876543210",
            },
          }),
        );
        localStorage.setItem(
          "centometer-draft",
          JSON.stringify({
            id: 22,
            step: 2,
            data: {
              postingFlowVersion: 2,
              intent,
              type,
              seller: "Owner",
              subtype: sub,
              landType: type === "Land" ? sub : "Residential",
              title: "Test property",
              description: "",
              area: 1200,
              areaUnit: "sq ft",
              price: 100000,
              beds: 2,
              baths: 2,
              photos: ["/land.jpg"],
              city: "Coimbatore",
              locality: "Kovilpalayam",
              location: [11.1179, 77.0369],
              shareDefault: { mode: "hidden", radiusM: 500 },
              occupancy: "Twin sharing",
              carpetArea: 900,
              plotArea: 2400,
              floor: "5",
              totalFloors: 12,
              balconies: 2,
              carParking:
                type === "Commercial" && intent === "SELL" ? "Available" : "1",
              propertyAge: 0,
              condition: "Resale",
              ownershipType: "Freehold",
              projectName: "Sunrise",
              community: "Gated",
              water: "Borewell",
              floorsLabel: "G+1",
              roadWidth: 30,
              width: 40,
              length: 60,
              frontage: 18,
              washrooms: 1,
              suitableFor: "Office",
              furnishing: "Unfurnished",
              available: "Ready now",
              preferredTenant: "Family",
              pets: "No",
              meals: "Included",
              bathroom: "Attached",
              housekeeping: "Included",
              electricity: type === "PG" ? "Included" : "Available",
              ac: "Yes",
              noticePeriod: "1 month",
              shopCount: 6,
              monthlyRent: 165000,
              powerBackup: "Available",
              waterSupply: "Available",
              roadAccess: type === "Land" ? "Public road" : "Main road",
              parking: "Common",
            },
          }),
        );
      },
      { intent, type, sub },
    );
    await page.reload();
    const flow = page.locator(".post-flow");
    for (const key of included)
      await expect(
        flow.locator("#post-" + key),
        name + " input " + key,
      ).toHaveCount(1);
    for (const key of excluded)
      await expect(
        flow.locator("#post-" + key),
        name + " excludes " + key,
      ).toHaveCount(0);
    await expect(flow.locator("select")).toHaveCount(0);
    await flow.getByRole("button", { name: "Continue", exact: true }).click();
    await flow.getByRole("button", { name: "Continue", exact: true }).click();
    await flow
      .getByRole("button", { name: "Review listing", exact: true })
      .click();
    for (const key of included)
      await expect(
        flow.locator('[data-review="' + key + '"]'),
        name + " review " + key,
      ).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      name + " overflow",
    ).toBe(true);
  }
});

test("posting mobile colours, keyboard chips and profile autofill match the app", async ({
  page,
}, info) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "centometer-session",
      JSON.stringify({
        signedIn: true,
        role: "user",
        profile: {
          name: "Login owner",
          email: "owner@example.com",
          phone: "9876543210",
        },
      }),
    ),
  );
  await page.route("**/tile.openstreetmap.org/**", (r) => r.abort());
  await page.goto("/#post");
  const flow = page.locator(".post-flow"),
    villa = flow.getByRole("button", { name: "Gated villa", exact: true });
  await villa.focus();
  await page.keyboard.press("Enter");
  await expect(villa).toHaveAttribute("aria-pressed", "true");
  await expect(villa).toBeFocused();
  await expect(villa).toHaveCSS("background-color", "rgb(255, 243, 235)");
  await expect(villa).toHaveCSS("color", "rgb(24, 24, 27)");
  await expect(
    flow.getByRole("button", { name: "Continue", exact: true }),
  ).toHaveCSS("color", "rgb(255, 255, 255)");
  await flow
    .getByRole("button", { name: "Autofill details", exact: true })
    .click();
  for (let i = 0; i < 4; i++)
    await flow.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    flow.getByRole("heading", { name: "Location privacy" }),
  ).toHaveCount(0);
  await expect(flow.locator("#post-lat,#post-lng")).toHaveCount(0);
  await flow
    .getByRole("button", { name: "Review listing", exact: true })
    .click();
  await expect(flow.getByLabel("Contact name", { exact: true })).toHaveValue(
    "Login owner",
  );
  await expect(flow.getByLabel("Phone number", { exact: true })).toHaveValue(
    "9876543210",
  );
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath("post-" + width + ".png"),
      fullPage: true,
    });
  }
});
