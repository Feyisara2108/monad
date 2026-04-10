'use client';

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-12 w-12 items-center justify-center rounded-[18px] bg-[linear-gradient(145deg,#1f1612,#ff6b57_55%,#ffb36b)] text-white shadow-[0_14px_36px_rgba(255,107,87,0.32)]">
        <span className="brand-font text-2xl font-semibold tracking-tight">P</span>
        <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-[#fff6ee]" />
      </div>
      <div>
        <p className="pulse-logo-wordmark brand-font text-[0.72rem] font-semibold text-[#7a5140]">
          Pulse
        </p>
        <p className="text-xs uppercase tracking-[0.34em] text-[#aa7a66]">
          onchain social
        </p>
      </div>
    </div>
  )
}
