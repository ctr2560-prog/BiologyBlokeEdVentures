import Link from 'next/link'
import { notFound } from 'next/navigation'
import { STAGES } from '@/lib/data/programs'

export default async function StagePage({ params }: { params: Promise<{ stageId: string }> }) {
  const { stageId } = await params
  const stage = STAGES.find((s) => s.id === stageId)
  if (!stage) notFound()

  return (
    <div style={{ padding: '2.5rem 2.5rem 4rem' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '0.8rem', color: '#9b6f44', marginBottom: '0.75rem' }}>
        <Link href="/teacher/programs" style={{ color: '#9b6f44', textDecoration: 'none' }}>View Programs</Link>
        {' › '}
        <span>{stage.label}</span>
      </div>

      <h1 style={{ fontWeight: 900, fontSize: '2rem', color: '#2e1a0e', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: '1.5rem' }}>
        {stage.label}
      </h1>

      {/* Unit info card */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1.5px solid #e4dab8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ marginBottom: '0.4rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#5c3a1e' }}>Unit Name: </span>
              <span style={{ color: '#2e1a0e' }}>{stage.unitName}</span>
            </p>
            <p style={{ marginBottom: '0.4rem', color: '#5c3a1e', fontSize: '0.875rem', maxWidth: 520 }}>
              <span style={{ fontWeight: 700 }}>Description: </span>
              {stage.description}
            </p>
            <p style={{ marginBottom: '0.4rem', fontSize: '0.875rem' }}>
              <span style={{ fontWeight: 700, color: '#5c3a1e' }}>Duration: </span>
              <span style={{ color: '#2e1a0e' }}>{stage.duration} lessons</span>
            </p>
            <p style={{ fontSize: '0.875rem' }}>
              <span style={{ fontWeight: 700, color: '#5c3a1e' }}>NSW Outcomes: </span>
              <span style={{ color: '#2e1a0e', fontFamily: 'monospace' }}>{stage.outcomes}</span>
            </p>
          </div>
          <button
            className="btn btn-green"
            onClick={undefined}
            style={{ whiteSpace: 'nowrap' }}
          >
            ⬇️ Download Unit Program
          </button>
        </div>
      </div>

      {/* Topics grid */}
      <h2 style={{ fontWeight: 900, fontSize: '1.1rem', color: '#2e1a0e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
        Topics
      </h2>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {stage.topics.map((topic) => (
          <Link
            key={topic.id}
            href={`/teacher/programs/${stage.id}/${topic.id}`}
            style={{ textDecoration: 'none', width: 150 }}
          >
            <div className="topic-card">
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{topic.icon}</div>
              <div style={{ fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 800 }}>
                {topic.label}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
