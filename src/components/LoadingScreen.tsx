import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const messages = [
  'Reviewing your situation',
  'Identifying visa pathways',
  'Mapping your timeline',
  'Personalizing your journey',
]

export function LoadingScreen() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % messages.length), 1800)
    return () => clearInterval(t)
  }, [])

  return (
    <div
      className="h-screen w-screen flex flex-col items-center justify-center gap-5"
      style={{ background: 'var(--bg)' }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="w-12 h-12 rounded-full border-2"
        style={{ borderColor: 'var(--bg2)', borderTopColor: 'var(--amber)' }}
      />

      <p className="font-serif text-2xl italic" style={{ color: 'var(--navy)' }}>
        Charting your path…
      </p>

      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35 }}
          className="font-mono text-[11px] tracking-[0.1em] uppercase"
          style={{ color: '#9CA3AF' }}
        >
          {messages[idx]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
