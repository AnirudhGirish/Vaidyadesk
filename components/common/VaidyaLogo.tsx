import React from 'react'

export function VaidyaLogo({ className = "w-6 h-6", style }: { className?: string; style?: React.CSSProperties }) {
  // A premium vector logo combining the concepts of an Ayurvedic leaf, a lotus, and a heart
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <path
        d="M16 28C16 28 6 20.5 6 11.5C6 7.5 9 4 13 4C14.8 4 16 5.5 16 5.5C16 5.5 17.2 4 19 4C23 4 26 7.5 26 11.5C26 20.5 16 28 16 28Z"
        fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
      />
      <path d="M16 28V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 19.5C16 19.5 21 16 22.5 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 19.5C16 19.5 11 16 9.5 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="7.5" r="1.5" fill="currentColor" />
    </svg>
  )
}
