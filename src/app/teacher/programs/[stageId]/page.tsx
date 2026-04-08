import Link from 'next/link'
import { notFound } from 'next/navigation'
import { STAGES } from '@/lib/data/programs'

export default async function StagePage({ params }: { params: Promise<{ stageId: string }> }) {
  const { stageId } = await params
  const stage = STAGES.find((s) => s.id === stageId)
  if (!stage) notFound()

  return (
    <div style={{ padding: '2.5rem 3rem 4rem' }}>
      <div className="breadcrumb">
        <Link href="/teacher/programs">View Programs</Link> {'>'} {stage.label}
      </div>

      <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>{stage.label}</h1>

      {/* Unit info */}
      <div className="panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '0.9rem', color: '#3a1f0d', lineHeight: 1.8 }}>
          <p><strong>Unit Name:</strong> {stage.unitName}</p>
          <p><strong>Description:</strong> {stage.description}</p>
          <p><strong>Duration:</strong> {stage.duration} lessons</p>
          <p><strong>NSW Outcomes:</strong> <span style={{ fontFamily: 'monospace', color: '#7a5230' }}>{stage.outcomes}</span></p>
        </div>
        <button className="btn btn-green" style={{ whiteSpace: 'nowrap', gap: '0.4rem' }}>
          ⬇️ Download Unit Program
        </button>
      </div>

      {/* Topics */}
      <div className="panel" style={{ padding: '1.5rem' }}>
        <h2 className="page-title" style={{ fontSize: '1.75rem', marginBottom: '1.25rem' }}>Topics</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {stage.topics.map((topic) => (
            <Link key={topic.id} href={`/teacher/programs/${stage.id}/${topic.id}`} style={{ textDecoration: 'none', width: 140 }}>
              <div className="topic-card">
                <div className="topic-card-label">{topic.label}</div>
                <div className="topic-card-animal">{topic.icon}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
