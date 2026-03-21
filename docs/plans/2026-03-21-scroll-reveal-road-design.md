# Scroll-Reveal Road Screen — Design Doc
**Date:** 2026-03-21
**Status:** Approved

## Problem

The current RoadScreen renders all nodes at once on page load with a staggered entrance animation. The full path is immediately visible. This undermines the sense of journey — there's no discovery, no earned progress, no parallax depth.

## Vision

A progressive horizontal reveal: the road line draws across the screen physically tied to the user's scroll gesture. Nodes appear one at a time, lagging slightly behind the line to create parallax depth. Previous nodes remain visible so the user retains a sense of accumulated progress.

---

## Architecture

### Scroll driver

```
containerRef → useScroll({ container: containerRef }) → scrollXProgress (MotionValue 0→1)
```

The scrollable `div` is the container. `scrollXProgress` is the single source of truth for all animation state — no `useState` for visibility, no IntersectionObserver. Everything derives from this one motion value.

Canvas width formula:
```
160 + steps.length * 280 + 160 + window.innerWidth * 0.4
```
The trailing `40vw` ensures the last node isn't pinned at the scroll boundary — the user can scroll past it, which feels finished.

### Node reveal thresholds

Each node `i` has a reveal threshold:
```
threshold_i = (i / steps.length) * 0.85
```
Node 0 is always visible (the journey start). The last 15% of scroll is reserved for the final node to settle.

Nodes use `useTransform` to watch `scrollXProgress` and derive their own `opacity` and `y` values, firing entrance when scroll crosses their threshold.

---

## Line Drawing

Single SVG `<path>` spanning full canvas width. Animated via:
```
strokeDasharray = totalPathLength
strokeDashoffset = useTransform(scrollXProgress, [0, 1], [totalPathLength, 0])
```

Raw motion value — no springs, no `animate()`. The line is physically coupled to the scroll gesture.

The path length is computed via `pathRef.current.getTotalLength()` in a `useEffect` after mount.

---

## Parallax Layers (three speeds)

| Element | Relative speed | Implementation |
|---|---|---|
| Road line | 1× (raw) | `strokeDashoffset` tied directly to scroll |
| Node icon | 0.7× | `x: useTransform(scrollXProgress, [threshold-0.1, threshold], [40, 0])` |
| Node label | 0.85× | Same pattern, smaller offset (20px) |

Result: line races ahead → icon floats in → label settles. Three layers of depth, one scroll value.

---

## Node Anatomy

```
[IsoIcon 72px]    ← spring entrance: y:20→0, opacity:0→1
      •           ← road dot, amber pulse on reveal
  Step Label      ← font-serif 13px, navy
  Duration        ← font-mono 10px, amber
  One-line blurb  ← font-sans 12px, muted — always visible
```

Nodes alternate above/below the road line (`i % 2 === 0` = above). Layout unchanged from current implementation.

---

## Hover Popover

Triggered by `onMouseEnter / onMouseLeave` on the node element. No library needed.

- Positioned absolutely, flips above/below based on node position relative to road
- `AnimatePresence` + `motion.div` entrance: `scale: 0.92→1`, `opacity: 0→1`, spring
- Small CSS arrow pointing to the node dot
- Cream background (`--cream`), navy border (`1px solid var(--bg2)`)
- Contains: full `description`, `requirement` label, `tip` label

The one-line blurb on the node replaces the need for a click. The popover is for users who want legal depth.

---

## Interaction Changes from Current

| Current | New |
|---|---|
| Click node → bottom panel slides up | Hover node → popover appears |
| All nodes visible on load | Nodes appear one-at-a-time on scroll |
| Static SVG line (full width always) | SVG path draws via strokeDashoffset |
| No parallax | 3-layer parallax (line / icon / label) |
| Drag-to-scroll only | Drag + native wheel scroll (keep both) |

---

## Files to Modify

- `src/components/RoadScreen.tsx` — full rewrite of scroll/node/line logic
- `src/index.css` — no changes needed
- `src/types.ts` — no changes needed
