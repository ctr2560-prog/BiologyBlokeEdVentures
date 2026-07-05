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

interface ClassQueryRow {
  id: string
  code: string
  name: string
  year_level: string
  students: { count: number }[] | null
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
        setClasses((data as ClassQueryRow[]).map((c) => ({
          id: c.id, code: c.code, name: c.name, year_level: c.year_level,
          student_count: c.students?.[0]?.count ?? 0,
        })))
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
    <div style={{ padding: '2.5rem 3rem 4rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1 className="page-title">Classes</h1>
        <Link href="/teacher/classes/new" className="btn btn-amber" style={{ fontSize: '0.85rem', padding: '0.6rem 1.4rem' }}>
          Create a Class
        </Link>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9b7a55', fontWeight: 600 }}>Loading your classes...</div>
        ) : classes.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🌿</div>
            <p style={{ color: '#7a5230', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem' }}>No classes yet.</p>
            <p style={{ color: '#9b7a55', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Create your first class to get started.</p>
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
                    <span style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '1rem', color: '#7a5230', letterSpacing: '0.05em' }}>
                      {cls.code}
                    </span>
                  </td>
                  <td>
                    <Link href={`/teacher/classes/${cls.id}`} style={{ fontWeight: 600, color: '#3a1f0d', textDecoration: 'none' }}>
                      {cls.name}
                    </Link>
                  </td>
                  <td style={{ color: '#7a5230' }}>{cls.year_level}</td>
                  <td style={{ color: cls.student_count === 0 ? '#aaa' : '#3a1f0d' }}>
                    {cls.student_count} {cls.student_count === 1 ? 'Student' : 'Students'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button className="btn-icon-amber" title="Edit" onClick={() => {}}>✏️</button>
                      <button
                        className="btn-icon-red"
                        title="Delete"
                        disabled={deleting === cls.id}
                        onClick={() => deleteClass(cls.id)}
                      >🗑️</button>
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
