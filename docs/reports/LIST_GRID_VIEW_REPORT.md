# Listing view modes — 2026-11-02

## Result

Added a shared grid/list toggle beside the result count on browse, Agent Finder, and agent-profile property listings. Grid remains the default. No dependencies, listing data, filters, action handlers, or location-gating rules changed.

Finder actually renders `AgentCard`; `ListingGrid` and `ListingCard` are used on agent profiles. Both surfaces receive the shared control so the Finder requirement and the identified property-listing components are covered.

## Design decisions

- `ViewToggle` contains two stable icon buttons with a labeled group, `aria-pressed`, descriptive names, 44×44 px targets, visible active/focus states, and a polite live announcement. The control keeps the same dimensions in both states and switching retains keyboard focus.
- `useViewMode(key)` reuses the existing guarded JSON localStorage helpers. Missing, corrupt, invalid, or unavailable storage defaults to grid. A blocked write leaves the current session interactive. Preferences are independent: `centometer-view-browse`, `centometer-view-finder`, and `centometer-view-agent-listings`.
- Existing memoized card components receive a `view` prop. List layout uses the same DOM, callbacks, accessible controls, and badges. It places photos on the left and information on the right; long titles wrap, and save controls stay over the thumbnail. Finder retains every preview photo, specialty, response time, follow action, and profile action.
- List mode is one row per card at phone and desktop widths. The scoped stylesheet leaves the default grid rules intact. No fake hash events, URL navigation, forced scroll-to-top, or keyed card remounts were introduced.
- `ListingGrid` still measures `:scope > [data-listing-id]`, caps FLIP at 20 cards, and uses translate/scale/opacity for 220 ms movement. It now reacts to view changes and size differences as well as position differences. Pending animations cancel on another switch/unmount, and exit clones cannot enter subsequent card measurements. Finder's existing FLIP also handles layout changes and cancels pending animations. Both use the existing reduced-motion helpers.
- Finder/profile skeletons read their saved layout preference and use matching horizontal placeholders. Existing empty states and fallback actions remain; the Finder no-match/reset path is exercised in list mode.

## Verification

| Check | Result |
| --- | --- |
| `npm run lint` | Passed, no warnings |
| `npm test` | 126 tests passed in 23 files |
| `npm run build` | Passed, no Vite warnings |
| `npm run test:e2e` | 72 passed; 2 intentional touch-device hover skips |

Added 14 unit/DOM tests for default grid, toggling, focus, pressed state, live announcements, remount persistence, invalid/unavailable storage, key independence, stable card nodes, direct-child FLIP, cancellation, reduced motion, and skeleton preferences.

Added six browser scenarios across **360×800 touch** and **1280×900**. They verify browse/Finder/profile switching, invariant control dimensions, minimum touch targets, focus and scroll retention, no settled page-width overflow, reload persistence, independent preferences, save/follow, filtering/empty/reset, profile navigation, gallery keyboard navigation, comparison, and gated location requests. Existing tests and assertions were retained.

The first new browser test assumed the first sample ID was active; it is sold, so the test now selects the rendered active card. Another new test needed to open the existing comparison disclosure before checking its table. These were corrections to new tests, not product behavior changes.

Grid/list screenshots at both requested sizes are saved locally under `artifacts/view-modes/`, with names such as `browse-360-grid.png`, `browse-360-list.png`, `finder-1280-list.png`, and `profile-360-list.png`. Final command logs are in that directory; browser traces are in `test-results/`. These generated artifacts are ignored by Git. Map tile requests are blocked in browser tests for repeatability; map failure feedback is expected.

## Not included

Saved/Seen lists retain their current layouts. Their wrapper cards include collection/note controls and are separate from agent-saved content; changing those optional surfaces would expand the layout scope. No production deployment was triggered manually; the source change is pushed to `main`.

## Files changed

- `src/components/ViewToggle.jsx` — shared accessible control.
- `src/useViewMode.js` — shared guarded preference hook.
- `src/styles/viewModes.css`, `src/main.jsx` — scoped layouts and stylesheet entry.
- `src/App.jsx`, `src/components/PropertyCard.jsx` — browse control and horizontal cards.
- `src/pages/AgentFinder.jsx`, `src/components/agent/AgentCard.jsx` — Finder control, agent rows, and motion.
- `src/pages/AgentProfile.jsx`, `src/components/agent/ListingGrid.jsx`, `src/components/agent/ListingCard.jsx` — profile control, stable property cards, and FLIP lifecycle.
- `src/components/LoadingSkeleton.jsx` — persisted skeleton layout.
- `tests/viewMode.test.jsx`, `tests/listingViewMotion.test.jsx` — unit/DOM coverage.
- `tests/e2e/view-modes.e2e.js`, `playwright.config.js` — browser scenarios at the requested sizes.
- `docs/reports/LIST_GRID_VIEW_REPORT.md` — this report.
