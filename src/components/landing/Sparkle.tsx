// Small sparkle/asterisk icon used inside primary buttons and as logomark accent.
export function Sparkle({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      {/* 8-point asterisk/sparkle */}
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="3" x2="12" y2="21" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
        <line x1="18.4" y1="5.6" x2="5.6" y2="18.4" />
      </g>
    </svg>
  );
}

// Tiny 3-dot logo mark used in the nav.
export function HandholdMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 16" className={className} aria-hidden="true" fill="currentColor">
      <circle cx="4" cy="8" r="3" />
      <rect x="8" y="6.5" width="6" height="3" rx="1.5" />
      <circle cx="16" cy="8" r="3" />
      <rect x="20" y="6.5" width="6" height="3" rx="1.5" />
      <circle cx="28" cy="8" r="3" />
    </svg>
  );
}
