# CentoMeter verification report — 31 October 2026

## 1. Phases and validation

| Phase | Result | Validation after phase |
| --- | --- | --- |
| 1 — Crashes and data | Completed: safe money/listing defaults, phone-safe details, error boundary, activity ids/contact fields, separate modal state, safe storage, initials, optional list notes. | Build passed; 13 tests passed. |
| 2 — Posting and storage | Completed: empty defaults, demo fill, preservation of edits/photos, Review phone validation, debounced IndexedDB photos, stable/deduped drafts, in-app confirmations, address lookup. | Build passed; 13 tests passed. |
| 3 — Map and search | Completed: preserve pin zoom, one tile layer, real sorting/land units, browse clustering, stable modal callbacks and Back support, stale auction/import cleanup. | Build passed; 15 tests passed. |
| 4 — UX | Completed: discovery BUY/RENT only, Activity owns visits, no permanent notification dot, Bookmark search action, empty saved defaults, missing facts hidden, visible notes, route titles/focus/city persistence, dirty form scrim protection, native share/copy fallback. | Build passed; 15 tests passed. |
| 5 — Details | Completed: optional metadata, BUY EMI calculator, comparable-price similar properties, optional posting fields. | Build passed; 17 tests passed. |

Final verification: Vite 6.4.5 production build passed; Vitest 5.0.5 passed all 17 tests; npm installation audit reported zero vulnerabilities, and final production dependency audit also reported zero. No lint script/config exists, so no lint command was run. A focused import/source audit removed the unused CalendarDays import and confirmed no direct App storage mutations, retired auction guards, or window.confirm calls remain. The build reports a roughly 549 kB JavaScript chunk warning.

Browser verification caught and fixed two runtime regressions missed by compilation: an effect dependency referenced drafts before its state declaration, and markercluster initialized before a finite map maxZoom existed. Both were fixed and build/tests rerun.

### Manual browser verification

- Posted QA Rent 31 Oct, QA PG 31 Oct and QA Land 31 Oct with the explicit demo fill action and a placeholder phone. Opened each detail page; Rent costs and PG occupancy/meals/bathroom/AC rendered without crashes.
- Verified invalid phone rejection with role=alert, corrected it, and completed Land posting.
- Saved the Rent property, saved a note with no list name, and verified the note on its Saved card.
- Recorded a local visit request; verified it in Activity → Contacted and matched it to the posted property. No calls, WhatsApp messages or appointment requests were sent externally.
- Saved QA Bengaluru search, reopened it from Profile, and verified restored results.
- Browser Back closed both a visit modal and a selected-property sheet.
- Tested 320 px and 390 px mobile layouts. DOM measurements found and fixed undersized category, save-search, sorting and map marker hit areas. Browse buttons/inputs/selects measured at least 44 px in both dimensions at 320 px. Map attribution links retain Leaflet's conventional small attribution layout.
- Keyboard Tab moved to the city selector with a visible focus ring; route headings receive focus.
- Required journeys showed no application runtime errors after the fixes. A source-less MutationObserver error appeared during later iframe preview reloads; no project code uses MutationObserver. A separate direct application startup logged no errors. Normal Safari/Chrome verification remains recommended to isolate this preview-tooling symptom.
- Local QA listings, the QA saved search, note and visit remain on this browser/device for inspection. Existing user saved data was preserved.

## 2. Files changed

| File | Change |
| --- | --- |
| src/App.jsx | Posting fields/validation, normalized live listings, safe state/storage/contact activity, modal history, map/search fixes, detail additions and UX cleanup. |
| src/PropertyModel.js | Shared money, phone validation, listing normalization, sorting, optional-value and EMI calculations. |
| src/ErrorBoundary.jsx | Friendly recovery boundary with Go home. |
| src/Discovery.jsx | Safe storage removal, defensive filter matching and optional values. |
| src/SearchDiscovery.jsx | Uses the shared money formatter. |
| src/main.jsx | Mounts the error boundary and markercluster styles. |
| src/PhotoStorage.js | Native IndexedDB photo storage, metadata-only localStorage, legacy draft photo migration and fallback results. |
| src/useDraftStorage.js | Serialized, debounced draft persistence and explicit flush/stop handling. |
| src/LocationSearch.jsx | Debounced explicit locality search with caching, rate limiting, cancellation and OpenStreetMap attribution. |
| public/config.js | Runtime-configurable geocoder endpoint. |
| index.html | Loads runtime configuration before the app. |
| src/OverlayHistory.js | Shared browser Back handling for overlays and sheets. |
| src/MinimalUI.jsx | Selected-property sheet participates in Back history. |
| src/Journeys.jsx | Activity visit management opens properties by matched ids. |
| src/LandDetails.jsx | Hides absent/unspecified land facts. |
| src/PropertyContact.jsx | Shares the strict Indian mobile validator for direct contact links. |
| src/PropertyExtras.jsx | Optional detail/posting facts and interactive EMI calculator. |
| src/properties.json | Representative optional metadata on three illustrative listings; no fabricated RERA numbers. |
| src/mobile.css | Cluster styles, accessible controls/focus/contrast, saved notes, optional cards and similar-property row. |
| src/__tests__/property.test.js | 17 money, filter, phone, Rent/PG normalization, sorting and EMI tests. |
| package.json | Test script, markercluster/Vitest dependencies and patched Vite version. |
| package-lock.json | Reproducible dependency versions. |
| QA_REPORT.md | This implementation and verification record. |

## 3. Deviations and unverified conditions

- Public Nominatim forbids client-side autocomplete. The location picker therefore debounces an explicit Find locality request rather than querying on every keystroke; results move the pin. This follows https://operations.osmfoundation.org/policies/nominatim/. A runtime endpoint can point to an autocomplete-capable provider later.
- No lint script/config was supplied. No additional lint dependency was introduced.
- Physical iPhone Safari, denied GPS permission, real quota exhaustion, browser-private IndexedDB restrictions and native mobile share sheets were not manually exercised. Their guarded fallbacks are implemented; the verification environment was the desktop mobile preview.
- Static detail maps remain fixed, as requested earlier. Only interactive browse maps cluster.
- SELL remains an internal posting intent meaning For sale; discovery mode is limited to BUY/RENT and has no SELL tab.

## 4. Risks and next steps

- Split the roughly 549 kB bundle when performance work is scheduled.
- Test photo persistence, storage pressure and native sharing on physical iOS/Android devices. IndexedDB/localStorage remain device-local, can be cleared by the browser, and are not a durable backend.
- Vitest 5 requires Node 22.12+, Node 24+, or newer supported releases; this workspace uses Node 24.22.0.
- Public geocoding remains subject to provider availability/rate limits. Replace public services before production traffic.
- Follow-ups explicitly out of scope: real login/OTP, backend API, SSR/SEO, production map tiles, translations and legal pages.
