import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
async function shot(page, info, name) {
  await page.evaluate(async () =>
    Promise.allSettled(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished),
    ),
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await fs.mkdir("artifacts/home-implementation", { recursive: true });
  await page.screenshot({
    path: `artifacts/home-implementation/${info.project.name}-${name}.png`,
  });
}
test.beforeEach(async ({ page }) => {
  await page.route(/tile\.openstreetmap\.org/, (r) => r.abort());
  await page.goto("/#home");
});
test("approved Home sections, SELL posting and full Map tab retain search and list access", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(nav.getByRole("button")).toHaveText([
    "Home",
    "Map",
    "Agents",
    "Activity",
    "Profile",
  ]);
  await expect(
    nav.getByRole("button", { name: "Home", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  const tabs = page.getByRole("tablist", { name: "Property intent" });
  await expect(tabs.getByRole("tab")).toHaveText(["BUY", "SELL", "RENT"]);
  await expect(page.locator(".home-section-heading h2")).toHaveText([
    "Suggested for you",
    "Spotlight",
    "Projects",
    "Most popular",
    "Featured local agents",
  ]);
  await expect(page.locator(".search-controls")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Explore full map" }),
  ).toHaveCount(0);
  await shot(page, info, "home");
  await tabs.getByRole("tab", { name: "SELL", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Post property", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Back to exploring", exact: true })
    .click();
  await nav.getByRole("button", { name: "Map", exact: true }).click();
  await expect(page).toHaveURL(/#map$/);
  await expect(
    nav.getByRole("button", { name: "Map", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".map-only .leaflet-container")).toBeVisible();
  await expect(page.locator(".search-controls")).toBeVisible();
  await expect(page.locator(".listing-panel")).toHaveCount(0);
  const map = await page.locator(".map-stage").boundingBox();
  expect(map.height).toBeGreaterThan(300);
  await shot(page, info, "map");
  await page.getByRole("button", { name: "View list", exact: true }).click();
  await expect(page).toHaveURL(/#map$/);
  await expect(
    nav.getByRole("button", { name: "Map", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.locator("#property-results")).toBeVisible();
  await expect(
    page.locator("#property-results .property-card").first(),
  ).toBeVisible();
  await shot(page, info, "map-list");
  await page.getByRole("button", { name: "Back to map", exact: true }).click();
  await expect(page).toHaveURL(/#map$/);
  await expect(page.locator(".map-only .leaflet-container")).toBeVisible();
  await page.getByRole("button", { name: "View list", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Sort properties" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("suggestions retain save persistence, original list navigation and property detail", async ({
  page,
}, info) => {
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  const suggestions = page.getByRole("region", {
    name: "Suggested properties",
  });
  const card = suggestions.locator(".property-card").first();
  const title = await card.locator("h3").textContent();
  await card.locator(".save-button").click();
  await expect(card.locator(".save-button")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.reload();
  await expect(card.locator(".save-button")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await nav.getByRole("button", { name: "Activity", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }).first(),
  ).toBeVisible();
  await nav.getByRole("button", { name: "Home", exact: true }).click();
  await card.locator(".property-copy").click();
  await expect(page.locator(".detail-page")).toBeVisible();
  await page
    .locator(".detail-page")
    .getByRole("button", { name: "Back", exact: true })
    .click();
  await expect(suggestions).toBeVisible();
  await page
    .getByRole("button", { name: "See all suggested for you", exact: true })
    .click();
  await expect(page).toHaveURL(/#results$/);
  await expect(
    page.getByRole("combobox", { name: "Sort properties" }),
  ).toBeVisible();
  await expect(
    page.locator("#property-results .property-card").first(),
  ).toBeVisible();
  await shot(page, info, "list");
});
test("Spotlight, Projects, popular rows and BUY/RENT use existing listing actions", async ({
  page,
}, info) => {
  const tabs = page.getByRole("tablist", { name: "Property intent" });
  const types = page.locator(".property-types-reveal");
  await expect(types).toHaveAttribute("data-expanded", "false");
  await tabs.getByRole("tab", { name: "BUY", exact: true }).click();
  await expect(types).toHaveAttribute("data-expanded", "true");
  await expect(
    page.getByRole("region", { name: "Property type" }),
  ).toBeVisible();
  await tabs.getByRole("tab", { name: "RENT", exact: true }).click();
  await expect(
    tabs.getByRole("tab", { name: "RENT", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(types).toHaveAttribute("data-expanded", "true");
  await expect(
    page.getByRole("group", { name: "Rental property types" }),
  ).toBeVisible();
  await tabs.getByRole("tab", { name: "BUY", exact: true }).click();
  await expect(types).toHaveAttribute("data-expanded", "true");
  await tabs.getByRole("tab", { name: "BUY", exact: true }).click();
  await expect(types).toHaveAttribute("data-expanded", "false");
  await tabs.getByRole("tab", { name: "RENT", exact: true }).click();
  await expect(
    tabs.getByRole("tab", { name: "RENT", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(types).toHaveAttribute("data-expanded", "true");
  await tabs.getByRole("tab", { name: "RENT", exact: true }).click();
  await expect(types).toHaveAttribute("data-expanded", "false");
  await expect(page.locator(".home-discovery")).toBeVisible();
  await tabs.getByRole("tab", { name: "BUY", exact: true }).click();
  await expect(types).toHaveAttribute("data-expanded", "true");
  const spotlight = page.getByRole("region", { name: "Spotlight property" });
  await spotlight.scrollIntoViewIfNeeded();
  await shot(page, info, "spotlight");
  await spotlight
    .getByRole("button", { name: "View property", exact: true })
    .click();
  await expect(page.locator(".detail-page")).toBeVisible();
  await page
    .locator(".detail-page")
    .getByRole("button", { name: "Back", exact: true })
    .click();
  await page
    .getByRole("region", { name: "Property projects" })
    .locator(".property-copy")
    .first()
    .click();
  await expect(page.locator(".detail-page")).toBeVisible();
  await page
    .locator(".detail-page")
    .getByRole("button", { name: "Back", exact: true })
    .click();
  const popular = page.getByRole("region", { name: "Popular properties" });
  await popular.scrollIntoViewIfNeeded();
  await shot(page, info, "popular");
  await popular.locator(".home-popular-save").first().click();
  await expect(popular.locator(".home-popular-save").first()).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await popular.locator(".home-popular-open").first().click();
  await expect(page.locator(".detail-page")).toBeVisible();
});

test("Home ends with local agent cards and preserves follow and profile navigation", async ({
  page,
}, info) => {
  await expect(page.locator("#property-results")).toHaveCount(0);
  const agents = page.getByRole("region", { name: "Featured local agents" });
  expect(
    await page
      .locator(".home-discovery")
      .evaluate((el) => el.lastElementChild.getAttribute("aria-label")),
  ).toBe("Featured local agents");
  await expect(
    agents.getByText(/Customer ratings aren't available yet/),
  ).toBeVisible();
  const card = agents.locator(".agent-card").first();
  await card.getByRole("button", { name: "Follow", exact: true }).click();
  await expect(
    card.getByRole("button", { name: "Following", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await shot(page, info, "top-agents");
  await card.getByRole("button", { name: /View profile/ }).click();
  await expect(page).toHaveURL(/#agent\//);
  await expect(page.locator(".agent-profile-heading")).toBeVisible();
});
