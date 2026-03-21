# Car Treadmill Road Animation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the static repeating street tile with a treadmill of discrete tiles that build/fall away, and add a continuously-driving VW Beetle car sprite.

**Architecture:** Three fixed-position layers — behind tile (falling), current tile (under car), ahead tile (dropping in). Car is fixed-position with scroll-driven micro-drift, idle wobble, and bounce-on-land. All changes in `RoadScreen.tsx` only. Scroll handler computes fractional progress and writes to refs to avoid re-renders.

**Tech Stack:** React 19, Framer Motion 12, TypeScript

---

### Task 1: Add car import and constants

**Files:**
- Modify: `src/components/RoadScreen.tsx:1-14`

**Step 1: Add the car image import and tile/car constants**

After line 12 (`import imgStreet`), add:

```ts
import imgCar from '@/assets/VW-BUG-ISO_exported.png'
```

After line 14 (`const stepImages`), add:

```ts
const TILE_WIDTH = 200  // matches Street-Tile.png rendered size
const CAR_WIDTH = 90
const CAR_TOP = 'calc(52vh + 100px)'  // on the road surface
const CAR_LEFT_PCT = 35  // percent from left edge
```

**Step 2: Verify build**

Run: `cd /Users/ea/Programming/web/fractal/the-path && bun run build`
Expected: Clean build, no errors

**Step 3: Commit**

```bash
git add src/components/RoadScreen.tsx
git commit -m "feat: add car import and treadmill constants"
```

---

### Task 2: Build the RoadTreadmill subcomponent

**Files:**
- Modify: `src/components/RoadScreen.tsx` — add new component before `RoadScreen`

**Step 1: Write the RoadTreadmill component**

Add this component after the `MilestoneCard` component (after line 203) and before the `Props` interface (line 205):

```tsx
interface TreadmillProps {
  activeIndex: number
  fractionalRef: React.RefObject<number>
}

function RoadTreadmill({ activeIndex }: TreadmillProps) {
  // Tile index in step-space (intro = no tile index, step 1 = tile 0, etc.)
  const tileIndex = activeIndex - 1
  const prevTileIndex = tileIndex - 1

  return (
    <div
      className="fixed pointer-events-none z-10"
      style={{ top: '52vh', left: 0, right: 0, height: 200 }}
    >
      {/* Behind tile — falling away */}
      <AnimatePresence>
        {prevTileIndex >= 0 && (
          <motion.img
            key={`behind-${prevTileIndex}`}
            src={imgStreet}
            initial={false}
            exit={{
              y: 400,
              rotate: -12,
              opacity: 0,
            }}
            transition={{ duration: 0.6, ease: [0.55, 0, 1, 0.45] }}
            style={{
              position: 'absolute',
              left: `calc(${CAR_LEFT_PCT}% - ${TILE_WIDTH}px)`,
              width: TILE_WIDTH,
              height: 200,
            }}
          />
        )}
      </AnimatePresence>

      {/* Current tile — under the car */}
      <AnimatePresence mode="popLayout">
        {tileIndex >= 0 && (
          <motion.img
            key={`current-${tileIndex}`}
            src={imgStreet}
            initial={false}
            animate={{ x: 0, y: 0 }}
            style={{
              position: 'absolute',
              left: `${CAR_LEFT_PCT}%`,
              width: TILE_WIDTH,
              height: 200,
            }}
          />
        )}
      </AnimatePresence>

      {/* Ahead tile — dropping from sky */}
      <AnimatePresence>
        <motion.img
          key={`ahead-${tileIndex + 1}`}
          src={imgStreet}
          initial={{ y: -300, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
          }}
          style={{
            position: 'absolute',
            left: `calc(${CAR_LEFT_PCT}% + ${TILE_WIDTH}px)`,
            width: TILE_WIDTH,
            height: 200,
          }}
        />
      </AnimatePresence>
    </div>
  )
}
```

**Step 2: Verify build**

