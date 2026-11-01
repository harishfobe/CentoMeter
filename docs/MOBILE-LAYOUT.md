# Mobile layout — 18 October 2026

The phone layout is defined in `src/mobile.css`, loaded after the shared stylesheet.

- Browse scrolls naturally from a bounded map preview to the property list. View list scrolls to that list. The dedicated Map screen keeps its viewport layout and full panning gestures; Browse allows vertical page scrolling over its map preview.
- The header contains the logo, city and notifications. Posting is available in the main navigation; its duplicate header action is hidden on phones.
- The category order stays Land, House / Villa, Apartment, Commercial, with PG last in Rent. Short labels appear in the phone discovery strip while accessible names retain the full labels.
- Details use a sticky Back/Share/Save toolbar, gallery, title/location, price, optional price breakdown, then summary. A single Contact/Schedule bar replaces the main navigation and desktop contact panel on this screen.
- Posting uses compact step labels and one fixed Back/Continue footer. Fields use 16px text; numeric pairs use columns that can shrink without intrinsic input overflow.
- Filters and other dialogs open as bottom sheets with visible heading and action rows. Controls, safe-area spacing, and landscape rules are included.
- `public/mobile-preview.html` presents the actual app with eight widths from 280–480 px and 100–200% text settings. Its frame fills the remaining preview height instead of subtracting a guessed toolbar height.

Sizing references and the implemented text roles are recorded in [MOBILE-RESEARCH.md](./MOBILE-RESEARCH.md).

## Checks

Production build passed. Eighty server-rendered page/draft checks cover every sample property detail, main routes, all four land posting steps, price-before-summary order, single-photo/multi-photo gallery states, retained dimensions/highlights in draft review, and combined house/villa filtering. Leaflet is stubbed for those server renders only.

These are source and render checks, not measured viewport or visual browser checks. The session exposes no browser or native app provider, so screenshots, live overflow measurements, keyboard checks and touch interaction review remain unverified.

## Responsive preview correction

The desktop simulator now uses a 390 x 844 px phone viewport by default instead of compressing the phone to the preview panel height. The surrounding page scrolls when the panel is shorter than the device. At widths up to 480 px, simulator controls disappear and the app uses the available screen edge to edge.

Discovery categories use horizontally scrollable 44 px chips with intact labels. Apartment and Commercial no longer wrap mid-word. The category strip scrolls independently of the page.

Verified in the live browser at simulator widths of 320 and 390 px, including home, phone filters and posting layout. The production build passed. Earlier server-render checks above are historical and were not rerun for this CSS/preview-only correction.
