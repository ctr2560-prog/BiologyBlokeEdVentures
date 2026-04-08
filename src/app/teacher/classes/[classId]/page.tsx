'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Student { id: string; nickname: string; pathway: string; progress_pct: number }
interface ClassData { id: string; code: string; name: string; year_level: string; focus: string | null }

export default function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>()
  const [cls, setCls] = useState<ClassData | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newNickname, setNewNickname] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: c }, { data: s }] = await Promise.all([
        supabase.from('classes').select('*').eq('id', classId).single(),
        supabase.from('students').select('id, nickname, pathway, progress_pct').eq('class_id', classId).order('nickname'),
      ])
      setCls(c); setStudents(s ?? []); setLoading(false)
    }
    load()
  }, [classId])

  async function addStudent(e: React.FormEvent) {
    e.preventDefault(); setAddLoading(true)
    const supabase = createClient()
    const password = Math.random().toString(36).slice(2, 10)
    const email = `${newNickname.toLowerCase().replace(/\s+/g, '_')}_${classId.slice(0,6)}_${Date.now()}@biologybloke.internal`
    const { data } = await supabase.auth.signUp({ email, password, options: { data: { nickname: newNickname, class_id: classId, role: 'student', generated_password: password } } })
    if (data.user) {
      await supabase.from('students').insert({ id: data.user.id, nickname: newNickname, class_id: classId, pathway: 'grow', progress_pct: 0 })
      setStudents(prev => [...prev, { id: data.user!.id, nickname: newNickname, pathway: 'grow', progress_pct: 0 }])
    }
    setNewNickname(''); setShowModal(false); setAddLoading(false)
  }

  async function deleteStudent(id: string) {
    if (!confirm('Remove this student?')) return
    const supabase = createClient()
    await supabase.from('students').delete().eq('id', id)
    setStudents(prev => prev.filter(s => s.id !== id))
  }

  function copyCode() {
    if (cls) { navigator.clipboard.writeText(cls.code); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  if (loading) return <div style={{ padding: '2.5rem', color: '#9b7a55' }}>Loading class...</div>
  if (!cls) return <div style={{ padding: '2.5rem', color: '#cc2222' }}>Class not found.</div>

  return (
    <div style={{ padding: '2.5rem 3rem 4rem' }}>
      <div className="breadcrumb">
        <Link href="/teacher/classes">Manage Classes</Link> {'>'} {cls.name}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">{cls.name} ({cls.year_level})</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#3a1f0d' }}>
              Class Code:{' '}
              <span style={{ fontFamily: 'monospace', fontSize: '1.05rem', color: '#7a5230', letterSpacing: '0.1em' }}>{cls.code}</span>
            </span>
            <button onClick={copyCode} className="btn btn-outline btn-sm">
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
          {cls.focus && <p style={{ fontSize: '0.85rem', color: '#9b7a55', marginTop: 4 }}>Focus: {cls.focus}</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => setShowModal(true)} className="btn btn-amber">Add Students</button>
          <Link href={`/teacher/classes/${classId}/insights`} className="btn btn-green">Class Insights</Link>
        </div>
      </div>

      <div className="card">
        {students.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🦘</div>
            <p style={{ fontWeight: 700, color: '#7a5230', fontSize: '1.05rem', marginBottom: '0.5rem' }}>No students yet.</p>
            <p style={{ color: '#9b7a55', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Share code <strong style={{ color: '#e8a020', letterSpacing: '0.1em' }}>{cls.code}</strong> or add students manually.
            </p>
            <button onClick={() => setShowModal(true)} className="btn btn-amber">Add Students</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Progress</th>
                <th>Password</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.nickname}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
                      <div className="progress-track" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{ width: `${s.progress_pct ?? 0}%` }} />
                      </div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#7a5230', minWidth: 32 }}>
                        {s.progress_pct ?? 0}%
                      </span>
                    </div>
                  </td>
                  <td style={{ letterSpacing: '0.1em', color: '#aaa', fontFamily: 'monospace' }}>••••••••</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link href={`/teacher/classes/${classId}/students/${s.id}`} title="View insights">
                        <button className="btn-icon-green">📊</button>
                      </Link>
                      <button className="btn-icon-amber" title="Edit" onClick={() => {}}>✏️</button>
                      <button className="btn-icon-red" title="Remove" onClick={() => deleteStudent(s.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '100%', maxWidth: 420, padding: '2rem', background: '#fffcef' }}>
            <h2 className="page-title" style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>Add Student</h2>
            <p style={{ fontSize: '0.85rem', color: '#7a5230', marginBottom: '1.25rem' }}>
              Or share code <strong style={{ color: '#e8a020', letterSpacing: '0.1em' }}>{cls.code}</strong> and let students join at <strong>/join</strong>
            </p>
            <form onSubmit={addStudent} className="space-y-3">
              <input value={newNickname} onChange={(e) => setNewNickname(e.target.value)} placeholder="e.g. Kylie Kangaroo" required className="input-field" />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" disabled={addLoading} className="btn btn-amber" style={{ flex: 1 }}>{addLoading ? 'Adding...' : 'Add Student'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
