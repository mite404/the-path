import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from 'framer-motion'
import { IsoIcon } from '@/components/IsoIcon'
import type { RoadData, RoadStep } from '@/types'

interface Props {
  data: RoadData
  onRestart: () => void
}

export function RoadScreen({ data, onRestart }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const [activeStep, setActiveStep] = useState<RoadStep | null>(null)
  const [showHint, setShowHint] = useState(true)
  const [pathLength, setPathLength] = useState(9999)
  const [roadY, setRoadY] = useState(360)

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

  function openStep(step: RoadStep, idx: number) {
    setActiveStep(step)
    setShowHint(false)
    // scroll node into view
    const track = trackRef.current
    if (!track) return
    const nodeEl = document.getElementById(`node-${idx}`)
    if (!nodeEl) return
    const nodeCenter = nodeEl.offsetLeft + nodeEl.offsetWidth / 2
    track.scrollTo({ left: nodeCenter - track.clientWidth / 2, behavior: 'smooth' })
  }

  const nodeSpacing = 220
  const canvasWidth = 160 + data.steps.length * nodeSpacing + 160

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
        style={{ cursor: 'grab' }}
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
          <div className="relative flex items-center z-10" style={{ gap: nodeSpacing - 80 }}>
            {data.steps.map((step, i) => {
              const above = i % 2 === 0
              const isActive = activeStep?.id === step.id
              return (
                <motion.div
                  key={step.id}
                  id={`node-${i}`}
                  initial={{ opacity: 0, y: above ? -20 : 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                  onClick={() => openStep(step, i)}
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
                  <div
                    className="text-center"
                    style={{
                      marginTop: above ? 0 : 12,
                      marginBottom: above ? 12 : 0,
                      order: above ? 3 : -1,
                    }}
                  >
                    <p className="font-serif text-[13px] font-medium leading-tight max-w-[100px]"
                      style={{ color: 'var(--navy)' }}>
                      {step.label}
                    </p>
                    <p className="font-mono text-[10px] mt-1" style={{ color: 'var(--amber)' }}>
                      {step.duration}
                    </p>
                  </div>
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

      {/* detail panel */}
      <AnimatePresence>
        {activeStep && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed bottom-0 left-0 right-0 z-50 grid gap-6"
            style={{
              background: 'var(--cream)',
              borderTop: '1px solid var(--bg2)',
              padding: '28px 48px 32px',
              gridTemplateColumns: '1fr auto',
              alignItems: 'start',
            }}
          >
            <div>
              <p className="font-mono text-[10px] tracking-[0.15em] uppercase mb-1.5"
                style={{ color: 'var(--amber)' }}>
                Step {data.steps.findIndex(s => s.id === activeStep.id) + 1} of {data.steps.length}
              </p>
              <h3 className="font-serif text-[22px] mb-2.5" style={{ color: 'var(--navy)' }}>
                {activeStep.label}
              </h3>
              <p className="text-[14px] leading-relaxed max-w-2xl" style={{ color: '#6B7280' }}>
                {activeStep.description}
              </p>
              <div className="flex gap-5 mt-3.5 flex-wrap">
                {[
                  { key: 'Timeline', val: activeStep.duration },
                  { key: "You'll need", val: activeStep.requirement },
                  { key: 'Pro tip', val: activeStep.tip },
                ].map(({ key, val }) => (
                  <div key={key} className="flex flex-col gap-0.5">
                    <span className="font-mono text-[9px] tracking-[0.12em] uppercase"
                      style={{ color: '#9CA3AF' }}>
                      {key}
                    </span>
                    <span className="font-mono text-[13px]" style={{ color: 'var(--navy)' }}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setActiveStep(null)}
              className="w-8 h-8 rounded-full border flex items-center justify-center text-[18px] transition-all"
              style={{ borderColor: 'var(--bg2)', color: '#6B7280' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
