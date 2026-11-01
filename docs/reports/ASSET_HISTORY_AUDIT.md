# Asset and history audit

Reviewed the full fetched Git history (`git fetch --unshallow`, then `git log --all --name-only` for PNG, JPEG, WebP, SVG, and WOFF2 files). The upstream history contains one source upload commit, `54584bf`.

- Removed `docs/visual-reference/99acres-mobile-reference.png` from the current tree. The original upload remains in Git history; no history rewrite was requested or performed.
- The other historical raster assets are the current project photographs/logo and the retained CentoMeter/earlier terra-branded prototype screenshots and previous-logo reference. No additional external-brand reference screenshot was found. The single upload commit cannot independently establish ownership of every historical reference image.
- The four property photographs (`apartment.jpg`, `interior.jpg`, `land.jpg`, `villa.jpg`) are third-party Unsplash images with source links and license notes in `docs/ASSETS.md`. They remain illustrative, are reused across sample listings, and are not verified photographs of the fictional properties.
- Inter is third-party typography with its SIL Open Font License bundled in `public/fonts/Inter-LICENSE.txt`. Leaflet, Lucide, and OpenStreetMap usage is documented in `docs/ASSETS.md`; runtime map attribution is retained.
- The current logo is documented as user-supplied. The agent avatar SVGs are project illustrations. The new `demo-floor-plan.svg` is an original schematic marked illustrative and not to scale.

This audit checks repository content and documented provenance, not an independent legal clearance of supplied assets.
