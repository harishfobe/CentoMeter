# CentoMeter

CentoMeter is a React and Vite real-estate marketplace prototype with an interactive Leaflet map. This folder is the active editable frontend project. The source preserves the latest header layout (logo on the left, no hamburger menu) and the October 18 facing-direction changes.

## Requirements

- Node.js 22 LTS
- npm (included with Node.js)

## Develop

From this folder, install the exact dependencies recorded in the lockfile and start Vite:

```sh
nvm use # if using nvm; .nvmrc pins Node 22
npm ci
npm run dev
```

Open the local URL printed by Vite. Stop the server with Ctrl+C.

The app is mobile-only: touch devices open the app directly, while desktop browsers show the phone preview at the local URL. The preview offers 280–480 px widths and 100–200% text sizing; its Browse screen scrolls from the map preview to the list, and the dedicated Map screen supports full panning. Open `/mobile-preview.html` directly to return to the device frame. Sizing references are recorded in [docs/MOBILE-RESEARCH.md](./docs/MOBILE-RESEARCH.md).

## Build and preview

```sh
npm run build
npm run preview
```

The production-ready static site is written to `dist/`. `npm run preview` serves that output locally; it does not deploy the site.

## Test and review

Run `npm test` for unit and DOM interaction tests, and `npm run lint` for ESLint checks. `npm run test:e2e` runs phone-only browser checks at 375×812 and 360×800. Before publishing, build the app and follow the interaction checks in [docs/USABILITY-TEST-PLAN.md](./docs/USABILITY-TEST-PLAN.md). The earlier prototype test record and its scope are in [docs/VALIDATION.md](./docs/VALIDATION.md).

Dependency advisories can be checked with:

```sh
npm audit
```

Review advisories and the release notes before changing pinned versions. The source dependency set reported a high-severity Vite advisory during this organization; no dependency upgrade was applied during that earlier organization.

## Deployment

1. Run `npm ci` and `npm run build`.
2. Publish the contents of `dist/` to a static web host.
3. Configure the host to serve `index.html` for application routes if it requires a single-page-app fallback.
4. Confirm the target hosting project and deployment command with the project owner before publishing. `.openai/hosting.json` points the existing hosting setup at `dist/`; this project does not define a deploy script.

The browser map loads OpenStreetMap tiles over the network and displays the required attribution. The host must allow those requests.

## Project structure

```text
CentoMeter/
├── .openai/hosting.json
├── docs/
│   ├── ASSETS.md
│   ├── DESIGN-SPEC.md
│   ├── USABILITY-TEST-PLAN.md
│   ├── VALIDATION.md
│   └── visual-reference/
├── public/                 # Logo, favicon, and illustrative property photos
├── src/
│   ├── App.jsx             # Route composition and application interactions
│   ├── MapViewImpl.jsx     # Deferred Leaflet map and teardown
│   ├── PostFlow.jsx        # Listing editor and draft recovery
│   ├── useListingStorage.js # Serialized listing persistence
│   ├── components/        # Shared actions and agent UI
│   ├── pages/             # Agent finder, profiles and dashboard
│   ├── Discovery.jsx       # Discovery filters, gallery, and related UI
│   ├── Journeys.jsx        # Saved-search and visit workflows
│   ├── properties.json     # Demonstration listing data
│   ├── styles.css          # Responsive application styles
│   └── main.jsx            # React entry point
├── index.html
├── package.json
└── package-lock.json
```

Public files remain at the `public/` root because the existing UI uses root-relative URLs for them. The Leaflet map loads through `MapView.jsx` and `MapViewImpl.jsx` as a separate deferred bundle.

## Current scope

- Listings, locations, pricing, and workflows are illustrative frontend data. There is no backend, API, authentication, database, payment flow, or real enquiry/listing submission.
- Saved properties are stored in browser local storage; several other profile and posting flows are demonstrations and are not persisted to a service.
- Photos are illustrative; their sources and attribution are documented in [docs/ASSETS.md](./docs/ASSETS.md).
- The existing README and unique design, usability, and validation documents were consolidated from the earlier prototype. Original project folders were left unchanged.

## Configuration and demo privacy

Copy `.env.example` to `.env.local` to configure `VITE_GEOCODER_URL` at build time. The default is the OpenStreetMap Nominatim search endpoint. Vite exposes `VITE_` variables to the browser: never put secrets in them.

Location gating is simulated. `private/demo-locations.json` contains synthetic dev/test fixtures and is excluded from production builds. Production sample approvals deliberately return the obviously fake point `[0, 0]` (Null Island). Posted listing locations stay in this device's IndexedDB; this is not server authorization. Only two modes are supported: **hidden** (no public pin) and **radius** (an approximate circle). Both require buyer-specific approval to show an exact demo point. Approximate centers use a random bearing and 20–60% of the radius, generated once and retained with the private record. Real location protection requires an authenticated server API.

Agent WhatsApp values are distinct masked dummy values, not contact numbers. Demo floor plans and RERA identifiers are illustrative. GitHub Actions runs the build, lint, and tests on pushes and pull requests.

For browser navigation checks, run `npx playwright install chromium` once, then `npm run test:e2e`. The suite runs Chromium at desktop, tablet and phone sizes, including audit flows at 360 px and 1280 px. See [the repository audit report](docs/reports/REPO_AUDIT_REPORT.md) for findings and validation. `npm run format` formats source and tests.
