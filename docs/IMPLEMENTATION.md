# The Path — Implementation Log

Session date: 2026-03-21
Built for: Anti-Slopathon hackathon, hosted by Ellis (ellis.com)

---

## Commit History

### `d656d03` — Initial commit

Bootstrapped the full project from scratch. Stack: Vite v6, React 19, TypeScript, Tailwind CSS v4 via `@tailwindcss/vite` plugin, Framer Motion 12, shadcn/ui components (manually written, no CLI).

**What was built:**
- Screen state machine in `App.tsx`: `landing → quest → loading → road`
- `LandingScreen` — staggered Framer Motion entrance, Ellis branding, serif italic headline
- `QuestionnaireScreen` — 4-stage questionnaire with `AnimatePresence` slide transitions, progress dots, text input + option pills
- `LoadingScreen` — spinning border circle, cycling status messages
- `RoadScreen` — horizontal scroll canvas, static SVG road line, all nodes visible on load, drag-to-scroll, click-triggered detail panel
- `IsoIcon` — 10 hand-crafted isometric SVG icons in navy/amber
- `src/lib/api.ts` — Claude API call via Vite dev proxy, `buildPrompt()`, `generateRoadData()`, `getFallbackData()`
- `src/types.ts` — `RoadStep`, `RoadData`, `Answers`, `IconName`
- `vite.config.ts` — Tailwind plugin, `@` alias, Anthropic API proxy
- `docs/h1b-research.md` — H-1B research sourced from ellis.com
- `docs/plans/2026-03-21-scroll-reveal-road.md` — first implementation plan (Framer `useScroll` parallax approach, later superseded)

Also included in this commit: TypeScript configuration fixes required to get the project building cleanly (see Bugs section).

---

### `470f284` — feat: display blurb text on road nodes

First working road screen with real H-1B data.

**What was built:**
- `src/data/h1b-steps.json` — 7 H-1B milestones with two-layer copy system:
  - `blurb` — always-visible 1-sentence plain language description
  - `description` — full legal detail for the hover popover
  - `requirement`, `tip` — structured popover metadata
- `src/types.ts` — added optional `blurb?: string` to `RoadStep`
- `src/lib/api.ts` — `getFallbackData()` replaced with direct JSON import; old hardcoded 6-step data removed
- `RoadScreen` — blurb text rendered below each node label

**Data structure rationale:** Two-layer copy (blurb vs. description) deliberately separates register. The blurb is written for a nervous first-time applicant; the popover description is for someone ready to act. The `blurb` field is optional so API-generated steps that omit it fall back to `step.description.split('.')[0] + '.'`.

---

### `af3f468` — before implementing Variant.com UI plan

Pivot point. The original horizontal road screen (all nodes visible, static line) was replaced with a new direction inspired by a Variant.com UI remix. This commit captures the state before the new implementation and includes:

- `docs/plans/2026-03-21-snap-scroll-refactor-design.md` — approved design doc for snap-scroll approach
- `docs/plans/2026-03-21-snap-scroll-refactor.md` — full implementation plan
- `src/assets/` — 8 new PNG assets added: `Work`, `QR-Code`, `Package`, `Document`, `Barcode`, `Globe`, `Plane`, `Street-Tile`

**Design pivot summary:** The original design showed all visa steps at once on a horizontal canvas. Feedback from reviewing a Variant.com prototype shifted this to: one full-screen snap section per milestone, a tiled isometric street as a mid-height visual metaphor, PNG step icons replacing hand-crafted SVG isometric icons, and a cursor-following hover popover replacing the click-triggered bottom panel. The Ellis brand palette (`#78f0ff` cyan, `#141414` dark, `#F1F5F5` background) also replaced the original warm navy/amber/cream system.

---

### `b48d3a6` — feat: update color tokens to Ellis palette

**What changed in `src/index.css`:**
- Replaced old `--navy`, `--amber`, `--bg`, `--bg2`, `--cream` token system
- Added Tailwind v4 `@theme` block with `--color-ellis-*` tokens for use as Tailwind utility classes
- Added matching CSS vars in `@layer base :root` for use as `var(--ellis-*)` in inline styles
- Updated `body` to use `--ellis-bg` and `--ellis-dark`

**Token map:**

