# Agent motion and interaction review

Implemented on `fix/centometer-review`, based on `0853450`. Location authorization, privacy modes, coordinates, and request approval rules remain unchanged; `src/lib/locationAccess.js` has no diff. The existing same-profile hash guard and route-transition helper already avoided whole-page transitions for in-page changes and were retained.

## What changed

1. **Jank:** React-owned filters with 200 ms debounced URL/localStorage persistence and deferred list computation. No synthetic hash events. Memoized listing cards receive request/saved/unlocked values and stable callbacks, and do not subscribe to the store. The list stays mounted while inputs are edited. Expiry refreshes use timeouts, sleep until the last hour, and stop at expiration; long delays respect the browser timer limit.
2. **Motion:** Shared timing/easing tokens; reduced-motion fallbacks; one-time IntersectionObserver card entrances with the first-eight stagger; viewport-triggered photo zooms on dominant-colour placeholders; snap galleries and noninteractive pill indicators; count-up stats; header entrance; sliding tab underline and panel crossfade; per-tab scroll memory; capped 20-card, 220 ms FLIP with exit fades; deferred-results progress; save pop/burst and haptics. Skeleton overlays last at least 300 ms, fade, and unmount rather than consuming animation resources invisibly.
3. **Sheets and feedback:** Phone bottom sheet / desktop side panel with reverse exit before unmount, pointer capture and rubber-banded drag dismissal, keyboard escape, gallery swipe-to-view with shared-element opening motion, request checkmark feedback, requested-state pulse, lock icon swap, authorized map reveal and marker bounce, and a location-unlocked toast. Notifications stack to three, expire after 3 seconds, and pause on hover, touch, or focus. A single passive/rAF scroll-polish listener controls top-bar shadow/blur, directional filter visibility, and Back to top.
4. **Interaction:** Save/follow and compare remain immediate, with preference rollback and a toast on persistence failure. Focus stays visible, gallery arrow keys work, images have dimensions, and result/request changes remain announced. Cards below the fold use content visibility and intrinsic sizing. The phone header no longer squeezes the registration number into a narrow stats column.

All movement uses compositor-friendly opacity and individual transform properties. The two specifically requested exceptions are the SVG checkmark stroke draw and the grid-track map reveal. Selected chip colour changes use a pseudo-element opacity fade, not an animated background property. The detail gallery remains locked until the existing authorization getter provides a point.

## Checks after each step

| Checkpoint | Build | Lint | Unit / DOM tests |
| --- | --- | --- | --- |
| Baseline | Pass | Pass | 70 |
| Step 1 | Pass | Pass | 70 |
| Step 2 | Pass | Pass | 70 |
| Step 3 | Pass | Pass | 75 |
| Step 4 / final | Pass | Pass | 75 |

The Chromium browser suite passed **27 regression tests plus 3 touch-gallery tests** across **375×812 touch**, **768×1024 touch**, and **1440×900**. The phone motion tests and all phone performance captures use **4× CPU throttling**. Coverage includes no scrolling on filters, scroll preservation for open/X/Escape/Back/drag close, direct links, tab scroll memory, reduced-motion transition suppression, stable list DOM while typing, and a real CDP touch drag opening the full-screen viewer. New unit tests cover card subscription isolation, expiry scheduling/stopping, absence of `setInterval` in the detail sheet, optimistic rollback, and card action IDs. `git diff --check` passes. The existing Vite >500 kB bundle warning remains.

A 12 px difference in an early phone drag test came from Playwright scrolling an offscreen card twice while its entrance was running. The test now waits for the card to settle before recording the baseline; the same strict 3 px tolerance is retained. Modal focus also explicitly prevents scrolling.

## Measurement method

The primary comparison uses production builds of the original commit (`0853450`, separate checkout) and the final UI, served by Vite preview. Each run uses a fresh browser context, the same sample records, 30 extra illustrative listings assigned to the same agent, and the same scripted journey. Captures cover first load, traversing 30 cards, five rapid sort/filter-state updates, opening/dismissing the detail, request submission, demo-dashboard approval/unlock, both tabs, and finder. The old UI had no drag handle, so its dismissal capture uses X.

The harness uses trusted navigation clicks to avoid counting deliberate scripted hash navigation as an unprompted layout shift. It records Playwright trace ZIPs, Chrome Performance trace JSON, screenshots, Event Timing, long tasks, and layout shifts. Phone CPU is throttled 4×; tablet and desktop are unthrottled. No network throttling or physical-device emulation beyond viewport/touch is claimed. Development-build traces are retained separately and are not mixed into the production comparison.

FPS is calculated from Chrome `AnimationFrame::Presentation` events during the scroll segment, excluding screenshot capture. CLS uses the maximum layout-shift session window and excludes recent-input shifts. The interaction number is the worst measured interaction from the trace, cross-checked with Event Timing; **it is a lab INP proxy, not field/CrUX INP**. Long-task totals cover the whole journey, including startup and dashboard/map rendering. The separate opening-window number includes click dispatch and rendering through the detail screenshot.

