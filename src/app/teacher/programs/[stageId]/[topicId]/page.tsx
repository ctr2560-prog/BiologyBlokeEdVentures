'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { STAGES } from '@/lib/data/programs'
import { createClient } from '@/lib/supabase/client'

const VIDEOS = [
  { id: 'v1', title: 'Into the Jungle', duration: '2:45', thumbnail: '🌿', curiosityPrompt: 'What do you think happens to animals when their habitat changes?' },
  { id: 'v2', title: 'Masters of Camouflage', duration: '3:12', thumbnail: '🦎', curiosityPrompt: 'How do you think camouflage helps an animal survive?' },
  { id: 'v3', title: 'Built to Survive', duration: '2:58', thumbnail: '🐆', curiosityPrompt: 'What adaptations can you spot in this animal?' },
]

export default function TopicDetailPage() {
  const { stageId, topicId } = useParams<{ stageId: string; topicId: string }>()
  const [openSection, setOpenSection] = useState<string>('media')
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [assignModal, setAssignModal] = useState(false)
  const [assigned, setAssigned] = useState(false)

  const stage = STAGES.find((s) => s.id === stageId)
  const topic = stage?.topics.find((t) => t.id === topicId)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('classes').select('id, name').order('name')
      setClasses(data ?? [])
    }
    load()
  }, [])

  if (!stage || !topic) {
    return <div style={{ padding: '2.5rem', color: '#cc2929' }}>Topic not found.</div>
  }

  async function assignToClass(classId: string) {
    const supabase = createClient()
    await supabase.from('class_edventures').upsert({
      class_id: classId,
      stage_id: stageId,
      topic_id: topicId,
      topic_label: topic!.label,
      assigned_at: new Date().toISOString(),
    })
    setAssigned(true)
    setAssignModal(false)
  }

  return (
    <div style={{ padding: '2.5rem 2.5rem 4rem', maxWidth: 800 }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '0.8rem', color: '#9b6f44', marginBottom: '0.75rem' }}>
        <Link href="/teacher/programs" style={{ color: '#9b6f44', textDecoration: 'none' }}>View Programs</Link>
        {' › '}
        <Link href={`/teacher/programs/${stageId}`} style={{ color: '#9b6f44', textDecoration: 'none' }}>{stage.label}</Link>
        {' › '}
        <span>{topic.label}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontWeight: 900, fontSize: '2rem', color: '#2e1a0e', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>
          {topic.label}
        </h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {assigned ? (
            <span className="btn btn-green btn-sm" style={{ cursor: 'default' }}>✓ Assigned</span>
          ) : (
            <button onClick={() => setAssignModal(true)} className="btn btn-green">
              Assign to Class
            </button>
          )}
        </div>
      </div>

      <p style={{ color: '#5c3a1e', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.7 }}>
        {topic.description}
      </p>

      {/* Collapsible sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* PowerPoints */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="section-header" onClick={() => setOpenSection(openSection === 'ppt' ? '' : 'ppt')}>
            <span>PowerPoints</span>
            <span>{openSection === 'ppt' ? '▲' : '▼'}</span>
          </div>
          {openSection === 'ppt' && (
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {['Introduction Slides', 'Key Concepts', 'Case Studies'].map((name) => (
                  <button key={name} className="btn btn-outline btn-sm">
                    📄 {name}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#9b6f44', marginTop: '0.75rem' }}>
                Downloadable PowerPoint presentations for classroom use.
              </p>
            </div>
          )}
        </div>

        {/* Adaptive Short Form Media */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="section-header" onClick={() => setOpenSection(openSection === 'media' ? '' : 'media')}>
            <span>Adaptive Short Form Media</span>
            <span>{openSection === 'media' ? '▲' : '▼'}</span>
          </div>
          {openSection === 'media' && (
            <div style={{ padding: '1.25rem' }}>
              {/* Overview */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div
                    style={{ width: 180, aspectRatio: '16/9', background: 'linear-gradient(135deg, #2d5a1e, #3d6b25)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', position: 'relative' }}
                  >
                    <span style={{ fontSize: '3rem' }}>▶️</span>
                    <span style={{ position: 'absolute', bottom: 6, left: 8, color: '#fff', fontSize: '0.7rem', fontWeight: 600 }}>Preview</span>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#2e1a0e', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                      <strong>Overview:</strong> Students will follow the Biology Bloke through the jungle of Sumatra, analysing the behavioural and physical adaptations of animals.
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#7a5230', lineHeight: 1.5 }}>
                      Adaptive personalised work includes: quizzes and interactive worksheets
                    </p>
                  </div>
                </div>
                <div>
                  <h4 style={{ fontWeight: 700, color: '#2e1a0e', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                    Pathways Available:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                      { label: '🌿 Explore (Advanced)', desc: 'Deeper concepts, open-ended challenges' },
                      { label: '🌱 Grow (Core)', desc: 'Structured progression with variation' },
                      { label: '🌾 Support', desc: 'Simplified explanations, scaffolded tasks' },
                    ].map((p) => (
                      <div key={p.label} style={{ background: '#f0ead0', borderRadius: 6, padding: '0.5rem 0.75rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#2e1a0e' }}>{p.label}</div>
                        <div style={{ fontSize: '0.75rem', color: '#7a5230' }}>{p.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Video list */}
              <h4 style={{ fontWeight: 700, color: '#2e1a0e', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                Videos in this topic:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {VIDEOS.map((v, i) => (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: '#f0ead0', borderRadius: 8 }}>
                    <span style={{ fontWeight: 700, color: '#9b6f44', minWidth: 24 }}>{i + 1}.</span>
                    <span style={{ fontSize: '1.5rem' }}>{v.thumbnail}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#2e1a0e' }}>{v.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#7a5230' }}>⏱ {v.duration}</div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#5c3a1e', fontStyle: 'italic', maxWidth: 200, textAlign: 'right' }}>
                      "{v.curiosityPrompt}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hands-on Activities */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="section-header" onClick={() => setOpenSection(openSection === 'hands' ? '' : 'hands')}>
            <span>Hands-on Activities</span>
            <span>{openSection === 'hands' ? '▲' : '▼'}</span>
          </div>
          {openSection === 'hands' && (
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {['Field Observation Sheet', 'Nature Journal', 'Habitat Mapping', 'Biodiversity Survey'].map((name) => (
                  <div key={name} style={{ background: '#f0ead0', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: '#2e1a0e' }}>
                    🌿 {name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assign modal */}
      {assignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '100%', maxWidth: 420, padding: '2rem', background: '#faf5e4' }}>
            <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: '#2e1a0e', marginBottom: '1rem', textTransform: 'uppercase' }}>
              Assign to Class
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#7a5230', marginBottom: '1.25rem' }}>
              Select a class to assign <strong>{topic.label}</strong> to:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {classes.length === 0 ? (
                <p style={{ color: '#9b6f44', fontSize: '0.875rem' }}>No classes yet. <Link href="/teacher/classes/new" style={{ color: '#e8920a' }}>Create one first.</Link></p>
              ) : (
                classes.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => assignToClass(cls.id)}
                    className="btn btn-amber"
                    style={{ justifyContent: 'center' }}
                  >
                    {cls.name}
                  </button>
                ))
              )}
            </div>
            <button onClick={() => setAssignModal(false)} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
