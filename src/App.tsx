import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LandingScreen } from '@/components/LandingScreen'
import { QuestionnaireScreen } from '@/components/QuestionnaireScreen'
import { LoadingScreen } from '@/components/LoadingScreen'
import { RoadScreen } from '@/components/RoadScreen'
import { ChatPanel } from '@/components/ChatPanel'
import { generateRoadData } from '@/lib/api'
import { H1B_STEPS, H1B_ROAD_DATA } from '@/data/steps'
import type { Answers, RoadData } from '@/types'
import type { H1BStep } from '@/data/steps'

type Screen = 'landing' | 'quest' | 'loading' | 'road'

export default function App() {
  const [screen, setScreen] = useState<Screen>('road')
  const [roadData, setRoadData] = useState<RoadData>(H1B_ROAD_DATA)
  const [activeStep, setActiveStep] = useState<H1BStep | null>(null)

  const handleStepChange = useCallback((stepIndex: number) => {
    // stepIndex 0 = intro (no step), 1-7 = steps
    setActiveStep(stepIndex > 0 ? H1B_STEPS[stepIndex - 1] ?? null : null)
  }, [])

  async function handleAnswers(answers: Answers) {
    setScreen('loading')
    try {
      const data = await generateRoadData(answers)
      setRoadData(data)
    } catch (err) {
      console.error('API failed, using fallback:', err)
      setRoadData(H1B_ROAD_DATA)
    }
    setScreen('road')
  }

  function restart() {
    setRoadData(H1B_ROAD_DATA)
    setActiveStep(null)
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
            <RoadScreen data={roadData} onRestart={restart} onStepChange={handleStepChange} />
          </ScreenWrap>
        )}
      </AnimatePresence>

      {/* Chat panel persists across all screens */}
      <ChatPanel activeStep={activeStep} />
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
