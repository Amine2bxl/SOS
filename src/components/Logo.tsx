export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 48 52" className="h-9 w-9 shrink-0" aria-hidden="true">
        <path
          d="M24 2 44 9v16c0 12.5-8.4 21.4-20 25C12.4 46.4 4 37.5 4 25V9L24 2Z"
          fill="#0b2545"
          stroke="#f2b705"
          strokeWidth="2.5"
        />
        <circle cx="18" cy="20" r="4.2" fill="#f2b705" />
        <circle cx="30" cy="20" r="4.2" fill="#f6f4ee" />
        <path d="M11 34c0-4.6 3.4-7.5 7-7.5s7 2.9 7 7.5" fill="none" stroke="#f2b705" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M24 34c0-4.6 3.4-7.5 7-7.5s7 2.9 7 7.5" fill="none" stroke="#f6f4ee" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-lg font-bold tracking-tight">
            <span className="text-gold-400">SOS</span> <span className="text-white">CITIZENS</span>
          </span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-navy-100/80">
            ASBL
          </span>
        </span>
      )}
    </span>
  );
}

export function PhoneIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.6a1 1 0 0 1-.25 1l-2.22 2.2Z" />
    </svg>
  );
}

export function MailIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
      <path d="m3 6 9 6.5L21 6" />
    </svg>
  );
}
