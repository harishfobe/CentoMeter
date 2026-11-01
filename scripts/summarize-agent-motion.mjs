import fs from "node:fs/promises";
const phases = process.argv.slice(2);
const results = [];
for (const phase of phases.length
  ? phases
  : ["production-before", "production-after"])
  for (const viewport of ["phone", "tablet", "desktop"]) {
    const root = `artifacts/agent-motion/${phase}/${viewport}`;
    const m = JSON.parse(await fs.readFile(root + "/metrics.json", "utf8"));
    const { traceEvents: events } = JSON.parse(
      await fs.readFile(root + "/performance-trace.json", "utf8"),
    );
    const nav = events.find(
      (e) => e.name === "navigationStart" && e.args?.data?.isOutermostMainFrame,
    );
    const time = (label) => m.marks.find((x) => x.label === label)?.at;
    const start = nav.ts + time("scroll-start") * 1000,
      end = nav.ts + time("scroll-end") * 1000;
    const frames = [
      ...new Set(
        events
          .filter(
            (e) =>
              e.pid === nav.pid &&
              e.name === "AnimationFrame::Presentation" &&
              e.ts >= start &&
              e.ts <= end,
          )
          .map((e) => e.ts),
      ),
    ].sort((a, b) => a - b);
    const scrollTasks = m.longTasks.filter(
      (t) => t.start >= time("scroll-start") && t.start <= time("scroll-end"),
    );
    const openTasks = m.longTasks.filter(
      (t) =>
        t.start >= time("03-five-filters") && t.start <= time("04-detail-open"),
    );
    const traceInteractions = events
      .filter(
        (e) =>
          e.pid === nav.pid &&
          e.name === "Responsiveness.Renderer.UserInteraction",
      )
      .map((e) => e.args?.data?.maxDuration || 0);
    let windowStart = 0,
      last = 0,
      score = 0,
      cls = 0;
    for (const e of m.shifts.filter((e) => !e.input)) {
      if (e.start - last > 1000 || e.start - windowStart > 5000) {
        score = 0;
        windowStart = e.start;
      }
      score += e.value;
      cls = Math.max(cls, score);
      last = e.start;
    }
    results.push({
      phase,
      viewport,
      cpu: viewport === "phone" ? 4 : 1,
      fpsFromTrace:
        frames.length > 1
          ? ((frames.length - 1) * 1e6) / (frames.at(-1) - frames[0])
          : null,
      fpsRaf: m.summary.fps,
      cls,
      interactionMs: Math.max(0, ...traceInteractions),
      eventTimingMs: m.summary.inpLab,
      longTasks: m.longTasks.length,
      longTaskMax: m.summary.longTaskMax,
      scrollLongTasks: scrollTasks.length,
      scrollLongTaskMax: Math.max(0, ...scrollTasks.map((t) => t.duration)),
      openLongTasks: openTasks.length,
      openLongTaskMax: Math.max(0, ...openTasks.map((t) => t.duration)),
    });
  }
await fs.writeFile(
  "artifacts/agent-motion/comparison.json",
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));
