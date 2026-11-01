import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const browser = await chromium.launch();
const report = [];
for (const [name, width, height] of [
  ["phone", 375, 812],
  ["tablet", 768, 1024],
  ["desktop", 1440, 900],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    hasTouch: name !== "desktop",
    isMobile: name !== "desktop",
  });
  await page.goto("http://127.0.0.1:5173/#agents");
  await page.waitForTimeout(700);
  await page.screenshot({ path: `artifacts/finder-filters/after-${name}.png` });
  const geometry = await page.evaluate(() => ({
    cardTop: document.querySelector(".agent-grid").getBoundingClientRect().top,
    overflow: document.documentElement.scrollWidth > innerWidth,
  }));
  await page.getByRole("button", { name: "Filters, 0 active" }).click();
  await page.waitForTimeout(350);
  await page.screenshot({ path: `artifacts/finder-filters/sheet-${name}.png` });
  let axe = null;
  try {
    await page.addScriptTag({ path: "/tmp/centometer-axe.min.js" });
    axe = await page.evaluate(async () =>
      (
        await window.axe.run(document.querySelector(".finder-sheet"), {
          rules: { "color-contrast": { enabled: true } },
        })
      ).violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    );
  } catch (e) {
    axe = String(e);
  }
  report.push({ name, ...geometry, axe });
  await page.close();
}
await fs.writeFile(
  "artifacts/finder-filters/checks.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report));
await browser.close();