| Viewport | Trace FPS before → after | CLS before → after | Worst trace interaction, ms before → after | Long tasks before → after (max ms) | Opening-window max long task, ms before → after |
| --- | --- | --- | --- | --- | --- |
| 375×812 touch, 4× CPU | 59.4 → 51.5 | 0.000 → 0.022 | 141 → 74 | 12 (164) → 5 (230) | 114 → 67 |
| 768×1024 touch | 60.2 → 59.7 | 0.000 → 0.000 | 62 → 75 | 0 (0) → 0 (0) | 0 → 0 |
| 1440×900 | 60.0 → 47.2 | 0.000 → 0.000 | 151 → 64 | 0 (0) → 1 (55) | 0 → 0 |

**Targets still missed:** 55 FPS is not met in the phone (51.5) or desktop (47.2) stress-scroll capture. FPS regressed against the static baseline. The phone still has a 67 ms opening-window long task, above the requested 50 ms limit. Its largest whole-journey task is 230 ms, also worse than the baseline peak despite fewer total long tasks. The desktop has one 55 ms task outside scrolling/opening. These are unresolved performance limits, not passing results.

**Targets met in these captures:** CLS is below 0.05 at all sizes; no >50 ms task was recorded during the scroll segment at any size; the tablet meets 55 FPS. Worst recorded interactions are below 100 ms after the change, but this is one lab journey rather than a field INP guarantee. Event Timing reports 72/72/64 ms for phone/tablet/desktop, consistent with the trace interaction values after rounding.

The benchmark includes 30-card jumps and simultaneous entrance/photo motion. Results describe this stress journey on the shared headless runner, not a statistical FPS guarantee for real devices. Raw evidence is retained so the trade-off can be reviewed.

## Artifacts and reproduction

Artifacts are local and ignored by Git because raw traces are large. The review bundle includes before/after screenshots, both trace formats, raw metrics, and the generated comparison JSON.

- [Review bundle](../../artifacts/agent-motion/review-bundle.zip)
- [Phone before/after screenshots](../../artifacts/agent-motion/phone-before-after.png)
- [Raw comparison](../../artifacts/agent-motion/comparison.json)
- [Phone after Playwright trace](../../artifacts/agent-motion/production-after/phone/playwright-trace.zip)
- [Phone after Performance trace](../../artifacts/agent-motion/production-after/phone/performance-trace.json)

Run `npm run build`, `npm run lint`, `npm test`, and `npm run test:e2e`. For performance capture, serve the relevant production build and run `BASE_URL=http://127.0.0.1:<port> node scripts/measure-agent-motion.mjs <phase>`, then `node scripts/summarize-agent-motion.mjs <before-phase> <after-phase>`. Install Chromium through Playwright first. `PLAYWRIGHT_BROWSERS_PATH` is an optional environment-specific override.

## Limits and omissions

- The report distinguishes passing correctness/accessibility checks from performance targets; the metrics below identify any remaining target misses rather than claiming success.
- There was no visible map circle in the old locked detail sheet. The existing locked/unlocked behavior is preserved: it reveals the authorized map and drops the pin, rather than adding a new pre-approval map solely to animate a literal geographic circle collapse.
- Dominant-colour placeholders were chosen instead of adding base64 thumbnails. The visual dot indicators are noninteractive; swipe and keyboard arrows retain gallery control without tiny tap targets.
- Verification uses Chromium desktop and touch emulation, not physical phones, other engines, or field INP. The benchmark's five rapid updates are sort/filter-state changes; it is not a separate trace of every possible filter combination.
- No deployment or push was performed.

## File inventory

- `.gitignore`
- `docs/reports/AGENT_MOTION_REPORT.md`
- `playwright.config.js`
- `scripts/measure-agent-motion.mjs`
- `scripts/summarize-agent-motion.mjs`
- `src/App.jsx`
- `src/components/agent/AgentActivity.jsx`
- `src/components/agent/AgentCard.jsx`
- `src/components/agent/AgentTabs.jsx`
- `src/components/agent/AgentToasts.jsx`
- `src/components/agent/FilterBar.jsx`
- `src/components/agent/ListingCard.jsx`
- `src/components/agent/ListingDetailSheet.jsx`
- `src/components/agent/ListingGrid.jsx`
- `src/components/agent/ListingPresence.jsx`
- `src/components/agent/LocationPrivacyChip.jsx`
- `src/components/agent/MotionSkeleton.jsx`
- `src/components/agent/RequestLocationSheet.jsx`
- `src/components/agent/StatsRow.jsx`
- `src/lib/agentMotion.js`
- `src/lib/agentNavigation.js`
- `src/lib/agentStore.js`
- `src/lib/useDebouncedValue.js`
- `src/lib/useExpiryTick.js`
- `src/lib/useSheetDrag.js`
- `src/pages/AgentFinder.jsx`
- `src/pages/AgentProfile.jsx`
- `src/styles/agents.css`
- `src/styles/motion.css`
- `tests/agentFlows.test.jsx`
- `tests/agentMotion.test.jsx`
- `tests/e2e/motion.e2e.js`
- `tests/e2e/navigation.e2e.js`
