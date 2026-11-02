# Prototype polish and optimization

Baseline: Git commit `8d204e2`. This pass preserves the established UI, static profile/Finder filter behavior, and location-access decisions. No dependencies were added.

## Motion and interaction audit

- Shared press feedback stays at .95 scale; fine-pointer hover lifts cards and controls by 4px with the shared cubic-bezier(.16,1,.3,1) curve. Cards have a static soft shadow, so hovering does not interpolate shadow paint.
- Removed animated grid tracks from the approved-map reveal, SVG stroke drawing from success feedback, blur from marker keyframes, and paint-property transitions from legacy activity/map styles. Map geometry now changes once, with transform/opacity feedback around the resulting state.
- Leaflet/cluster motion respects reduced motion. Vendor spider-leg stroke animation is disabled; map transform/opacity transitions use the shared curve.
- Statistics show their actual values immediately and fade into view instead of rewriting text on every animation frame.
- New automated CSS audit checks authored keyframes and transition properties. Existing press, hover, reduced-motion, navigation and scroll tests remain in place.

## Rendering and state

- Added a stable external-store subscription and primitive selector hook. Agent cards subscribe only to their own follow state; a Profiler test confirms unrelated saved/followed changes do not commit the card.
- Memoized agent preview/count calculations and Finder rendering; stabilized the main navigation callback.
- Finder FLIP reads all card rectangles before animation writes, uses stable agent IDs/document coordinates, and skips unchanged rectangles. The 20-card/200ms cap remains.
- Extracted and memoized the main property card. Stable save/open callbacks let unchanged cards bail out; saves update immediately and persist across reloads.
- Removed the profile-header skeleton wrapper, the approved-map inner wrapper, and compact property-card wrappers that had no structural purpose. Metadata wrappers and accessibility/dialog boundaries remain where needed.
- Added intrinsic dimensions/async decoding to previously unreserved property, gallery, search-preview and posting images. Agent previews skip missing photos.

## Loading and production output

There were no blocking spinner components in the audited flows. The existing agent skeletons were timed overlays hiding data that was already available. Those overlays and their 300ms delay were removed. Shimmering skeletons now appear at actual deferred-code boundaries, with Finder identity/thumbnail/action geometry, detail photo sizing and a full-size map placeholder. Inline photo-optimization status remains available while that action runs.

- Extracted `Modal`, `MapViewImpl`, and `PostFlow` from the large App module; lazy-loaded map, posting and agent routes.
- Leaflet and its CSS load when needed. Locked agent details do not require the map library; the approved map has its own lazy boundary.
- Listing intent (hover/focus) prepares the detail module. Shared promises avoid duplicate loads, and prefetch failures remain retryable.
- Extracted sharing into a small utility, avoiding a detail-to-profile module dependency.
- Production build succeeds with no chunk-size warning. The original 678kB entry became roughly 313kB; actual route loading also includes shared chunks, so use the measured route totals below rather than treating the entry reduction as the whole download reduction.

## Validation

- Build and ESLint pass; 76 unit/DOM tests pass.
- Full browser regression: 55 passed; two fine-pointer hover checks intentionally skipped on touch projects.
- Final focused navigation/Finder/production checks: 30 passed, covering deferred map/post routes, route-heading focus, CSS motion audit, save/reload behavior and navigation at 375×812, 768×1024 and 1440×900.
- Existing tests cover filter operation, Back/Escape/X/drag dismissals, gallery gestures, debounce stability, reduced motion, static filters and privacy boundaries.

Deferred route focus waits for the real heading to commit instead of focusing a placeholder. The older gallery test now waits for the real loaded sheet and its entrance animation instead of beginning a gesture on a lazy placeholder. The debounce observer ignores compositor cleanup/image metadata while retaining React-relevant DOM mutations.

## Production measurement

`measure-prototype-polish.mjs` runs production builds on ports 5181 (baseline) and 5182 (current), in fresh browser contexts. Phone uses touch and 4× CPU throttling; tablet and desktop use normal CPU. External network requests are blocked for repeatability, so map screenshots do not show live third-party tiles. Local fonts/images remain enabled.

Results, screenshots and Playwright traces: `artifacts/prototype-polish/`. Raw measurements are in `metrics.json`; generated artifacts are ignored by Git. Gzip figures are calculated compressed equivalents of JavaScript resources actually requested, not a claim that the local preview server transferred them compressed. Timing samples are single local runs, not field Core Web Vitals or statistical benchmarks. Event durations are not reported as INP, and no FPS claim is made.

