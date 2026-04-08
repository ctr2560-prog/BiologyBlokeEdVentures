'use client'

import Link from 'next/link'
import Image from 'next/image'

interface LogoProps {
  href?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** 'dark' = logo on dark/forest background, 'light' = logo on cream/white background */
  variant?: 'dark' | 'light'
}

export default function Logo({ href = '/', size = 'md', className = '', variant = 'dark' }: LogoProps) {
  const dimensions = {
    sm: { width: 80,  height: 80  },
    md: { width: 110, height: 110 },
    lg: { width: 160, height: 160 },
  }
  const { width, height } = dimensions[size]

  const inner = (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius: '14%',
        background: variant === 'dark' ? 'rgba(255,255,255,0.08)' : '#3d2409',
        padding: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
        flexShrink: 0,
      }}
    >
      <Image
        src="/logo.png"
        alt="The Biology Bloke"
        width={width - 16}
        height={height - 16}
        style={{ objectFit: 'contain' }}
        priority
      />
    </div>
  )

  return href ? <Link href={href} style={{ display: 'inline-block' }}>{inner}</Link> : inner
}
