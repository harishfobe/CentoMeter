import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }, info) => {
  if (info.project.name === "phone") {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  }
});
test("reduced motion disables transitions and animations in the profile and sheet", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#agent/ananya.rao?mode=BUY&available=false");
  await page.waitForTimeout(400);
  const moving = () =>
    page.evaluate(() =>
      [
        ...document.querySelectorAll(
          ".agent-feature *,.modal-scrim,.modal-scrim *",
        ),
      ]
        .filter((el) => {
          const s = getComputedStyle(el);
          return (
            s.animationName !== "none" ||
            s.transitionDuration.split(",").some((t) => parseFloat(t) > 0)
          );
        })
        .map((el) => el.className),
    );
  expect(await moving()).toEqual([]);
  await page.locator(".property-copy").first().click();
  expect(await moving()).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("dragging the handle dismisses the sheet without moving the list", async ({
  page,
}) => {
  await page.goto("/#agent/ananya.rao?mode=BUY&available=false");
  await page.waitForTimeout(400);
  await page
    .locator(".property-copy")
    .last()
    .evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(260);
  await page
    .locator(".property-copy")
    .last()
    .evaluate((el) => el.scrollIntoView({ block: "center" }));
  const y = await page.evaluate(() => scrollY);
  await page.locator(".property-copy").last().click();
  const handle = page.getByRole("button", { name: "Drag to dismiss" });
  await expect(handle).toBeVisible();
  await page.waitForTimeout(300);
  const b = await handle.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2 + 150, {
    steps: 10,
  });
  await page.mouse.up();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(Math.abs((await page.evaluate(() => scrollY)) - y)).toBeLessThan(3);
});
test("price typing keeps the list stable until the 200ms debounce", async ({
  page,
}) => {
  await page.goto("/#agent/ananya.rao?mode=BUY&available=false");
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /More filters/ }).click();
  await page.evaluate(() => {
    window.cardMutations = 0;
    const grid = document.querySelector(".agent-motion-grid");
    window.gridObserver = new MutationObserver(() => window.cardMutations++);
    window.gridObserver.observe(grid, {
      subtree: true,
      childList: true,
      attributes: true,
      // Ignore compositor animation cleanup and image-loaded metadata.
      attributeFilter: ["class", "src", "aria-pressed"],
    });
  });
  await page.getByLabel("Minimum ₹").fill("1000");
  expect(await page.evaluate(() => window.cardMutations)).toBe(0);
  await expect(page).toHaveURL(/min=1000/);
  await page.evaluate(() => window.gridObserver.disconnect());
});
test("tab switching remembers the listing scroll position", async ({
  page,
}) => {
  await page.goto("/#agent/ananya.rao?mode=BUY&available=false");
  await page.waitForTimeout(400);
  await page
    .getByRole("tab", { name: "About", exact: true })
    .scrollIntoViewIfNeeded();
  const y = await page.evaluate(() => scrollY);
  await page.getByRole("tab", { name: "About", exact: true }).click();
  await page.getByRole("tab", { name: "Listings", exact: true }).click();
  expect(Math.abs((await page.evaluate(() => scrollY)) - y)).toBeLessThan(3);
});

test("gallery touch drag opens the full-screen viewer", async ({ page }) => {
  await page.goto("/#agent/ananya.rao?mode=BUY&available=false");
  await page.waitForTimeout(400);
  await page.locator(".property-copy").first().click();
  await expect(page.locator(".agent-detail")).toBeVisible();
  await page
    .locator(".modal:has(.agent-detail)")
    .evaluate((el) =>
      Promise.all(el.getAnimations().map((a) => a.finished.catch(() => {}))),
    );
  const gallery = page.locator(".agent-detail .agent-photo-strip"),
    box = await gallery.boundingBox();
  const x = box.x + box.width / 2,
    y = box.y + Math.min(90, box.height / 2);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x, y: y + 90 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(
    page.getByRole("dialog", { name: "Photo viewer", exact: true }),
  ).toBeVisible();
});
