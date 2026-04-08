import Link from 'next/link'
import { STAGES } from '@/lib/data/programs'

// Stage card colours and large animal emojis matching the mockup
const STAGE_META = [
  { color: '#5c8a3a', bg: '#e8f5d0', animal: '🦎' }, // Stage 1 – sugar glider
  { color: '#8b5e3c', bg: '#ede0cc', animal: '🦘' }, // Stage 2 – kangaroo
  { color: '#3a7d3e', bg: '#d4edbc', animal: '🦔' }, // Stage 3 – echidna
  { color: '#2a6e5e', bg: '#c4e0d8', animal: '🐍' }, // Stage 4 – snake
  { color: '#4a4a2e', bg: '#d8d8b8', animal: '🕷️' }, // Stage 5 – spider
]

export default function ProgramsPage() {
  return (
    <div style={{ padding: '2.5rem 3rem 4rem' }}>
      <h1 className="page-title" style={{ marginBottom: '2.5rem' }}>Programs</h1>

      {/* Stage cards row */}
      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
        {STAGES.map((stage, i) => {
          const meta = STAGE_META[i]
          return (
            <Link key={stage.id} href={`/teacher/programs/${stage.id}`} style={{ textDecoration: 'none', width: 170 }}>
              <div className="stage-card">
                {/* Header */}
                <div style={{ background: meta.color, padding: '0.85rem 0.5rem', textAlign: 'center' }}>
                  <p style={{ fontWeight: 900, fontSize: '0.9rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-nunito, sans-serif)' }}>
                    {stage.label}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', fontWeight: 700, marginTop: 1 }}>
                    {stage.years}
                  </p>
                </div>
                {/* Animal */}
                <div style={{ background: meta.bg, padding: '1.75rem 1rem', textAlign: 'center', fontSize: '4rem', lineHeight: 1 }}>
                  {meta.animal}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
