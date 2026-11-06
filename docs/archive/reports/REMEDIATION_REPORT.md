# CentoMeter remediation

Implemented the requested privacy, navigation, workflow, UX, and repository-hygiene changes in the local checkout. Existing component/class names are retained; additional components and classes support the requested controls. The first local commit, `ab1b793`, contains only Prettier formatting of `src/` and `tests/`.

## Validation

The initial `npm ci && npm run build && npm run lint && npm test` reached an unwritable default npm cache. The baseline rerun with `--cache /tmp/centometer-npm-cache` passed: build, lint, 52 tests. Build, lint, and tests were rerun after each functional group, and any intermediate failures were fixed.

| Checkpoint | Build | Lint | Unit / DOM tests |
| --- | --- | --- | --- |
| Baseline | Pass | Pass | 52 |
| A — privacy | Pass | Pass | 55 |
| B — navigation | Pass | Pass | 55 |
| C — flows, with navigation interaction coverage | Pass | Pass | 61 |
| D — UX | Pass | Pass | 61 |
| E — hygiene and expanded regressions | Pass | Pass | 70 across 11 files |

Chromium additionally passed 10 Playwright checks across desktop and mobile viewport projects: X, Escape, Back, deep-link closure, filters, and tabs. Scroll position and history state are asserted in a real browser. The tests assert one listing history entry and return to the prior list URL. `git diff --check` passes. The production build emits no private fixture asset; a separate production-mode test verifies sample approval returns `[0, 0]`, not fixture coordinates.

Vite still reports its existing >500 kB JavaScript chunk warning. It does not fail the build. No deployment or remote push was performed.

## Changes by requirement

- **A (1–5):** Exact sample locations are dev/test-only fixtures outside `src/`; production sample approvals use Null Island. Agent pages visibly disclose simulation. Sample and posted approximations use a random bearing and 20–60% of the radius, retained privately across reloads. Buyer identity applies to every agent listing, independent of ID prefix. Revocation remains locked, appears in Activity/dashboard, and applies the cooldown. Only hidden/no-pin and radius/circle modes remain in sample data and posting controls.
- **B (6–7):** Profile query, listing, and tab state use React state with `replaceState`, without synthetic hash events. A listing owns one history entry; closing consumes it. Same-profile hash updates bypass page scrolling, modal clearing, and view transitions. Existing history state and focus/scroll are preserved, including direct links.
- **C (8–11):** Validated visit requests reach dashboard Accept/Decline controls and buyer Activity status. Requests, reports, and visits announce submit toasts. The unsupported pinch hint was removed; empty photos have a placeholder and no invalid counter. Views count once per agent/session; persistence is debounced and flushed on pagehide; expiry refreshes run once a minute. Custom listings invalidate profile results.
- **D (12–16):** Buy/rent budget chips and custom bounds, readable filter labels and plurals, deferred-result skeletons, sticky comparison table, labelled detail units, EMI assumptions, one directions action, and capitalised statuses. Agent finder uses chips and a bottom sheet, unit labels, nonempty suggestions, controlled sort reset, and device geolocation with an explained city fallback. Most sample listings now have demo RERA identifiers/highlights and non-land floor plans; photo galleries reuse more of the existing licensed illustrative photos. Agents have distinct masked fake WhatsApp values, deal counts, and demo registration numbers for verified profiles. Fake contacts show a demo toast instead of navigating to an invalid number.
- **E (17–19):** Formatting-only commit; removed unused AgentUI exports and `src/agents.json`; unified tests under `tests/`; moved old reports under `docs/reports/`; removed the requested image and audited full available history. Added social metadata, manifest, env-based geocoder configuration, and CI for build/lint/unit tests plus browser tests. ESLint now includes tests. Regressions cover buyer isolation, revocation/cooldown, randomized offsets/radius bounds/private persistence, fake production locations, visits/dashboard/Activity, navigation/scroll/Back, budgets, compare, zero-photo details, finder geolocation/fallback, controlled filters, view counting, and debounced writes.

## Limits and deliberate choices

