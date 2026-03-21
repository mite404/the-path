# The Path — Project Brief for Claude Code

## What this is
A single-page visa journey visualizer built for the **Anti-Slopathon** hackathon, hosted by **Ellis** (ellis.com), a modern U.S. immigration law firm. The concept: answer 4 questions, get a personalized horizontal-scroll roadmap of your visa journey with isometric icons, timelines, and Claude-generated step details.

## Stack
- **Vite** (v6) + **React 19** + **TypeScript**
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (no tailwind.config.js — config is in CSS)
- **Framer Motion** for all animations (screen transitions, node entrance, spring-based detail panel)
- **shadcn/ui** (minimal — only `Button` and `Input` are used, manually included, no CLI needed)
- **Bun** as package manager and dev server runner
- **Anthropic Claude API** (claude-sonnet-4-20250514) called via a **Vite dev proxy** to avoid CORS

## Design System
Defined entirely in `src/index.css` as CSS custom properties:

| Token | Value | Usage |
|---|---|---|
| `--navy` | `#1A2340` | Primary color, road line, text |
| `--amber` | `#C4873A` | Accent — active states, labels, icons |
| `--bg` | `#F5F0E8` | Warm off-white page background |
| `--bg2` | `#EDE8DC` | Slightly darker — borders, inactive dots |
| `--cream` | `#FAF7F2` | Card/panel backgrounds |

**Typography (3-font system):**
- `.font-serif` → Playfair Display (headers, titles, italic logotype)
- `.font-sans` → DM Sans weight 300/400/500 (body, buttons)
- `.font-mono` → JetBrains Mono (metadata, timelines, labels, badges)

Fonts load from Google Fonts in `index.css`. Works fine in a real browser.

## App Architecture

### Screen state machine (`src/App.tsx`)
Four screens managed with a simple `useState<Screen>` + `AnimatePresence`:
```
landing → quest → loading → road
```
Screens slide in/out with a shared `ScreenWrap` motion component (x: 30→0→-30, opacity fade).

### Data flow
1. User answers 4 questions in `QuestionnaireScreen` → `Answers` object built up
2. On final answer, `App` calls `generateRoadData(answers)` from `src/lib/api.ts`
3. API returns (or fallback fires) → `RoadData` stored in App state → `RoadScreen` renders

### Types (`src/types.ts`)
```ts
Answers       { nationality, employment, goal, field }
RoadStep      { id, icon, label, duration, description, requirement, tip }
RoadData      { visaType, tagline, totalTime, difficulty, steps[] }
IconName      union of 10 icon strings
```

## File-by-File

### `src/App.tsx`
Top-level screen router. Holds `screen` and `roadData` state. Calls `generateRoadData`, falls back to `getFallbackData` on error. `ScreenWrap` handles enter/exit animation for every screen transition.

### `src/types.ts`
All shared TypeScript types. Single source of truth for `RoadData`, `RoadStep`, `Answers`, `IconName`.

### `src/index.css`
- Tailwind v4 `@import "tailwindcss"`
- shadcn CSS variable block (HSL format for Tailwind compatibility)
- Custom design tokens as CSS vars (`--navy`, `--amber`, `--bg`, etc.)
- Google Fonts import
- `.font-serif / .font-sans / .font-mono` utility classes
- `.road-track` scrollbar styling

### `src/lib/api.ts`
- `buildPrompt(answers)` — constructs the immigration attorney prompt as a string array joined with newlines (avoids template literal issues)
- `generateRoadData(answers)` — fetches `/api/anthropic/v1/messages` (proxied), parses JSON from response, returns `RoadData`
- `getFallbackData()` — hardcoded H-1B 6-step journey, used when API fails
- API key read from `import.meta.env.VITE_ANTHROPIC_API_KEY`

### `src/lib/utils.ts`
Standard shadcn `cn()` utility — `clsx` + `twMerge`.

### `src/components/LandingScreen.tsx`
Hero screen. Staggered Framer Motion entrance (badge → title → subtitle → button). Ellis badge, serif italic headline with amber `<em>` accent, disclaimer footer. Single prop: `onStart: () => void`.

### `src/components/QuestionnaireScreen.tsx`
4-stage questionnaire with `AnimatePresence` slide transitions between stages (x: ±40). Stage 0 is a text input (nationality), stages 1–3 are option pill buttons. Progress dots in header animate between inactive/active/done states. Answers accumulate in local state, final answer triggers `onComplete(answers)`.

### `src/components/LoadingScreen.tsx`
Spinning border circle (Framer `animate rotate`), italic serif "Charting your path…", cycling status messages with `AnimatePresence` fade.

### `src/components/RoadScreen.tsx`
The main visual. Key pieces:
- **Road line**: an `<svg>` absolutely positioned behind nodes, single `<line>` spanning full canvas width
- **Canvas**: a wide `div` (computed width = `160 + steps.length * 220 + 160`) inside a horizontally scrollable track
- **Nodes**: alternate above/below the road line (`i % 2 === 0`). Each has an `IsoIcon`, a dot on the road, and a label/duration below
- **Drag scroll**: `mousedown/mousemove/mouseup` on the track ref for click-drag scrolling
- **Detail panel**: `AnimatePresence` spring slide-up from bottom on node click, shows description + 3 metadata items (timeline, requirement, tip)
- **Scroll hint**: fades out on first drag or node click

### `src/components/IsoIcon.tsx`
10 hand-crafted isometric-style SVG icons rendered as inline JSX. Icons: `document`, `briefcase`, `calendar`, `stamp`, `plane`, `key`, `shield`, `people`, `star`, `home`. Each uses layered rects/paths in `--navy` and `--amber` to simulate 3D depth. Applied via `<IsoIcon name={step.icon} />`.

### `src/components/ui/button.tsx` / `input.tsx`
Minimal shadcn components. `Button` uses `cva` variants (default/outline/ghost). `Input` is a forwarded-ref input. Both use `cn()` for class merging.

### `vite.config.ts`
- `@tailwindcss/vite` and `@vitejs/plugin-react` plugins
- `@` path alias → `./src`
- Dev proxy: `/api/anthropic` → `https://api.anthropic.com`, rewrites path, injects `anthropic-version` and `anthropic-dangerous-direct-browser-access` headers

### `index.html`
Minimal Vite entry. Title: "The Path — Visa Journey by Ellis". Mounts to `#root`.

## Running locally
```bash
# 1. add your key
echo "VITE_ANTHROPIC_API_KEY=sk-ant-..." > .env.local

# 2. install + run
bun install
bun dev
```

## Known / Likely Issues to Fix
- **Tailwind v4 class purging**: some inline `style={}` patterns used where Tailwind classes would be cleaner — could be refactored
- **Road node spacing**: currently fixed at `220px` gap; on very large step counts (7+) may feel too spread on smaller viewports
- **No mobile scroll**: horizontal scroll works on desktop; touch scroll on mobile needs `touch-action: pan-x` on the track
- **API key exposure**: the Vite proxy keeps the key out of the browser bundle in dev, but for any public deployment this needs a real backend route (e.g. a Netlify function or Express endpoint)
- **shadcn init not run**: `button.tsx` and `input.tsx` are manually written, not generated by the CLI. If you run `bunx shadcn init` it may want to overwrite them — skip or merge carefully
