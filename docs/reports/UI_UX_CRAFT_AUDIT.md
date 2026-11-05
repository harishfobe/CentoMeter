# UI/UX craft audit — 5 November 2026

Audited against `.cursor/rules/ui-ux-craft.mdc`. Corrections shipped on this branch; deferred items listed below.

## Corrections shipped

| Priority | Finding | Fix |
| --- | --- | --- |
| P0 | Sticky contact WhatsApp/Call targets were 40px | Raised to **44×44** min |
| P0 | Sticky contact `z-index: 1000` tied with selection sheets | Raised sticky contact to **1050** (below modal 1100 / toast 1400) |
| P1 | Missing `-webkit-tap-highlight-color: transparent` | Added for interactive controls |
| P1 | Press scale was `0.95` (harsh vs craft 0.97–0.98) | Shared active scale to **0.98** |
| P1 | Agent nav used decorative orange gradient | Solid `--brand` fill; no multi-layer glow |
| P1 | Card elevation relied on soft shadows | Prefer **1px border** elevation (`craft.css`) |
| P1 | Spring motion token unnamed / ease-in-out for UI | `--ease-spring` alias; sheet enter uses spring curve |
| P2 | Under-44px save / filter / type / list-map chrome | Mobile remediations to **44px** min |

## Z-index map (after fix)

| Layer | z-index |
| --- | ---: |
| Map controls | 450 |
| Selection / sheets | 1000 |
| Sticky contact bar | 1050 |
| Detail header chrome | 900–950 |
| Modal scrim | 1100 |
| App toast | 1400 |
| Agent toast stack | 10000 |

## Deferred

- Exhaustive pass on every 36px chip in legacy `styles.css` desktop breakpoints
- WAAPI spring `{ stiffness, damping }` object form (CSS cubic-bezier used as equivalent)
- Replace remaining skeleton shimmer `ease-in-out` loops (acceptable for continuous animation)
- Home spotlight photo gradient (content overlay, not decorative chrome)

## Verification

`npm run lint`, `npm test`, `npm run build` after changes.
