import { test, expect } from "@playwright/test";
test("press feedback uses scale and keeps control layout unchanged", async ({
  page,
}) => {
  await page.goto("/#agents");
  const button = page.getByRole("button", { name: "Filters, 0 active" });
  await expect(button).toBeVisible();
  const before = await button.evaluate((e) => ({
    width: e.offsetWidth,
    height: e.offsetHeight,
    top: e.offsetTop,
  }));
  await button.dispatchEvent("pointerdown");
  const point = await button.boundingBox();
  await page.mouse.move(point.x + point.width / 2, point.y + point.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(150);
  expect(await button.evaluate((e) => getComputedStyle(e).scale)).toBe("0.95");
  expect(
    await button.evaluate((e) => ({
      width: e.offsetWidth,
      height: e.offsetHeight,
      top: e.offsetTop,
    })),
  ).toEqual(before);
  await page.mouse.up();
});
test("reduced motion disables control and modal transitions", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#agents");
  await page.getByRole("button", { name: "Filters, 0 active" }).click();
  expect(
    await page
      .locator(".finder-sheet .modal")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
  expect(
    await page
      .locator(".finder-sheet button")
      .first()
      .evaluate((e) => getComputedStyle(e).transitionDuration),
  ).toBe("0s");
});
test("fine pointer hover lifts cards using translate only", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "desktop", "Fine pointer hover only");
  await page.goto("/#agents");
  const card = page.locator(".agent-card").first();
  await card.hover();
  await page.waitForTimeout(220);
  expect(await card.evaluate((e) => getComputedStyle(e).translate)).toBe(
    "0px -4px",
  );
  const properties = await card.evaluate((e) =>
    getComputedStyle(e)
      .transitionProperty.split(",")
      .map((x) => x.trim()),
  );
  expect(
    properties.every((p) => ["scale", "translate", "opacity"].includes(p)),
  ).toBe(true);
});
