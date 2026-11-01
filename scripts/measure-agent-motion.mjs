import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const phase = process.argv[2] || "after";
const baseURL = process.env.BASE_URL || "http://127.0.0.1:5173";
const listings = JSON.parse(
  await fs.readFile(
    new URL("../src/data/agentListings.json", import.meta.url),
    "utf8",
  ),
);
const browser = await chromium.launch({ headless: true });
const summary = [];
for (const [name, width, height, touch] of [
  ["phone", 375, 812, true],
  ["tablet", 768, 1024, true],
  ["desktop", 1440, 900, false],
]) {
  if (process.env.SKIP_PHONE && name === "phone") continue;
  console.log("Capturing", phase, name);
  const dir = `artifacts/agent-motion/${phase}/${name}`;
  await fs.mkdir(dir, { recursive: true });
  const context = await browser.newContext({
    viewport: { width, height },
    isMobile: touch,
    hasTouch: touch,
  });
  await context.tracing.start({
    screenshots: true,
    snapshots: true,
    sources: true,
  });
  await context.addInitScript(
    ({ listings }) => {
      const extras = Array.from({ length: 30 }, (_, i) => ({
        ...listings[i % listings.length],
        id: "perf-" + i,
        agentId: "a1",
        mode: "BUY",
        status: "available",
        title: "Performance sample " + (i + 1),
      }));
      if (!sessionStorage.getItem("perf-seeded")) {
        localStorage.setItem(
          "centometer-agents-v2",
          JSON.stringify({ customListings: extras }),
        );
        sessionStorage.setItem("perf-seeded", "1");
      }
      window.perf = {
        longTasks: [],
        shifts: [],
        events: [],
        frames: [],
        marks: [],
      };
      for (const [type, key] of [
        ["longtask", "longTasks"],
        ["layout-shift", "shifts"],
        ["event", "events"],
      ])
        try {
          new PerformanceObserver((list) => {
            for (const e of list.getEntries())
              window.perf[key].push({
                name: e.name,
                start: e.startTime,
                duration: e.duration,
                value: e.value || 0,
                input: !!e.hadRecentInput,
                interactionId: e.interactionId || 0,
              });
          }).observe({ type, buffered: true, durationThreshold: 16 });
        } catch {
          /* Unsupported metric is left empty. */
        }
      let last;
      function frame(now) {
        if (last) window.perf.frames.push({ at: now, delta: now - last });
        last = now;
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    },
    { listings },
  );
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", {
    rate: touch && width === 375 ? 4 : 1,
  });
  await cdp.send("Tracing.start", {
    categories: "devtools.timeline,blink.user_timing,loading,latencyInfo",
    transferMode: "ReturnAsStream",
  });
  const navigate = async (route) => {
    await page.evaluate((route) => {
      const a = document.createElement("a");
      a.id = "perf-route";
      a.textContent = "Scenario navigation";
      a.href = "#" + route;
      Object.assign(a.style, {
        position: "fixed",
        top: "0",
        left: "0",
        zIndex: "999999",
        padding: "12px",
        background: "white",
      });
      document.body.append(a);
    }, route);
    await page.locator("#perf-route").click();
    await page.evaluate(() => document.getElementById("perf-route").remove());
  };
  const shot = async (label) => {
    await page.screenshot({ path: `${dir}/${label}.png` });
    await page.evaluate(
      (label) => window.perf.marks.push({ label, at: performance.now() }),
      label,
    );
  };
  await page.goto(baseURL + "/#agent/ananya.rao?mode=BUY&available=false", {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(850);
  await shot("01-first-load");
  await page.evaluate(() =>
    window.perf.marks.push({ label: "scroll-start", at: performance.now() }),
  );
  for (let i = 0; i < 30; i++) {
    await page
      .locator(".agent-listing")
      .nth(i)
      .evaluate((el) =>
        el.scrollIntoView({ block: "center", behavior: "instant" }),
      );
    await page.waitForTimeout(45);
  }
  await page.evaluate(() =>
    window.perf.marks.push({ label: "scroll-end", at: performance.now() }),
  );
  await shot("02-scroll-30");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  for (const value of ["low", "high", "area", "sqft", "newest"]) {
    await page.getByLabel("Sort listings").selectOption(value);
    await page.waitForTimeout(70);
  }
  await page.waitForTimeout(350);
  await shot("03-five-filters");
  await page.locator(".property-copy").first().click();
  await page.waitForTimeout(500);
  await shot("04-detail-open");
  const handle = page.getByRole("button", { name: "Drag to dismiss" });
  if (await handle.count()) {
    const box = await handle.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + 12);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + 180, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(400);
  } else await page.getByLabel("Close dialog").first().click();
  await shot("05-detail-dismissed");
  // Exercise the real request and demo-dashboard approval flow for a seeded sample.
  await navigate("agent/ananya.rao?l=al1");
  await page.waitForTimeout(500);
  await page
    .getByRole("button", { name: "Request location", exact: true })
    .click();
  await page.getByLabel("Name", { exact: true }).fill("Motion review");
  await page.getByLabel("Indian mobile", { exact: true }).fill("9000000000");
  await page.getByRole("checkbox").last().check();
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await page.waitForTimeout(450);
  await shot("06-requested");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.waitForTimeout(350);
  await page.getByLabel("Close dialog").first().click();
  await page.waitForTimeout(350);
  await navigate("agent-dashboard");
  await page.waitForTimeout(400);
  await page
    .getByRole("button", { name: "Approve", exact: true })
    .first()
    .click();
  await navigate("agent/ananya.rao?l=al1");
  await page.waitForTimeout(700);
  await page.locator(".location-gate").last().scrollIntoViewIfNeeded();
  await shot("07-unlocked");
  await page.getByLabel("Close dialog").first().click();
  await page.waitForTimeout(350);
  await page.getByRole("tab", { name: "About", exact: true }).click();
  await page.waitForTimeout(300);
  await shot("08-about");
  await page.getByRole("tab", { name: "Listings", exact: true }).click();
  await page.waitForTimeout(300);
  await navigate("agents");
  await page.waitForTimeout(500);
  await shot("09-finder");
  const metrics = await page.evaluate(() => {
    const p = window.perf;
    const start = p.marks.find((m) => m.label === "scroll-start")?.at || 0,
      end = p.marks.find((m) => m.label === "scroll-end")?.at || Infinity;
    const frame = p.frames.filter(
      (f) => f.at >= start && f.at <= end && f.delta < 500,
    );
    const interactions = new Map();
    p.events
      .filter((e) => e.interactionId)
      .forEach((e) =>
        interactions.set(
          e.interactionId,
          Math.max(interactions.get(e.interactionId) || 0, e.duration),
        ),
      );
    return {
      ...p,
      summary: {
        fps: 1000 / (frame.reduce((s, f) => s + f.delta, 0) / frame.length),
        cls: p.shifts.filter((e) => !e.input).reduce((s, e) => s + e.value, 0),
        inpLab: Math.max(0, ...interactions.values()),
        longTaskCount: p.longTasks.length,
        longTaskMax: Math.max(0, ...p.longTasks.map((e) => e.duration)),
      },
    };
  });
  await fs.writeFile(`${dir}/metrics.json`, JSON.stringify(metrics, null, 2));
  summary.push({
    viewport: name,
    cpu: width === 375 ? 4 : 1,
    ...metrics.summary,
  });
  const complete = new Promise((resolve) =>
    cdp.once("Tracing.tracingComplete", resolve),
  );
  await cdp.send("Tracing.end");
  const { stream } = await complete;
  let data = "";
  for (;;) {
    const result = await cdp.send("IO.read", { handle: stream });
    data += result.data;
    if (result.eof) break;
  }
  await cdp.send("IO.close", { handle: stream });
  await fs.writeFile(`${dir}/performance-trace.json`, data);
  await context.tracing.stop({ path: `${dir}/playwright-trace.zip` });
  await context.close();
}
await fs.writeFile(
  `artifacts/agent-motion/${phase}/summary.json`,
  JSON.stringify(summary, null, 2),
);
console.log(JSON.stringify(summary, null, 2));
await browser.close();
