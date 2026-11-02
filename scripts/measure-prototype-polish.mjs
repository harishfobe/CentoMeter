import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
const output = path.resolve("artifacts/prototype-polish");
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch();
const phaseFilter = process.env.POLISH_PHASE;
let results = [];
if (phaseFilter) {
  try {
    results = JSON.parse(
      await fs.readFile(`${output}/metrics.json`, "utf8"),
    ).filter((x) => x.phase !== phaseFilter);
  } catch {
    /* First measurement. */
  }
}
const routes = [
  ["finder", "agents", ".agent-card"],
  ["agent", "agent/ananya.rao?mode=BUY&available=false", ".agent-listing"],
  ["home", "home", ".leaflet-container"],
  ["post", "post", ".post-page"],
];
for (const [phase, port, dist] of [
  ["before", 5181, "/tmp/centometer-polish-baseline/dist"],
  ["after", 5182, path.resolve("dist")],
]) {
  if (phaseFilter && phase !== phaseFilter) continue;
  for (const [device, width, height, cpu] of [
    ["phone", 375, 812, 4],
    ["tablet", 768, 1024, 1],
    ["desktop", 1440, 900, 1],
  ]) {
    for (const [view, route, ready] of routes) {
      const context = await browser.newContext({
        viewport: { width, height },
        isMobile: device !== "desktop",
        hasTouch: device !== "desktop",
      });
      await context.route("**/*", (r) =>
        new URL(r.request().url()).hostname === "127.0.0.1"
          ? r.continue()
          : r.abort(),
      );
      await context.tracing.start({
        screenshots: true,
        snapshots: true,
        sources: false,
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const cdp = await context.newCDPSession(page);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
      await page.addInitScript(() => {
        window.measure = { shifts: [], tasks: [], lcp: 0, events: [] };
        for (const [type, callback] of [
          [
            "layout-shift",
            (e) => {
              if (!e.hadRecentInput)
                window.measure.shifts.push({
                  value: e.value,
                  start: e.startTime,
                });
            },
          ],
          [
            "longtask",
            (e) =>
              window.measure.tasks.push({
                start: e.startTime,
                duration: e.duration,
              }),
          ],
          [
            "largest-contentful-paint",
            (e) => (window.measure.lcp = e.startTime),
          ],
          [
            "event",
            (e) =>
              window.measure.events.push({
                name: e.name,
                duration: e.duration,
              }),
          ],
        ]) {
          try {
            new PerformanceObserver((list) =>
              list.getEntries().forEach(callback),
            ).observe({ type, buffered: true, durationThreshold: 16 });
          } catch {
            /* Unsupported metric is left absent. */
          }
        }
      });
      await page.goto(`http://127.0.0.1:${port}/#${route}`);
      await page.locator(ready).first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1000);
      const initial = await page.evaluate(() => ({
        fcp: performance.getEntriesByName("first-contentful-paint")[0]
          ?.startTime,
        lcp: window.measure.lcp,
        domNodes: document.querySelectorAll("*").length,
        bodyNodes: document.body.querySelectorAll("*").length,
        shifts: window.measure.shifts.slice(),
        tasks: window.measure.tasks.slice(),
        resources: performance.getEntriesByType("resource").map((x) => x.name),
        cutoff: performance.now(),
      }));
      await page.screenshot({
        path: `${output}/${phase}-${device}-${view}.png`,
      });
      if (view === "finder") {
        await page
          .getByRole("button", { name: "Verified", exact: true })
          .click();
        await page.waitForTimeout(250);
        await page.getByRole("button", { name: /^Filters, / }).click();
        await page.getByRole("dialog").waitFor();
        await page.waitForTimeout(300);
        await page.screenshot({
          path: `${output}/${phase}-${device}-filters.png`,
        });
        await page.keyboard.press("Escape");
      }
      if (view === "agent") {
        await page.locator(".property-copy").first().click();
        await page.locator(".agent-detail").waitFor();
        await page.waitForTimeout(400);
        await page.screenshot({
          path: `${output}/${phase}-${device}-detail.png`,
        });
        await page
          .getByRole("button", { name: "Close dialog", exact: true })
          .click();
      }
      await page.waitForTimeout(300);
      const final = await page.evaluate(() => window.measure);
      const jsFiles = [
        ...new Set(
          initial.resources
            .filter((x) => new URL(x).pathname.endsWith(".js"))
            .map((x) => new URL(x).pathname),
        ),
      ];
      let jsBytes = 0,
        jsGzipBytes = 0;
      for (const file of jsFiles) {
        const bytes = await fs.readFile(path.join(dist, file));
        jsBytes += bytes.length;
        jsGzipBytes += gzipSync(bytes).length;
      }
      const cls = (shifts) => {
        let max = 0,
          total = 0,
          start = 0,
          last = 0;
        for (const x of shifts) {
          if (x.start - last > 1000 || x.start - start > 5000) {
            total = 0;
            start = x.start;
          }
          total += x.value;
          last = x.start;
          max = Math.max(max, total);
        }
        return max;
      };
      const result = {
        phase,
        device,
        view,
        cpu,
        initial: {
          fcpMs: initial.fcp,
          lcpMs: initial.lcp,
          cls: cls(initial.shifts),
          domNodes: initial.domNodes,
          bodyNodes: initial.bodyNodes,
          jsBytes,
          jsGzipBytes,
          longTasks: initial.tasks.length,
          maxTaskMs: Math.max(0, ...initial.tasks.map((x) => x.duration)),
        },
        interaction: {
          cls: cls(final.shifts),
          maxTaskMs: Math.max(
            0,
            ...final.tasks
              .filter((x) => x.start >= initial.cutoff)
              .map((x) => x.duration),
          ),
          maxEventDurationMs: Math.max(
            0,
            ...final.events.map((x) => x.duration),
          ),
        },
        errors,
      };
      results.push(result);
      console.log(JSON.stringify(result));
      await context.tracing.stop({
        path: `${output}/${phase}-${device}-${view}.zip`,
      });
      await context.close();
    }
  }
}
await fs.writeFile(`${output}/metrics.json`, JSON.stringify(results, null, 2));
await browser.close();
