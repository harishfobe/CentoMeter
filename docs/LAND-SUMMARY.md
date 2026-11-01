# Land summary — 18 October 2026

- One summary replaces repeated specifications and generic land descriptions.
- Plot area appears in sq ft and cents on cards, in the summary, and in comparisons.
- Dimensions show supplied length × width in feet. Missing dimensions show “Not specified”; frontage and area are not used to infer them.
- Use “Land type” in the listing form, summary and filters. Existing listing `subtype` values remain supported.
- Show Key highlights only when supplied. Existing declared features remain visible; new listings offer optional highlight selections and customer-entered points. Duplicate points are removed.
- Listing drafts save land type, dimensions, selected highlights and custom points. Review uses the same summary as property details.
- Area inputs convert in either direction. Land filters also accept cents. The conversion is 1 cent = 435.6 sq ft ([reference](https://www.mindspacereit.com/wp-content/uploads/2026/04/Intimation-of-full-Valuation-Report-as-on-March-31-2026.pdf)). Stored area remains in sq ft.

Production build passed. Checks covered conversion round trips, cent filter boundaries, highlight omission/deduplication/escaping, missing dimensions, full land-page rendering, posting fields, persisted-draft review, and an apartment-page regression. Leaflet was stubbed only for server rendering; these checks do not exercise browser interactions or visual layout. Browser review remains unavailable in this session.
