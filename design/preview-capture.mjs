import { chromium } from "@playwright/test";
const browser = await chromium.launch();
for (const [name, width, height] of [
  ["phone", 375, 812],
  ["tablet", 768, 1024],
  ["desktop", 1440, 900],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    isMobile: name !== "desktop",
    hasTouch: name !== "desktop",
  });
  for (const [view, hash] of [
    ["profile", "agent/ananya.rao?mode=BUY&available=false"],
    ["finder", "agents"],
  ]) {
    await page.goto("http://127.0.0.1:5173/#" + hash);
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: `artifacts/figma-refinement/${name}-${view}.png`,
      fullPage: true,
    });
    if (view === "profile") {
      await page.locator(".property-copy").first().click();
      await page.waitForTimeout(400);
      await page.screenshot({
        path: `artifacts/figma-refinement/${name}-detail.png`,
      });
    }
  }
  await page.close();
}
await browser.close();