| Token | Hex | Role |
|---|---|---|
| `--ellis-bg` | `#F1F5F5` | Page background |
| `--ellis-dark` | `#141414` | Primary text, dark card |
| `--ellis-darkest` | `#000014` | Deep backgrounds |
| `--ellis-navy` | `#141428` | Dark navy variant |
| `--ellis-cyan` | `#78f0ff` | Accent — CTA, step highlights |
| `--ellis-gray` | `#505064` | Secondary text |
| `--ellis-mid` | `#647878` | Muted teal-gray |
| `--ellis-light` | `#a0a0a0` | Inactive states |
| `--ellis-muted` | `#a0a0b4` | Subtle labels |

**Font decision:** Ellis uses Monument Grotesk (sans) and Atacama (serif) — both commercial fonts from ABC Dinamo, self-hosted on their Next.js site. For this project, Google Fonts substitutes are used: DM Sans → Monument Grotesk, Playfair Display → Atacama, JetBrains Mono → Monument Grotesk Mono. All three were already loaded in the project.

---

### `2271814` — feat: snap-scroll shell with street tile and progress dots

Core layout rewrite. `RoadScreen.tsx` reduced from 278 lines to the new snap-scroll architecture.

**What was built:**
- Snap-scroll container using CSS `scroll-snap-type: x mandatory` with `inline-flex` sections (`100vw × 100vh` each)
- Street tile band: `position: fixed`, `top: 52vh`, `height: 200px`, `background-repeat: repeat-x`, parallax via `backgroundPositionX = -scrollLeft * 0.3` on scroll
- Active section detection: `getBoundingClientRect()` on each `.snap-section` element, fires on scroll event
- Intro section: visa type headline, tagline, bouncing scroll indicator
- Header: Ellis logotype, step counter (`01 / 07`), "Start over" button
- Progress dots: `motion.div` array, active dot scales up + darkens

**Implementation note on inline layout:** Snap sections use `display: inline-flex` with `vertical-align: top` rather than a flex container parent. This is required because a `display: flex` wrapper causes `scroll-snap` to break in Safari — snap points inside a flex container aren't reliably honored. Inline layout sidesteps this.

---

### `5903c38` — fix: add white-space nowrap to enable horizontal snap-scroll

Single-line fix: added `whiteSpace: 'nowrap'` to the snap scroll container.

**Why this was needed:** Without it, the `inline-flex` sections wrapping to a second row — the browser treated them as inline content and wrapped at the container width. Adding `nowrap` forced all sections onto a single horizontal line.

**Side effect:** This property cascades to all descendant text nodes, causing text inside milestone cards and popovers to refuse to wrap. Fixed in session (post-commit) by adding `whiteSpace: 'normal'` to the card and popover containers to break the inheritance chain.

---

### `7944cf1` — feat: MilestoneCard with staggered entry parallax

**What was built:**
- `MilestoneCard` subcomponent with `IntersectionObserver` (threshold: 0.4) triggering Framer `visible` state
- Staggered entrance sequence per section snap:
  1. Card body — `y: 30→0, opacity: 0→1`, tween `[0.16, 1, 0.3, 1]`, 500ms
  2. Number circle — `scale: 0.7→1, opacity: 0→1`, spring, 100ms delay
  3. PNG icon — `x: 40→0, opacity: 0→1`, spring, 180ms delay
  4. Text block — `opacity: 0→1`, 260ms delay
- Glass panel card: `rgba(255,255,255,0.62)` + `backdrop-filter: blur(16px)` + white border
- Final card (step 7) variant: dark background (`--ellis-dark`), white text, cyan CTA button
- Cyan circle on step 2 (Lottery Registration) — highlights the lottery as the critical gate
- Cursor-following hover popover: `position: fixed`, tracks `clientX/clientY` via `onMouseMove`, dark background with full description + requirement + tip

**PNG → Step mapping:**

| Step | Label | PNG |
|---|---|---|
| 1 | Job Offer | Work.png |
| 2 | Enter Lottery | QR-Code.png |
| 3 | Selected! | Package.png |
| 4 | Petition Filed | Document.png |
| 5 | USCIS Decision | Barcode.png |
| 6 | Visa Interview | Globe.png |
| 7 | October 1st | Plane.png |

---

## Bugs & Hard Problems

