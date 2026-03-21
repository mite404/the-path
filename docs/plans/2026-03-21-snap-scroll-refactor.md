# Snap-Scroll Road Screen Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild RoadScreen as a full-screen snap-scroll experience with a tiled isometric street, staggered entry parallax per milestone, glass cards above the street, and a dark hover popover for legal detail.

**Architecture:** Each milestone gets a 100vw snap section. A fixed street tile band runs at mid-height across all sections and scrolls at 0.3× speed for parallax. IntersectionObserver fires Framer Motion entry animations per section. The entire card surface triggers the popover on hover.

**Tech Stack:** React 19, TypeScript, Framer Motion 12 (motion, AnimatePresence), IntersectionObserver API, CSS scroll-snap, Tailwind CSS v4 @theme tokens

---

> **Context note:** The app currently boots directly to the road screen with fallback H-1B data loaded (`screen = 'road'` in App.tsx, `getFallbackData()` returns data from `src/data/h1b-steps.json`). Run `bun dev` and open `http://localhost:5173` to see changes immediately — no need to go through the questionnaire.
>
> This plan **supersedes** `2026-03-21-scroll-reveal-road.md` (the useScroll parallax plan). The other session implementing that plan may have made changes to `RoadScreen.tsx` — this plan fully rewrites that file, so merge conflicts should be resolved by taking this version entirely.
>
> **Design doc:** `docs/plans/2026-03-21-snap-scroll-refactor-design.md` — read it for full visual rationale.

---

### Task 1: Update color tokens and fonts in index.css

**Files:**
- Modify: `src/index.css`

Replace the existing color token system with the Ellis palette and ensure fonts are correctly assigned.

**Step 1: Replace the @layer base :root block and add @theme**

Open `src/index.css`. Replace everything from `@layer base {` through the closing `}` of the first layer block with:

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

@layer base {
  :root {
    --navy:   #141428;
    --amber:  #78f0ff;
    --bg:     #F1F5F5;
    --bg2:    #e0e4e4;
    --cream:  #ffffff;

    --ellis-bg:      #F1F5F5;
    --ellis-dark:    #141414;
    --ellis-darkest: #000014;
    --ellis-navy:    #141428;
    --ellis-cyan:    #78f0ff;
    --ellis-gray:    #505064;
    --ellis-mid:     #647878;
    --ellis-light:   #a0a0a0;
    --ellis-muted:   #a0a0b4;
  }
}

@layer base {
  body {
    background-color: var(--ellis-bg);
    color: var(--ellis-dark);
    font-family: 'DM Sans', system-ui, sans-serif;
    overflow: hidden;
  }
}
```

Keep the font utility classes and road-track scrollbar styles below unchanged. Keep the Google Fonts import at the top.

**Step 2: Verify build**

```bash
bun run build 2>&1 | grep -E "(error|✓ built)"
```

Expected: `✓ built in ...ms`

**Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: update color tokens to Ellis palette"
```

---

### Task 2: Import PNG assets and build the asset map

**Files:**
- Modify: `src/components/RoadScreen.tsx`

We need TypeScript-safe imports for the 7 PNG files. Vite handles PNG imports natively.

**Step 1: Add PNG imports at the top of RoadScreen.tsx**

```tsx
import imgWork from '@/assets/Work.png'
import imgQRCode from '@/assets/QR-Code.png'
import imgPackage from '@/assets/Package.png'
import imgDocument from '@/assets/Document.png'
import imgBarcode from '@/assets/Barcode.png'
import imgGlobe from '@/assets/Globe.png'
import imgPlane from '@/assets/Plane.png'
import imgStreet from '@/assets/Street-Tile.png'

const stepImages = [imgWork, imgQRCode, imgPackage, imgDocument, imgBarcode, imgGlobe, imgPlane]
```

**Step 2: Verify build still passes**

```bash
bun run build 2>&1 | grep -E "(error|✓ built)"
```

Expected: `✓ built in ...ms`

**Step 3: Commit**

```bash
git add src/components/RoadScreen.tsx
git commit -m "feat: import PNG assets for road milestones"
```

---

### Task 3: Rebuild RoadScreen shell — snap-scroll container + street tile

**Files:**
- Modify: `src/components/RoadScreen.tsx`

Replace the entire component with the new snap-scroll shell. No milestone cards yet — just the layout structure, street, header, and progress dots wired to scroll position.

**Step 1: Replace RoadScreen with the snap-scroll shell**

