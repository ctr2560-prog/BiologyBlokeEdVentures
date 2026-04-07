import Link from 'next/link'
import { STAGES } from '@/lib/data/programs'

export default function ProgramsPage() {
  return (
    <div style={{ padding: '2.5rem 2.5rem 4rem' }}>
      <h1 style={{ fontWeight: 900, fontSize: '2rem', color: '#2e1a0e', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: '2rem' }}>
        Programs
      </h1>

      {/* Stage cards */}
      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
        {STAGES.map((stage) => (
          <Link
            key={stage.id}
            href={`/teacher/programs/${stage.id}`}
            style={{ textDecoration: 'none', width: 160 }}
          >
            <div
              className="stage-card"
              style={{ background: stage.bgColor }}
            >
              {/* Colored header */}
              <div style={{ background: stage.color, padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                <p style={{ fontWeight: 900, fontSize: '0.85rem', color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {stage.label}
                </p>
                <p style={{ fontWeight: 600, fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>
                  {stage.years}
                </p>
              </div>
              {/* Animal */}
              <div style={{ padding: '1.5rem 1rem', fontSize: '4rem', textAlign: 'center' }}>
                {stage.animal}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Edventures preview */}
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ fontWeight: 900, fontSize: '1.25rem', color: '#2e1a0e', textTransform: 'uppercase', letterSpacing: '0.03em', fontFamily: 'Georgia, serif', marginBottom: '1.25rem' }}>
          Featured Edventures
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {[
            { id: 'canopy', title: 'Life in the Canopy', subtitle: 'Rainforest systems', icon: '🌴', videos: 10 },
            { id: 'predator-prey', title: 'Predator & Prey', subtitle: 'The Balance of Survival', icon: '🦁', videos: 8 },
            { id: 'micro-worlds', title: 'Hidden Worlds', subtitle: 'Micro Life Around Us', icon: '🔬', videos: 9 },
            { id: 'oceans', title: 'Oceans in Motion', subtitle: 'Marine ecosystem dynamics', icon: '🌊', videos: 11 },
            { id: 'fire-ecosystem', title: 'Living with Fire', subtitle: 'Australian Ecosystems', icon: '🔥', videos: 8 },
          ].map((adv) => (
            <div key={adv.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{adv.icon}</div>
              <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#2e1a0e', marginBottom: '0.25rem' }}>{adv.title}</h3>
              <p style={{ fontSize: '0.8rem', color: '#7a5230', marginBottom: '0.75rem' }}>{adv.subtitle}</p>
              <p style={{ fontSize: '0.75rem', color: '#9b6f44' }}>{adv.videos} short-form videos</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