### Bug 1 — TypeScript compilation failures on project init

**Symptoms:** `bun run build` failed with 5 separate TypeScript errors on first run after `bun install`.

**Errors and fixes:**

| Error | Fix |
|---|---|
| `Cannot find namespace 'JSX'` in IsoIcon.tsx | Changed `JSX.Element` type to `React.ReactNode` — no import needed in react-jsx mode |
| `Cannot find module 'path'` in vite.config.ts | Added `@types/node` to devDependencies |
| `Property 'env' does not exist on type 'ImportMeta'` | Added `"types": ["vite/client"]` to `tsconfig.app.json` |
| `'Button' is declared but its value is never read` | Removed unused Button import from QuestionnaireScreen.tsx |
| `'dir' is declared but its value is never read` | Removed unused `dir` prop from `ScreenWrap` component and all call sites; also removed `screenOrder` array that was only used to compute `dir` |

**Root cause:** The project was scaffolded with strict TypeScript (`noUnusedLocals`, `noUnusedParameters`) and some boilerplate imports/variables were left in that weren't actually used.

---

### Bug 2 — Tailwind v4 shadcn utility classes not recognized

**Symptoms:** Build failed with `Error: Cannot apply unknown utility class 'border-border'` then `'bg-background'`, `'text-foreground'`.

**Root cause:** These are shadcn/ui conventions that rely on Tailwind being configured with a custom theme that maps `border` → `hsl(var(--border))`, etc. Tailwind v4's new architecture doesn't automatically register these mappings — they only exist if you define them in `@theme`.

**Fix:** Removed the `@apply border-border` line and replaced `@apply bg-background text-foreground` in the `body` rule with direct CSS var references:
```css
body {
  background-color: var(--bg);
  color: var(--navy);
}
```

---

### Bug 3 — CSS @import ordering warning

**Symptom:** Build produced a warning: `@import rules must precede all rules aside from @charset and @layer statements`.

**Root cause:** The Google Fonts `@import url(...)` was placed after `@layer base { ... }` blocks in `index.css`. CSS spec requires `@import` to come before any other rules.

**Fix:** Moved the Google Fonts import to immediately after `@import "tailwindcss"` at the top of the file.

---

### Bug 4 — `whiteSpace: 'nowrap'` cascading into card text

**Symptom:** After implementing snap-scroll, blurb text in milestone cards extended past the card boundary in a single unbroken line. Same issue in the hover popover — the full description paragraph rendered as one overflow line.

**Root cause:** The snap-scroll container required `whiteSpace: 'nowrap'` to prevent `inline-flex` sections from wrapping to a second row. CSS `white-space` is an inherited property, so every text node inside the container inherited `nowrap`.

**Fix:** Added `whiteSpace: 'normal'` to both the `motion.div` card and the popover `motion.div` to break the inheritance chain at those boundaries. This is the minimum targeted fix — changing the container itself would break the horizontal layout.

---

### Bug 5 — Spring animation curve on card entrance

**Symptom:** When a snap section entered view and triggered the card entrance animation, the card appeared to travel along a slight curved arc rather than a straight vertical line.

**Root cause:** Framer Motion's spring physics overshoot. The card animated from `y: 30` to `y: 0` but the spring bounced past `y: 0` to approximately `y: -6` before settling. In isolation this is imperceptible, but combined with the vertical centering of the card in a 100vh section, the overshoot caused the card to briefly appear above its resting position — reading visually as a curved path.

**Fix:** Replaced `type: 'spring'` with `type: 'tween'` and a cubic bezier ease:
```tsx
transition={{ type: 'tween', duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
```
`[0.16, 1, 0.3, 1]` is an expo-out curve — fast initial movement decelerating sharply to rest with zero overshoot. Subjectively identical to the spring feel but geometrically straight.

---

### Bug 6 — Popover clipping above viewport

**Symptom:** The hover popover on milestone cards was positioned with `bottom: calc(100% + 12px)` (above the card). On step 3 ("Selected!") the card sat high enough in the viewport that the popover was partially or fully hidden behind the header.

**Root cause:** Absolute positioning relative to the card doesn't account for where the card sits in the viewport. A card near the top of the screen pushes the popover outside the visible area.

