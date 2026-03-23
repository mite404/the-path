# Chat Feature Implementation Plan
*Contextual AI advisor panel for "The Path" — H-1B Visa Journey Visualizer*

---

## What We're Building

A persistent floating chat panel in the bottom-left of the screen. It:
- Is always visible and collapsible, regardless of which screen the user is on
- Knows which of the 7 H-1B steps the user currently has active
- Streams responses token by token via the Anthropic API
- Maintains a single global conversation history across all steps
- Pre-fills an example question contextual to the active step
- Is grounded in Ellis's H-1B documentation via a detailed system prompt

---

## New Files to Create

### `src/lib/chat.ts`
The streaming API call. Responsibilities:
- `streamChat(messages, onChunk, onDone, onError)` — fetches `/api/anthropic/v1/messages` with `stream: true`
- Reads the SSE response body as a `ReadableStream`
- Parses `data:` lines, extracts `content_block_delta` events
- Calls `onChunk(text)` for each token, `onDone()` when stream ends
- Exports `buildSystemPrompt(activeStep)` — injects current step context into the static H-1B knowledge base

### `src/data/steps.ts`
Extracted, hardcoded H-1B step data. Responsibilities:
- Defines `H1BStep` type (extends `RoadStep` with `exampleQuestion` and `phase`)
- Exports `H1B_STEPS: H1BStep[]` — the canonical 7-step array used by both `RoadScreen` and `ChatPanel`
- Removes the need for Claude API to generate steps (faster, more accurate, more reliable for demo)

### `src/components/ChatPanel.tsx`
The floating UI component. Responsibilities:
- Renders in bottom-left corner, fixed position, z-index above road/detail panel
- Collapsed state: small pill button showing "Ask Ellis" + active step label
- Expanded state: ~380px wide × ~480px tall panel with message history + input
- On step change: injects a soft system note into context (no visual bubble), pre-fills example question into input placeholder
- On send: appends user message, calls `streamChat`, streams assistant response into a growing message bubble
- Scroll to bottom on each new token

### `src/components/ChatMessage.tsx`
Single message bubble component. Responsibilities:
- Renders user vs. assistant messages with distinct styles
- Assistant messages support partial/streaming text via a `streaming` boolean prop
- Shows a blinking cursor while streaming

---

## Files to Modify

### `src/App.tsx`
- Import `ChatPanel` and render it outside the `AnimatePresence` block so it persists across screen transitions
- Pass `activeStep: H1BStep | null` down to `ChatPanel`
- `activeStep` is set when the user clicks a node in `RoadScreen` — lift this state up from `RoadScreen` into `App`

### `src/components/RoadScreen.tsx`
- Remove local `activeStep` state
- Accept `activeStep` and `onStepSelect` as props (state now lives in `App`)
- Otherwise unchanged

### `src/lib/api.ts`
- Remove `getFallbackData()` — replace with import from `src/data/steps.ts`
- The Claude API call for roadmap generation can remain for future multi-visa support, but for the H-1B PoC it's no longer needed

### `src/types.ts`
- Add `exampleQuestion: string` and `phase: string` to `RoadStep` interface
- Or keep `H1BStep` as a separate extended type in `steps.ts` — cleaner for now

---

## System Prompt Design

The system prompt passed to the API on every request. Structure:

```
You are an expert U.S. immigration advisor for Ellis, a modern immigration law firm.

You are helping a user navigate their H-1B visa journey. You have deep knowledge of:
- The 7-step H-1B process (lottery, LCA, I-129, consular processing, etc.)
- Current 2025/2026 rules including the $100,000 sponsorship fee
- USCIS timelines, RFE risks, premium processing
- Ellis's specific services and process

The user is currently on Step [N] of 7: [Step Label] ([Phase Name]).
[One sentence description of what this step involves.]

Guidelines:
- Be warm, clear, and human — like a trusted friend who is also an immigration expert
- Be specific and accurate — do not hallucinate USCIS rules or timelines
- When relevant, note that Ellis can help and direct them to ellis.com
- Keep responses concise — 2–4 short paragraphs max
- If asked something outside H-1B immigration, gently redirect
- Always add: "This is not legal advice — consult Ellis for your specific situation."
```

The `[N]`, `[Step Label]`, `[Phase Name]`, and description are injected dynamically based on `activeStep`. If no step is active, use a generic intro context.

---

## State Flow

```
App.tsx
├── activeStep: H1BStep | null        ← lifted from RoadScreen
├── RoadScreen (props: activeStep, onStepSelect)
│     └── node click → onStepSelect(step)
└── ChatPanel (props: activeStep)
      ├── messages: Message[]          ← global, never reset
      ├── inputValue: string
      ├── isStreaming: boolean
      └── isOpen: boolean
```

When `activeStep` changes in `ChatPanel`:
- Update the placeholder to the new step's `exampleQuestion`
- Do NOT reset `messages` — history is global
- The next API call will include the updated system prompt with new step context

