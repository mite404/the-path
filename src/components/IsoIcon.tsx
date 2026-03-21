import type { IconName } from '@/types'

const icons: Record<IconName, React.ReactNode> = {
  document: (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <g transform="translate(36,14)">
        <rect x="-18" y="8" width="36" height="44" rx="4" fill="#2A3660" transform="translate(-8,-8)" />
        <rect x="-18" y="8" width="36" height="44" rx="4" fill="#1A2340" transform="translate(-4,-4)" />
        <rect x="-18" y="8" width="36" height="44" rx="4" fill="#3A4880" />
        <line x1="-10" y1="20" x2="10" y2="20" stroke="#C4873A" strokeWidth="2" strokeLinecap="round" />
        <line x1="-10" y1="28" x2="10" y2="28" stroke="#8090C0" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="-10" y1="36" x2="4" y2="36" stroke="#8090C0" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  ),
  briefcase: (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <g transform="translate(36,20)">
        <rect x="-20" y="8" width="40" height="28" rx="3" fill="#C4873A" transform="translate(-5,-5)" />
        <rect x="-20" y="8" width="40" height="28" rx="3" fill="#1A2340" />
        <rect x="-8" y="-2" width="16" height="12" rx="2" fill="none" stroke="#C4873A" strokeWidth="2" />
        <rect x="-3" y="18" width="6" height="10" rx="1" fill="#C4873A" opacity="0.6" />
      </g>
    </svg>
  ),
  calendar: (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <g transform="translate(36,14)">
        <rect x="-19" y="4" width="38" height="36" rx="3" fill="#2D5A8E" transform="translate(-5,-5)" />
        <rect x="-19" y="4" width="38" height="36" rx="3" fill="#1A2340" />
        <rect x="-19" y="4" width="38" height="12" rx="3" fill="#0A1628" />
        <rect x="-6" y="-2" width="4" height="9" rx="2" fill="#C4873A" />
        <rect x="2" y="-2" width="4" height="9" rx="2" fill="#C4873A" />
        <circle cx="-6" cy="26" r="2.5" fill="white" opacity="0.7" />
        <circle cx="2" cy="26" r="2.5" fill="white" opacity="0.7" />
        <circle cx="10" cy="26" r="2.5" fill="#C4873A" />
      </g>
    </svg>
  ),
  stamp: (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <g transform="translate(36,14)">
        <rect x="-20" y="22" width="40" height="18" rx="3" fill="#1A2340" />
        <rect x="-16" y="26" width="32" height="10" rx="2" fill="#C4873A" opacity="0.25" />
        <rect x="-8" y="0" width="16" height="24" rx="2" fill="#2A3660" transform="translate(-3,-3)" />
        <rect x="-8" y="0" width="16" height="24" rx="2" fill="#1A2340" />
        <text x="0" y="36" textAnchor="middle" fontSize="7" fill="#C4873A" fontWeight="bold" fontFamily="monospace">VISA</text>
      </g>
    </svg>
  ),
  plane: (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <g transform="translate(36,36) rotate(-30)">
        <path d="M-4,-20 L4,-20 L6,0 L14,8 L14,13 L6,10 L5,18 L9,20 L9,24 L0,22 L-9,24 L-9,20 L-5,18 L-6,10 L-14,13 L-14,8 L-6,0 Z" fill="#C4873A" transform="translate(-3,-3)" />
        <path d="M-4,-20 L4,-20 L6,0 L14,8 L14,13 L6,10 L5,18 L9,20 L9,24 L0,22 L-9,24 L-9,20 L-5,18 L-6,10 L-14,13 L-14,8 L-6,0 Z" fill="#1A2340" />
      </g>
    </svg>
  ),
  key: (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <g transform="translate(30,32)">
        <circle cx="-8" cy="-8" r="14" fill="none" stroke="#C4873A" strokeWidth="5" transform="translate(-3,-3)" />
        <circle cx="-8" cy="-8" r="14" fill="none" stroke="#1A2340" strokeWidth="5" />
        <rect x="2" y="-5" width="24" height="6" rx="3" fill="#1A2340" />
        <rect x="18" y="-5" width="4" height="9" rx="1" fill="#2A3660" />
        <rect x="24" y="-5" width="4" height="9" rx="1" fill="#2A3660" />
      </g>
    </svg>
  ),
  shield: (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <g transform="translate(36,12)">
        <path d="M0,-2 L18,6 L18,22 Q18,36 0,42 Q-18,36 -18,22 L-18,6 Z" fill="#1A6B4A" transform="translate(-4,-4)" />
        <path d="M0,-2 L18,6 L18,22 Q18,36 0,42 Q-18,36 -18,22 L-18,6 Z" fill="#1A2340" />
        <path d="M-8,18 L-2,24 L10,10" stroke="#C4873A" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  ),
  people: (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <g transform="translate(36,20)">
        <circle cx="8" cy="-4" r="9" fill="#1A2340" />
        <path d="M-4,22 Q-4,8 8,8 Q20,8 20,22" fill="#1A2340" />
        <circle cx="-6" cy="-6" r="9" fill="#C4873A" transform="translate(-4,-2)" />
        <path d="M-18,22 Q-18,8 -6,8 Q6,8 6,22" fill="#C4873A" transform="translate(-4,-2)" />
      </g>
    </svg>
  ),
  star: (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <g transform="translate(36,36)">
        <polygon points="0,-20 5.9,-8.1 19,-7.6 9.5,1.6 12.4,15 0,8 -12.4,15 -9.5,1.6 -19,-7.6 -5.9,-8.1" fill="#1A2340" transform="translate(-3,-3)" />
        <polygon points="0,-20 5.9,-8.1 19,-7.6 9.5,1.6 12.4,15 0,8 -12.4,15 -9.5,1.6 -19,-7.6 -5.9,-8.1" fill="#C4873A" />
      </g>
    </svg>
  ),
  home: (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <g transform="translate(36,14)">
        <rect x="-15" y="10" width="30" height="28" rx="2" fill="#C4873A" transform="translate(-5,-5)" />
        <rect x="-15" y="10" width="30" height="28" rx="2" fill="#1A2340" />
        <polygon points="0,-4 22,12 -22,12" fill="#2A3660" transform="translate(-5,-5)" />
        <polygon points="0,-4 22,12 -22,12" fill="#0A1628" />
        <rect x="-5" y="22" width="10" height="16" rx="2" fill="#2A3660" />
      </g>
    </svg>
  ),
}

export function IsoIcon({ name }: { name: IconName }) {
  return icons[name] ?? icons.document
}
