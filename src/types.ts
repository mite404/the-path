export type IconName =
  | 'document' | 'briefcase' | 'calendar' | 'stamp'
  | 'plane' | 'key' | 'shield' | 'people' | 'star' | 'home'

export interface RoadStep {
  id: number
  icon: IconName
  label: string
  duration: string
  description: string
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