---

## Message Data Shape

```ts
interface Message {
  id: string           // crypto.randomUUID()
  role: 'user' | 'assistant'
  content: string      // full text (or partial during streaming)
  streaming?: boolean  // true while tokens are arriving
  stepId?: number      // which step was active when sent (for future UI use)
}
```

Messages array is passed to the API as the standard Anthropic `messages` format:
```ts
messages.map(m => ({ role: m.role, content: m.content }))
```

---

## Streaming Implementation

Use the Anthropic streaming API with `"stream": true`. Parse the SSE stream:

```
event: content_block_delta
data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}
```

Pattern:
1. `fetch('/api/anthropic/v1/messages', { body: JSON.stringify({ stream: true, ... }) })`
2. Get `response.body` as a `ReadableStream<Uint8Array>`
3. Pipe through `TextDecoderStream`
4. Split on `\n`, filter lines starting with `data: `
5. Parse JSON, extract `delta.text` from `content_block_delta` events
6. Call `onChunk(text)` — append to the last assistant message in state
7. On `message_stop` event or stream end, call `onDone()`

The Vite proxy already handles the `anthropic-version` header injection. No changes needed there.

---

## Visual Design Spec

**Collapsed state (pill):**
- Fixed bottom-left, `left: 24px, bottom: 24px`
- `~180px wide × 44px tall`, rounded-full
- Background: `--navy`
- Left: small chat bubble icon in `--amber`
- Text: `"Ask Ellis"` in cream, DM Sans 13px
- Right: current step name truncated, muted, mono 10px
- Framer Motion: subtle pulse on the amber dot when a step is active

**Expanded state (panel):**
- `380px wide × 480px tall`
- Anchored bottom-left, springs up from pill with Framer Motion layout animation
- Background: `--cream`, border: `1px solid --bg2`, `border-radius: 16px`
- **Header:** "Ask Ellis" left-aligned in serif italic, close button (✕) right
- **Step badge:** current step shown as amber mono pill below header — e.g. `STEP 3 · SELECTED`
- **Message area:** scrollable, padding 16px, gap 12px between bubbles
  - User: right-aligned, navy background, cream text, `border-radius: 12px 12px 2px 12px`
  - Assistant: left-aligned, `--bg2` background, navy text, `border-radius: 12px 12px 12px 2px`
  - Streaming cursor: blinking `|` appended to last assistant message
- **Input area:** pinned to bottom of panel, separated by 1px border
  - Textarea, 1–3 lines, auto-grow
  - Placeholder: current step's `exampleQuestion` in muted italic
  - Send button: right of input, amber on hover, disabled while streaming
  - `Enter` to send, `Shift+Enter` for newline

---

## Implementation Order

Do these in sequence — each step is independently testable:

1. **`src/data/steps.ts`** — create the 7 hardcoded steps with example questions
2. **Lift `activeStep` state** into `App.tsx`, update `RoadScreen` props
3. **`src/lib/chat.ts`** — write and test `streamChat` and `buildSystemPrompt` in isolation (can test via browser console)
4. **`src/components/ChatMessage.tsx`** — build message bubble, test with static props
5. **`src/components/ChatPanel.tsx`** — wire everything together, collapsed/expanded states first, then streaming
6. **Mount `ChatPanel` in `App.tsx`** — verify it persists across screen transitions
7. **Polish** — Framer Motion animations, auto-scroll, streaming cursor, mobile touch scroll on chat

---

## Potential Gotchas

- **SSE parsing:** The Vite proxy passes through the stream correctly, but make sure `response.body` is read as a stream, not awaited as JSON. Check `response.headers.get('content-type')` includes `text/event-stream`.
- **React state + streaming:** Appending tokens to a message requires either a `useRef` for the accumulator (avoids stale closures) combined with a `setState` call, or using `useReducer`. Don't update state on every single token — batch with `requestAnimationFrame` or a small debounce if performance is an issue.
- **`activeStep` prop updates:** When the user clicks a new node while chat is open, the panel should visually acknowledge the context switch (update the step badge) without resetting history. A `useEffect` on `activeStep` handles this.
- **Panel z-index:** The detail panel slides up from the bottom at `z-index: 50`. The chat panel should be `z-index: 60` so it stays on top.
- **Textarea auto-grow:** Use `onInput` to set `element.style.height = 'auto'` then `element.style.height = element.scrollHeight + 'px'`. Cap at ~80px (3 lines).
- **Empty state:** First open with no active step — show a brief welcome message and invite the user to click a step on the road.

---

## Out of Scope for PoC

- Persisting chat history to localStorage or a backend
- Multiple conversation threads
- Markdown rendering in assistant messages (plain text is fine for now)
- Rate limiting / error retry UI
- Mobile keyboard handling (chat input pushing layout)
