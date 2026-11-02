import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";

async function settle(page) {
  await page.evaluate(async () => {
    await Promise.allSettled(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished),
    );
  });
}
async function screenshot(page, info, name) {
  await settle(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await fs.mkdir("artifacts/view-modes", { recursive: true });
  await page.screenshot({
    path: `artifacts/view-modes/${info.project.name}-${name}.png`,
  });
}
async function switchView(page, label) {
  const group = page.getByRole("group", { name: label, exact: true });
  const grid = group.getByRole("button", { name: "Grid view", exact: true });
  const list = group.getByRole("button", { name: "List view", exact: true });
  await expect(grid).toHaveAttribute("aria-pressed", "true");
  await grid.focus();
  await page.keyboard.press("Tab");
  await expect(list).toBeFocused();
  const scroll = await page.evaluate(() => scrollY);
  const before = await group.boundingBox();
  await page.keyboard.press("Space");
  await settle(page);
  await expect(list).toHaveAttribute("aria-pressed", "true");
  await expect(grid).toHaveAttribute("aria-pressed", "false");
  await expect(list).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  const after = await group.boundingBox();
  expect(after.width).toBe(before.width);
  expect(after.height).toBe(before.height);
  for (const button of [list, grid]) {
    const rect = await button.boundingBox();
    expect(rect.width).toBeGreaterThanOrEqual(44);
    expect(rect.height).toBeGreaterThanOrEqual(44);
  }
  await expect(group.locator('[aria-live="polite"]')).toHaveText(
    "List view selected",
  );
  return list;
}
test.beforeEach(async ({ page }) => {
  await page.route(/tile\.openstreetmap\.org/, (route) => route.abort());
});

test("browse list keeps card actions, scroll, focus and persisted layout", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#home");
  await page
    .getByRole("group", { name: "Browse listing view" })
    .scrollIntoViewIfNeeded();
  await screenshot(page, info, "browse-grid");
  await switchView(page, "Browse listing view");
  const card = page.locator("#property-results .property-card").first();
  await expect(card).toHaveClass(/property-card--list/);
  const image = await card.locator(".property-image").boundingBox();
  const copy = await card.locator(".property-copy").boundingBox();
  expect(copy.x).toBeGreaterThan(image.x);
  expect(Math.abs(copy.y - image.y)).toBeLessThan(2);
  const save = card.locator(".save-button");
  await save.click();
  await expect(save).toHaveAttribute("aria-pressed", "true");
  await screenshot(page, info, "browse-list");
  await card.locator(".property-copy").click();
  await expect(page.locator(".detail-page")).toBeVisible();
  await page.goBack();
  await expect(card).toBeVisible();
  await page.reload();
  await expect(
    page
      .getByRole("group", { name: "Browse listing view" })
      .getByRole("button", { name: "List view" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.locator("#property-results .save-button").first(),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.locator('#property-results [data-view="list"]'),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("Finder layout persists independently and retains filters, follow and profile navigation", async ({
  page,
}, info) => {
  await page.goto("/#agents");
  await screenshot(page, info, "finder-grid");
  await switchView(page, "Finder view");
  const card = page.locator(".agent-grid .agent-card").first();
  await expect(card).toHaveClass(/agent-card--list/);
  const follow = card.getByRole("button", { name: "Follow", exact: true });
  await follow.click();
  await expect(
    card.getByRole("button", { name: "Following", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await screenshot(page, info, "finder-list");
  await page.getByRole("combobox").fill("no agent matches this text");
  await expect(
    page.getByRole("heading", { name: "No matching agents" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Clear all", exact: true })
    .last()
    .click();
  await expect(page.locator(".agent-grid .agent-card")).toHaveCount(8);
  await page.reload();
  await expect(
    page
      .getByRole("group", { name: "Finder view" })
      .getByRole("button", { name: "List view" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page
      .locator(".agent-card--list")
      .first()
      .getByRole("button", { name: "Following", exact: true }),
  ).toBeVisible();
  await page
    .locator(".agent-card")
    .first()
    .getByRole("button", { name: "View profile" })
    .click();
  await expect(
    page
      .getByRole("group", { name: "Agent listing view" })
      .getByRole("button", { name: "Grid view" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/#home");
  await expect(
    page
      .getByRole("group", { name: "Browse listing view" })
      .getByRole("button", { name: "Grid view" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("agent property list retains gallery, save, compare, gated requests and closing scroll", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#agent/ananya.rao?mode=BUY");
  await page
    .getByRole("group", { name: "Agent listing view" })
    .scrollIntoViewIfNeeded();
  await screenshot(page, info, "profile-grid");
  await switchView(page, "Agent listing view");
  const card = page.locator(".agent-motion-grid > [data-listing-id]").first();
  await expect(card).toHaveClass(/property-card--list/);
  const strip = card.getByRole("group", { name: /Photos of/ });
  await strip.focus();
  await page.keyboard.press("ArrowRight");
  await expect(card.locator(".agent-photo-count")).toHaveText("2 / 3");
  await card.locator(".save-button").click();
  await expect(card.locator(".save-button")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await card.getByRole("checkbox", { name: "Compare" }).check();
  await page.locator(".agent-compare summary").click();
  await expect(
    page.getByRole("table", { name: "Property comparison" }),
  ).toBeVisible();
  await page.locator(".agent-compare summary").click();
  await screenshot(page, info, "profile-list");
  const scroll = await page.evaluate(() => scrollY);
  await card.locator(".property-copy").click();
  const detail = page.locator(".agent-detail");
  await expect(detail).toBeVisible();
  await expect(
    detail.getByRole("link", { name: "Get directions", exact: true }),
  ).toHaveCount(0);
  await detail
    .getByRole("button", { name: "Request location", exact: true })
    .click();
  const request = page.getByRole("dialog", {
    name: "Request location",
    exact: true,
  });
  await request.getByLabel("Name", { exact: true }).fill("List-view buyer");
  await request.getByLabel("Indian mobile", { exact: true }).fill("9000000000");
  await request.getByRole("checkbox").check();
  await request.getByRole("button", { name: "Send request" }).click();
  await expect(
    request.getByRole("heading", { name: "Request sent" }),
  ).toBeVisible();
  await request.getByRole("button", { name: "Done" }).click();
  await page.keyboard.press("Escape");
  await expect(detail).toHaveCount(0);
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  await expect(card.getByRole("status")).toHaveText("requested");
  await page.reload();
  await expect(
    page
      .getByRole("group", { name: "Agent listing view" })
      .getByRole("button", { name: "List view" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(card.locator(".save-button")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(card.getByRole("status")).toHaveText("requested");
  expect(errors).toEqual([]);
});
