# Approved Home and navigation implementation — 2026-11-03

Implemented the approved video-based Home structure: compact map card, Suggested for you, Spotlight, Projects, Most popular, and access to the complete property list. Kept the existing search box and BUY/RENT visual styling, adding SELL as a third equal-width Home segment. SELL opens the existing posting flow rather than inventing a third listing mode.

Bottom navigation is now Home, Map, Agents, Activity, Profile. Map opens the existing full-map route directly and correctly receives the active state. Search, filters, map tools, selected-property previews, and View list remain available there. Removed the separate Full map button. Home's approved map card has an Open map action.

## Existing functionality retained

- The original property list, sorting, filters, empty states, save actions, and details remain available below discovery and on the existing results route. See all and Browse all properties open those results with the current filters.
- Discovery rails reuse `PropertyCard` and its existing save/open handlers. Spotlight and popular rows use the same handlers and existing money/land-unit/rent-period helpers.
- Projects come from matching sample Builder listings and are omitted when there are none, including rental-only results. Developer labels use the existing sample developer helper; no new verified/new-launch claims or invented project data were added.
- Suggested results can use the last viewed listing's type/locality. Most popular prioritizes saved/viewed items on this device, with clearly labeled sample picks when there is no matching activity. No fake weekly analytics or save counts were introduced.
- Existing location access, private coordinates, approximate circles, request/approval flows, agent data, and masked numbers were not modified. The Home mini-map is the existing Leaflet component with the same privacy inputs. Its additional tools are available on the full Map page.
- New card images have explicit dimensions; horizontal rails use native scroll-snap. Existing focus and reduced-motion behavior is retained, and new controls have visible focus styles and touch targets.

## Verification

Node 22.23.4; no dependency changes.

| Command | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm test` | 121 passed in 23 files |
| `npm run build` | Passed |
| `npm run test:e2e` | 72 passed; 2 existing intentional hover skips on touch devices |

Added nine unit/DOM tests for discovery, navigation, SELL, BUY/RENT, save/open, empty recovery, land unit prices, and PG rent labels. Added six browser cases at 360×800 touch and 1280×900 covering new Home sections, posting/back, full Map/search/list access, save persistence, Activity, original results, details, Spotlight, Projects, and popular rows.

Updated the existing save-persistence browser test to assert every rendered instance of a listing reflects the saved state, including after reload and unsaving. It also asserts no stale Unsave controls remain. This handles discovery and original-list copies without assuming their count stays constant while map bounds settle. Existing persistence assertions remain.

Screenshots were also captured at 375×812, 768×1024, and 1440×900. Generated screenshots and final command logs are in `artifacts/home-implementation/`; traces are in `test-results/`. These artifacts are ignored by Git. Browser verification blocks external map tiles for repeatability: offline tile feedback in screenshots does not imply the production map was replaced by a mock.

## Files

- `src/App.jsx`: navigation, active tab, SELL route, compact map footer, discovery integration, retained original list.
- `src/components/HomeDiscovery.jsx`: discovery sections using existing listings and handlers.
- `src/styles/home.css`: Home-scoped layout and responsive styling; no full-map restyling.
- `src/main.jsx`: Home stylesheet entry.
- `tests/homeDiscovery.test.jsx`, `tests/homeNavigation.test.jsx`: new unit/DOM coverage.
- `tests/e2e/home-discovery.e2e.js`, `playwright.config.js`: new browser flows at the requested phone/desktop sizes.
- `tests/e2e/production-polish.e2e.js`: synchronized-save assertions for repeated cards.
- `docs/reports/HOME_DISCOVERY_REPORT.md`: this report.
