export type IconName =
  | 'document' | 'briefcase' | 'calendar' | 'stamp'
  | 'plane' | 'key' | 'shield' | 'people' | 'star' | 'home'

export interface RoadStep {
  id: number
  icon: IconName
  label: string
  duration: string
  blurb?: string        // short always-visible sentence; falls back to first sentence of description
  description: string  // full detail shown in hover popover
  requirement: string
  tip: string
}

export interface RoadData {
  visaType: string
  tagline: string
  totalTime: string
  difficulty: 'Straightforward' | 'Moderate' | 'Complex'
  steps: RoadStep[]
}

export interface Answers {
  nationality: string
  employment: string
  goal: string
  field: string
}
