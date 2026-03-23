interface Props {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

const SOURCE_LABELS: Record<string, string> = {
  'ellis.com/resources': 'Ellis H-1B Guide',
  'ellis.com': 'Ellis',
  'uscis.gov': 'USCIS',
  'flcdatacenter.com': 'DOL Wage Data',
  'cbp.dhs.gov': 'CBP I-94 Records',
  'ustraveldocs.com': 'Visa Interview Scheduling',
}

function extractSources(text: string): { url: string; label: string }[] {
  // Match URLs in the text (with or without https://)
  const urlPattern = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s),."]*)?)/g
  const found = new Map<string, { url: string; label: string }>()

  let match
  while ((match = urlPattern.exec(text)) !== null) {
    const raw = match[0]
    const full = raw.startsWith('http') ? raw : `https://${raw}`
    // Deduplicate by domain
    if (found.has(match[1])) continue

    // Find a friendly label
    let label = match[1]
    for (const [pattern, name] of Object.entries(SOURCE_LABELS)) {
      if (raw.includes(pattern)) {
        label = name
        break
      }
    }
    found.set(match[1], { url: full, label })
  }

  return Array.from(found.values())
}

export function ChatMessage({ role, content, streaming }: Props) {
  const isUser = role === 'user'
  const sources = !isUser && !streaming ? extractSources(content) : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
      <div
        style={{
          maxWidth: '85%',
          padding: '10px 14px',
          borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
          background: isUser ? 'var(--ellis-dark)' : 'rgba(0,0,0,0.05)',
          color: isUser ? '#F1F5F5' : 'var(--ellis-dark)',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 13,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {content}
        {streaming && (
          <span
            style={{
              display: 'inline-block',
              width: 2,
              height: 14,
              background: isUser ? '#F1F5F5' : 'var(--ellis-dark)',
              marginLeft: 2,
              verticalAlign: 'text-bottom',
              animation: 'blink 0.8s step-end infinite',
            }}
          />
        )}
      </div>

      {sources.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 6,
            marginTop: 6,
            maxWidth: '85%',
          }}
        >
          <span className="font-mono" style={{ fontSize: 10, color: 'var(--ellis-muted)' }}>
            Source:
          </span>
          {sources.map(({ url, label }) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono"
              style={{
                fontSize: 10,
                color: 'var(--ellis-gray)',
                background: 'rgba(120, 240, 255, 0.1)',
                padding: '3px 8px',
                borderRadius: 6,
                textDecoration: 'underline',
                textUnderlineOffset: 2,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(120, 240, 255, 0.25)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(120, 240, 255, 0.1)')}
            >
              ↗ {label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
