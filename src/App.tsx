import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LandingScreen } from '@/components/LandingScreen'
import { QuestionnaireScreen } from '@/components/QuestionnaireScreen'
import { LoadingScreen } from '@/components/LoadingScreen'
import { RoadScreen } from '@/components/RoadScreen'
import { generateRoadData, getFallbackData } from '@/lib/api'
import type { Answers, RoadData } from '@/types'

type Screen = 'landing' | 'quest' | 'loading' | 'road'

export default function App() {
  const [screen, setScreen] = useState<Screen>('road')
  const [roadData, setRoadData] = useState<RoadData | null>(getFallbackData())


  async function handleAnswers(answers: Answers) {
    setScreen('loading')
    try {
      const data = await generateRoadData(answers)
      setRoadData(data)
    } catch (err) {
      console.error('API failed, using fallback:', err)
      setRoadData(getFallbackData())
    }
    setScreen('road')
  }

  function restart() {
    setRoadData(null)
    setScreen('landing')
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {screen === 'landing' && (
          <ScreenWrap key="landing">
            <LandingScreen onStart={() => setScreen('quest')} />
          </ScreenWrap>
        )}
        {screen === 'quest' && (
          <ScreenWrap key="quest">
            <QuestionnaireScreen onComplete={handleAnswers} />
          </ScreenWrap>
        )}
        {screen === 'loading' && (
          <ScreenWrap key="loading">
            <LoadingScreen />
          </ScreenWrap>
        )}
        {screen === 'road' && roadData && (
          <ScreenWrap key="road">
            <RoadScreen data={roadData} onRestart={restart} />
          </ScreenWrap>
        )}
      </AnimatePresence>
    </div>
  )
}

function ScreenWrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
    >
      {children}
    </motion.div>
  )
}
