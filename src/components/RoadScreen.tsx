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
import imgCar from '@/assets/VW-BUG-ISO_exported.png'

const stepImages = [imgWork, imgQRCode, imgPackage, imgDocument, imgBarcode, imgGlobe, imgPlane]

const TILE_WIDTH = 376
const TILE_HEIGHT = 251
// Isometric offset per tile step: right and up along the ~45° iso axis
// 2:1 isometric ratio: dx = half tile width, dy = quarter tile width
const TILE_DX = TILE_WIDTH / 2   // 188px right
const TILE_DY = TILE_WIDTH / 4   // 94px up
const CAR_WIDTH = 200

interface MilestoneCardProps {
  step: RoadData['steps'][number]
  index: number
  image: string
  isFinal: boolean
}

function MilestoneCard({ step, index, image, isFinal }: MilestoneCardProps) {
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
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
    <div
      ref={ref}
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}
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
              position: 'fixed',
              top: mousePos.y + 16,
              left: Math.min(mousePos.x - 160, window.innerWidth - 336),
              width: 320,
              whiteSpace: 'normal',
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

      {/* Card */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={visible ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
        transition={{ type: 'tween', duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: cardBg,
          backdropFilter: isFinal ? undefined : 'blur(16px)',
          WebkitBackdropFilter: isFinal ? undefined : 'blur(16px)',
          border: cardBorder,
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)',
          borderRadius: 32,
          padding: 40,
          width: 420,
          whiteSpace: 'normal',
          color: isFinal ? 'white' : 'var(--ellis-dark)',
        } as React.CSSProperties}
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

interface TreadmillProps {
  activeIndex: number
  fractionalRef: React.RefObject<number>
}

function RoadTreadmill({ activeIndex }: TreadmillProps) {
  const tileIndex = activeIndex - 1

  // Position a tile at an offset along the isometric diagonal
  // offsetIndex: -1 = behind (lower-left), 0 = current (center), +1 = ahead (upper-right)
  // z-index: inverted for isometric — lower tiles (closer to viewer) must overlap upper tiles
  const tileAt = (offsetIndex: number): React.CSSProperties => ({
    position: 'fixed',
    left: `calc(50vw - ${TILE_WIDTH / 2}px + ${offsetIndex * TILE_DX}px)`,
    top: `calc(78vh - ${TILE_HEIGHT / 2}px - ${offsetIndex * TILE_DY}px)`,
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    zIndex: offsetIndex === -1 ? 3 : offsetIndex === 0 ? 2 : 1,
  })

  return (
    <div className="pointer-events-none fixed inset-0" style={{ zIndex: 10 }}>
      {/* Behind tile (lower-left) — visible while present, falls away on exit */}
      <AnimatePresence>
        {tileIndex > 0 && (
          <motion.img
            key={`behind-${tileIndex - 1}`}
            src={imgStreet}
            initial={false}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{
              y: 400,
              rotate: -12,
              opacity: 0,
            }}
            transition={{ duration: 0.6, ease: [0.55, 0, 1, 0.45] }}
            style={tileAt(-1)}
          />
        )}
      </AnimatePresence>

      {/* Current tile — center, under the car */}
      {tileIndex >= 0 && (
        <img
          key={`current-${tileIndex}`}
          src={imgStreet}
          style={tileAt(0)}
        />
      )}

      {/* Ahead tile (upper-right) — dropping from sky, only after intro */}
      <AnimatePresence>
        {tileIndex >= 0 && (
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
            style={tileAt(1)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

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
            // Car sits on the road surface of the center tile (below the card)
            top: `calc(78vh - ${CAR_WIDTH * 0.36}px)`,
            left: `calc(50vw - ${CAR_WIDTH / 2}px)`,
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
              style={{ width: CAR_WIDTH }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const CONFETTI_COLORS = ['#78f0ff', '#ff6b8a', '#ffd93d', '#6bff8a', '#b478ff', '#ff9f43']

function Confetti({ active }: { active: boolean }) {
  const [particles] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 600,
      y: -(Math.random() * 500 + 200),
      rotate: Math.random() * 720 - 360,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: Math.random() * 8 + 4,
      delay: Math.random() * 0.3,
      isCircle: Math.random() > 0.5,
    }))
  )

  return (
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 pointer-events-none z-[70]">
          {particles.map(p => (
            <motion.div
              key={p.id}
              initial={{
                x: '50vw',
                y: '40vh',
                opacity: 1,
                scale: 0,
                rotate: 0,
              }}
              animate={{
                x: `calc(50vw + ${p.x}px)`,
                y: `calc(40vh + ${p.y}px)`,
                opacity: [1, 1, 0],
                scale: [0, 1, 0.8],
                rotate: p.rotate,
              }}
              transition={{
                duration: 1.4,
                delay: p.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.isCircle ? p.size : p.size * 2.5,
                borderRadius: p.isCircle ? '50%' : 2,
                background: p.color,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

interface Props {
  data: RoadData
  onRestart: () => void
  onStepChange?: (stepIndex: number) => void
}

export function RoadScreen({ data, onRestart, onStepChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const fractionalRef = useRef(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const confettiFiredRef = useRef(false)

  useEffect(() => {
    onStepChange?.(activeIndex)
    // Fire confetti once when reaching step 1 (Job Offer)
    if (activeIndex === 1 && !confettiFiredRef.current) {
      confettiFiredRef.current = true
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 2000)
    }
  }, [activeIndex, onStepChange])

  // Scroll handler: fractional progress + active index
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

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

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Total sections = intro + steps
  const totalSections = data.steps.length + 1

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: 'var(--ellis-bg)' }}>

      {/* Confetti burst on Job Offer */}
      <Confetti active={showConfetti} />

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

      {/* Road treadmill */}
      <RoadTreadmill activeIndex={activeIndex} fractionalRef={fractionalRef} />

      {/* Driving car */}
      <DrivingCar visible={activeIndex > 0} activeIndex={activeIndex} fractionalRef={fractionalRef} />

      {/* Snap scroll container */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-x-auto overflow-y-hidden"
        style={{
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          whiteSpace: 'nowrap',
        } as React.CSSProperties}
      >
        {/* Intro section */}
        <div
          className="snap-section inline-flex items-center justify-center flex-col"
          style={{ width: '100vw', height: '100vh', scrollSnapAlign: 'center', verticalAlign: 'top' } as React.CSSProperties}
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

        {/* Milestone sections */}
        {data.steps.map((step, i) => (
          <div
            key={step.id}
            className="snap-section inline-flex items-center justify-center"
            style={{ width: '100vw', height: '100vh', scrollSnapAlign: 'center', verticalAlign: 'top' } as React.CSSProperties}
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
