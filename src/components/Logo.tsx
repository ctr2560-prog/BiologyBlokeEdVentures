'use client'

import Link from 'next/link'

interface LogoProps {
  href?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Logo({ href = '/', size = 'md', className = '' }: LogoProps) {
  const sizes = {
    sm: { box: 60, text1: 9, text2: 7, text3: 6 },
    md: { box: 90, text1: 13, text2: 10, text3: 9 },
    lg: { box: 120, text1: 17, text2: 13, text3: 11 },
  }
  const s = sizes[size]

  const inner = (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      style={{
        width: s.box,
        height: s.box,
        background: 'linear-gradient(135deg, #faf5e4 0%, #f0ead0 100%)',
        borderRadius: '12%',
        border: '2px solid #7a5230',
        padding: '6px',
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <div style={{ fontSize: s.text1, fontWeight: 900, color: '#5c3a1e', lineHeight: 1.1, fontFamily: 'Georgia, serif', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
        THE
      </div>
      <div style={{ fontSize: s.text2, fontWeight: 900, color: '#3d2409', lineHeight: 1.1, fontFamily: 'Georgia, serif', textTransform: 'uppercase' }}>
        BIOLOGY
      </div>
      <div style={{ fontSize: s.text2, fontWeight: 900, color: '#3d2409', lineHeight: 1.1, fontFamily: 'Georgia, serif', textTransform: 'uppercase' }}>
        BLOKE
      </div>
      <div style={{ fontSize: s.text3, color: '#e8920a', fontWeight: 700, marginTop: 2, letterSpacing: '0.05em' }}>
        🐨 EDVENTURES
      </div>
    </div>
  )

  return href ? <Link href={href}>{inner}</Link> : inner
}