No numbered item was intentionally omitted. For item 9, the allowed option to remove the unsupported pinch instruction was chosen. Floor plans are explicitly illustrative; “more photos” reuses the existing licensed assets rather than introducing unverified external imagery. Exact-location protection is a local demo, not secure authorization: the public repository's dev fixture remains readable as source, and posted data stays on the device. A real deployment needs a server-side authorization service. Browser verification covers Chromium desktop and mobile emulation, not physical devices or other browser engines. The asset-history audit and its provenance limits are recorded in [ASSET_HISTORY_AUDIT.md](ASSET_HISTORY_AUDIT.md). Existing Git history was not rewritten.

## Files changed

The inventory below includes the formatting-only commit as well as functional changes. Removed paths and moved reports/tests are included for review.

- `.env.example`
- `.github/workflows/ci.yml`
- `.gitignore`
- `AGENT_FEATURE_REPORT.md`
- `AGENT_PROFILE_REPORT.md`
- `PHASE1_REPORT.md`
- `QA_REPORT.md`
- `README.md`
- `docs/ASSETS.md`
- `docs/reports/AGENT_FEATURE_REPORT.md`
- `docs/reports/AGENT_PROFILE_REPORT.md`
- `docs/reports/ASSET_HISTORY_AUDIT.md`
- `docs/reports/PHASE1_REPORT.md`
- `docs/reports/QA_REPORT.md`
- `docs/reports/REMEDIATION_REPORT.md`
- `docs/visual-reference/99acres-mobile-reference.png`
- `eslint.config.js`
- `index.html`
- `package-lock.json`
- `package.json`
- `playwright.config.js`
- `private/demo-locations.json`
- `public/config.js`
- `public/demo-floor-plan.svg`
- `public/manifest.webmanifest`
- `src/AgentUI.jsx`
- `src/App.jsx`
- `src/Discovery.jsx`
- `src/ErrorBoundary.jsx`
- `src/JourneyUX.js`
- `src/Journeys.jsx`
- `src/LandDetails.jsx`
- `src/LandMeasurements.js`
- `src/LocationSearch.jsx`
- `src/MapInteractions.js`
- `src/MinimalUI.jsx`
- `src/MobileUI.jsx`
- `src/OverlayHistory.js`
- `src/PhotoStorage.js`
- `src/PlotUI.js`
- `src/PropertyContact.jsx`
- `src/PropertyExtras.jsx`
- `src/PropertyModel.js`
- `src/PropertyTypes.jsx`
- `src/SearchDiscovery.jsx`
- `src/SearchSuggestions.js`
- `src/__tests__/locationAccess.test.jsx`
- `src/__tests__/phase1.test.jsx`
- `src/__tests__/property.test.js`
- `src/agents.json`
- `src/components/agent/AgentActivity.jsx`
- `src/components/agent/AgentCard.jsx`
- `src/components/agent/AgentHeader.jsx`
- `src/components/agent/BudgetChips.jsx`
- `src/components/agent/CompareTable.jsx`
- `src/components/agent/FilterBar.jsx`
- `src/components/agent/FilterSheet.jsx`
- `src/components/agent/ListingCard.jsx`
- `src/components/agent/ListingDetailSheet.jsx`
- `src/components/agent/LocationPrivacyChip.jsx`
- `src/components/agent/QRCode.jsx`
- `src/components/agent/RequestLocationSheet.jsx`
- `src/components/agent/StatsRow.jsx`
- `src/data/agentListings.json`
- `src/data/agents.json`
- `src/lib/agentNavigation.js`
- `src/lib/agentStore.js`
- `src/lib/agents.js`
- `src/lib/locationAccess.js`
- `src/lib/qr.js`
- `src/lib/routeMotion.js`
- `src/main.jsx`
- `src/minimal.css`
- `src/mobile.css`
- `src/pages/AgentDashboard.jsx`
- `src/pages/AgentFinder.jsx`
- `src/pages/AgentProfile.jsx`
- `src/properties.json`
- `src/search-discovery.css`
- `src/styles.css`
- `src/styles/agents.css`
- `src/styles/motion.css`
- `src/useDraftStorage.js`
- `tests/agentFlows.test.jsx`
- `tests/agentPrivacy.test.jsx`
- `tests/agentUX.test.jsx`
- `tests/agents.test.jsx`
- `tests/e2e/navigation.e2e.js`
- `tests/locationAccess.test.jsx`
- `tests/locationStorage.test.js`
- `tests/phase1.test.jsx`
- `tests/privacyRegression.test.js`
- `tests/productionPrivacy.test.js`
- `tests/property.test.js`
- `tests/storeWrites.test.js`