**Fix:** Switched to `position: fixed` with live cursor tracking. The popover top edge is always `cursor.y + 16px` — guaranteed to start below wherever the mouse is, regardless of card position:
```tsx
onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}

// in popover style:
position: 'fixed',
top: mousePos.y + 16,
left: Math.min(mousePos.x - 160, window.innerWidth - 336),
```
The `left` clamp (`window.innerWidth - 336`) prevents the popover from clipping off the right edge when hovering a card near the right side of the screen.

---

## Architecture Decisions

**Why two separate Claude sessions?** The copy/content work (H-1B research → structured step data) and the UI implementation were parallelized across two sessions to avoid context bloat. One session held the design conversation and wrote `h1b-steps.json`; the other executed the implementation plan against `RoadScreen.tsx`.

**Why snap-scroll over `useScroll` parallax?** The original plan used Framer Motion's `useScroll` to draw an SVG road line via `strokeDashoffset` as the user scrolled — continuous, physically coupled to gesture. After reviewing a Variant.com prototype, the design shifted to snap-scroll with full-screen milestone cards. The snap pattern gives each step editorial focus and works better with the large PNG assets. The parallax goal was preserved via staggered entry animations per snap rather than continuous scroll-driven motion.

**Why `inline-flex` + `vertical-align: top` for snap sections?** A `display: flex` parent wrapper breaks Safari's `scroll-snap` — snap points inside a flex container aren't reliably honored. `inline-flex` children in a `nowrap` container is the cross-browser safe pattern.

**Why `position: fixed` for the popover?** Card-relative absolute positioning (`bottom: 100%`) breaks when the card is near the viewport top. Fixed positioning with cursor coordinates makes the popover position independent of the card's location in the document — the top edge is always below the cursor regardless of scroll state or card placement.

---

## Pre-Deployment: API Key Security Fix

**🚨 CRITICAL — Must complete before production deployment**

### The Problem
Both `generateRoadData()` (src/lib/api.ts) and `streamChat()` (src/lib/chat.ts) read `import.meta.env.VITE_ANTHROPIC_API_KEY` and send it directly from the browser to Anthropic's API.

During **development** (`bun dev`), Vite's dev proxy (vite.config.ts) intercepts these requests server-side, so the key stays safe on the Vite server.

During **production** (`bun build`), Vite **inlines the entire API key value** into the JavaScript bundle at build time. When deployed, browsers receive the actual API key and can use it to make API calls, exposing your Anthropic credits and system prompts.

### The Solution
Create a backend endpoint that handles the Anthropic API calls on your server. The key lives in the server's environment variables, never sent to the browser.

**Architecture:**
```
Browser → Your Backend (/api/roadmap, /api/chat) → Anthropic API
         (no key here)                        (key in process.env)
```

### Checklist Before Deploying

- [ ] Create a backend route (Node/Express, Vercel function, Netlify function, etc.) that:
  - Receives POST request from browser with `{ answers }` or `{ messages, activeStep }`
  - Reads `VITE_ANTHROPIC_API_KEY` from `process.env` (or your hosting provider's secrets manager)
  - Makes the actual API call to Anthropic
  - Returns the response to the browser

- [ ] Update `src/lib/api.ts` — change `generateRoadData()` to call `/api/roadmap` (your backend endpoint) instead of hitting Anthropic directly

- [ ] Update `src/lib/chat.ts` — change `streamChat()` to call `/api/chat` (your backend endpoint) instead of hitting Anthropic directly

- [ ] Add `VITE_ANTHROPIC_API_KEY` to your production environment on your hosting provider (Vercel, Netlify, Railway, etc.)
  - **Never** commit `.env.local` or any real API keys to git

- [ ] Remove the dev proxy from `vite.config.ts` once backend endpoints are live (it's no longer needed)

**Example backend endpoint** (Express):
```typescript
app.post('/api/roadmap', async (req, res) => {
  const apiKey = process.env.VITE_ANTHROPIC_API_KEY
  const { answers } = req.body

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,  // ← lives on server, never sent to browser
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: buildPrompt(answers) }],
    }),
  })

  const data = await response.json()
  res.json(data)
})
```

**Why this matters:** Without this fix, anyone can inspect the browser's JavaScript, find your API key, and exhaust your Anthropic quota or access sensitive system prompts.
