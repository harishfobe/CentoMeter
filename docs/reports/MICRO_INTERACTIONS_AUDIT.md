# Interaction audit and refinement

User story: pressing a control, hovering a card, updating a filter or opening a dialog provides immediate visual feedback while retaining the existing page geometry and navigation. This work is client-side CSS/WAAPI; no API, store, environment variable or location-gating change is involved.

## Findings and changes

| Surface | Audit finding | Result |
| --- | --- | --- |
| Buttons and links | Global press translation overlapped agent-specific scaling; backgrounds and shadows were transitioned | Shared 120ms press scale to .95 and 200ms translate feedback, using cubic-bezier(.16,1,.3,1). Fine-pointer hover lift is 4px. Disabled native buttons are excluded from press/hover rules. |
| Property and agent cards | Legacy hover mixed transform, shadow transitions and agent translate | Compositor-friendly translate/scale/opacity transitions. Main property click target does not double-scale inside the pressed card. Existing card shadows remain static. |
| Filters | Finder chips and list reordering used a different easing | Finder sheet and WAAPI list motion use the same ease-out curve. Static profile/Finder filters remain static. Filter values and URL logic are unchanged. |
| Modals | Listing/Finder sheets already had dedicated motion; other dialogs appeared instantly | Existing sheets retained with shared easing. Other dialogs gain a 240ms fade, .98-to-1 scale and 12px entrance; backdrop fades over 200ms. |
| Activity tabs | Hover animated shadows and used a separate transform | Shared button lift/press, icon scale transition; color changes remain instant. |

CSS lives in `src/styles/interactions.css`, imported last from `src/main.jsx`. Existing motion tokens live in `src/styles/motion.css`; WAAPI defaults in `src/lib/agentMotion.js`. Legacy overlapping rules were removed from `src/styles.css`; Finder press/easing rules were aligned in `src/styles/agents.css`. No new dependency or framework was added.

All new transitions/keyframes animate translate, scale or opacity. Dimensions, position offsets, borders and shadows are not animated. Reduced motion disables the added effects, focus indicators remain visible, touch does not receive mouse hover motion, and positioned controls retain their existing positioning transforms. No permanent will-change layer promotion was added.

## Verification

Build, lint and 75 unit/DOM tests pass. Browser suite: 49 pass, two fine-pointer hover cases intentionally skip on touch devices. Browser checks cover 375×812, 768×1024 and 1440×900, including new tests for press scale with unchanged offsetWidth/offsetHeight/offsetTop, desktop card translate and allowed transition properties, and reduced-motion modal/control states. Existing tests cover filter operation, navigation, dismissals, static filters and reduced-motion listing sheets.

Playwright browser executables were absent after the workspace refresh; they were installed into `/tmp/centometer-browsers` and the suite rerun. The initial launcher failures did not reach application code. Vite's existing bundle-size warning remains.

The dimension assertions demonstrate that the press effect does not alter layout geometry. They do not constitute an FPS or zero-reflow performance-trace claim. No Vercel settings, access controls or paid resources were changed.
