import { test, expect } from "@playwright/test";
for (const close of ["X", "Escape", "Back"])
  test(`listing closes by ${close} with one history entry and keeps list scroll`, async ({
    page,
  }) => {
    await page.goto("/#agent/ananya.rao?mode=BUY&available=false");
    const card = page.locator(".property-copy").last();
    await card.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        card.evaluate((el) => el.closest(".agent-listing").dataset.entered),
      )
      .toBe("true");
    await card.evaluate((el) =>
      Promise.all(
        el
          .closest(".agent-listing")
          .getAnimations()
          .map((a) => a.finished.catch(() => {})),
      ),
    );
    await card.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => {
      history.replaceState({ ...history.state, sentinel: 42 }, "");
      return { hash: location.hash, y: scrollY, length: history.length };
    });
    await card.click();
    await expect(page.getByRole("dialog").first()).toBeVisible();
    expect(await page.evaluate(() => history.length)).toBe(before.length + 1);
    if (close === "X")
      await page
        .getByRole("button", { name: "Close dialog", exact: true })
        .click();
    else if (close === "Escape") await page.keyboard.press("Escape");
    else await page.goBack();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => location.hash))
      .toBe(before.hash);
    expect(await page.evaluate(() => history.state.sentinel)).toBe(42);
    expect(
      Math.abs((await page.evaluate(() => scrollY)) - before.y),
    ).toBeLessThan(3);
  });
test("profile filters and tabs do not scroll the page", async ({ page }) => {
  await page.goto("/#agent/ananya.rao?mode=BUY&available=false");
  const sort = page.getByLabel("Sort listings");
  await sort.scrollIntoViewIfNeeded();
  const y = await page.evaluate(() => scrollY);
  await sort.selectOption("low");
  await expect(page).toHaveURL(/sort=low/);
  expect(await page.evaluate(() => scrollY)).toBe(y);
  await page
    .getByRole("tab", { name: "About", exact: true })
    .scrollIntoViewIfNeeded();
  const tabY = await page.evaluate(() => scrollY);
  await page.getByRole("tab", { name: "About", exact: true }).click();
  await expect(page).toHaveURL(/tab=about/);
  expect(await page.evaluate(() => scrollY)).toBe(tabY);
});

test("a direct listing link closes to its profile with one Back press", async ({
  page,
}) => {
  await page.goto("/#agent/ananya.rao?l=al1");
  await expect(page.getByRole("dialog").first()).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).not.toHaveURL(/[?&]l=/);
});
