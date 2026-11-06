# Map list and Home ending — 2026-11-03

Map's View list control now changes React presentation state within `#map`, with Map remaining the active tab. Back to map restores the existing canvas and keyboard focus. The map stays mounted so its state is retained. Selecting the Map tab or Home's Open map action explicitly opens the canvas.

The list retains existing cards, search, filters, sort, save, details, area/city scope controls, and empty recovery. Detail/back returns to Map list. Removed the obsolete redirect-to-Home/pending-scroll logic.

A real regression found during browser review was fixed: Leaflet emits collapsed bounds when its container is hidden. Bounds and viewport updates from the hidden Map are now ignored, preserving the last visible area and preventing an incorrectly empty list. A unit regression simulates this event, and browser coverage requires actual property cards after switching.

Home no longer renders the full property-list panel or its bottom Browse all properties button. Existing section See all links still reach the separate results page. Home ends with Top rated agents, using the shared AgentCard, local sample agents, existing follow behavior and profile navigation. The data has no customer rating scores, so none were invented. The section explicitly says customer ratings are unavailable and features local agents ordered by existing sample verification/closed-deal fields.

This supersedes the embedded Home list described in the earlier Home discovery report. Search, BUY/SELL/RENT, discovery sections, private location access, masked numbers, and other routes remain intact. No dependencies or sample data changed.

Validation under Node 22.23.4:

- `npm run lint`: passed.
- `npm test`: 125 passed in 23 files.
- `npm run build`: passed.
- `npm run test:e2e`: 74 passed; two existing intentional touch-device hover skips.
- Focused browser flows cover 360×800 touch and 1280×900; additional screenshots/checks at 375×812 and 1280×900 confirm Map list/detail/back stays on Map, and Home has no full list and ends with local agents.

Generated screenshots and final logs are in `artifacts/map-list-home-agents/`. Browser tests also update screenshots in `artifacts/home-implementation/`. External map tiles are blocked for repeatable browser verification; this does not replace the production map.

Files changed: `src/App.jsx`, `src/components/HomeDiscovery.jsx`, `src/styles/home.css`, `tests/homeDiscovery.test.jsx`, `tests/homeNavigation.test.jsx`, `tests/e2e/home-discovery.e2e.js`, and this report.
