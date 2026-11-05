# UI/UX craft audit — 5 November 2026

Audited against `.cursor/rules/ui-ux-craft.mdc`. Corrections shipped on this branch.

## Corrections shipped

| Priority | Finding | Fix |
| --- | --- | --- |
| P0 | Sticky contact WhatsApp/Call were 40px | Raised to **44×44** min |
| P0 | Sticky contact `z-index: 1000` tied with selection sheets | Raised sticky contact to **1050** |
| P0 | `finder-toast` at `z-index: 110` buried under nav/modals | Raised to **1400** |
| P1 | Missing tap-highlight / harsh press scale | Tap highlight off; active scale **0.98** everywhere |
| P1 | Agent nav decorative gradient | Solid `--brand` |
| P1 | Card / listing soft shadows | Prefer **1px border** elevation |
| P1 | Search submit, chips, pins, filters under 44px | Raised to **44px** min |
| P1 | Selected map pin `z-index: 999` covered controls | Cap selected pin at **400** |
| P1 | Brand drift `#c44b05` | `var(--brand)` / `var(--brand-on)` |
| P1 | Modal/toast/`ease` motion leftovers | `var(--ease-spring)` |
| P1 | Dead `.mobile-detail-actions` CSS | Removed (unused; sticky-contact is live) |
| P2 | `agent-back-top` / `agent-compare` z thrash | Unified **900** / **500** |
| P2 | App `.toast` under modals | Raised to **2100** |

## Z-index map (after fix)

| Layer | z-index |
| --- | ---: |
| Map pins (selected) | ≤400 |
| Map controls | 450 |
| Agent compare | 500 |
| Agent back-top | 900 |
| Selection / sheets | 1000 |
| Sticky contact bar | 1050 |
| Finder toast | 1400 |
| Modal scrim | 2000 |
| App toast | 2100 |
| Finder sheet | 2100 |
| Agent toast stack | 10000 |

## Deferred

- WAAPI spring `{ stiffness, damping }` object form (CSS cubic-bezier used as equivalent)
- Skeleton shimmer `ease-in-out` loops (acceptable for continuous animation)
- Home spotlight photo gradient (content overlay, not decorative chrome)
- Heavier selection-sheet / map-preview depth tokens beyond border preference

## Verification

`npm run lint`, `npm test`, `npm run build` after changes.
