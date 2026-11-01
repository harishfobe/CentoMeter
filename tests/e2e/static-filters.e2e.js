import { test, expect } from "@playwright/test";
for (const [route, selector] of [
  ["agents", ".finder-sticky"],
  ["agent/ananya.rao", ".agent-filter-bar"],
]) {
  test(`${route} filters remain in normal flow and do not hide on downward scroll`, async ({
    page,
  }) => {
    await page.goto("/#" + route);
    const filters = page.locator(selector).first();
    await expect(filters).toBeVisible();
    expect(await filters.evaluate((el) => getComputedStyle(el).position)).toBe(
      "static",
    );
    await page.locator(".agent-feature").evaluate((el) => {
      el.dataset.scrollDown = "true";
    });
    for (const target of [
      filters,
      ...(route === "agents" ? [page.locator(".finder-quick")] : []),
    ]) {
      expect(
        await target.evaluate((el) => getComputedStyle(el).pointerEvents),
      ).toBe("auto");
      expect(await target.evaluate((el) => getComputedStyle(el).opacity)).toBe(
        "1",
      );
      expect(
        await target.evaluate((el) => getComputedStyle(el).translate),
      ).toBe("none");
    }
  });
}
