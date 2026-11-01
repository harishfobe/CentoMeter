# Mobile sizing and scrolling revision — 18 October 2026

## References reviewed

| Primary source | Observed guidance or pattern | CentoMeter decision |
| --- | --- | --- |
| [NoBroker property search](https://www.nobroker.in/property/rent/bangalore) | Search and filters are distinct from List/Map controls; property types include Independent House/Villa. | Keep the combined category and explicit full Map access. Honour the requested map-then-list page flow. |
| [Housing.com Bengaluru search](https://housing.com/in/buy/bengaluru/) | Property type, BHK and budget are prominent discovery filters; results are price-led. | Retain compact discovery controls and price-first, single-column phone cards. |
| [99acres official app listing](https://play.google.com/store/apps/details?id=com.nnacres.app&hl=en_US) | Its supplied search/filter promotional screenshot uses clear section labels, intent choices and substantial separation between input groups. | Separate field groups and give labels readable weight and spacing. The screenshot is a marketing reference, not a source of measured font sizes. |
| [Android Material typography](https://developer.android.com/develop/ui/compose/designsystems/material3#typography) | Published body styles include 16/24 and 14/20, with 12/16 supporting text and 14/20 labels. | Use a small set of consistent web typography roles rather than independent per-element sizes. |
| [Android accessibility guidance](https://developer.android.com/guide/topics/ui/accessibility/apps) | Recommends 48 dp touch targets and 4.5:1 contrast for smaller text. | Use 44–48 CSS-pixel targets for primary web controls, with comfortable internal spacing. Secondary mobile text has a checked 5.06:1 contrast against the canvas. |
| [W3C Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) | Ordinary page content should reflow at 320 CSS pixels; maps have different spatial needs. | Keep the page vertically scrollable and constrain any horizontal category strip to its own container. |

Native sp/dp values are not measurements of these websites' CSS. The implemented CSS sizes are CentoMeter's web adaptation of the published guidance. No competitor font sizes are claimed to have been measured.

## Implemented type roles

| Role | Default CSS size |
| --- | --- |
| Secondary text | 12 px |
| Field labels and supporting facts | 13 px |
| Body and actions | 14 px |
| Inputs and card titles | 16 px |
| Section headings | 18–20 px |
| Page titles | 20–24 px |
| Main prices | 24–28 px |

These roles use rem units and a system font stack. Footer reservations grow with text size. Dense map labels and third-party map attribution retain separate spatial sizing.

## Scroll and responsive behaviour

- Home/Browse is a normal document: controls, a bounded map preview, then the property list. It has no fixed viewport-height scroll lock or hidden results panel.
- A vertical swipe starting over the phone map preview scrolls the page. Touch dragging and touch zoom are enabled in the dedicated full Map screen; zoom controls, markers and full Map access remain available in Browse.
- View list scrolls to and focuses the results section on phones. From full Map it returns to Browse and then scrolls to that section. Desktop keeps its existing results navigation.
- Content uses flexible widths and shrinking grid tracks. Small phones stack form groups; related numeric inputs remain paired when practical. Coarse-pointer devices up to 1024 px use the mobile treatment; wider touch devices can show two listing columns.
- The preview offers 280, 320, 360, 375, 390, 412, 430 and 480 px widths, plus 100%, 125%, 150% and 200% text settings. Its readout reports the actual frame dimensions, which can be constrained by the available browser window.

## Verification limits

Production build, route rendering, persisted land fields, unit conversions and map gesture-mode checks run locally. The session has no connected browser provider. Consequently the width and text controls are available for live review, but no claim is made that screenshots, measured browser overflow or touch behaviour have been visually verified on devices.
