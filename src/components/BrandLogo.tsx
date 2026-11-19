import React from 'react';

interface BrandLogoProps {
  compact?: boolean;
  lightText?: boolean;
}

export function BrandLogo({ compact = false, lightText = false }: BrandLogoProps) {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 select-none">
      <svg
        width="32"
        height="32"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="36" height="36" rx="9" fill="#142B53" />
        {/* Graduation Mortarboard Cap */}
        <path
          d="M18 7.5L29 12.6L18 17.7L7 12.6L18 7.5Z"
          fill="#3267D5"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="M26.5 14V18.8"
          stroke="#26C6DA"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Pulse Waveform */}
        <path
          d="M6.5 24.5H12L14.5 20.5L17.6 28L20.8 21.5L23.2 24.5H29.5"
          stroke="#26C6DA"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {!compact && (
        <span
          className={`font-display text-lg font-bold tracking-tight ${
            lightText ? 'text-white' : 'text-[#142B53] dark:text-white'
          }`}
        >
          StudentPulse <span className="text-[#3267D5] dark:text-[#26C6DA]">AI</span>
        </span>
      )}
    </span>
  );
}
