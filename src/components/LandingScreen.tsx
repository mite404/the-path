import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

export function LandingScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-between"
      style={{ background: 'var(--bg)' }}>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-10">

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-mono text-[10px] tracking-[0.15em] uppercase border rounded-full px-4 py-1.5 mb-8"
          style={{ color: 'var(--amber)', borderColor: 'var(--amber)' }}
        >
          Ellis — Visa Journey
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-serif text-[clamp(42px,7vw,80px)] font-normal leading-[1.05] tracking-[-0.02em] max-w-[700px]"
          style={{ color: 'var(--navy)' }}
        >
          Your path to{' '}
          <em style={{ color: 'var(--amber)' }}>working in America</em>{' '}
          made clear.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-5 text-base font-light max-w-[440px] leading-relaxed"
          style={{ color: '#6B7280' }}
        >
          Answer a few questions. We'll map every step of your visa journey —
          timelines, milestones, and what to expect along the way.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mt-11"
        >
          <Button
            onClick={onStart}
            className="rounded-full px-11 py-4 h-auto text-[15px] font-medium tracking-[0.01em]"
            style={{ background: 'var(--navy)', color: 'var(--cream)' }}
          >
            Begin your journey →
          </Button>
        </motion.div>
      </div>

      <p className="pb-7 font-mono text-[10px] tracking-[0.08em] uppercase"
        style={{ color: '#9CA3AF' }}>
        Not legal advice · For informational purposes · Consult Ellis for expert guidance
      </p>
    </div>
  )
}