```tsx
import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { RoadData } from '@/types'

import imgWork from '@/assets/Work.png'
import imgQRCode from '@/assets/QR-Code.png'
import imgPackage from '@/assets/Package.png'
import imgDocument from '@/assets/Document.png'
import imgBarcode from '@/assets/Barcode.png'
import imgGlobe from '@/assets/Globe.png'
import imgPlane from '@/assets/Plane.png'
import imgStreet from '@/assets/Street-Tile.png'

const stepImages = [imgWork, imgQRCode, imgPackage, imgDocument, imgBarcode, imgGlobe, imgPlane]

interface Props {
  data: RoadData
  onRestart: () => void
}

export function RoadScreen({ data, onRestart }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const streetRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // Street parallax
  useEffect(() => {
    const container = containerRef.current
    const street = streetRef.current
    if (!container || !street) return

    const handleScroll = () => {
      street.style.backgroundPositionX = `-${container.scrollLeft * 0.3}px`

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

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Total sections = intro + steps
  const totalSections = data.steps.length + 1

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: 'var(--ellis-bg)' }}>

      {/* Header */}
      <header className="fixed top-0 left-0 w-full flex justify-between items-center py-6 px-8 lg:px-16 z-50"
        style={{ background: 'rgba(241,245,245,0.85)', backdropFilter: 'blur(12px)' }}>
        <button
          onClick={onRestart}
          className="font-serif text-2xl font-bold tracking-tighter"
          style={{ color: 'var(--ellis-dark)' }}
        >
          ellis
        </button>
        <div className="flex items-center gap-6">
          <span
            className="font-mono text-xs uppercase tracking-widest"
            style={{
              color: 'var(--ellis-gray)',
              opacity: activeIndex > 0 ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
          >
            {activeIndex > 0 ? `0${activeIndex} / 0${data.steps.length}` : ''}
          </span>
          <button
            onClick={onRestart}
            className="font-mono text-[10px] tracking-widest uppercase px-4 py-2 rounded-full border transition-all"
            style={{ borderColor: 'var(--ellis-light)', color: 'var(--ellis-gray)' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--ellis-dark)'
              e.currentTarget.style.color = 'white'
              e.currentTarget.style.borderColor = 'var(--ellis-dark)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--ellis-gray)'
              e.currentTarget.style.borderColor = 'var(--ellis-light)'
            }}
          >
            Start over
          </button>
        </div>
      </header>

      {/* Street tile — fixed mid-height band */}
      <div
        ref={streetRef}
        className="fixed pointer-events-none z-10"
        style={{
          top: '52vh',
          left: 0,
          right: 0,
          height: '200px',
          backgroundImage: `url(${imgStreet})`,
          backgroundRepeat: 'repeat-x',
          backgroundSize: 'auto 200px',
          backgroundPositionX: '0px',
        }}
      />

      {/* Snap scroll container */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-x-auto overflow-y-hidden"
        style={{
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Intro section */}
        <div
          className="snap-section inline-flex items-center justify-center flex-col"
          style={{ width: '100vw', height: '100vh', scrollSnapAlign: 'center', verticalAlign: 'top' }}
        >
          <div className="text-center relative z-20 px-12" style={{ marginTop: '-80px' }}>
            <span className="font-mono text-xs uppercase tracking-[0.2em] block mb-4"
              style={{ color: 'var(--ellis-gray)' }}>
              U.S. Work Visa
            </span>
            <h1 className="font-serif leading-tight tracking-tight mb-6"
              style={{ fontSize: 'clamp(48px, 8vw, 88px)', color: 'var(--ellis-dark)' }}>
              {data.visaType} Candidate<br />Journey
            </h1>
            <p className="text-lg max-w-md mx-auto leading-relaxed mb-10"
              style={{ color: 'var(--ellis-gray)', fontFamily: 'DM Sans, sans-serif' }}>
              {data.tagline}
            </p>
            <div className="flex justify-center">
              <div className="animate-bounce w-6 h-10 border-2 rounded-full flex justify-center p-1"
                style={{ borderColor: 'var(--ellis-dark)' }}>
                <div className="w-1 h-2 rounded-full" style={{ background: 'var(--ellis-dark)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Milestone sections — placeholder divs for now */}
        {data.steps.map((step, i) => (
          <div
            key={step.id}
            className="snap-section inline-flex items-center justify-center"
            style={{ width: '100vw', height: '100vh', scrollSnapAlign: 'center', verticalAlign: 'top' }}
          >
            <div className="relative z-20 font-mono text-xs" style={{ color: 'var(--ellis-gray)', marginTop: '-80px' }}>
              Step {i + 1}: {step.label} — placeholder
            </div>
          </div>
        ))}
      </div>

      {/* Progress dots */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-50">
        {Array.from({ length: totalSections }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              background: activeIndex === i ? 'var(--ellis-dark)' : 'var(--ellis-light)',
              scale: activeIndex === i ? 1.5 : 1,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{ width: 10, height: 10, borderRadius: '50%' }}
          />
        ))}
      </div>
    </div>
  )
}
```

