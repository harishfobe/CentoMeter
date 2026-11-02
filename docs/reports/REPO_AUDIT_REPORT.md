# Repository audit — 2026-11-02

## Scope and baseline

Audited the React 19/Vite/Leaflet frontend under Node 22.23.4. No dependencies, location-gating rules, class names, or intentional masked demo phone numbers were changed. `.nvmrc` now selects Node 22.

Initial `npm ci`, `npm run lint`, `npm test`, and `npm run build` passed: 76 tests in 12 files. No ESLint or Vite warnings were reported. The environment's default npm cache was not writable; using a temporary cache resolved installation. npm's upgrade notice and Vitest's worker-startup performance suggestion are informational. Test isolation was retained.

## Bugs fixed and evidence

- Already expired approvals repeatedly scheduled immediate updates. Schedule only future expiry times; a Profiler regression verifies no render loop.
- Listing hydration could overwrite concurrent edits/deletions; failed restore promises lacked recovery. Extracted `useListingStorage`, serialize writes, cancel stale debounces, merge only untouched records, finish loading in `finally`, and report failures. Storage lifecycle tests exercise rejection, hydration/deletion, and overlapping writes.
- Draft discard could race an in-flight save and recreate the discarded draft. Stop/debounce cleanup happens before awaiting the queue, repeated identical snapshots coalesce, and failed persistence stays visible. Leaving the editor flushes first; failures keep the editor available to retry.
- A failed photo restore could erase its stored photo reference on the next save. Preserve references until a successful recovery/replacement. Deleting an older draft no longer removes a newer editor's metadata or published listing photos. Covered by photo recovery/storage tests.
- Agent listings entered the public store before persistence succeeded. Publish only after successful persistence; failures remain retryable. Editing an existing agent sample also changed its identity and created duplicate cards. Preserve its ID and merge custom listings over base listings consistently. Unit and browser tests cover failed publish, ID preservation, and one updated card.
- Delayed browser Back could race the former overlay timeout and leave replacement sheets with incorrect history. Wait for the actual history transition, ignore unrelated pop events, preserve unrelated history state, and report unavailable history APIs. Covered by overlay history tests and existing Back/navigation browser tests.
- Leaflet 1.9.4's delayed zoom completion could run after map removal and throw `_leaflet_pos`. A shared version-specific teardown guard clears the animation flag before removing panes; tile listeners are removed. A real Leaflet regression reproduces the delayed callback after disposal. Posting/editing browser flows now complete without page errors.
- Clipboard actions could fail silently or update a replacement target. Shared `CopyButton` adds pending state, guarded completion, and visible success/failure. Dashboard keeps the manual-copy URL and adds a profile return action.
- Saved-place and agent-store persistence failures now produce visible messages. Existing optimistic toggle rollback remains intact.
- Geocoder throttling/fetches and Finder blur timers now clean up on unmount. Stale city results and geolocation callbacks cannot overwrite a later city choice/reset. Post-editor GPS callbacks ignore unmounted editors. Lifecycle tests cover cancellation and late results.
- Shared `Empty` handles route recovery, Finder/profile empty states, and ErrorBoundary recovery. Consolidated unknown-route recovery into one visible heading/action. Reused shared WhatsApp links while preserving message text and intentional fake-number feedback.

## Cleanup and structure

Removed unnecessary exports from LandDetails, PhotoStorage, PlotUI, PropertyContact, PropertyModel, PropertyTypes, and BudgetChips; removed unused LandDetails re-exports and the dead `Journeys.localDate` function. Test-consumed storage helpers remain exported. No additional orphan application modules were found in the inspected import graph.

Extracted listing persistence and posting normalization from App, plus shared Empty/Copy/WhatsApp components. App decreased from 2,949 to 2,869 lines. Removed an unstyled Activity wrapper, duplicate profile-share action, and redundant Activity destination action. Kept wrappers that supply layout, semantics, focus boundaries, or styles. Updated README's obsolete claim that Leaflet was implemented directly in App.

