import type { Answers, RoadData } from '@/types'
import h1bSteps from '@/data/h1b-steps.json'

function buildPrompt(answers: Answers): string {
  return [
    'You are an expert U.S. immigration attorney assistant for Ellis, a modern immigration law firm.',
    '',
    'A user has provided this profile:',
    `- Nationality: ${answers.nationality}`,
    `- Employment situation: ${answers.employment}`,
    `- Goal: ${answers.goal}`,
    `- Field: ${answers.field}`,
    '',
    'Generate a personalized visa journey roadmap as JSON.',
    'Return ONLY valid JSON, no markdown fences, no explanation.',
    '',
    'Schema:',
    '{',
    '  "visaType": "string (e.g. H-1B, O-1, EB-2 NIW)",',
    '  "tagline": "string (one warm sentence, max 12 words)",',
    '  "totalTime": "string (e.g. 6-9 months)",',
    '  "difficulty": "Straightforward | Moderate | Complex",',
    '  "steps": [',
    '    {',
    '      "id": 1,',
    '      "icon": "one of: document | briefcase | calendar | stamp | plane | key | shield | people | star | home",',
    '      "label": "string (2-4 words)",',
    '      "duration": "string (e.g. 2-3 weeks)",',
    '      "description": "string (2-3 sentences, warm and human tone)",',
    '      "requirement": "string (1 key thing needed, max 8 words)",',
    '      "tip": "string (one practical tip, max 15 words)"',
    '    }',
    '  ]',
    '}',
    '',
    "Generate 5-7 steps specific to this person's visa type and situation.",
    'Be accurate but accessible. Tone: trusted friend who is also an immigration expert.',
  ].join('\n')
}

export async function generateRoadData(answers: Answers): Promise<RoadData> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY is not set in .env.local')

  const response = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: buildPrompt(answers) }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const text: string = data.content
    .map((c: { type: string; text?: string }) => (c.type === 'text' ? (c.text ?? '') : ''))
    .join('')

  const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
  return JSON.parse(clean) as RoadData
}

export function getFallbackData(): RoadData {
  return h1bSteps as RoadData
}
