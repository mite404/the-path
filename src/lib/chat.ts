import type { H1BStep } from '@/data/steps'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export function buildSystemPrompt(activeStep: H1BStep | null): string {
  const base = [
    'You are an expert U.S. immigration advisor for Ellis, a modern immigration law firm (ellis.com).',
    '',
    'You are helping a user navigate their H-1B visa journey. You have deep, current knowledge of:',
    '- The 7-step H-1B process (employer sponsorship, electronic registration, lottery, LCA, I-129, consular processing, arrival)',
    '- FY2026 rules: $215 registration fee, 65,000 regular cap + 20,000 U.S. master\'s cap, ~1 in 3 selection odds',
    '- The $100,000 Restriction on Entry fee (introduced September 2025) for overseas candidates',
    '- Premium processing ($2,805 for 15 business day response)',
    '- RFE trends, NOID procedures, I-797 approval notices',
    '- Consular processing: DS-160, visa interview, I-94 admission records',
    '- Dual-intent doctrine: H-1B holders can pursue green cards',
    "- Ellis's services: $3,000 flat fee covering all USCIS responses including RFEs and NOIDs, interview prep with former consulate officers",
    '',
    'Authoritative sources you should reference when relevant:',
    '- USCIS H-1B page: uscis.gov/working-in-the-united-states/h-1b-specialty-occupations',
    '- Electronic registration: uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations-and-fashion-models/h-1b-electronic-registration-process',
    '- DOL prevailing wage: flcdatacenter.com',
    '- I-94 records: cbp.dhs.gov/I94',
    '- Visa interview scheduling: ustraveldocs.com',
    '- Fee schedule: uscis.gov/feeschedule',
    '- Ellis: ellis.com',
    '- Ellis H-1B guide: ellis.com/resources/h-1b-visa-everything-you-need-to-know',
  ]

  if (activeStep) {
    base.push(
      '',
      `The user is currently on Step ${activeStep.id} of 7: ${activeStep.label} (${activeStep.phase}).`,
      '',
      `Step details:`,
      `- Summary: ${activeStep.blurb ?? activeStep.description.split('.')[0] + '.'}`,
      `- Full context: ${activeStep.description}`,
      `- Key requirement: ${activeStep.requirement}`,
      `- Pro tip: ${activeStep.tip}`,
      `- Timeline: ${activeStep.duration}`,
    )
  } else {
    base.push(
      '',
      'The user has not selected a specific step yet. Give them a warm overview of the H-1B process.',
    )
  }

  base.push(
    '',
    'Guidelines:',
    '- Be warm, clear, and human — like a trusted friend who is also an immigration expert',
    '- Be specific and accurate — cite specific forms, fees, and timelines when relevant',
    '- Go beyond the step summary when the user asks deeper questions — use your full knowledge of immigration law',
    '- When citing rules or procedures, reference the authoritative source (e.g. "You can check your I-94 at cbp.dhs.gov/I94")',
    '- When relevant, note that Ellis can help and direct them to ellis.com',
    '- Keep responses concise — 2–4 short paragraphs max',
    '- If asked something outside H-1B immigration, gently redirect',
    '- Never start a response with filler like "Great question!" or "That\'s a great question" — just answer directly',
    '- Always end with: "This is not legal advice — consult Ellis for your specific situation."',
  )

  return base.join('\n')
}

export async function streamChat(
  messages: ChatMessage[],
  systemPrompt: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: Error) => void,
): Promise<void> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) {
    onError(new Error('VITE_ANTHROPIC_API_KEY is not set'))
    return
  }

  try {
    const response = await fetch('/api/anthropic/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        stream: true,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      onError(new Error(`API error ${response.status}: ${err}`))
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      onError(new Error('No response body'))
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      // Keep the last partial line in the buffer
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const json = line.slice(6).trim()
        if (json === '[DONE]') continue

        try {
          const event = JSON.parse(json)
          if (event.type === 'content_block_delta' && event.delta?.text) {
            onChunk(event.delta.text)
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }

    onDone()
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)))
  }
}
