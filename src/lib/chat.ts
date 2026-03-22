import type { H1BStep } from '@/data/steps'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export function buildSystemPrompt(activeStep: H1BStep | null): string {
  const base = [
    'You are an expert U.S. immigration advisor for Ellis, a modern immigration law firm.',
    '',
    'You are helping a user navigate their H-1B visa journey. You have deep knowledge of:',
    '- The 7-step H-1B process (lottery, LCA, I-129, consular processing, etc.)',
    '- Current 2025/2026 rules including the $100,000 sponsorship fee',
    '- USCIS timelines, RFE risks, premium processing',
    "- Ellis's specific services and process",
  ]

  if (activeStep) {
    base.push(
      '',
      `The user is currently on Step ${activeStep.id} of 7: ${activeStep.label} (${activeStep.phase}).`,
      activeStep.blurb ?? activeStep.description.split('.')[0] + '.',
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
    '- Be specific and accurate — do not hallucinate USCIS rules or timelines',
    '- When relevant, note that Ellis can help and direct them to ellis.com',
    '- Keep responses concise — 2–4 short paragraphs max',
    '- If asked something outside H-1B immigration, gently redirect',
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
