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
