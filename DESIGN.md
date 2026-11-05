---
name: CentoMeter
description: Mobile-first property discovery with map browsing and direct owner or agent contact.
colors:
  brand: "#f96b13"
  brand-fill: "#c2410c"
  brand-fill-hover: "#9a3412"
  brand-text: "#9d3c04"
  brand-soft: "#fff3eb"
  brand-on: "#ffffff"
  ink: "#18181b"
  muted: "#63636c"
  placeholder: "#63636c"
  paper: "#ffffff"
  canvas: "#f4f4f5"
  line: "#e4e4e7"
  success: "#047857"
  reserved: "#b45309"
  sold: "#b91c1c"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: "9px"
  md: "12px"
  lg: "14px"
  pill: "9999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "24px"
  6: "32px"
  7: "48px"
components:
  button-primary:
    backgroundColor: "{colors.brand-fill}"
    textColor: "{colors.brand-on}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "11px 14px"
  button-primary-hover:
    backgroundColor: "{colors.brand-fill-hover}"
    textColor: "{colors.brand-on}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "44px"
  chip:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "44px"
---

# Design System: CentoMeter

## Overview

**Creative North Star: "The Zinc Listing Desk"**

CentoMeter is an Operate-mode property product: scanable listings, map discovery, and fast contact. The visual world is light, flat, and zinc-neutral with a single orange voice reserved for commitment actions. Density stays phone-first; hierarchy comes from weight and spacing, not decoration.

No structured brand interview was available for this document pass, so the north star and qualitative language are inferred from the incumbent implementation (Inter, zinc neutrals, orange CTAs, 12px radius, border-led elevation).

**Key Characteristics:**
- Light paper/canvas surfaces with ink text
- One orange action system (fill for CTAs, deeper text for accents)
- Flat elevation via 1px borders before soft shadow
- 44×44px minimum interactive targets on mobile chrome
- Expo-out motion, interruptible and reduced-motion aware

## Colors

A restrained zinc field with one warm orange commitment color.

### Primary
- **Listing Orange** (`#f96b13` / `{colors.brand}`): Soft accent and brand recognition; not used alone for small body text.
- **Action Fill** (`#c2410c` / `{colors.brand-fill}`): Primary buttons and sticky WhatsApp — white label meets AA.
- **Brand Text** (`#9d3c04` / `{colors.brand-text}`): Wordmark accent and icons on light surfaces.
- **Brand Soft** (`#fff3eb` / `{colors.brand-soft}`): Quiet tinted backgrounds behind orange UI.

### Neutral
- **Ink** (`#18181b`): Primary text and focus ring.
- **Muted** (`#63636c`): Secondary labels; AA on paper and canvas.
- **Paper** (`#ffffff`) / **Canvas** (`#f4f4f5`): Elevated vs recessed surfaces.
- **Line** (`#e4e4e7`): Borders and separators.

### Semantic
- **Success** (`#047857`), **Reserved** (`#b45309`), **Sold** (`#b91c1c`): Status text safe on light surfaces.

### Named Rules
**The One Voice Rule.** Orange is for commitment actions and brand marks. Neutrals carry structure. Do not scatter orange across decorative chrome.

**The Contrast Rule.** Body/placeholder text ≥4.5:1; large text ≥3:1; filled CTAs use `{colors.brand-fill}` with `{colors.brand-on}`.

## Typography

**Display / Body Font:** Inter (self-hosted variable) with system-ui fallbacks.

**Character:** Neutral product sans — clarity over personality. Headings use heavy weight (700–800) and tight tracking (about −0.035em).

### Hierarchy
- **Display** (800, ~28px): Wordmark / hero price.
- **Title** (700, ~1.125rem): Section headings (Property details, Highlights).
- **Body** (400, 1rem): Descriptions and forms (16px minimum on mobile inputs).
- **Label** (500, ~13px): Meta, chips, captions.

### Named Rules
**The Weight Ladder Rule.** Same-size text differentiates by weight, not color alone.

## Layout

Mobile-first app shell with bottom navigation, sticky detail contact bar, and map/list split on larger widths. Spacing uses `--space-1`…`--space-7` (4→48px). Detail pages stack: gallery → identity → price → facts → highlights → location → similar.

## Elevation & Depth

Flat-by-default. Depth is mostly **1px `{colors.line}` borders** and tonal paper-on-canvas stacking. Soft shadow (`0 4px 16px rgba(0,0,0,0.08)`) is rare and never paired as a “ghost card” with heavy border + glow.

### Named Rules
**The Border-First Rule.** Prefer a 1px border over multi-layer shadows for resting surfaces.

## Shapes

Corner language centers on **12px** (`{rounded.md}`) for buttons, inputs, and cards. Facts grids use ~14px. Pills/chips use full rounding. Avoid sharp zero-radius chrome and oversized marketing card radii.

## Components

### Buttons
- **Shape:** 12px radius, min-height 44px
- **Primary:** `{colors.brand-fill}` fill, `{colors.brand-on}` label; hover `{colors.brand-fill-hover}`
- **Secondary:** Paper fill, ink text, line border
- **Focus:** 2px ink outline, 3px offset

### Chips
- Canvas background, ink text, 44px min-height on mobile filter chips

### Cards / Containers
- Paper surface, line border, 12–14px radius, internal padding ~14–16px
- Listing facts use two-column tonal cells, not nested cards

### Inputs / Fields
- Paper fill, line border, 12px radius, placeholder `{colors.placeholder}`
- Focus via shared focus-visible ring

### Navigation
- Bottom nav with ink icons/labels; Agents entry uses brand fill mark
- Sticky contact bar: dark meta + brand-fill WhatsApp CTA + call icon button (44×44)

## Do's and Don'ts

### Do:
- **Do** use `{colors.brand-fill}` for filled CTAs with white labels.
- **Do** keep interactive targets ≥44×44 on mobile chrome.
- **Do** prefer tokens (`var(--*)`) over raw hex for ink/muted/line/brand roles.
- **Do** honor `prefers-reduced-motion` for sheet and pin motion.

### Don't:
- **Don't** use vivid `{colors.brand}` orange as small body text on white.
- **Don't** stack soft shadow + thick border on resting cards.
- **Don't** introduce purple/indigo AI-default themes or cream/terracotta editorial kits.
- **Don't** drop below 16px for mobile form text.
