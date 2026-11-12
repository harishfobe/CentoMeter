import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
const shots = "artifacts/repo-audit";
async function shot(page, info, name) {
  // Finish finite entrance animations before recording the settled interface.
  await page.evaluate(async () => {
    const finite = document
      .getAnimations()
      .filter(
        (animation) =>
          animation.effect?.getComputedTiming().iterations !== Infinity,
      );
    await Promise.allSettled(finite.map((animation) => animation.finished));
  });
  await fs.mkdir(shots, { recursive: true });
  await page.screenshot({ path: `${shots}/${info.project.name}-${name}.png` });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
test.beforeEach(async ({ page }) => {
  await page.route(/tile\.openstreetmap\.org/, (route) => route.abort());
});
test("browse, property filters, save, and Finder filters remain usable", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#home");
  await expect(page.locator(".leaflet-container").first()).toBeVisible();
  await page.getByRole("button", { name: "Open search" }).click();
  await expect(page).toHaveURL(/#search/);
  const searchPage = page.getByRole("region", {
    name: /Refine search in /,
  });
  await expect(
    searchPage.getByRole("heading", { name: "Refine your search", exact: true }),
  ).toBeVisible();
  await expect(
    searchPage.getByRole("heading", { name: "Suggested areas", exact: true }),
  ).toBeVisible();
  await expect(
    searchPage.getByRole("listbox", { name: /Area suggestions in / }),
  ).toBeVisible();
  await expect(
    searchPage.getByRole("heading", {
      name: "Suggested properties",
      exact: true,
    }),
  ).toBeVisible();
  const propertyCarousel = searchPage.getByRole("list", {
    name: /Suggested properties in /,
  });
  await expect(propertyCarousel).toBeVisible();
  await expect(
    propertyCarousel.getByRole("button", { name: /View / }).first(),
  ).toBeVisible();
  const intent = searchPage.getByRole("tablist", { name: "Buy or rent" });
  await expect(intent.getByRole("tab", { name: "Buy" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await intent.getByRole("tab", { name: "Rent" }).click();
  await expect(intent.getByRole("tab", { name: "Rent" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await intent.getByRole("tab", { name: "Buy" }).click();
  const typeHint =
    "Choose a property type to see price, bedrooms, and more filters.";
  const typeGroup = searchPage.getByRole("group", {
    name: /Property types|Rental property types/,
  });
  await expect(searchPage.getByText(typeHint)).toBeVisible();
  await expect(
    searchPage.getByRole("button", { name: "All properties" }),
  ).toHaveCount(0);
  const apartment = searchPage.getByRole("button", {
    name: /Apartment \/ Flat/i,
  });
  await apartment.click();
  await expect(
    searchPage.getByLabel("Minimum price (₹)", { exact: true }),
  ).toBeVisible();
  await apartment.click();
  await expect(searchPage.getByText(typeHint)).toBeVisible();
  await expect(
    typeGroup.getByRole("button", { pressed: true }),
  ).toHaveCount(0);
  await intent.getByRole("tab", { name: "Rent" }).click();
  await expect(searchPage.getByText(typeHint)).toBeVisible();
  await apartment.click();
  await expect(
    searchPage.getByLabel("Minimum rent (₹)", { exact: true }),
  ).toBeVisible();
  await apartment.click();
  await expect(searchPage.getByText(typeHint)).toBeVisible();
  await intent.getByRole("tab", { name: "Buy" }).click();
  await apartment.click();
  await searchPage.getByLabel("Minimum price (₹)", { exact: true }).fill("1000");
  const areaList = searchPage.getByRole("listbox", {
    name: /Area suggestions in /,
  });
  await areaList.getByRole("option").first().click();
  await expect(areaList.getByRole("option", { selected: true })).toHaveCount(
    1,
  );
  await searchPage.getByRole("button", { name: "Reset all filters" }).click();
  await expect(searchPage.getByText(typeHint)).toBeVisible();
  await expect(
    typeGroup.getByRole("button", { pressed: true }),
  ).toHaveCount(0);
  await expect(areaList.getByRole("option", { selected: true })).toHaveCount(
    0,
  );
  await apartment.click();
  await searchPage.getByLabel("Minimum price (₹)", { exact: true }).fill("1000");
  await searchPage.getByRole("button", { name: /Show \d+ properties/ }).click();
  await expect(page).toHaveURL(/#results/);
  const card = page.locator(".property-card").first();
  const title = await card.locator("h3").innerText();
  await card.locator(".save-button").click();
  await expect(card.locator(".save-button")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page
    .locator(".bottom-nav")
    .getByRole("button", { name: "Activity", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }).first(),
  ).toBeVisible();
  await shot(page, info, "saved");
  await page
    .locator(".bottom-nav")
    .getByRole("button", { name: "Agents", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Find your local expert" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Filters, 0 active" }).click();
  const sheet = page.getByRole("dialog", { name: "Filters", exact: true });
  await sheet.getByRole("button", { name: "Coimbatore", exact: true }).click();
  await sheet.getByRole("button", { name: "English", exact: true }).click();
  await sheet.getByRole("switch", { name: "Verified only" }).check();
  await shot(page, info, "finder-filters");
  await sheet.getByRole("button", { name: /Show \d+ agents?/ }).click();
  await expect(sheet).toHaveCount(0);
  await page.getByRole("button", { name: "Clear all", exact: true }).click();
  await expect(page.locator(".agent-grid .agent-card")).toHaveCount(8);
  await shot(page, info, "finder");
  expect(errors).toEqual([]);
});
test("a sample listing can be posted, reopened, and edited without losing data", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#post");
  await page.getByRole("button", { name: "Fill with sample data" }).click();
  for (let step = 0; step < 3; step++)
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Contact name", { exact: true }).fill("Audit owner");
  await page.getByLabel("Phone number", { exact: true }).fill("9000000000");
  await shot(page, info, "post-review");
  await page.getByRole("button", { name: "Finish preview" }).click();
  await expect(
    page.getByRole("heading", { name: "Your listing looks great." }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("centometer-listings") || "[]")
            .length,
      ),
    )
    .toBe(1);
  await page.getByRole("button", { name: "Back to exploring" }).click();
  await page
    .locator(".bottom-nav")
    .getByRole("button", { name: "Profile", exact: true })
    .click();
  await page.getByRole("button", { name: /Sample listings/ }).click();
  const manager = page.getByRole("dialog", { name: "Your sample listings" });
  await manager
    .getByRole("button", { name: "Edit sample listing", exact: true })
    .click();
  await page
    .getByLabel("Listing title", { exact: true })
    .fill("Audited edited home");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Finish preview" }).click();
  await expect(
    page.getByRole("heading", { name: "Your listing looks great." }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem("centometer-listings") || "[]").map(
          (x) => x.title,
        ),
      ),
    )
    .toEqual(["Audited edited home"]);
  await shot(page, info, "post-edited");
  expect(errors).toEqual([]);
});
test("location request, approval, buyer activity and site-visit decision reach both sides", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#agent/ananya.rao?l=al1");
  await expect(page.locator(".agent-detail")).toBeVisible();
  await page
    .getByRole("button", { name: "Request location", exact: true })
    .click();
  const request = page.getByRole("dialog", {
    name: "Request location",
    exact: true,
  });
  await request.getByLabel("Name", { exact: true }).fill("Audit buyer");
  await request.getByLabel("Indian mobile", { exact: true }).fill("9000000000");
  await request.getByRole("checkbox").check();
  await request.getByRole("button", { name: "Send request" }).click();
  await expect(
    request.getByRole("heading", { name: "Request sent" }),
  ).toBeVisible();
  await request.getByRole("button", { name: "Done" }).click();
  await page.getByRole("button", { name: "Site visit", exact: true }).click();
  const visit = page.getByRole("dialog", { name: "Request site visit" });
  await visit.getByLabel("Name", { exact: true }).fill("Audit buyer");
  await visit.getByLabel("Indian mobile", { exact: true }).fill("9000000000");
  await visit.getByRole("button", { name: "Save visit request" }).click();
  await expect(visit).toHaveCount(0);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/#agent-dashboard");
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await shot(page, info, "dashboard");
  await page.goto("/#saved");
  await page.getByRole("tab", { name: /Requests & visits/ }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "approved" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "accepted" }).first(),
  ).toBeVisible();
  await shot(page, info, "activity");
  await page.goto("/#agent/ananya.rao?l=al1");
  await expect(
    page.getByRole("link", { name: "Get directions", exact: true }),
  ).toBeVisible();
  await shot(page, info, "unlocked-detail");
  expect(errors).toEqual([]);
});

test("editing an agent sample replaces the existing card instead of creating a duplicate", async ({
  page,
}, info) => {
  await page.goto("/#agent-dashboard");
  await page.getByRole("tab", { name: "Listings", exact: true }).click();
  const listing = page
    .locator(".agent-listing, .request-card")
    .filter({
      has: page.getByRole("heading", {
        name: "Kovai Palm Residences",
        exact: true,
      }),
    })
    .first();
  await listing
    .getByRole("button", { name: "Edit listing · place pin again" })
    .click();
  await page
    .getByLabel("Listing title", { exact: true })
    .fill("Audit agent edit");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Use sample location" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Contact name", { exact: true }).fill("Audit agent");
  await page.getByLabel("Phone number", { exact: true }).fill("9000000000");
  await page.getByRole("button", { name: "Finish preview" }).click();
  await expect(
    page.getByRole("heading", { name: "Your listing looks great." }),
  ).toBeVisible();
  await page.goto("/#agent/ananya.rao?mode=BUY");
  await expect(
    page.locator('.agent-motion-grid [data-listing-id="al1"]'),
  ).toHaveCount(1);
  await expect(
    page
      .getByRole("heading", { name: "Audit agent edit", exact: true })
      .first(),
  ).toBeVisible();
  await shot(page, info, "agent-edited");
});