Note the `inline-flex` + `vertical-align: top` pattern — this makes horizontal snap work with `overflow-x: auto` without needing a flex container wrapper.

**Step 2: Verify in browser**

```bash
bun dev
```

Open `http://localhost:5173`. You should see:
- Ellis header with "Start over" button
- Intro section centered with H-1B headline and bouncing scroll indicator
- Street tile running across mid-height of screen
- Scrolling snaps between sections (intro + 7 placeholder steps)
- Progress dots at bottom update as you scroll
- Header counter shows "01 / 07" etc. after intro

**Step 3: Commit**

```bash
git add src/components/RoadScreen.tsx
git commit -m "feat: snap-scroll shell with street tile and progress dots"
```

---

### Task 4: Build MilestoneCard with entry parallax

**Files:**
- Modify: `src/components/RoadScreen.tsx`

Add a `MilestoneCard` subcomponent that uses `IntersectionObserver` to detect when it enters the viewport and triggers Framer Motion staggered entrance.

**Step 1: Add MilestoneCard component (above RoadScreen in the same file)**

```tsx
interface MilestoneCardProps {
  step: RoadData['steps'][number]
  index: number
  image: string
  isFinal: boolean
}

function MilestoneCard({ step, index, image, isFinal }: MilestoneCardProps) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const isHighlight = index === 1 // Lottery Registration — cyan circle

  const cardBg = isFinal
    ? 'var(--ellis-dark)'
    : 'rgba(255,255,255,0.62)'

  const cardBorder = isFinal
    ? 'none'
    : '1px solid rgba(255,255,255,0.9)'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={visible ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        style={{
          background: cardBg,
          backdropFilter: isFinal ? undefined : 'blur(16px)',
          WebkitBackdropFilter: isFinal ? undefined : 'blur(16px)',
          border: cardBorder,
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)',
          borderRadius: 32,
          padding: 40,
          width: 420,
          color: isFinal ? 'white' : 'var(--ellis-dark)',
        }}
      >
        {/* Number + icon row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={visible ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24, delay: 0.1 }}
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 700,
              fontSize: 16,
              flexShrink: 0,
              background: isFinal ? 'var(--ellis-cyan)' : isHighlight ? 'var(--ellis-cyan)' : 'transparent',
              border: isFinal || isHighlight ? 'none' : `2px solid ${isFinal ? 'white' : 'var(--ellis-dark)'}`,
              color: isFinal ? 'var(--ellis-dark)' : isHighlight ? 'var(--ellis-dark)' : 'inherit',
            }}
          >
            {isFinal ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              `0${index + 1}`
            )}
          </motion.div>

          <motion.img
            src={image}
            alt={step.label}
            initial={{ x: 40, opacity: 0 }}
            animate={visible ? { x: 0, opacity: 1 } : { x: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24, delay: 0.18 }}
            style={{ width: 72, height: 72, objectFit: 'contain' }}
          />
        </div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={visible ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.4, delay: 0.26 }}
        >
          <p className="font-mono text-[10px] uppercase tracking-widest mb-1"
            style={{ color: isFinal ? 'var(--ellis-cyan)' : 'var(--ellis-gray)' }}>
            {step.duration}
          </p>
          <h2 className="font-serif mb-3"
            style={{ fontSize: 32, lineHeight: 1.1, color: isFinal ? 'white' : 'var(--ellis-dark)' }}>
            {step.label}
          </h2>
          <p style={{
            fontSize: 14,
            lineHeight: 1.65,
            color: isFinal ? 'rgba(255,255,255,0.7)' : 'var(--ellis-gray)',
            fontFamily: 'DM Sans, sans-serif',
          }}>
            {step.blurb ?? step.description.split('.')[0] + '.'}
          </p>

          {isFinal && (
            <button
              className="font-mono text-[11px] uppercase tracking-widest mt-8 px-6 py-3 rounded-full transition-colors"
              style={{ background: 'var(--ellis-cyan)', color: 'var(--ellis-dark)', fontWeight: 700 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'white')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--ellis-cyan)')}
            >
              Talk to Ellis
            </button>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
```

**Step 2: Replace placeholder divs in RoadScreen with MilestoneCard**

In the milestone sections map, replace the placeholder content:

```tsx
{data.steps.map((step, i) => (
  <div
    key={step.id}
    className="snap-section inline-flex items-center justify-center"
    style={{ width: '100vw', height: '100vh', scrollSnapAlign: 'center', verticalAlign: 'top' }}
  >
    <div className="relative z-20" style={{ marginTop: '-80px' }}>
      <MilestoneCard
        step={step}
        index={i}
        image={stepImages[i]}
        isFinal={i === data.steps.length - 1}
      />
    </div>
  </div>
))}
```