| Route | JavaScript before (gzip kB) | After (gzip kB) | Reduction |
| --- | ---: | ---: | ---: |
| finder | 184.8 | 124.3 | 32.8% |
| agent | 184.8 | 126.9 | 31.3% |
| home | 184.8 | 174.0 | 5.8% |
| post | 184.8 | 125.6 | 32.0% |

Initial shared CSS is about 29.7kB gzip versus 36.1kB before. Map CSS is deferred on non-map routes. Total DOM-node counts include additional module-preload links, so they are not evidence of a larger visible component tree.

Timing and responsiveness samples (milliseconds):

| Device / route | FCP before → after | LCP before → after | Max initial long task before → after | Max interaction long task before → after | CLS after |
| --- | ---: | ---: | ---: | ---: | ---: |
| phone / finder | 176 → 168 | 1244 → 952 | 198 → 109 | 65 → 55 | 0.0000 |
| phone / agent | 136 → 164 | 1220 → 740 | 222 → 105 | 67 → 101 | 0.0000 |
| phone / home | 152 → 188 | 1108 → 1324 | 178 → 195 | 0 → 0 | 0.0002 |
| phone / post | 104 → 192 | 1136 → 192 | 174 → 148 | 0 → 0 | 0.0000 |
| tablet / finder | 76 → 124 | 316 → 548 | 0 → 0 | 0 → 0 | 0.0000 |
| tablet / agent | 116 → 124 | 668 → 384 | 0 → 0 | 0 → 0 | 0.0000 |
| tablet / home | 88 → 120 | 304 → 284 | 0 → 0 | 0 → 0 | 0.0000 |
| tablet / post | 80 → 104 | 432 → 732 | 0 → 0 | 0 → 0 | 0.0000 |
| desktop / finder | 76 → 92 | 480 → 508 | 0 → 0 | 0 → 0 | 0.0000 |
| desktop / agent | 104 → 124 | 704 → 792 | 56 → 59 | 0 → 0 | 0.0000 |
| desktop / home | 76 → 208 | 340 → 412 | 0 → 0 | 0 → 0 | 0.0284 |
| desktop / post | 96 → 112 | 488 → 508 | 0 → 0 | 0 → 0 | 0.0004 |

All sampled CLS values stayed below 0.03, and no page errors were recorded. Timing wins are not uniform: the cold map home and some tablet/desktop paints were slower in this sample. The 4× CPU run still includes >50ms startup tasks and a roughly 101ms first detail-opening task. Deferred work reduces upfront payload but can add first-use latency; intent preloading and immediate press feedback help without eliminating that cost. This pass does not claim that every interaction now stays below 50ms.


## Screenshots

| Surface | Before | After |
| --- | --- | --- |
| Phone Finder | [Before](../../artifacts/prototype-polish/before-phone-finder.png) | [After](../../artifacts/prototype-polish/after-phone-finder.png) |
| Phone profile | [Before](../../artifacts/prototype-polish/before-phone-agent.png) | [After](../../artifacts/prototype-polish/after-phone-agent.png) |
| Phone details | [Before](../../artifacts/prototype-polish/before-phone-detail.png) | [After](../../artifacts/prototype-polish/after-phone-detail.png) |
| Tablet Finder | [Before](../../artifacts/prototype-polish/before-tablet-finder.png) | [After](../../artifacts/prototype-polish/after-tablet-finder.png) |
| Desktop Finder | [Before](../../artifacts/prototype-polish/before-desktop-finder.png) | [After](../../artifacts/prototype-polish/after-desktop-finder.png) |

Home, posting and filter-sheet screenshots at all sizes are in the same directory. Screenshots show settled states; traces retain the interactions.

## Changed files

- App orchestration and extracted components: `src/App.jsx`, `src/Modal.jsx`, `src/MapView.jsx`, `src/MapViewImpl.jsx`, `src/PostFlow.jsx`, `src/components/PropertyCard.jsx`, `src/components/LoadingSkeleton.jsx`.
- Agent rendering/loading: `AgentCard`, `ListingCard`, `ListingDetailSheet`, `UnlockedMap`, `StatsRow`, `AgentFinder`, `AgentProfile`; removed the unused timed `MotionSkeleton` component.
- State/helpers: `src/lib/agentStore.js`, `agentMotion.js`, `agentShare.js`, `listingDetailsLoader.js`.
- Image geometry and import boundaries: `src/Discovery.jsx`, `src/SearchDiscovery.jsx`, `src/MinimalUI.jsx`, `src/main.jsx`.
- Styles: `src/styles.css`, `src/mobile.css`, `src/styles/agents.css`, `motion.css`, `interactions.css`.
- Evidence: `tests/agentMotion.test.jsx`, `tests/e2e/motion.e2e.js`, `tests/e2e/production-polish.e2e.js`, `scripts/measure-prototype-polish.mjs`, this report.
