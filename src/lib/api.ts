import type { Answers, RoadData } from '@/types'

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
  return {
    visaType: 'H-1B',
    tagline: 'A well-trodden path for skilled professionals.',
    totalTime: '6-9 months',
    difficulty: 'Moderate',
    steps: [
      {
        id: 1, icon: 'briefcase', label: 'Job Offer', duration: 'Varies',
        description: 'Secure a job offer from a U.S. employer willing to sponsor your H-1B. This is the foundation — your employer becomes your petitioner and champion through the process.',
        requirement: 'Signed offer letter',
        tip: 'Confirm early that your employer has done H-1B sponsorships before.',
      },
      {
        id: 2, icon: 'document', label: 'LCA Filing', duration: '7 days',
        description: 'Your employer files a Labor Condition Application with the Department of Labor, certifying they will pay the prevailing wage. Ellis handles this in about a week.',
        requirement: 'Employer EIN and wage data',
        tip: 'LCA approval must come before the H-1B petition can be filed.',
      },
      {
        id: 3, icon: 'calendar', label: 'Lottery Registration', duration: 'March',
        description: 'If your role is cap-subject, your employer registers you in the USCIS lottery each March. Selection is random — Ellis tracks every deadline so nothing slips.',
        requirement: 'Registration by March 25',
        tip: 'Only one registration per employer per person is allowed.',
      },
      {
        id: 4, icon: 'stamp', label: 'Petition Filed', duration: '3-4 months',
        description: 'Once selected, Ellis prepares and files your full H-1B petition with USCIS. Premium processing can cut the wait to 15 business days.',
        requirement: 'Complete documentation package',
        tip: 'Premium processing is worth the cost for peace of mind.',
      },
      {
        id: 5, icon: 'shield', label: 'USCIS Approval', duration: '2 weeks',
        description: 'USCIS issues your I-797 approval notice. If you are outside the U.S., you will attend a consulate interview to receive your visa stamp.',
        requirement: 'Valid passport',
        tip: 'Check your I-94 record online after entry — errors do happen.',
      },
      {
        id: 6, icon: 'home', label: "You're Here", duration: 'Oct 1',
        description: 'H-1B status begins October 1st. You can now legally work for your sponsoring employer. The path ahead includes renewals and potentially a green card.',
        requirement: 'Maintain valid status',
        tip: 'Ellis sends renewal reminders well before your status expires.',
      },
    ],
  }
}
