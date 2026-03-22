import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { H1BStep } from '@/data/steps'
import { streamChat, buildSystemPrompt } from '@/lib/chat'
import type { ChatMessage as ChatMsg } from '@/lib/chat'
import { ChatMessage } from './ChatMessage'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

interface Props {
  activeStep: H1BStep | null
}

export function ChatPanel({ activeStep }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const accumulatorRef = useRef('')
  const rafRef = useRef<number>(0)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  function handleTextareaInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 80) + 'px'
  }

  async function handleSend() {
    const text = inputValue.trim()
    if (!text || isStreaming) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    }

    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      streaming: true,
    }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setInputValue('')
    setIsStreaming(true)
    accumulatorRef.current = ''

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    const apiMessages: ChatMsg[] = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }))

    const systemPrompt = buildSystemPrompt(activeStep)

    await streamChat(
      apiMessages,
      systemPrompt,
      (chunk) => {
        accumulatorRef.current += chunk
        cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(() => {
          const text = accumulatorRef.current
          setMessages(prev =>
            prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: text } : m
            )
          )
        })
      },
      () => {
        setMessages(prev =>
          prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, streaming: false } : m
          )
        )
        setIsStreaming(false)
      },
      (error) => {
        console.error('Chat error:', error)
        setMessages(prev =>
          prev.map((m, i) =>
            i === prev.length - 1
              ? { ...m, content: 'Sorry, something went wrong. Please try again.', streaming: false }
              : m
          )
        )
        setIsStreaming(false)
      },
    )
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const placeholder = activeStep
    ? activeStep.exampleQuestion
    : 'Ask about the H-1B visa process...'

  // Only show after user reaches step 1
  if (!activeStep) return null

  return (
    <>
      {/* Collapsed pill */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={() => setIsOpen(true)}
            className="fixed z-[60]"
            style={{
              left: 24,
              bottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 9999,
              background: 'var(--ellis-dark)',
              color: '#F1F5F5',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
          >
            {/* Chat icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ellis-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Ask Ellis</span>
            {activeStep && (
              <span
                className="font-mono"
                style={{
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--ellis-muted)',
                  marginLeft: 4,
                }}
              >
                Step {activeStep.id}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed z-[60]"
            style={{
              left: 24,
              bottom: 24,
              width: 380,
              height: 480,
              borderRadius: 16,
              background: '#F1F5F5',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 16px 48px -8px rgba(0,0,0,0.18)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 20px 12px',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <span className="font-serif" style={{ fontStyle: 'italic', fontSize: 18, color: 'var(--ellis-dark)' }}>
                Ask Ellis
              </span>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ellis-gray)',
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            </div>

            {/* Step badge */}
            {activeStep && (
              <div style={{ padding: '8px 20px 0' }}>
                <span
                  className="font-mono"
                  style={{
                    fontSize: 9,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--ellis-dark)',
                    background: 'rgba(120, 240, 255, 0.15)',
                    padding: '4px 10px',
                    borderRadius: 9999,
                  }}
                >
                  Step {activeStep.id} · {activeStep.label}
                </span>
              </div>
            )}

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {messages.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: 'var(--ellis-gray)',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 13,
                  lineHeight: 1.6,
                }}>
                  <p style={{ marginBottom: 8 }}>
                    Hi! I'm Ellis's AI advisor.
                  </p>
                  <p style={{ color: 'var(--ellis-muted)', fontSize: 12 }}>
                    Ask me anything about the H-1B visa process.
                  </p>
                </div>
              )}
              {messages.map(msg => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  streaming={msg.streaming}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div
              style={{
                borderTop: '1.5px solid rgba(0,0,0,0.12)',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'flex-end',
                gap: 10,
                flexShrink: 0,
              }}
            >
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onInput={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={1}
                style={{
                  flex: 1,
                  resize: 'none',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: 'var(--ellis-dark)',
                  padding: '8px 0',
                  maxHeight: 80,
                }}
              />
              <button
                onClick={handleSend}
                disabled={isStreaming || !inputValue.trim()}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: 'none',
                  background: isStreaming || !inputValue.trim() ? 'rgba(0,0,0,0.05)' : 'var(--ellis-dark)',
                  color: isStreaming || !inputValue.trim() ? 'var(--ellis-muted)' : 'var(--ellis-cyan)',
                  cursor: isStreaming || !inputValue.trim() ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
