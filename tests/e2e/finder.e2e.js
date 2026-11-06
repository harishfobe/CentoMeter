import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.goto("/#agents");
  await page.waitForTimeout(400);
});
test("compact layout, filters apply live, URL commits on close, clear and Back", async ({
  page,
}) => {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const first = page.locator(".agent-grid");
  expect((await first.boundingBox()).y).toBeLessThan(
    page.viewportSize().width === 375 ? 261 : 300,
  );
  const initial = await page.evaluate(() => location.hash);
  await page.getByRole("button", { name: "Filters, 0 active" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Coimbatore", exact: true }).click();
  await dialog.getByRole("button", { name: "English", exact: true }).click();
  await dialog.getByRole("radio", { name: "1 hour", exact: true }).click();
  const count = await page.locator(".agent-grid .agent-card").count();
  await expect(
    dialog.getByRole("button", {
      name: `Show ${count} ${count === 1 ? "agent" : "agents"}`,
      exact: true,
    }),
  ).toBeVisible();
  expect(await page.evaluate(() => location.hash)).toBe(initial);
  await page.goBack();
  await expect(dialog).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => location.hash)).not.toBe(initial);
  await page.getByRole("button", { name: "Clear all", exact: true }).click();
  await expect(page.getByText("Sort: Best")).toBeVisible();
  await expect(page.locator(".finder-active")).toHaveCount(0);
});
test("Near me fallback and keyboard search and sheet focus", async ({
  page,
}) => {
  await page.evaluate(() => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition: (_ok, fail) => fail() },
    });
  });
  await page.getByRole("button", { name: "Near me", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Using Coimbatore");
  await page.getByRole("button", { name: "Clear all", exact: true }).click();
  const search = page.getByRole("combobox");
  await search.fill("Ananya");
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(search).toHaveValue("Ananya Rao");
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  const trigger = page.getByRole("button", { name: "Filters, 0 active" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
