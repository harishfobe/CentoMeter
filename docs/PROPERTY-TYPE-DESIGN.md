# Property-type revision — 18 October 2026

Reviewed the public discovery pages of [Housing.com](https://housing.com/in/buy/bengaluru/), [Magicbricks](https://www.magicbricks.com/), and [Housing.com's tenant and seller entry points](https://housing.com/).

Housing.com surfaces Apartment, Independent House, Independent Floor, Plot, Studio, Duplex, Penthouse, Villa and Agricultural Land before BHK and budget filters. Magicbricks provides distinct entry points for flats, houses and plots, and separate Buy and Rent journeys. Housing.com also separates buyer, tenant and owner journeys. These observations informed the hierarchy; the exact card design is specific to CentoMeter.

## Applied to CentoMeter

- Use compact icon-and-label buttons across Buy, Rent, Sell and Filters. Remove descriptive headings, subtitles and the redundant posting selection summary.
- Combine Independent House and Villa in one option. The combined filter includes both underlying listing types, including when reopening a previously saved Villa search. Existing sample listing identifiers remain unchanged.
- Keep Apartment / Flat, Plot / Land, Commercial and rental-only PG as the other options. Use a short All button when browsing or filtering.
- Use a border and tinted background for selection, with native buttons, pressed states and visible keyboard focus.
- Keep discovery controls in a single 36px-high row, scrolling horizontally on narrow screens. Restore the desktop map height allowance from before the larger card design. Use compact two-column buttons in Filters and Sell.
- Preserve price limits when switching type and reset incompatible detailed filters. Clicking the already selected type keeps existing preferences and listing details.
- When switching a PG listing to sale, normalize its type and sample details to an apartment.

## Verification

Production build passed after the compact revision. Nineteen server-rendered selector checks cover all three intents, rental-only PG, legacy Villa selection, and removal of descriptive text. Inventory checks confirm the combined filter returns both houses and villas in Buy and Rent, including for legacy saved searches. Interactive browser and screenshot review remain unavailable because the browser provider is unavailable in this session.
