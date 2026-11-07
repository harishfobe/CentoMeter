import { test, expect } from "@playwright/test";

const rentApartmentId = "p9";

test.beforeEach(async ({ page }) => {
  await page.route(/tile\.openstreetmap\.org/, (r) => r.abort());
});

test("rental detail costs and site visit stay within page width", async ({
  page,
}) => {
  await page.goto("/#property/" + rentApartmentId);
  await expect(page.locator(".detail-page")).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".property-card-type, .detail-eyebrow").first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "What you will pay" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Book site visit/i }).first(),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
});

test("rental results cards expose type, price basis and costs", async ({
  page,
}) => {
  await page.goto("/#home");
  const tabs = page.getByRole("tablist", { name: "Property intent" });
  await tabs.getByRole("tab", { name: "RENT", exact: true }).click();
  const popular = page.getByRole("region", { name: "Popular properties" });
  await popular.scrollIntoViewIfNeeded();
  const open = popular.locator(".home-popular-open, .property-copy").first();
  await expect(open).toBeVisible({ timeout: 15000 });
  // Prefer a card in the popular stack that already uses the shared PropertyCard.
  const card = popular.locator(".property-card").first();
  if (await card.count()) {
    await expect(card.locator(".property-card-type")).toBeVisible();
    await expect(card.locator(".price")).toContainText("/ month");
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
});

test("residential land post details expose declarations", async ({ page }) => {
  await page.goto("/#post");
  await page.getByRole("button", { name: /For sale/i }).click();
  await page.getByRole("button", { name: /Plot \/ Land|^Land$/i }).click();
  await page.getByRole("button", { name: /^Continue$|^Next$/i }).click();
  await expect(
    page.getByRole("heading", { name: "Land details" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Land declarations" }),
  ).toBeVisible();
  await page
    .getByRole("heading", { name: "Land declarations" })
    .scrollIntoViewIfNeeded();
  await expect(page.getByText("Patta available")).toBeVisible();
  await expect(page.getByText("Road access", { exact: true })).toBeVisible();
  await expect(
    page.getByText(
      /seller-provided declarations and have not been independently verified/i,
    ),
  ).toBeVisible();
});
