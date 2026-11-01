# Agent profiles and gated location

## Implemented
- Navigation: Map, Search, raised Agents with pending-request badge, Activity, Profile. Posting remains in the header and the demo agent dashboard.
- Routes: #agent hub (creator row and featured listings), #agent/:handle profile (Listings and About only).
- Added 3 illustrative agents and linked 18 sample agent listings. Agent records contain agentId, privacy policy and approximate coordinates; exact coordinates are removed from public properties.json.
- Location access is centralized in src/lib/locationAccess.js. Unrequested, requested, declined and expired requests cannot retrieve an exact point, parcel boundary or generated hotspots. Approval is checked for the specific listing and agent. Expiry fails closed, including malformed dates.
- Hidden policies have no public pin. Radius policies show an approximate circle and avatar marker. Approved listings use a normal price pin. One exact-policy seed is provided and remains locked until approved.
- Approval animates the prior approximate area into the precise marker when returning to a map. Reduced-motion disables this animation.
- Request sheet validates name and Indian mobile number. Request source is recorded from ?src=ig. Latest request status is stored per listing on this device.
- Demo agent inbox supports approval, decline/revocation and 24-hour, 7-day or no expiry. Activity has a Location requests tab.
- Locked detail pages hide their map, hotspots and directions. Locked properties are excluded from Near Me and nearby-selection grouping. Public share text contains a city and listing link, never coordinates. Saved searches containing agent listings omit spatial viewport/bounds/location data.
- Agent dashboard has Add listing, Copy my link and a locally generated QR code. Agent-posted exact points persist separately in an IndexedDB prototype vault, rather than public listing metadata.
- No Reels routes, tab, field, badge or embedding were added. No dependencies were added.

## Validation
- npm run build: passed (existing-style bundle-size warning, approximately 566 KB main JS before gzip).
- npm run lint: passed.
- npm test: 42 tests pass in 3 files, including 11 new agent/location tests.
- Tests cover public coordinate removal, locked/malformed/different-agent access, per-listing approval, hidden/radius/exact projections, expiry deadline, decline, hotspots, safe share/saved-search projection, Instagram attribution and deterministic QR generation.
- Browser verified on 390px mobile preview: hub navigation, profile Listings/About, request form, pending badge, approve/reveal directions/hotspots, decline/relock, and Activity request status. No console errors captured during the approval check.
- One local Demo Buyer request was created for the manual flow and left declined. No messages or contact details were sent to a server.
- QR matrix generation is tested; an actual iPhone camera scan has not been verified. Use a reachable deployed origin (or the PC LAN URL on the same Wi-Fi), not a localhost link, when scanning from another device.

## Files changed / added
- src/App.jsx — agent routes/nav, request state and expiry, map projections/circles/avatar pins/approval animation, gated detail controls, Activity and posting integration, safe saved searches and share text.
- src/AgentUI.jsx — agent hub/profile/dashboard/inbox, request form/gate/activity components and QR display.
- src/agents.json — illustrative agent data.
- src/properties.json — agent ownership/privacy/approximation; removed agent exact coordinates from public data.
- src/lib/locationAccess.js — central access checks, coordinate vault, projection, expiry, source and sharing helpers.
- src/lib/qr.js — local version 5-L QR encoder, with a clear copy-link fallback for overly long URLs.
- src/PropertyContact.jsx — derive hotspots only from an authorized location.
- src/MinimalUI.jsx — location-request action in a locked map preview sheet.
- src/mobile.css — agent profiles, request states, raised center navigation, map avatar pins, touch targets and reduced-motion handling.
- src/__tests__/locationAccess.test.jsx — agent/location regression suite.
- public/agent-ananya.svg, public/agent-rahul.svg, public/agent-meera.svg — illustrative initial avatars.
- AGENT_FEATURE_REPORT.md — this report.

## Backend work still required
This is a client-side prototype, not secure access control. Shipped JavaScript and IndexedDB can be inspected or modified; all seeded exact locations must move to a private server database before production. Never send them to an unapproved client in production.
- Auth/OTP for buyers and agents; verified agent ownership, viewer identity, authorization per listing, audit trail, rate limits and abuse prevention.
- Server request workflow, authoritative expiry/revocation, concurrency, persistence across devices and private coordinate endpoints. Avoid precise-location leaks through map tiles, logs, analytics, caches, image EXIF and API payloads.
- Consent-aware WhatsApp notifications via an approved provider, with delivery/retry handling; no notification is sent in this prototype.
- Verified Instagram profile URLs (current seed URLs are placeholders), real agent photos and profile editing.
- Canonical public profile/listing URLs, OG images and SSR metadata for Instagram link previews; deploy HTTPS so clipboard and sharing APIs work reliably.