**Step 3: Verify in browser**

```bash
bun dev
```

Scroll through sections. Each milestone card should:
- Start invisible (y: 30, opacity: 0)
- Animate in with stagger when section snaps into view: card body first, then number circle, then PNG icon slides from right, then text fades
- Final step (October 1st) uses dark card with cyan checkmark circle and "Talk to Ellis" CTA
- Lottery step (index 1) has cyan number circle

**Step 4: Commit**

```bash
git add src/components/RoadScreen.tsx
git commit -m "feat: MilestoneCard with staggered entry parallax"
```

---

### Task 5: Add hover popover

**Files:**
- Modify: `src/components/RoadScreen.tsx`

Wrap MilestoneCard in a hover-triggered popover. The entire card is the trigger. Popover appears above the card with dark background.

**Step 1: Add hover state and popover to MilestoneCard**

Add `useState` for hover at the top of `MilestoneCard`:

```tsx
const [hovered, setHovered] = useState(false)
```

Wrap the returned JSX in an outer `div` with mouse handlers, and add the popover with `AnimatePresence`:

```tsx
return (
  <div
    ref={ref}
    style={{ position: 'relative' }}
    onMouseEnter={() => setHovered(true)}
    onMouseLeave={() => setHovered(false)}
  >
    {/* Popover */}
    <AnimatePresence>
      {hovered && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 12px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 320,
            background: 'var(--ellis-dark)',
            borderRadius: 20,
            padding: 24,
            zIndex: 100,
            pointerEvents: 'none',
            boxShadow: '0 20px 60px -10px rgba(0,0,20,0.3)',
          }}
        >
          <p className="font-mono text-[10px] uppercase tracking-widest mb-2"
            style={{ color: 'var(--ellis-cyan)' }}>
            {step.label}
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.8)', marginBottom: 16, fontFamily: 'DM Sans, sans-serif' }}>
            {step.description}
          </p>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: "You'll need", value: step.requirement },
              { label: 'Pro tip', value: step.tip },
            ].map(({ label, value }) => (
              <div key={label}>
                <span className="font-mono text-[9px] uppercase tracking-widest block mb-0.5"
                  style={{ color: 'var(--ellis-muted)' }}>
                  {label}
                </span>
                <span className="font-mono text-[11px]" style={{ color: 'white' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Card — existing motion.div goes here unchanged */}
    ...
  </div>
)
```

**Step 2: Verify popover**

```bash
bun dev
```

Hover over any milestone card — dark popover should spring up above the card. Moving cursor off the card exits cleanly. Verify it doesn't clip off the top of the screen on the first milestone (it should be fine since cards sit at ~40vh).

**Step 3: Commit**

```bash
git add src/components/RoadScreen.tsx
git commit -m "feat: dark hover popover on milestone cards"
```

---

### Task 6: TypeScript check and final build

**Files:**
- Modify: `src/components/RoadScreen.tsx` (type fixes only if needed)

**Step 1: Run TypeScript check**

```bash
bun run build 2>&1
```

Common issues to fix:
- `msOverflowStyle` type: cast the scrollContainer style as `React.CSSProperties`
- `WebkitBackdropFilter`: add `as React.CSSProperties` to the style object

Fix pattern:
```tsx
style={{ msOverflowStyle: 'none' } as React.CSSProperties}
```

**Step 2: Verify visual in browser one final time**

Check:
- [ ] Intro section: headline, tagline, bouncing scroll indicator
- [ ] Street tile visible at mid-height, scrolls slower than content
- [ ] Each milestone card animates in on snap (staggered: card → circle → icon → text)
- [ ] Number circle: cyan on step 2 (Lottery), checkmark on step 7 (Oct 1st)
- [ ] Final card: dark background, cyan CTA button
- [ ] Hover popover on all cards: dark, springs up, exits cleanly
- [ ] Progress dots update as you scroll, active dot scales up
- [ ] Header counter shows "01 / 07" etc.
- [ ] "Start over" button works

**Step 3: Final commit**

```bash
git add src/components/RoadScreen.tsx src/index.css
git commit -m "feat: snap-scroll road screen with street tile, entry parallax, and hover popovers"
```

---

## Completed State

After all tasks, `RoadScreen.tsx` is a complete rewrite. `IsoIcon.tsx` is no longer used by RoadScreen (leave it in place — don't delete, it may be used elsewhere). The Ellis color palette is defined both as CSS vars and Tailwind `@theme` tokens.
