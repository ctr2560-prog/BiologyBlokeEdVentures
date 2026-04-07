'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface ClassRow {
  id: string
  code: string
  name: string
  year_level: string
  student_count: number
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('classes')
        .select('id, code, name, year_level, students(count)')
        .order('created_at', { ascending: false })

      if (data) {
        setClasses(
          data.map((c: any) => ({
            id: c.id,
            code: c.code,
            name: c.name,
            year_level: c.year_level,
            student_count: c.students?.[0]?.count ?? 0,
          }))
        )
      }
      setLoading(false)
    }
    load()
  }, [])

  async function deleteClass(id: string) {
    if (!confirm('Delete this class and all its students?')) return
    setDeleting(id)
    const supabase = createClient()
    await supabase.from('classes').delete().eq('id', id)
    setClasses((prev) => prev.filter((c) => c.id !== id))
    setDeleting(null)
  }

  return (
    <div style={{ padding: '2.5rem 2.5rem 4rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1 style={{ fontWeight: 900, fontSize: '2rem', color: '#2e1a0e', textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: 'Georgia, serif' }}>
          Classes
        </h1>
        <Link href="/teacher/classes/new" className="btn btn-amber">
          + Create a Class
        </Link>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9b6f44' }}>Loading your classes...</div>
        ) : classes.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌿</div>
            <p style={{ color: '#7a5230', fontWeight: 600 }}>No classes yet.</p>
            <p style={{ color: '#9b6f44', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Create your first class to get started.</p>
            <Link href="/teacher/classes/new" className="btn btn-amber">Create a Class</Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Class ID</th>
                <th>Class Name</th>
                <th>Year Group</th>
                <th>Students</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr key={cls.id}>
                  <td>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#5c3a1e', fontSize: '0.95rem' }}>
                      {cls.code}
                    </span>
                  </td>
                  <td>
                    <Link href={`/teacher/classes/${cls.id}`} style={{ fontWeight: 700, color: '#2e1a0e', textDecoration: 'none' }}>
                      {cls.name}
                    </Link>
                  </td>
                  <td>{cls.year_level}</td>
                  <td>
                    <span style={{ color: cls.student_count === 0 ? '#9b6f44' : '#2e1a0e' }}>
                      {cls.student_count} {cls.student_count === 1 ? 'Student' : 'Students'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link href={`/teacher/classes/${cls.id}`} className="btn btn-amber btn-icon btn-sm" title="Edit">
                        ✏️
                      </Link>
                      <button
                        onClick={() => deleteClass(cls.id)}
                        disabled={deleting === cls.id}
                        className="btn btn-red btn-icon"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
