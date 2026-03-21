# Snap-Scroll Road Screen Refactor — Design Doc
**Date:** 2026-03-21
**Status:** Approved
**Supersedes:** `2026-03-21-scroll-reveal-road-design.md` (useScroll parallax approach — abandoned in favor of this)

---

## Vision

Full-screen snap-scroll journey. Each milestone occupies one complete viewport. A tiled isometric street runs at mid-height across all sections — the visual metaphor for "the path." Cards sit above the street and animate in with staggered entry parallax on each snap. The entire card triggers a hover popover with legal detail.

---

## Layout Stack (bottom → top)

```
[Background: #F1F5F5, full screen]
[Street tile — repeat-x, mid-height ~55vh from top, parallax 0.3×]
[Intro section OR MilestoneCard — above street, centered horizontally]
[Hover popover — absolute, above card]
[Header — fixed, z-50]
[Progress dots — fixed bottom, z-50]
```

---

## Color Tokens (Tailwind CSS vars in index.css)

```css
--ellis-bg:      #F1F5F5;   /* page background */
--ellis-dark:    #141414;   /* primary text, dark card bg */
--ellis-darkest: #000014;   /* deepest backgrounds */
--ellis-navy:    #141428;   /* dark navy variant */
--ellis-cyan:    #78f0ff;   /* accent — highlights, CTAs, step circles */
--ellis-gray:    #505064;   /* secondary text */
--ellis-mid:     #647878;   /* muted teal-gray */
--ellis-light:   #a0a0a0;   /* inactive states, light labels */
--ellis-muted:   #a0a0b4;   /* subtle labels */
```

Tailwind theme extension (in index.css `@theme` block):
```css
@theme {
  --color-ellis-bg:      #F1F5F5;
  --color-ellis-dark:    #141414;
  --color-ellis-darkest: #000014;
  --color-ellis-navy:    #141428;
  --color-ellis-cyan:    #78f0ff;
  --color-ellis-gray:    #505064;
  --color-ellis-mid:     #647878;
  --color-ellis-light:   #a0a0a0;
  --color-ellis-muted:   #a0a0b4;
}
```

---

## Typography

Replace existing font system with Ellis-approximate equivalents (Google Fonts, already loaded):

| Role | Font | Ellis equivalent |
|---|---|---|
| Headlines, large titles | Playfair Display | Atacama |
| Body, UI, labels | DM Sans | Monument Grotesk |
| Mono labels, metadata | JetBrains Mono | Monument Grotesk Mono |

Update `body` default to DM Sans. No new Google Fonts imports needed — all three are already in `index.css`.

---

## Street Tile

- Asset: `src/assets/Street-Tile.png`
- Position: fixed horizontal band, `top: 52vh`, `height: 200px`
- Tiling: `background-image: url(Street-Tile.png)`, `background-repeat: repeat-x`, `background-size: auto 200px`
- Parallax: `background-position-x` shifts at 0.3× the container's `scrollLeft`
- Implementation: a `useEffect` scroll listener on the container updates `backgroundPositionX` via a ref to the street div

---

## PNG → Step Mapping

| Step | Label | PNG |
|---|---|---|
| 1 | Job Offer | `Work.png` |
| 2 | Enter Lottery | `QR-Code.png` |
| 3 | Selected! | `Package.png` |
| 4 | Petition Filed | `Document.png` |
| 5 | USCIS Decision | `Barcode.png` |
| 6 | Visa Interview | `Globe.png` |
| 7 | October 1st | `Plane.png` |

---

## MilestoneCard Anatomy

```
┌──────────────────────────────────┐
│  [○ 01]  [PNG icon, 80px]        │  ← number circle + icon row
│                                  │
│  Job Offer                       │  ← Playfair Display, 36px
│  Before March                    │  ← JetBrains Mono, 11px, ellis-cyan
│                                  │
│  Your employer confirms the      │  ← DM Sans, 14px, ellis-light
│  role qualifies and signs off.   │
└──────────────────────────────────┘
```

- Card width: `max-w-md` (~448px)
- Card background: glass panel — `rgba(255,255,255,0.6)` + `backdrop-filter: blur(16px)` + `border: 1px solid rgba(255,255,255,0.9)`
- Border radius: `rounded-[32px]`
- Padding: `p-8` (32px)
- Number circle: 48px, border `2px solid ellis-dark`. Step 2 (lottery) uses `bg-ellis-cyan` per Variant highlight treatment. Final step (7) uses `bg-ellis-dark` with a checkmark.

---

## Entry Parallax (per snap)

Each time a new section scrolls into view (detected via `IntersectionObserver` on each `.milestone-section`), trigger a Framer Motion sequence:

| Element | Initial | Animate | Delay |
|---|---|---|---|
| Card container | `y: 30, opacity: 0` | `y: 0, opacity: 1` | 0ms |
| Number circle | `scale: 0.7, opacity: 0` | `scale: 1, opacity: 1` | 100ms |
| PNG icon | `x: 40, opacity: 0` | `x: 0, opacity: 1` | 180ms |
| Text block | `opacity: 0` | `opacity: 1` | 260ms |

Use Framer `motion.div` with `initial`/`animate` props driven by a `visible` boolean state toggled by the IntersectionObserver. Spring transition: `stiffness: 280, damping: 24`.

---

## Hover Popover

- Trigger: `onMouseEnter/Leave` on the entire card `div`
- Position: above the card — `bottom: 100%`, `left: 50%`, `translateX(-50%)`, `marginBottom: 12px`
- Width: `w-72` (288px)
- Background: `var(--ellis-dark)` with `color: white` (dark popover contrasts glass card)
- Border radius: `rounded-[20px]`
- Entrance: `AnimatePresence` + `motion.div`, `y: 8→0`, `opacity: 0→1`, `scale: 0.95→1`, spring

Popover content:
```
Step label (mono, cyan, uppercase, 10px)
Full description (DM Sans, 13px, white/80%)
─────────────────
You'll need   [requirement text]
Pro tip       [tip text]
```

---

## Intro Section

First snap section (index 0, `milestone = null` in Variant code):
```
U.S. WORK VISA          ← JetBrains Mono, 12px, ellis-gray, tracked
H-1B Candidate Journey  ← Playfair Display, 72px
Tagline from RoadData   ← DM Sans, 18px, ellis-gray
[scroll indicator]      ← bouncing mouse/scroll icon
```

---

## Progress Dots

- Fixed bottom center, `z-50`
- 8 dots total (intro + 7 steps)
- Inactive: `12px`, `background: ellis-light`
- Active: `12px`, `background: ellis-dark`, `scale: 1.5`
- Framer `motion.div` spring transition on active state change

---

## Data Integration

`RoadData` from `h1b-steps.json` (via `getFallbackData()`) maps to sections:
- Section 0: intro — uses `data.visaType`, `data.tagline`
- Sections 1–7: each `RoadStep` — `label`, `duration`, `blurb`, `description`, `requirement`, `tip`
- PNG paths imported statically and mapped by step index

---

## Files to Modify

- `src/components/RoadScreen.tsx` — full rewrite (supersedes useScroll plan)
- `src/index.css` — replace color tokens, add `@theme` block, update body font
- `src/lib/api.ts` — no changes needed
- `src/data/h1b-steps.json` — no changes needed
- `src/types.ts` — no changes needed

## Files to Leave Alone

- `src/components/LandingScreen.tsx` — questionnaire flow unchanged
- `src/components/QuestionnaireScreen.tsx` — unchanged
- `src/components/LoadingScreen.tsx` — unchanged
- `src/components/IsoIcon.tsx` — no longer used in RoadScreen (PNG assets replace it)
