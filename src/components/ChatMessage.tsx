interface Props {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

export function ChatMessage({ role, content, streaming }: Props) {
  const isUser = role === 'user'

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
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
    </div>
  )
}
