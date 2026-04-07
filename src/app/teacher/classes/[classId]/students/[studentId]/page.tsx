'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface WatchRecord {
  topic: string
  avg_time_seconds: number
  adaptive_focus: string
  engagement_level: 'high' | 'mid' | 'low'
}

interface StudentData {
  id: string
  nickname: string
  pathway: string
  progress_pct: number
  class_id: string
}

const engagementLabel = (level: string) => {
  const map: Record<string, { label: string; cls: string }> = {
    high: { label: '🌿 Curious', cls: 'dot-high' },
    mid:  { label: '🌱 Engaged', cls: 'dot-mid' },
    low:  { label: '🌾 Needs Support', cls: 'dot-low' },
  }
  return map[level] ?? map.mid
}

export default function StudentDetailPage() {
  const { classId, studentId } = useParams<{ classId: string; studentId: string }>()
  const [student, setStudent] = useState<StudentData | null>(null)
  const [records, setRecords] = useState<WatchRecord[]>([])
  const [className, setClassName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: s }, { data: cls }, { data: wr }] = await Promise.all([
        supabase.from('students').select('*').eq('id', studentId).single(),
        supabase.from('classes').select('name').eq('id', classId).single(),
        supabase
          .from('watch_events')
          .select('topic, avg_time_seconds, adaptive_focus, engagement_level')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false }),
      ])
      setStudent(s)
      setClassName(cls?.name ?? '')
      setRecords(wr ?? [])
      setLoading(false)
    }
    load()
  }, [classId, studentId])

  async function regeneratePassword() {
    if (!confirm('Generate a new login for this student?')) return
    const newPw = Math.random().toString(36).slice(2, 10)
    const supabase = createClient()
    await supabase.auth.admin.updateUserById(studentId, { password: newPw })
    alert(`New password: ${newPw}\nShare this with the student.`)
  }

  if (loading) return <div style={{ padding: '2.5rem', color: '#9b6f44' }}>Loading student...</div>
  if (!student) return <div style={{ padding: '2.5rem', color: '#cc2929' }}>Student not found.</div>

  return (
    <div style={{ padding: '2.5rem 2.5rem 4rem' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '0.8rem', color: '#9b6f44', marginBottom: '0.75rem' }}>
        <Link href="/teacher/classes" style={{ color: '#9b6f44', textDecoration: 'none' }}>Manage Classes</Link>
        {' › '}
        <Link href={`/teacher/classes/${classId}`} style={{ color: '#9b6f44', textDecoration: 'none' }}>{className}</Link>
        {' › '}
        <span>{student.nickname}</span>
      </div>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontWeight: 900, fontSize: '2rem', color: '#2e1a0e', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>
          {student.nickname}
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href={`/teacher/classes/${classId}`} className="btn btn-outline btn-sm">← Back</Link>
        </div>
      </div>

      {/* Password block */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ background: '#e8920a', color: '#fff', borderRadius: 8, padding: '0.5rem 1rem', fontWeight: 700, fontSize: '0.9rem' }}>
          Password: ••••••••
        </div>
        <button onClick={regeneratePassword} className="btn btn-red" style={{ borderRadius: 8 }}>
          Regenerate
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
          <div>
            <span style={{ color: '#9b6f44' }}>Pathway: </span>
            <span style={{ fontWeight: 700, color: '#2e1a0e', textTransform: 'capitalize' }}>{student.pathway}</span>
          </div>
          <div>
            <span style={{ color: '#9b6f44' }}>Progress: </span>
            <span style={{ fontWeight: 700, color: '#2e1a0e' }}>{student.progress_pct ?? 0}%</span>
          </div>
        </div>
      </div>

      {/* Watch records */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {records.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📺</div>
            <p style={{ color: '#7a5230', fontWeight: 600 }}>No watch data yet.</p>
            <p style={{ color: '#9b6f44', fontSize: '0.875rem' }}>Data will appear once the student starts watching videos.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Avg. Time / Video</th>
                <th>Adaptive Focus Area</th>
                <th>Engagement</th>
                <th>Insights</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => {
                const eng = engagementLabel(r.engagement_level)
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{r.topic}</td>
                    <td>{r.avg_time_seconds}s</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{r.adaptive_focus}</span>{' '}
                      <span style={{ color: '#0ea5e9', fontSize: '1.1rem' }}>👁️</span>
                    </td>
                    <td>
                      <span className={eng.cls}>{eng.label}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '1.2rem' }}>📊</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
