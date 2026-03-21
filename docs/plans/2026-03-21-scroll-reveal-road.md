# Scroll-Reveal Road Screen Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the static all-nodes-at-once RoadScreen with a scroll-driven progressive reveal where the road line draws in real-time and nodes appear one-at-a-time with parallax depth.

**Architecture:** A single `scrollXProgress` MotionValue from Framer's `useScroll({ container })` drives everything — SVG `strokeDashoffset` for the line, threshold comparisons for node visibility, and `useTransform` offsets for parallax. No React state for visibility; motion values handle all animation reactively.

**Tech Stack:** React 19, TypeScript, Framer Motion 12 (`useScroll`, `useTransform`, `useMotionValueEvent`, `AnimatePresence`, `motion`), inline SVG

---

### Task 1: Wire `useScroll` to the container and verify motion value

**Files:**
- Modify: `src/components/RoadScreen.tsx`

The goal of this task is to replace the manual drag-scroll implementation with Framer's `useScroll` and confirm the motion value fires correctly. We keep the existing visual output unchanged — this is purely infrastructure.

**Step 1: Replace drag-scroll setup with `useScroll`**

Remove the entire `useEffect` block (lines 19–44) for drag-to-scroll. Replace with:

```tsx
import { useScroll, useTransform, useMotionValueEvent } from 'framer-motion'

// inside RoadScreen:
const trackRef = useRef<HTMLDivElement>(null)
const { scrollXProgress } = useScroll({ container: trackRef })
```

