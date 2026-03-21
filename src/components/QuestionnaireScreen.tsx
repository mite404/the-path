import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import type { Answers } from '@/types'

interface Props {
  onComplete: (answers: Answers) => void
}

const stages = [
  { key: 'nationality', step: '01', total: '04', question: 'Where are you from?', type: 'text' as const },
  {
    key: 'employment', step: '02', total: '04',
    question: 'What\'s your employment situation?',
    type: 'options' as const,
    options: [
      'I have a U.S. job offer',
      'Interviewing with U.S. companies',
      'Self-employed / entrepreneur',
      'Academic / researcher',
      'Transferring within my company',
    ],
  },
  {
    key: 'goal', step: '03', total: '04',
    question: 'What\'s your goal?',
    type: 'options' as const,
    options: [
      'Work here for a few years',
      'Permanent residence (green card)',
      'Bring my family',
      'Build a startup',
    ],
  },
  {
    key: 'field', step: '04', total: '04',
    question: 'What field do you work in?',
    type: 'options' as const,
    options: [
      'Technology / Software',
      'Healthcare / Medicine',
      'Finance / Business',
      'Design / Creative',
      'Academia / Research',
      'Other',
    ],
  },
]

export function QuestionnaireScreen({ onComplete }: Props) {
  const [stageIdx, setStageIdx] = useState(0)
  const [answers, setAnswers] = useState<Partial<Answers>>({})
  const [textVal, setTextVal] = useState('')
  const [textErr, setTextErr] = useState(false)
  const [direction, setDirection] = useState(1)

  const stage = stages[stageIdx]

  function advance(key: string, value: string) {
    const next = { ...answers, [key]: value }
    setAnswers(next)
    if (stageIdx < stages.length - 1) {
      setDirection(1)
      setTimeout(() => setStageIdx(i => i + 1), 80)
    } else {
      onComplete(next as Answers)
    }
  }

  function submitText() {
    if (!textVal.trim()) { setTextErr(true); return }
    setTextErr(false)
    advance('nationality', textVal.trim())
    setTextVal('')
  }

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
  }

  return (
    <div className="h-screen w-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* header */}
      <div className="flex items-center justify-between px-12 py-6">
        <span className="font-serif text-lg italic" style={{ color: 'var(--navy)' }}>the path</span>
        <div className="flex items-center gap-2">
          {stages.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                background: i < stageIdx
                  ? 'var(--amber)'
                  : i === stageIdx
                    ? 'var(--navy)'
                    : 'var(--bg2)',
                scale: i === stageIdx ? 1.4 : 1,
              }}
              transition={{ duration: 0.3 }}
              className="w-1.5 h-1.5 rounded-full"
            />
          ))}
        </div>
      </div>

      {/* stage */}
      <div className="flex-1 flex items-center justify-center px-12 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={stageIdx}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="flex flex-col items-center text-center w-full max-w-2xl"
          >
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase mb-4"
              style={{ color: 'var(--amber)' }}>
              Step {stage.step} of {stage.total}
            </p>

            <h2
              className="font-serif font-normal leading-[1.2] mb-11"
              style={{
                fontSize: 'clamp(26px, 4vw, 42px)',
                color: 'var(--navy)',
              }}
            >
              {stage.question}
            </h2>

            {stage.type === 'text' ? (
              <div className="flex flex-col items-center gap-3 w-full max-w-sm">
                <div
                  className="flex items-center rounded-full overflow-hidden w-full border transition-colors"
                  style={{
                    background: 'var(--cream)',
                    borderColor: textErr ? '#EF4444' : 'var(--bg2)',
                  }}
                >
                  <Input
                    value={textVal}
                    onChange={e => { setTextVal(e.target.value); setTextErr(false) }}
                    onKeyDown={e => e.key === 'Enter' && submitText()}
                    placeholder="e.g. India, Canada, Brazil…"
                    className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 px-6 h-12 text-[15px]"
                    style={{ color: 'var(--navy)' }}
                  />
                  <button
                    onClick={submitText}
                    className="h-12 px-6 text-sm font-medium transition-colors whitespace-nowrap"
                    style={{ background: 'var(--navy)', color: 'var(--cream)' }}
                  >
                    Continue
                  </button>
                </div>
                {textErr && (
                  <p className="text-xs text-red-500">Please enter your country.</p>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 justify-center max-w-xl">
                {stage.options?.map(opt => (
                  <motion.button
                    key={opt}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => advance(stage.key, opt)}
                    className="px-7 py-3.5 rounded-full text-sm font-normal border transition-all"
                    style={{
                      background: 'var(--cream)',
                      borderColor: 'var(--bg2)',
                      color: 'var(--navy)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--navy)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--bg2)'
                    }}
                  >
                    {opt}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
