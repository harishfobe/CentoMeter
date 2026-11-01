# Finder filter redesign

Only the Finder filtering experience changed. Agent cards, location gating and `src/lib/agents.js` remain unchanged. No dependencies were added.

## Files

- `src/pages/AgentFinder.jsx`: compact search, 250ms debounce, up to six grouped keyboard suggestions, quick chips, removable active filters, sort dialog, location fallback toast, live results and bounded 200ms FLIP. Filter state is mirrored using replaceState; while a sheet is open URL writes pause until close.
- `src/components/agent/FinderFilterSheet.jsx`: existing Modal (and its useOverlayBack/focus trap), responsive sheet/dialog, swipe handle, all filter sections, live result footer and Reset actions.
- `src/components/agent/FinderChips.jsx`: shared button chips and keyboard arrow navigation for radio segments.
- `src/styles/agents.css`: scoped Finder styles, light orange selection, sticky search, scroll direction chip visibility, reduced motion and responsive sheet layout.
- `src/App.jsx`: moved the Demo agent dashboard shortcut into Profile; no other profile redesign.
- `tests/agentUX.test.jsx`, `tests/e2e/finder.e2e.js`: refreshed old control expectations and added Finder interaction coverage.
- `design/finder-capture.mjs`: reproducible screenshots, geometry checks and axe audit (uses a temporary external axe script; no project dependency).

The unchanged findAgents API accepts one locality and a maximum budget. The page adapts multi-area selections and price ranges around calls to this function. Existing filter keys are retained; mode selects the budget preset context.

## Verification

Build, lint and all 75 unit/DOM tests pass. Full browser regression: 36 tests pass across desktop, tablet and phone. The six new checks cover open/close, three live filters, count consistency, URL commit on close, one Back press, Clear all, geolocation denial fallback, keyboard search, Escape and focus return.

At 375×812 the app header ends at y=60 and the first card begins at y=236: 176px for the title and filtering section. Card start is y=236 at 768×1024 and y=260 at 1440×900. No document horizontal overflow at any size. The sheet has zero axe-core 4.10.3 violations at all three sizes. This is a scoped sheet audit, not a claim that every pre-existing application screen is axe clean.

## Screenshots

Before images reuse the Playwright captures of the unchanged Finder from the preceding revision; after images and sheet images are newly captured. Before images are full-page, after images show the viewport.

| Size | Before | After | Sheet |
| --- | --- | --- | --- |
| 375×812 | [Before](../../artifacts/finder-filters/before-phone.png) | [After](../../artifacts/finder-filters/after-phone.png) | [Sheet](../../artifacts/finder-filters/sheet-phone.png) |
| 768×1024 | [Before](../../artifacts/finder-filters/before-tablet.png) | [After](../../artifacts/finder-filters/after-tablet.png) | [Sheet](../../artifacts/finder-filters/sheet-tablet.png) |
| 1440×900 | [Before](../../artifacts/finder-filters/before-desktop.png) | [After](../../artifacts/finder-filters/after-desktop.png) | [Sheet](../../artifacts/finder-filters/sheet-desktop.png) |

Generated screenshots and traces are workspace artifacts ignored by Git. `artifacts/finder-filters/checks.json` records geometry and axe results.

## Limits

Selected colors change instantly; movement and fades use transform/opacity only, honoring the requested animation restriction. Swipe dismissal uses a 120px downward gesture from the handle. Active-filter chips can add height when filters are selected; the 176px measurement is the default state. The existing Vite chunk-size warning remains. No push or deployment was performed.
