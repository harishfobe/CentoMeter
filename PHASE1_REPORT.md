# Phase 1 checkpoint

Phase 1 implemented. Phase 2 and Phase 3 have not started, per the requested stop after each phase.

## Validation
- npm run build: passed. Vite warns that the main JavaScript bundle is about 548 KB before gzip.
- npm run lint: passed, no errors.
- npm test: 31 tests passed across two files.
- Mobile browser: map selection opens the correct property's visit form; detail footer opens the same form; browser Back dismisses the modal; date chips are unique and future-only; Home, detail and Post each have one h1; bottom Post tab works; blank draft reports that details are needed before saving; no captured console errors in the verification tab.
- This checkpoint did not repeat every end-to-end posting/submission journey; normalization, storage and compression regressions are covered by unit tests.

## Files changed
- src/App.jsx: stable map defaults, land rent prices, overlay navigation, pin-derived city validation, visit targets/actions, single route headings, Post navigation, dead enquiry branch/import cleanup and photo upload call cleanup.
- src/PropertyModel.js: safe money rounding, nullable charges, posted-listing normalization, shared distance/city helpers and land-unit sorting rules.
- src/JourneyUX.js: future-only deduplicated date choices, BUY-only land-unit prices, and per-photo compression with quality reduction before further resizing.
- src/Journeys.jsx: shared distance helper and future visit rescheduling minimum.
- src/PhotoStorage.js: skip blank drafts and avoid IndexedDB rewrites when photos are unchanged.
- src/useDraftStorage.js: blank-draft saving status.
- src/Discovery.jsx: hide unknown rental charges/totals and use the shared land conversion constant.
- src/PropertyContact.jsx: optional site-visit action beside direct contacts.
- src/MinimalUI.jsx: restore visits in action bar/map sheet and fix non-BUY land pricing.
- src/styles.css: remove obsolete selectors while preserving live combined-selector branches.
- src/mobile.css: remove obsolete controls and support full-width visit actions.
- src/minimal.css: retire unused selection/nav rules and support visit actions.
- src/search-discovery.css: parsed during stylesheet cleanup; no intended design change.
- src/properties.json: remove rented land, clean irrelevant fields, distinct city titles/prices, corrected bedroom counts, posted dates and photo arrays.
- src/__tests__/property.test.js: update nullable charge and BUY land sort expectations.
- src/__tests__/phase1.test.jsx: add 14 regression tests for pricing, dates, location, visits, compression, storage and sample-data consistency.
- eslint.config.js: add lint configuration and JSX identifier usage handling.
- package.json / package-lock.json: add lint tooling and script.
- PHASE1_REPORT.md: this checkpoint report.

No files were moved; restructuring belongs to Phase 2.

## Limits and follow-ups
- Photo arrays reuse existing illustrative assets. Land retains its existing land image; no additional licensed land photography was supplied.
- Existing legacy activity records matched only by sample title may no longer resolve after the requested sample-title cleanup; id-based records remain stable.
- npm audit reports five moderate development-tool findings from one minimatch dependency advisory through ESLint. Its proposed automatic fix downgrades ESLint incompatibly; no forced downgrade was applied. Production runtime packages are not reported affected.
- Discovery to PhotoStorage dependency direction, folder moves, motion, preview ribbon and the full accessibility polish remain for Phases 2 and 3.
