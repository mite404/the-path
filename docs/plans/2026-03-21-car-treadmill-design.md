# Car Treadmill Road Animation — Design Doc
**Date:** 2026-03-21
**Status:** Approved

---

## Vision

A playful treadmill effect: a VW Beetle drives continuously along a road that builds itself one tile at a time. New road tiles drop from above and land ahead of the car. As the car drives onto the new tile, the old tile behind falls away off-screen. Only 2-3 tiles exist at any moment — the road is always being constructed just ahead of you, matching the visa journey metaphor where each step is unknown until you reach it.

---

## Assets

- **Road tile:** `src/assets/Street-Tile.png` (existing, imported as `imgStreet`) — isometric tile with grass strip top-left, asphalt with dashed center lines, concrete curb bottom-right
- **Car:** VW Beetle with surfboard on roof (needs to be added to `src/assets/`) — 3/4 view, light blue, fun/playful tone

---

## Tile State Machine

Three slots managed by `activeIndex`:

```
State transitions when activeIndex goes from N to N+1:

  BEHIND          CURRENT         AHEAD
  ┌─────┐        ┌─────┐        ┌─────┐
  │(N-1)│        │  N  │        │(N+1)│
  │fall  │◄──────│shift │◄──────│land  │
  │away  │        │left  │        │from  │
  └──┬──┘        └─────┘        └──┬──┘
     │                              │
     ▼                              │
  removed                    drops from sky
  from DOM                   with bounce
```

**Tile positions** (all `position: fixed`, same `top: 52vh` band as current street):
- **Current tile**: centered under the car, roughly `left: 30%`
- **Ahead tile**: one tile-width to the right of current
- **Behind tile**: one tile-width to the left, animating down and away

**Tile lifecycle animations:**

| Phase | Animation | Duration | Easing |
|---|---|---|---|
| Drop in (ahead) | `y: -300 → 0`, `opacity: 0 → 1` | 500ms | Spring, stiffness 300, damping 20 (bouncy) |
| Settle (become current) | `x: tileWidth → 0` | Scroll-driven | Tween, ease-out |
| Fall away (behind) | `y: 0 → 400`, `rotate: -12deg`, `opacity: 1 → 0` | 600ms | Tween, ease-in (gravity feel) |

**Special cases:**
- Intro section (index 0): one tile already placed, no drop animation. Ahead tile for step 1 drops in after a short delay on page load.
- No car visible on intro section.

---

## The Car

**Size:** ~80-100px wide, positioned so wheels sit on the road surface.

**Position:** `position: fixed`, `top: 52vh + ~140px` (on the road surface), `left: 35%`.

**Three motion layers:**

1. **Micro-drift on scroll** — As user scrolls between snaps, car nudges right ~30px (`left: 35% → 37%`), resets when tile transition completes. Driven by `fractional` scroll progress.

2. **Bounce on tile land** — When new tile drops and settles, car does a small `y` bounce (`y: 0 → -6 → 0`, spring). Like driving over a bump.

3. **Idle wobble** — Continuous subtle `rotate` oscillation (`-0.5deg → 0.5deg`, 2s loop). Keeps car feeling alive.

**Car entrance:** On intro→step1 transition, car drives in from off-screen left (`x: -50vw → resting position`, spring).

---

## Scroll-to-Tile Coordination

**Scroll ranges** (snap sections are `100vw` wide):

```
Section 0 (intro):    scrollLeft = 0
Section 1 (step 1):   scrollLeft = 1 × innerWidth
Section N:            scrollLeft = N × innerWidth
```

**Fractional progress between snaps:**

```ts
const sectionWidth = window.innerWidth
const rawProgress = scrollLeft / sectionWidth
const currentSection = Math.round(rawProgress)
const fractional = rawProgress - Math.floor(rawProgress)  // 0→1
```

**`fractional` drives (continuous, ref-based, no re-renders):**
- Car micro-drift: `translateX(fractional * 30px)`
- Current tile slide: `translateX(-fractional * TILE_WIDTH)`
- Ahead tile slide: slides in from right in tandem

**`currentSection` changing triggers (discrete events):**
- Behind tile: start fall-away animation
- Ahead tile: start drop-from-sky animation
- Car: bounce on land

---

## Component Structure

All changes in `src/components/RoadScreen.tsx` only. Two new subcomponents:

### `RoadTreadmill`

Replaces the current fixed `streetRef` div. Contains three `motion.img` elements for behind/current/ahead tiles using `AnimatePresence` for enter/exit.

### `DrivingCar`

Fixed-position car image with idle wobble animation, scroll-driven micro-drift, and bounce-on-land triggered by `activeIndex` changes. Hidden when `activeIndex === 0` (intro section).

### State

```ts
const [activeIndex, setActiveIndex] = useState(0)  // already exists
// Derived:
const currentTileIndex = Math.max(0, activeIndex - 1)
const aheadTileIndex = currentTileIndex + 1
const behindTileIndex = currentTileIndex - 1
const carVisible = activeIndex > 0
```

No new state beyond existing `activeIndex`. Fractional scroll progress written to a ref to avoid re-renders.

---

## Files

- **Modified:** `src/components/RoadScreen.tsx` — replace street tile div with `RoadTreadmill`, add `DrivingCar`
- **Added:** Car PNG to `src/assets/`
- **Unchanged:** All other files
