'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Student {
  id: string
  nickname: string
  pathway: 'explore' | 'grow' | 'support'
  progress_pct: number
}

interface ClassData {
  id: string
  code: string
  name: string
  year_level: string
  focus: string | null
  active_edventure: string | null
}

const pathwayBadge = (p: string) => {
  const map: Record<string, { label: string; cls: string }> = {
    explore: { label: '🌿 Explore', cls: 'badge-explore' },
    grow:    { label: '🌱 Grow',    cls: 'badge-grow' },
    support: { label: '🌾 Support', cls: 'badge-support' },
  }
  return map[p] ?? map.grow
}

export default function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>()
  const [cls, setCls] = useState<ClassData | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newNickname, setNewNickname] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: classData } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single()

      const { data: studData } = await supabase
        .from('students')
        .select('id, nickname, pathway, progress_pct')
        .eq('class_id', classId)
        .order('nickname')

      setCls(classData)
      setStudents(studData ?? [])
      setLoading(false)
    }
    load()
  }, [classId])

  async function addStudent(e: React.FormEvent) {
    e.preventDefault()
    setAddLoading(true)
    const supabase = createClient()
    const password = Math.random().toString(36).slice(2, 10)
    const email = `${newNickname.toLowerCase().replace(/\s+/g, '_')}_${classId.slice(0, 6)}_${Date.now()}@biologybloke.internal`

    const { data } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname: newNickname, class_id: classId, role: 'student', generated_password: password } },
    })

    if (data.user) {
      await supabase.from('students').insert({
        id: data.user.id,
        nickname: newNickname,
        class_id: classId,
        pathway: 'grow',
        progress_pct: 0,
      })
      setStudents((prev) => [...prev, { id: data.user!.id, nickname: newNickname, pathway: 'grow', progress_pct: 0 }])
    }
    setNewNickname('')
    setShowAddModal(false)
    setAddLoading(false)
  }

  async function deleteStudent(id: string) {
    if (!confirm(`Remove this student?`)) return
    const supabase = createClient()
    await supabase.from('students').delete().eq('id', id)
    setStudents((prev) => prev.filter((s) => s.id !== id))
  }

  function copyCode() {
    if (cls) {
      navigator.clipboard.writeText(cls.code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  if (loading) return <div style={{ padding: '2.5rem', color: '#9b6f44' }}>Loading class...</div>
  if (!cls) return <div style={{ padding: '2.5rem', color: '#cc2929' }}>Class not found.</div>

  return (
    <div style={{ padding: '2.5rem 2.5rem 4rem' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '0.8rem', color: '#9b6f44', marginBottom: '0.75rem' }}>
        <Link href="/teacher/classes" style={{ color: '#9b6f44', textDecoration: 'none' }}>Manage Classes</Link>
        {' › '}
        <span>{cls.name}</span>
      </div>

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: '2rem', color: '#2e1a0e', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>
            {cls.name} ({cls.year_level})
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#5c3a1e' }}>
              Class Code:{' '}
              <span style={{ fontFamily: 'monospace', fontSize: '1.05rem', color: '#e8920a', letterSpacing: '0.1em' }}>{cls.code}</span>
            </span>
            <button onClick={copyCode} className="btn btn-outline btn-sm">
              {copiedCode ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
          {cls.focus && (
            <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: '#7a5230' }}>
              Focus: {cls.focus}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setShowAddModal(true)} className="btn btn-amber">
            + Add Students
          </button>
          <Link href={`/teacher/classes/${classId}/insights`} className="btn btn-green">
            📊 Class Insights
          </Link>
        </div>
      </div>

      {/* Students table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {students.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🦘</div>
            <p style={{ color: '#7a5230', fontWeight: 600 }}>No students yet.</p>
            <p style={{ color: '#9b6f44', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Share the class code <strong style={{ color: '#e8920a' }}>{cls.code}</strong> with your students.
            </p>
            <button onClick={() => setShowAddModal(true)} className="btn btn-amber">Add Students</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Progress</th>
                <th>Pathway</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const badge = pathwayBadge(s.pathway)
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.nickname}</td>
                    <td style={{ minWidth: 160 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-track" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{ width: `${s.progress_pct ?? 0}%` }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#7a5230', fontWeight: 600, minWidth: 30 }}>
                          {s.progress_pct ?? 0}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link href={`/teacher/classes/${classId}/students/${s.id}`} className="btn btn-green btn-icon" title="View insights">
                          📊
                        </Link>
                        <button
                          onClick={() => deleteStudent(s.id)}
                          className="btn btn-red btn-icon"
                          title="Remove student"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add student modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '100%', maxWidth: 400, padding: '2rem', background: '#faf5e4' }}>
            <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: '#2e1a0e', marginBottom: '1rem', textTransform: 'uppercase' }}>
              Add Student
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#7a5230', marginBottom: '1.25rem' }}>
              Or share the class code <strong style={{ color: '#e8920a' }}>{cls.code}</strong> and let students join themselves via the join page.
            </p>
            <form onSubmit={addStudent} className="space-y-3">
              <input
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                placeholder="Student nickname (e.g. Kylie Kangaroo)"
                required
                className="input-field"
              />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" disabled={addLoading} className="btn btn-amber" style={{ flex: 1, justifyContent: 'center' }}>
                  {addLoading ? 'Adding...' : 'Add Student'}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
