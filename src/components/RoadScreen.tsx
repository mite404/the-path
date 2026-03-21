import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from 'framer-motion'
import { IsoIcon } from '@/components/IsoIcon'
import type { RoadData, RoadStep } from '@/types'

interface Props {
  data: RoadData
  onRestart: () => void
}

interface RoadNodeProps {
  step: RoadStep
  index: number
  total: number
  scrollXProgress: any
  above: boolean
  isActive: boolean
  onOpenStep: () => void
}

function RoadNode({ step, index, total, scrollXProgress, above, isActive, onOpenStep }: RoadNodeProps) {
  const [hovered, setHovered] = useState(false)
  const threshold = index === 0 ? 0 : (index / total) * 0.85
  const start = Math.max(0, threshold - 0.08)
  const end = threshold + 0.06

  const iconX = useTransform(scrollXProgress, [start, end], [40, 0])
  const labelX = useTransform(scrollXProgress, [start, end], [20, 0])

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative"
    >
      <motion.div
        initial={{ opacity: 0, y: above ? -20 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        onClick={onOpenStep}
        className="flex flex-col items-center cursor-pointer select-none"
        style={{
          flexDirection: above ? 'column' : 'column-reverse',
          width: 80,
        }}
      >
      {/* icon */}
      <motion.div
        animate={{ y: isActive ? -6 : 0, scale: isActive ? 1.08 : 1 }}
        whileHover={{ y: -4, scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{
          marginBottom: above ? 12 : 0,
          marginTop: above ? 0 : 12,
          filter: 'drop-shadow(0 4px 10px rgba(26,35,64,0.15))',
          x: iconX,
        }}
      >
        <IsoIcon name={step.icon} />
      </motion.div>

      {/* dot on road */}
      <motion.div
        animate={{
          background: isActive ? 'var(--amber)' : 'var(--navy)',
          scale: isActive ? 1.4 : 1,
        }}
        className="w-3.5 h-3.5 rounded-full border-[3px] z-10"
        style={{ borderColor: 'var(--bg)' }}
      />

      {/* label */}
      <motion.div
        style={{
          marginTop: above ? 0 : 12,
          marginBottom: above ? 12 : 0,
          order: above ? 3 : -1,
          x: labelX,
          textAlign: 'center',
        }}
      >
        <p className="font-serif text-[13px] font-medium leading-tight max-w-[100px]"
          style={{ color: 'var(--navy)' }}>
          {step.label}
        </p>
        <p className="font-mono text-[10px] mt-1" style={{ color: 'var(--amber)' }}>
          {step.duration}
        </p>
        <p className="font-sans text-[10px] mt-2 leading-snug max-w-[110px]"
          style={{ color: '#6B7280' }}>
          {step.blurb ?? (step.description.split('.')[0] + '.')}
        </p>
      </motion.div>
      </motion.div>

      {/* hover popover */}
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
  )
}

export function RoadScreen({ data, onRestart }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const [showHint, setShowHint] = useState(true)
  const [pathLength, setPathLength] = useState(9999)
  const [roadY, setRoadY] = useState(360)
  const [visibleCount, setVisibleCount] = useState(1)

  const { scrollXProgress } = useScroll({ container: trackRef })

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength())
    }
  }, [data.steps.length])

  useEffect(() => {
    if (trackRef.current) {
      setRoadY(trackRef.current.clientHeight / 2)
    }
  }, [])

  useMotionValueEvent(scrollXProgress, 'change', (v) => {
    if (v > 0.01) setShowHint(false)

    const total = data.steps.length
    let count = 1
    for (let i = 1; i < total; i++) {
      const threshold = (i / total) * 0.85
      if (v >= threshold) count = i + 1
    }
    setVisibleCount(prev => Math.max(prev, count))
  })

  const nodeSpacing = 280
  const trailingSpace = typeof window !== 'undefined' ? window.innerWidth * 0.4 : 400
  const canvasWidth = 160 + data.steps.length * nodeSpacing + 160 + trailingSpace

  return (
    <div className="h-screen w-screen overflow-hidden relative" style={{ background: 'var(--bg)' }}>

      {/* header */}
      <div
        className="absolute top-0 left-0 right-0 px-12 py-6 flex items-center justify-between z-20 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, var(--bg) 60%, transparent)' }}
      >
        <button
          className="font-serif text-lg italic pointer-events-auto"
          style={{ color: 'var(--navy)' }}
          onClick={onRestart}
        >
          the path
        </button>

        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="text-right">
            <p className="font-serif text-[15px] font-medium" style={{ color: 'var(--navy)' }}>
              {data.visaType}
            </p>
            <p className="font-mono text-[10px] tracking-[0.08em]" style={{ color: '#9CA3AF' }}>
              {data.totalTime} · {data.difficulty}
            </p>
          </div>
          <button
            onClick={onRestart}
            className="font-mono text-[10px] tracking-[0.1em] border rounded-full px-3.5 py-1.5 transition-all"
            style={{ color: '#6B7280', borderColor: 'var(--bg2)' }}
            onMouseEnter={e => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.borderColor = 'var(--navy)'
              b.style.color = 'var(--navy)'
            }}
            onMouseLeave={e => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.borderColor = 'var(--bg2)'
              b.style.color = '#6B7280'
            }}
          >
            Start over
          </button>
        </div>
      </div>

      {/* road track */}
      <div
        ref={trackRef}
        className="absolute inset-0 overflow-x-auto overflow-y-hidden road-track pt-20"
        style={{ cursor: 'grab', touchAction: 'pan-x' }}
      >
        <div
          className="relative h-full flex items-center"
          style={{ width: canvasWidth, paddingLeft: 120, paddingRight: 120 }}
        >
          {/* road line */}
          <svg
            className="absolute pointer-events-none"
            style={{ left: 0, top: 0, width: canvasWidth, height: '100%' }}
          >
            <motion.path
              ref={pathRef}
              d={`M 60 ${roadY} L ${canvasWidth - 60} ${roadY}`}
              stroke="var(--navy)"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={pathLength || undefined}
              strokeDashoffset={pathLength ? useTransform(scrollXProgress, [0, 1], [pathLength, 0]) : 0}
            />
          </svg>

          {/* nodes */}
          <div className="relative flex items-center z-10" style={{ gap: 200 }}>
            {data.steps.map((step, i) => {
              const isVisible = i < visibleCount
              if (!isVisible) return null
              const above = i % 2 === 0
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
                    above={above}
                    isActive={false}
                    onOpenStep={() => {}}
                  />
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* scroll hint */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-7 right-12 flex items-center gap-2 pointer-events-none z-30"
          >
            <span className="font-mono text-[10px] tracking-[0.08em]" style={{ color: '#9CA3AF' }}>
              scroll to explore
            </span>
            <svg width="28" height="12" viewBox="0 0 28 12" fill="none">
              <line x1="0" y1="6" x2="22" y2="6" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M17 2L23 6L17 10" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
