export function Logo({ size = 40, showText = false, className = '' }: { size?: number; showText?: boolean; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* "b" shape */}
        <path d="M25 8L38 2L42 35C42 35 30 20 25 8Z" fill="#2d2d2d" />
        <path d="M30 25C30 25 32 40 35 50C38 60 45 72 58 78C71 84 82 76 85 65C88 54 84 42 74 34C64 26 50 24 40 28L42 15C55 10 72 14 82 26C92 38 96 56 88 70C80 84 64 92 48 88C32 84 25 70 22 55C19 40 20 30 30 25Z" fill="#2d2d2d" />
        {/* Yellow accent on the right */}
        <path d="M85 65C88 54 86 44 80 36C84 46 85 57 82 67C79 77 70 83 60 82C72 84 82 76 85 65Z" fill="#E5A817" />
        {/* Racket strings grid */}
        <g stroke="#fff" strokeWidth="1.2" opacity="0.9">
          {/* Vertical strings */}
          <line x1="28" y1="38" x2="22" y2="68" />
          <line x1="32" y1="35" x2="28" y2="70" />
          <line x1="36" y1="33" x2="34" y2="72" />
          <line x1="40" y1="32" x2="40" y2="73" />
          <line x1="44" y1="33" x2="46" y2="72" />
          <line x1="48" y1="35" x2="51" y2="70" />
          {/* Horizontal strings */}
          <line x1="23" y1="42" x2="50" y2="38" />
          <line x1="22" y1="48" x2="52" y2="44" />
          <line x1="22" y1="54" x2="52" y2="50" />
          <line x1="23" y1="60" x2="51" y2="56" />
          <line x1="25" y1="66" x2="49" y2="62" />
        </g>
        {/* Racket frame */}
        <ellipse cx="37" cy="53" rx="18" ry="22" stroke="#2d2d2d" strokeWidth="3" fill="none" transform="rotate(-5 37 53)" />
      </svg>
      {showText && (
        <div className="leading-tight">
          <span className="text-sm font-bold text-gray-800 tracking-tight block">ENCORDOAMENTO</span>
          <span className="text-sm font-black text-amber-500 tracking-tight italic">PROFISSIONAL</span>
        </div>
      )}
    </div>
  )
}

export function LogoFull({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <Logo size={80} />
      <div className="mt-2 text-center">
        <span className="text-lg font-bold text-gray-800 tracking-wide block">ENCORDOAMENTO</span>
        <span className="text-lg font-black text-amber-500 tracking-wide italic">PROFISSIONAL</span>
      </div>
    </div>
  )
}
