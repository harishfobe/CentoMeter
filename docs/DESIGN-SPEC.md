# CentoMeter design specification

## Direction

Map-first, ultra-clean minimalism: approximately 90% monochrome white/zinc UI and 10% orange accents. Property photography and basemap colors are content. Orange is reserved for primary actions, active controls, the wordmark's lowercase o, and map selection. Large surfaces and headers remain white or zinc.

## Tokens

The authoritative tokens are in src/minimal.css.

| Role | Value |
| --- | --- |
| Primary orange / pressed / soft | #F96B13 / #DC5605 / #FFF3EB |
| Primary text and dark buttons | #18181B |
| Secondary / placeholder | #71717A / #A1A1AA |
| Cards and sheets / secondary surface | #FFFFFF / #F4F4F5 |
| Borders and dividers | 1px solid #E4E4E7 |
| Available / reserved / sold plots | #10B981 / #F59E0B / #EF4444 |
| Selected plot | #F96B13 fill, 2.5px white border |

## Typography and shape

Inter variable font is bundled locally with its SIL Open Font License. Headings and prices use 700-800; body text uses 400-500. The HTML wordmark reads CentoMeter, with only its lowercase o orange. The supplied artwork remains available and its pin is retained in the favicon.

Cards and buttons have a 12px radius; bottom-sheet top corners have a 24px radius; search and filter pills use 9999px. The search shadow is 0 4px 16px rgba(0,0,0,.08). Mobile body text uses a relative scale, and normal form inputs remain 16px. Existing reduced-motion and keyboard focus behavior is retained.

## Browse and search

Search, Buy/Sell/Rent, compact property types, then the map. Land, House, Apartment, Commercial retain their order; All is first and PG appears only for Rent. House and Villa share one category. Type selections are not repeated in a separate filter-chip row. Other removable filters still appear when applied.

The floating white search pill has an orange location pin and a circular zinc filter control. Suggestions, recent searches, keyboard navigation, city selection, and separate Buy/Rent filters retain their existing behavior. Sell opens the posting journey.

## Map and pull-up sheet

Default price pins are white with bold dark prices. Selected pins are orange with white text and a 2px white border. Buy land prices show a per-cent basis using the actual supplied square-foot area (1 cent = 435.6 square feet). Other sale prices remain totals; rentals retain their monthly room/bed basis.

On mobile, selecting a marker opens a white sheet with 24px top corners and a zinc handle. Land specs use zinc boxes for Cent, Facing and Road width. Tap the handle/More details or drag the handle vertically to expand/collapse. Expanded content shows supplied dimensions and highlights, plus a property-details link. The price-and-visit footer remains visible while sheet content scrolls. Close returns to the standard navigation.

Home continues to scroll from a bounded map down to the property list. View list scrolls to that list. The dedicated Map route retains map panning. The desktop map keeps its compact property preview and adjacent results.

## Details and sticky actions

Mobile details have a white sheet treatment, zinc specification boxes, supplied key highlights, and one sticky footer: total/monthly price and price basis on the left, Book Site Visit on the right. The main navigation is hidden on details and during map selection.

The selected-map CTA opens the existing sample visit form for that property's actual title/locality. It does not navigate to an unrelated listing. All visit/enquiry confirmations remain explicit demonstrations; no message or booking is sent.

## Plot data contract

- Optional land boundary: an ordered array of at least three finite [latitude, longitude] pairs, in valid ranges and with nonzero area. Approximate marker coordinates never generate boundaries.
- Optional plotStatus: Available, Reserved or Sold (case-insensitive). Unknown or absent status does not create an availability claim.
- Available/reserved/sold polygons use the status border and exactly 0.25 fill opacity. Selection uses the orange fill and 2.5px white border. A small status legend appears only when supplied parcel boundaries are present.
- Optional approvals: an array containing DTCP, DTCP Approved, RERA or RERA Approved. Explicit matching approval entries in features are also supported. Badges use zinc with a green check. Pending/negative claims do not generate approved badges.
- The current illustrative listings do not contain parcel boundaries or approval records. Their approximate pins remain visible; no boundaries or approvals were fabricated.
- Land dimensions and key highlights remain supplied values. Frontage is not shown. Area remains available in both square feet and cents.

## Validation

Production build passes. 77 application routes server-render, with Leaflet stubbed for that render check. Domain checks cover per-cent conversion, rental units, invalid values, all three plot states, selected styling, boundary validation, conditional approvals, and the local font signature. Browser checks cover selected land, sheet expansion, the correct visit form, and mobile width/text scaling. See docs/VALIDATION.md for the current results.