Run: `bun run build`
Expected: Clean build (component exists but isn't rendered yet)

**Step 3: Commit**

```bash
git add src/components/RoadScreen.tsx
git commit -m "feat: add RoadTreadmill component with tile state machine"
```

---

### Task 3: Build the DrivingCar subcomponent

**Files:**
- Modify: `src/components/RoadScreen.tsx` — add new component after `RoadTreadmill`

**Step 1: Write the DrivingCar component**

```tsx
interface CarProps {
  visible: boolean
}

function DrivingCar({ visible }: CarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.img
          src={imgCar}
          alt="VW Beetle"
          initial={{ x: '-50vw', opacity: 0 }}
          animate={{
            x: 0,
            opacity: 1,
            rotate: [-0.5, 0.5, -0.5],
          }}
          exit={{ x: '-50vw', opacity: 0 }}
          transition={{
            x: { type: 'spring', stiffness: 120, damping: 20 },
            opacity: { duration: 0.3 },
            rotate: {
              repeat: Infinity,
              duration: 2,
              ease: 'easeInOut',
            },
          }}
          className="fixed pointer-events-none z-20"
          style={{
            top: CAR_TOP,
            left: `${CAR_LEFT_PCT}%`,
            width: CAR_WIDTH,
            transform: 'translateX(-50%)',
          }}
        />
      )}
    </AnimatePresence>
  )
}
```

**Step 2: Verify build**

Run: `bun run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add src/components/RoadScreen.tsx
git commit -m "feat: add DrivingCar component with idle wobble and entrance"
```

---

### Task 4: Wire components into RoadScreen and remove old street tile

**Files:**
- Modify: `src/components/RoadScreen.tsx:210-375` — the `RoadScreen` component

**Step 1: Add fractionalRef and update scroll handler**

In `RoadScreen`, after the existing `const [activeIndex, setActiveIndex] = useState(0)` (line 213), add:

```ts
const fractionalRef = useRef(0)
```

Update the scroll handler (lines 221-232) to also compute fractional progress:

```ts
const handleScroll = () => {
  const scrollLeft = container.scrollLeft
  const sectionWidth = container.offsetWidth
  const rawProgress = scrollLeft / sectionWidth
  fractionalRef.current = rawProgress - Math.floor(rawProgress)

  // Detect active section
  const sections = container.querySelectorAll<HTMLElement>('.snap-section')
  const width = container.offsetWidth
  sections.forEach((section, index) => {
    const rect = section.getBoundingClientRect()
    if (rect.left >= -width / 2 && rect.left <= width / 2) {
      setActiveIndex(index)
    }
  })
}
```

**Step 2: Replace the street tile div with RoadTreadmill and add DrivingCar**

Remove the entire street tile div (lines 287-300):
```tsx
{/* Street tile — fixed mid-height band */}
<div
  ref={streetRef}
  ...
/>
```

Replace with:
```tsx
{/* Road treadmill */}
<RoadTreadmill activeIndex={activeIndex} fractionalRef={fractionalRef} />

{/* Driving car */}
<DrivingCar visible={activeIndex > 0} />
```

Also remove the now-unused `streetRef` declaration (line 212):
```ts
const streetRef = useRef<HTMLDivElement>(null)
```

And remove `street` from the scroll handler guard:
```ts
// Before:
const street = streetRef.current
if (!container || !street) return

// After:
if (!container) return
```

And remove the parallax line:
```ts
street.style.backgroundPositionX = `-${container.scrollLeft * 0.3}px`
```

**Step 3: Verify build**

Run: `bun run build`
Expected: Clean build

**Step 4: Visual test in browser**

Run: `bun dev`

Verify:
- Intro section: no car, one tile visible at 35% left, ahead tile drops in
- Scroll to step 1: car drives in from left, tile is under car
- Scroll to step 2: old tile falls away (rotates, drops), new tile drops from sky ahead, car bounces
- Continue scrolling: treadmill repeats for each step
- Scroll back: tiles reverse (ahead tile should still work)

**Step 5: Commit**

```bash
git add src/components/RoadScreen.tsx
git commit -m "feat: wire treadmill and car into RoadScreen, remove old street tile"
```

---

### Task 5: Add car bounce-on-land effect

**Files:**
- Modify: `src/components/RoadScreen.tsx` — update `DrivingCar`

**Step 1: Add bounce triggered by activeIndex change**

Update `DrivingCar` to accept `activeIndex` and use a `useEffect` to trigger a bounce:

```tsx
interface CarProps {
  visible: boolean
  activeIndex: number
}

function DrivingCar({ visible, activeIndex }: CarProps) {
  const [bounceKey, setBounceKey] = useState(0)

  useEffect(() => {
    if (activeIndex > 1) {
      // Trigger bounce when landing on a new tile (not the first entrance)
      setBounceKey(k => k + 1)
    }
  }, [activeIndex])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed pointer-events-none z-20"
          initial={{ x: '-50vw', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-50vw', opacity: 0 }}
          transition={{
            x: { type: 'spring', stiffness: 120, damping: 20 },
            opacity: { duration: 0.3 },
          }}
          style={{
            top: CAR_TOP,
            left: `${CAR_LEFT_PCT}%`,
          }}
        >
          <motion.img
            key={bounceKey}
            src={imgCar}
            alt="VW Beetle"
            initial={bounceKey > 0 ? { y: 0 } : false}
            animate={{
              y: [0, -8, 0],
              rotate: [-0.5, 0.5, -0.5],
            }}
            transition={{
              y: bounceKey > 0
                ? { duration: 0.3, ease: [0.36, 0, 0.66, -0.56] }
                : undefined,
              rotate: {
                repeat: Infinity,
                duration: 2,
                ease: 'easeInOut',
              },
            }}
            style={{
              width: CAR_WIDTH,
              transform: 'translateX(-50%)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

Update the usage in RoadScreen:
```tsx
<DrivingCar visible={activeIndex > 0} activeIndex={activeIndex} />
```

**Step 2: Visual test**

Scroll through steps and confirm:
- Car bounces slightly when each new tile lands
- No bounce on initial car entrance (step 1)
- Bounce on step 2, 3, 4, etc.

**Step 3: Commit**

```bash
git add src/components/RoadScreen.tsx
git commit -m "feat: add car bounce-on-land when reaching new tile"
```

---

### Task 6: Add scroll-driven car micro-drift

**Files:**
- Modify: `src/components/RoadScreen.tsx` — update `DrivingCar` and scroll handler

**Step 1: Pass fractionalRef to DrivingCar and apply micro-drift**

Update `DrivingCar` to read `fractionalRef` on an animation frame loop and apply a small horizontal offset:

```tsx
interface CarProps {
  visible: boolean
  activeIndex: number
  fractionalRef: React.RefObject<number>
}

function DrivingCar({ visible, activeIndex, fractionalRef }: CarProps) {
  const [bounceKey, setBounceKey] = useState(0)
  const driftRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeIndex > 1) {
      setBounceKey(k => k + 1)
    }
  }, [activeIndex])

  useEffect(() => {
    if (!visible) return
    let raf: number
    const tick = () => {
      if (driftRef.current && fractionalRef.current !== undefined) {
        const drift = (fractionalRef.current ?? 0) * 30
        driftRef.current.style.transform = `translateX(${drift}px)`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [visible, fractionalRef])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed pointer-events-none z-20"
          initial={{ x: '-50vw', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-50vw', opacity: 0 }}
          transition={{
            x: { type: 'spring', stiffness: 120, damping: 20 },
            opacity: { duration: 0.3 },
          }}
          style={{
            top: CAR_TOP,
            left: `${CAR_LEFT_PCT}%`,
          }}
        >
          <div ref={driftRef}>
            <motion.img
              key={bounceKey}
              src={imgCar}
              alt="VW Beetle"
              initial={bounceKey > 0 ? { y: 0 } : false}
              animate={{
                y: [0, -8, 0],
                rotate: [-0.5, 0.5, -0.5],
              }}
              transition={{
                y: bounceKey > 0
                  ? { duration: 0.3, ease: [0.36, 0, 0.66, -0.56] }
                  : undefined,
                rotate: {
                  repeat: Infinity,
                  duration: 2,
                  ease: 'easeInOut',
                },
              }}
              style={{
                width: CAR_WIDTH,
                transform: 'translateX(-50%)',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

Update usage:
```tsx
<DrivingCar visible={activeIndex > 0} activeIndex={activeIndex} fractionalRef={fractionalRef} />
```

**Step 2: Visual test**

Slowly scroll between snap points and confirm:
- Car drifts right ~30px as you scroll between sections
- Car snaps back when the snap settles
- Movement feels smooth and continuous

**Step 3: Commit**

```bash
git add src/components/RoadScreen.tsx
git commit -m "feat: add scroll-driven car micro-drift between snaps"
```

---

### Task 7: Tune tile positions and car alignment

**Files:**
- Modify: `src/components/RoadScreen.tsx` — adjust constants

**Step 1: Visual tuning pass**

Run `bun dev` and adjust these constants until the car's wheels sit on the road surface and tiles align naturally:

- `TILE_WIDTH` — may need to match actual rendered width of `Street-Tile.png`
- `CAR_TOP` — adjust so the car sits on the asphalt, not floating or sinking
- `CAR_LEFT_PCT` — adjust horizontal positioning
- Tile `left` positions in `RoadTreadmill` — ensure current tile is under car, ahead tile is adjacent

This is a visual tuning step — exact values depend on the asset dimensions.

**Step 2: Commit**

```bash
git add src/components/RoadScreen.tsx
git commit -m "fix: tune tile and car positioning for visual alignment"
```

---

### Task 8: Final visual test and edge cases

**Step 1: Test full flow**

Run `bun dev` and verify:
- [ ] Intro section: no car, tiles visible, ahead tile drops in on load
- [ ] Scroll intro → step 1: car drives in from left
- [ ] Each subsequent scroll: old tile falls, new tile drops, car bounces
- [ ] Last step (step 7): treadmill still works, no ahead tile needed
- [ ] Scroll backward: tiles/car handle reverse direction gracefully
- [ ] No console errors or React warnings

**Step 2: Build check**

Run: `bun run build`
Expected: Clean build, no TypeScript errors

**Step 3: Commit any final fixes**

```bash
git add src/components/RoadScreen.tsx
git commit -m "fix: edge cases in car treadmill animation"
```
