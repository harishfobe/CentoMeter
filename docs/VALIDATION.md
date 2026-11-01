# Prototype validation

Checked on 2 October 2026 using a real Chromium-based browser (Microsoft Edge) driven by Playwright.

| Check | Result |
| --- | --- |
| Vite compilation | Passed after final source changes |
| Runtime errors during main walkthrough | None observed |
| Three intent tabs and five navigation destinations | Passed |
| Clickable map marker and preview card | Passed |
| Zoom updates visible mock listings | Passed; 13 results became 10 |
| Keyboard map pan updates visible mock listings | Passed; 12 results became 4 |
| BUY and RENT inventories | Passed; rental markers show monthly units |
| Property-type filter and search results | Passed |
| Property detail and visit-request confirmation | Passed |
| Saving/removing properties across page refresh | Passed |
| Posting validation for missing images and location | Passed |
| Browser image selection and preview | Passed |
| Sample images and sample-location shortcut | Passed |
| Clicking the map to select a posting location | Passed |
| Land/rent sample details and price | Passed |
| Posting review, completion and profile sample listing | Passed |
| Demo profile editing | Passed |
| City switching | Passed |
| Horizontal overflow at 320, 390, 768 and 1440 px | None observed |
| Visual inspection of desktop, mobile, preview and detail states | Completed |

The main walkthrough was repeated after fixing mobile map sizing and the accessible name of the mobile Filters button. Additional checks covered keyboard panning, image selection, map location selection and the final land/rent defaults. Screenshots are included for the desktop Home and mobile property-preview states.

The DOCX blueprint could not be read because file access remained denied after permission was granted. Its requirements have not been independently reconciled. This does not affect the runnable prototype, but it is an outstanding review dependency.

This validation is for a demonstration frontend. It is not a production-readiness, security or accessibility certification.

## Usability revision — 14 October 2026
- Detail Back restores the prior route and scroll position; map center and zoom survive navigation. View list retains map bounds; Search entire city explicitly expands the scope.
- Contextual filters cover budget range, minimum bedrooms including 1 BHK, furnishing, area/unit, property-specific facilities, occupancy, meals, availability and listing source. Applied chips can be removed; filter dialog previews match count.
- Detail pages include swipeable sample galleries, a clearly illustrative floor plan, sample nearby distances, cost breakdowns and mobile contact actions.
- Save searches, recently viewed homes, report-listing preview and Help are accessible. Visits/enquiries are session-only demonstrations.
- Posting automatically saves draft details on this device; Save draft & exit, confirmed discard and completed-sample editing are available. Large photos may exceed browser storage; the UI explains fallback behavior.
- No real enquiries, registrations, payments, notifications or verification are performed. Existing logo and navy/blue palette retained.

Validation: Vite build passed; filter boundaries, area conversions, mock-data coverage/cost integrity and standalone JavaScript syntax passed. Fresh browser interaction and visual QA could not complete: Edge launch failed in the sandbox and the in-app preview could not reach localhost. Please refresh the standalone HTML for design review.

## Second usability pass — 14 October 2026
- Unified seller/contact identity, amenities, area basis, PG room/bed pricing and listing freshness. Missing specifications are explicit.
- More menu replaces duplicate profile shortcut. Saved-search library lives under Saved/Profile; map/results keep a compact save action.
- Named searches preserve boundaries, map position, criteria and optional landmark-distance search. Buy and Rent retain separate filters. Suggestions support recent searches and minor misspellings.
- Exact multi-select bedrooms/Studio and expandable property-specific preferences. Filter preview counts use the same candidate set as results.
- Named saved lists and a copyable sample property summary.
- Visit requests retain date, time and preferred channel; users can reschedule/cancel or simulate confirmation. Requested and confirmed are distinct.
- Multiple draft recovery, another-listing action, photo cover/reordering and availability controls on completed sample listings.
- Added a participant usability test script; no participant sessions have been conducted.

Validation: six application routes and the new components server-render without errors. Assertions cover exact multi-BHK/Studio filters, typo matching, PG pricing units, saved-area labels, visit date/time and data consistency. Leaflet is stubbed only in this server-render test; map interactions and effects are not validated by it. Vite build and standalone JavaScript syntax passed. Browser/physical-device visual verification remains outstanding because of the previously observed environment failures.

## Facing direction — 18 October 2026
Verified and rebuilt the existing facing-direction implementation for Land, Independent House, Villa and Apartment. Eight compass directions are available in posting and filters, with Not specified for incomplete drafts. Details explain plot frontage versus the main entrance looking out. Review shows facing. Filter matching, detail rendering and restored draft selection passed, along with the build and standalone syntax check.

## Minimalist UI revision - 31 October 2026

- Replaced teal/ivory with the specified white/zinc and #F96B13 tokens; bundled Inter locally and rendered the requested wordmark.
- Added mobile map selection sheet with tap/drag expansion and a sticky total/per-cent price plus Book Site Visit. Preserved natural map-to-list scrolling.
- 77 route renders passed. Leaflet was stubbed only for server rendering; this is not a map-interaction test. Domain assertions passed for per-cent pricing, PG/rental units, invalid inputs, status/selection colors, supplied boundaries, conditional approval badges and font signature.
- Live browser verified Greenfield Plot's 5.65-cent summary, selected orange per-cent pin, expansion, and its correctly identified visit form. No visit request was submitted.
- Mobile widths 280, 320, 360, 375, 390, 412, 430 and 480 px were inspected at 100% and 200% text. A narrow enlarged-text intent-tab overflow was corrected; page width now stays within the viewport. The sticky CTA stays within the viewport.
- Existing sample data has no boundary or approval records. Polygon styling and approval rendering were validated with explicit test fixtures; no property approvals or parcel shapes were inferred.
- Browser screenshots are saved in docs/visual-reference/centometer-minimal-map.png and centometer-minimal-land.png.
