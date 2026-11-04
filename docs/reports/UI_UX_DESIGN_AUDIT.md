# UI/UX design audit — 4 November 2026

Audited CentoMeter against `docs/DESIGN-SPEC.md` and `docs/MOBILE-LAYOUT.md`. Corrections below were applied on this branch; deferred items remain for follow-up.

## Corrections shipped

| Priority | Finding | Fix |
| --- | --- | --- |
| P0 | Profile → Agents used `key === "agent"` and opened a modal | Navigate to `agents` |
| P0 | Selected map pins used dark ink (`--ink-alt`) + terracotta ring | Orange `--brand` fill, white text/border per spec |
| P0 | Bottom nav forced visible during map selection | Hide nav; dock selection sheet edge-to-edge with 24px top radius |
| P0 | Detail sticky bar led with Call/WhatsApp | Price left + primary **Book site visit**; Call/WhatsApp secondary in contact panel |
| P1 | Duplicate Save search on map + list | Map overlay only in map-peek; list panel owns list mode/results |
| P1 | Save search truncated (`max-width` 108–116px) | Removed max-width; min-height 44px |
| P1 | Competing brand oranges (`#b84406`, `#c44b05`, `#F96B13`) | Accents → `var(--brand)`; primary action aliases brand; `--muted` → `#71717A` |
| P1 | Touch targets under 44px (filter, types, intent, discovery chips) | Raised to 44px; type chips `flex: 0 0 auto` |
| P1 | Agent/home refinement used green-ink palette | Remapped to zinc/brand tokens |
| P1 | Token layer lost cascade | `minimal.css` imported last |
| P1 | Search trigger used MapPin | Search icon + “Open search” label |
| P1 | House category labeled “Villa” | “House / Villa” |
| P1 | Search footer said “Next” | “Show results” with primary styling |
| P2 | Duplicate body “Request a site visit” | Removed; desktop panel uses primary Book site visit |

## Deferred (not blocking)

- Full selected-sheet expand/collapse + land zinc boxes (spec detail beyond sticky CTA)
- Listing hydration skeleton on browse
- Agent finder layout density vs map-first home
- Legacy shadow/radius drift cleanup beyond the touch/token pass
- Bottom-nav Post vs Agents: current product keeps Agents; posting stays on SELL + desktop header Post

## Verification

`npm run lint`, `npm test` (125), and `npm run build` passed after the changes.