Reviewed all 11 existing reports and the three design scripts. Reports describe historical stages and design scripts remain reproducible reference tools; none were deleted. Historical reports can contain outdated paths or measurements and are not current verification. A broad App rewrite or removal of reference documentation would carry unnecessary behavior/review risk during this audit.

## Verification

Each implementation group passed lint, unit tests, and build before proceeding. Final frozen-source results:

| Command | Result |
| --- | --- |
| `npm ci` (baseline; lockfile unchanged) | Passed, 173 packages |
| `npm run lint` | Passed, no warnings |
| `npm test` | Passed, 112 tests in 21 files (76 at baseline) |
| `npm run build` | Passed, no Vite warnings |
| `npm run test:e2e` | Passed, 66 tests; 2 intentional touch-device hover skips |

The browser server initially required network permission to bind locally. An intermediate run was invalidated by Vite hot reload during final button-style review; the entire suite was rerun successfully with frozen sources. No existing test assertions were weakened.

The new browser audit runs at **360×800 touch** and **1280×900**. At both sizes it covers browse/map mounting, property filters, save/Activity, Finder filters/reset, all posting steps, owner edit/re-publish, agent edit without duplication, location request/approval/unlock, site-visit acceptance, and buyer/dashboard status. Screenshots assert no page-width overflow. Existing desktop/tablet/phone navigation, motion, focus, reduced-motion, and interaction tests remain enabled.

Map tile requests are deliberately blocked in browser tests for repeatability. Map mounting, failure feedback, and unlock controls are exercised; live OpenStreetMap availability is not certified. This is a frontend prototype with simulated privacy, not authenticated server authorization.

Artifacts are local and ignored by Git:

- `artifacts/repo-audit/baseline-*.log`, `final-*.log`
- `artifacts/repo-audit/audit-phone-*.png`, `audit-desktop-*.png` (Finder, filters, saved, posting, dashboard, Activity, unlocked detail, edited agent)
- `test-results/` Playwright traces

No new loading spinner was introduced; editor hydration uses the existing skeleton pattern. Existing active/focus/reduced-motion styles were retained. Pure effects without timers/listeners/async work were not given artificial cleanup functions. The geolocation API has no cancellation method, so callbacks use lifecycle/generation guards.

## Files changed

- `.nvmrc`
- `README.md`
- `docs/reports/REPO_AUDIT_REPORT.md`
- `playwright.config.js`
- `src/App.jsx`
- `src/ErrorBoundary.jsx`
- `src/Journeys.jsx`
- `src/LandDetails.jsx`
- `src/LocationSearch.jsx`
- `src/MapViewImpl.jsx`
- `src/OverlayHistory.js`
- `src/PhotoStorage.js`
- `src/PlotUI.js`
- `src/PostFlow.jsx`
- `src/PropertyContact.jsx`
- `src/PropertyModel.js`
- `src/PropertyTypes.jsx`
- `src/components/CopyButton.jsx`
- `src/components/Empty.jsx`
- `src/components/WhatsAppLink.jsx`
- `src/components/agent/AgentActivity.jsx`
- `src/components/agent/AgentHeader.jsx`
- `src/components/agent/BudgetChips.jsx`
- `src/components/agent/ListingDetailSheet.jsx`
- `src/components/agent/UnlockedMap.jsx`
- `src/lib/agentStore.js`
- `src/lib/agents.js`
- `src/lib/disposeMap.js`
- `src/lib/savePostedListing.js`
- `src/pages/AgentDashboard.jsx`
- `src/pages/AgentFinder.jsx`
- `src/pages/AgentProfile.jsx`
- `src/useDraftStorage.js`
- `src/useListingStorage.js`
- `tests/agentFlows.test.jsx`
- `tests/agentMotion.test.jsx`
- `tests/e2e/audit-flows.e2e.js`
- `tests/expiredAppRequests.test.jsx`
- `tests/locationSearchLifecycle.test.jsx`
- `tests/mapCleanup.test.js`
- `tests/overlayHistory.test.jsx`
- `tests/photoRecovery.test.js`
- `tests/postFlowFailures.test.jsx`
- `tests/publishListing.test.js`
- `tests/sharedActions.test.jsx`
- `tests/storageLifecycle.test.jsx`
