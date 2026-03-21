import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { RoadData } from '@/types'

import imgStreet from '@/assets/Street-Tile.png'

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

        {/* Milestone sections — placeholder divs for now */}
        {data.steps.map((step, i) => (
          <div
            key={step.id}
            className="snap-section inline-flex items-center justify-center"
            style={{ width: '100vw', height: '100vh', scrollSnapAlign: 'center', verticalAlign: 'top' } as React.CSSProperties}
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
