# CentoMeter

CentoMeter is a React and Vite real-estate marketplace prototype with an interactive Leaflet map. This folder is the active editable frontend project. The source preserves the latest header layout (logo on the left, no hamburger menu) and the October 18 facing-direction changes.

## Requirements

- Node.js 22 LTS
- npm (included with Node.js)

## Develop

From this folder, install the exact dependencies recorded in the lockfile and start Vite:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Stop the server with Ctrl+C.

For the phone preview, open `/mobile-preview.html` on that server. It offers 280–480 px widths and 100–200% text sizing. Browse scrolls from the map preview to the list; the dedicated Map screen supports full panning. Sizing references are recorded in [docs/MOBILE-RESEARCH.md](./docs/MOBILE-RESEARCH.md).

## Build and preview

```sh
npm run build
npm run preview
```

The production-ready static site is written to `dist/`. `npm run preview` serves that output locally; it does not deploy the site.

## Test and review

There is no automated test script configured in `package.json`. Before publishing, build the app and follow the interaction checks in [docs/USABILITY-TEST-PLAN.md](./docs/USABILITY-TEST-PLAN.md). The earlier prototype test record and its scope are in [docs/VALIDATION.md](./docs/VALIDATION.md).

Dependency advisories can be checked with:

```sh
npm audit
```

Review advisories and the release notes before changing pinned versions. The source dependency set reported a high-severity Vite advisory during this organization; no dependency upgrade was applied.

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
│   ├── App.jsx             # Application screens, interactions, and Leaflet map
│   ├── Discovery.jsx       # Discovery filters, gallery, and related UI
│   ├── Journeys.jsx        # Saved-search and visit workflows
│   ├── properties.json     # Demonstration listing data
│   ├── styles.css          # Responsive application styles
│   └── main.jsx            # React entry point
├── index.html
├── package.json
└── package-lock.json
```

Public files remain at the `public/` root because the existing UI uses root-relative URLs for them. The map is implemented in `App.jsx`; it does not have separate bundled map assets.

## Current scope

- Listings, locations, pricing, and workflows are illustrative frontend data. There is no backend, API, authentication, database, payment flow, or real enquiry/listing submission.
- Saved properties are stored in browser local storage; several other profile and posting flows are demonstrations and are not persisted to a service.
- Photos are illustrative; their sources and attribution are documented in [docs/ASSETS.md](./docs/ASSETS.md).
- The existing README and unique design, usability, and validation documents were consolidated from the earlier prototype. Original project folders were left unchanged.