Keep `trackRef` on the same scrollable `div`. Remove `isDragging`, `dragStart`, `showHint`-from-drag logic for now (we'll restore scroll hint later).

**Step 2: Add a debug listener to verify the value fires**

Temporarily add inside the component:

```tsx
useMotionValueEvent(scrollXProgress, 'change', (v) => console.log('scroll', v))
```

**Step 3: Run dev server and verify**

```bash
bun dev
```

Open browser → navigate to the road screen (use fallback data by temporarily setting `screen = 'road'` in App.tsx, or just answer the questionnaire). Open DevTools console. Scroll the road horizontally — confirm numbers 0→1 log as you scroll.

**Step 4: Remove debug listener, commit**

Remove the `console.log` line.

```bash
git add src/components/RoadScreen.tsx
git commit -m "feat: wire useScroll to road container"
```

---

### Task 2: Draw the SVG line via `strokeDashoffset`

**Files:**
- Modify: `src/components/RoadScreen.tsx`

Replace the static `<line>` with a `<motion.path>` whose `strokeDashoffset` is tied to `scrollXProgress`.

**Step 1: Replace `<line>` with `<motion.path>` and a ref**

```tsx
const pathRef = useRef<SVGPathElement>(null)
const [pathLength, setPathLength] = useState(0)

useEffect(() => {
  if (pathRef.current) {
    setPathLength(pathRef.current.getTotalLength())
  }
}, [canvasWidth])
```

In the SVG, replace:
```tsx
<line x1="60" y1="50%" x2={canvasWidth - 60} y2="50%" ... />
```
with:
```tsx
<motion.path
  ref={pathRef}
  d={`M 60 ${/* vertical center, use a fixed value */} L ${canvasWidth - 60} ${/* same */}`}
  stroke="var(--navy)"
  strokeWidth="5"
  strokeLinecap="round"
  fill="none"
  strokeDasharray={pathLength}
  strokeDashoffset={useTransform(scrollXProgress, [0, 1], [pathLength, 0])}
/>
```

The SVG container needs a fixed pixel height to know the vertical center. The road sits at vertical center of the screen. Use `style={{ height: '100%' }}` on the SVG and hardcode `y` as `50%` in the path — but SVG `50%` only works in `<line>`, not `<path>`. Instead use a `useRef` on the container to read its `clientHeight`, or just use a constant like `360` (half of typical 720px road area height). For robustness, read it:

```tsx
const [roadY, setRoadY] = useState(360)
useEffect(() => {
  if (trackRef.current) setRoadY(trackRef.current.clientHeight / 2)
}, [])
```

Then: `d={\`M 60 ${roadY} L ${canvasWidth - 60} ${roadY}\`}`

**Step 2: Handle zero pathLength on first render**

When `pathLength === 0`, the line would be invisible. Guard:

```tsx
strokeDasharray={pathLength || undefined}
strokeDashoffset={pathLength ? useTransform(...) : 0}
```

Actually, `useTransform` cannot be called conditionally. Instead, initialize `pathLength` to a large number (e.g., `9999`) and let it correct on mount:

```tsx
const [pathLength, setPathLength] = useState(9999)
```

This means on first paint the line is invisible (offset = 9999 >> actual length), which is fine since scroll starts at 0.

**Step 3: Verify**

```bash
bun dev
```

At scroll 0: line should be invisible (or barely started). Scroll right: line should draw across from left to right in real-time, tied directly to scroll position. It should feel physically coupled to your gesture — no easing.

**Step 4: Commit**

```bash
git add src/components/RoadScreen.tsx
git commit -m "feat: animate road line via strokeDashoffset on scroll"
```

---

### Task 3: Progressive node reveal with scroll thresholds

**Files:**
- Modify: `src/components/RoadScreen.tsx`

Make nodes appear one-at-a-time as scroll crosses their threshold. Node 0 is always visible.

**Step 1: Build a `useNodeVisible` hook inside the component**

```tsx
function useNodeVisible(scrollXProgress: MotionValue<number>, index: number, total: number) {
  const [visible, setVisible] = useState(index === 0)
  const threshold = index === 0 ? 0 : (index / total) * 0.85
  useMotionValueEvent(scrollXProgress, 'change', (v) => {
    if (v >= threshold) setVisible(true)
    // once visible, never hide (accumulated progress)
  })
  return visible
}
```

Since hooks can't be called in a loop, we need a different approach. Use a single event listener and derive all visibilities:

```tsx
const [visibleCount, setVisibleCount] = useState(1) // node 0 always visible

useMotionValueEvent(scrollXProgress, 'change', (v) => {
  const total = data.steps.length
  let count = 1
  for (let i = 1; i < total; i++) {
    const threshold = (i / total) * 0.85
    if (v >= threshold) count = i + 1
  }
  setVisibleCount(prev => Math.max(prev, count)) // never decrease
})
```

**Step 2: Gate node rendering on `visibleCount`**

In the node map:

```tsx
{data.steps.map((step, i) => {
  const isVisible = i < visibleCount
  if (!isVisible) return null
  return (
    <AnimatePresence key={step.id}>
      <motion.div
        initial={{ opacity: 0, y: above ? -24 : 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        // ... rest of node
      />
    </AnimatePresence>
  )
})}
```

**Step 3: Verify**

```bash
bun dev
```

At scroll 0: only node 0 (first step) visible. Scroll right: nodes should pop in one at a time as you cross thresholds. Previous nodes stay visible. Line should be drawing ahead of each node reveal.

**Step 4: Commit**

```bash
git add src/components/RoadScreen.tsx
git commit -m "feat: reveal nodes one-at-a-time on scroll threshold"
```

---

### Task 4: Parallax — icon lags behind the line

**Files:**
- Modify: `src/components/RoadScreen.tsx`

Give each node icon an `x` offset derived from its local scroll window, so it floats in slightly after the line reaches it.

**Step 1: Compute per-node parallax transform**

Each node `i` has a scroll window: from `threshold_i - 0.08` to `threshold_i + 0.06`. The icon's `x` goes from `+40` to `0` across this window:

```tsx
// outside the map, create a helper:
function useNodeParallax(scrollXProgress: MotionValue<number>, i: number, total: number) {
  const threshold = i === 0 ? 0 : (i / total) * 0.85
  const start = Math.max(0, threshold - 0.08)
  const end = threshold + 0.06
  return useTransform(scrollXProgress, [start, end], [40, 0])
}
```

`useTransform` is safe to call unconditionally in a loop — but it IS a hook so we can't call it inside `.map()`. Extract to a subcomponent.

**Step 2: Extract `RoadNode` subcomponent**

Create a `RoadNode` component inside the file (not exported):

```tsx
interface RoadNodeProps {
  step: RoadStep
  index: number
  total: number
  scrollXProgress: MotionValue<number>
  above: boolean
}

function RoadNode({ step, index, total, scrollXProgress, above }: RoadNodeProps) {
  const threshold = index === 0 ? 0 : (index / total) * 0.85
  const start = Math.max(0, threshold - 0.08)
  const end = threshold + 0.06

  const iconX = useTransform(scrollXProgress, [start, end], [40, 0])
  const labelX = useTransform(scrollXProgress, [start, end], [20, 0])

  return (
    <motion.div
      initial={{ opacity: 0, y: above ? -24 : 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className="flex flex-col items-center cursor-pointer select-none"
      style={{ flexDirection: above ? 'column' : 'column-reverse', width: 80 }}
    >
      <motion.div style={{ x: iconX, marginBottom: above ? 12 : 0, marginTop: above ? 0 : 12 }}>
        <IsoIcon name={step.icon} />
      </motion.div>

      <div className="w-3.5 h-3.5 rounded-full z-10"
        style={{ background: 'var(--navy)', border: '3px solid var(--bg)' }} />

      <motion.div style={{ x: labelX, textAlign: 'center', marginTop: above ? 0 : 12, marginBottom: above ? 12 : 0 }}>
        <p className="font-serif text-[13px] font-medium leading-tight max-w-[100px]"
          style={{ color: 'var(--navy)' }}>{step.label}</p>
        <p className="font-mono text-[10px] mt-1" style={{ color: 'var(--amber)' }}>{step.duration}</p>
        <p className="font-sans text-[11px] mt-1.5 leading-snug max-w-[110px]"
          style={{ color: '#9CA3AF' }}>{step.description.split('.')[0]}.</p>
      </motion.div>
    </motion.div>
  )
}
```

The blurb is the first sentence of `description` — short, human, no legal depth. That goes in the popover (next task).

**Step 3: Use `RoadNode` in the parent map**

```tsx
{data.steps.map((step, i) => {
  if (i >= visibleCount) return null
  return (
    <motion.div
      key={step.id}
      id={`node-${i}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <RoadNode
        step={step}
        index={i}
        total={data.steps.length}
        scrollXProgress={scrollXProgress}
        above={i % 2 === 0}
      />
    </motion.div>
  )
})}
```

**Step 4: Verify parallax feel**

```bash
bun dev
```

Scroll slowly toward a node — the line should reach the node's dot position first, then the icon should float in from the right (~40px behind), then the label settles. Tune the `[40, 0]` range and window `[start, end]` if the lag feels too much or too little.

**Step 5: Commit**

```bash
git add src/components/RoadScreen.tsx
git commit -m "feat: add parallax to node icon and label"
```

---

### Task 5: Hover popover with legal detail

**Files:**
- Modify: `src/components/RoadScreen.tsx`

Add a hover-triggered popover to each `RoadNode` that shows the full description, requirement, and tip.

**Step 1: Add hover state to `RoadNode`**

```tsx
const [hovered, setHovered] = useState(false)
```

Wrap the whole node `motion.div` with:
```tsx
onMouseEnter={() => setHovered(true)}
onMouseLeave={() => setHovered(false)}
```

**Step 2: Render the popover with `AnimatePresence`**

Add this inside `RoadNode`, positioned absolutely. If `above`, popover appears below the node (reversed for below nodes):

```tsx
<div className="relative">
  <AnimatePresence>
    {hovered && (
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: above ? 8 : -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: above ? 8 : -8 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="absolute z-50 w-64 rounded-xl p-4 shadow-lg"
        style={{
          background: 'var(--cream)',
          border: '1px solid var(--bg2)',
          bottom: above ? 'auto' : '100%',
          top: above ? '100%' : 'auto',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: above ? 12 : 0,
          marginBottom: above ? 0 : 12,
          pointerEvents: 'none',
        }}
      >
        <p className="font-serif text-[13px] font-medium mb-2" style={{ color: 'var(--navy)' }}>
          {step.label}
        </p>
        <p className="font-sans text-[12px] leading-relaxed mb-3" style={{ color: '#6B7280' }}>
          {step.description}
        </p>
        <div className="flex flex-col gap-2">
          {[
            { key: "You'll need", val: step.requirement },
            { key: 'Pro tip', val: step.tip },
          ].map(({ key, val }) => (
            <div key={key}>
              <span className="font-mono text-[9px] tracking-[0.12em] uppercase block mb-0.5"
                style={{ color: '#9CA3AF' }}>{key}</span>
              <span className="font-mono text-[11px]" style={{ color: 'var(--navy)' }}>{val}</span>
            </div>
          ))}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
</div>
```

**Step 3: Remove the old detail panel and `activeStep` state**

Remove from `RoadScreen`:
- `const [activeStep, setActiveStep] = useState<RoadStep | null>(null)`
- `function openStep(...)`
- The entire `{activeStep && ...}` `AnimatePresence` block at the bottom
- `onClick` on nodes (already removed in `RoadNode` refactor)

**Step 4: Verify popover**

```bash
bun dev
```

Hover over any visible node — popover should spring up (or down, depending on alternating position). Moving mouse away should exit cleanly. Ensure z-index is high enough to overlap adjacent nodes.

**Step 5: Commit**

```bash
git add src/components/RoadScreen.tsx
git commit -m "feat: add hover popover with legal detail to road nodes"
```

---

### Task 6: Canvas width, spacing, and scroll hint polish

**Files:**
- Modify: `src/components/RoadScreen.tsx`

Final polish: correct canvas width so last node has breathing room, restore scroll hint, tune spacing.

**Step 1: Update canvas width formula**

```tsx
const nodeSpacing = 280
const trailingSpace = typeof window !== 'undefined' ? window.innerWidth * 0.4 : 400
const canvasWidth = 160 + data.steps.length * nodeSpacing + 160 + trailingSpace
```

**Step 2: Restore scroll hint**

Re-add `showHint` state, hide it on first scroll:

```tsx
const [showHint, setShowHint] = useState(true)
useMotionValueEvent(scrollXProgress, 'change', (v) => {
  if (v > 0.01) setShowHint(false)
  // ... existing visibleCount logic
})
```

Keep the existing scroll hint JSX (bottom-right arrow + "scroll to explore" text).

**Step 3: Node spacing in the flex container**

Update:
```tsx
style={{ gap: nodeSpacing - 80 }}
```
→
```tsx
style={{ gap: nodeSpacing - 80 }}  // 200px gap between 80px-wide nodes = 280px center-to-center
```

**Step 4: Touch scroll support**

Add to the scrollable track div:
```tsx
style={{ cursor: 'grab', touchAction: 'pan-x' }}
```

**Step 5: Final visual check**

```bash
bun dev
```

Verify:
- First node visible on load, no others
- Scroll hint visible and fades on first scroll
- Line draws left to right with scroll
- Nodes reveal one-at-a-time with parallax
- Hover popover works on all nodes
- Last node has trailing space so scroll doesn't feel abrupt
- Mobile touch scroll works (test with DevTools device emulation)

**Step 6: Commit**

```bash
git add src/components/RoadScreen.tsx
git commit -m "feat: polish canvas width, scroll hint, touch support"
```

---

## Completed State

After all tasks:

- `RoadScreen.tsx` — fully rewritten scroll/node/line logic, `RoadNode` subcomponent
- No new files created
- Design doc at `docs/plans/2026-03-21-scroll-reveal-road-design.md`
- This plan at `docs/plans/2026-03-21-scroll-reveal-road.md`

The old bottom detail panel is gone. The old drag-scroll imperative event handler is gone. Everything animates from a single `scrollXProgress` motion value.
