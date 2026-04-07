'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function generateClassCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function NewClassPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', yearLevel: '', focus: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const code = generateClassCode()
    const { data, error: dbErr } = await supabase
      .from('classes')
      .insert({
        name: form.name,
        year_level: form.yearLevel,
        focus: form.focus || null,
        code,
        teacher_id: user.id,
      })
      .select('id')
      .single()

    if (dbErr) { setError(dbErr.message); setLoading(false); return }
    router.push(`/teacher/classes/${data.id}`)
  }

  return (
    <div style={{ padding: '2.5rem', maxWidth: 560 }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '0.8rem', color: '#9b6f44', marginBottom: '1.25rem' }}>
        <Link href="/teacher/classes" style={{ color: '#9b6f44', textDecoration: 'none' }}>Manage Classes</Link>
        {' › '}
        <span>New Class</span>
      </div>

      <h1 style={{ fontWeight: 900, fontSize: '2rem', color: '#2e1a0e', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: '1.75rem' }}>
        Create a Class
      </h1>

      {error && (
        <div style={{ background: '#fde8e8', border: '1px solid #cc2929', borderRadius: 8, padding: '0.6rem 0.875rem', marginBottom: '1rem', color: '#cc2929', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#5c3a1e', display: 'block', marginBottom: 6 }}>
              Class Name <span style={{ color: '#cc2929' }}>*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Wombat, Kookaburra, Quoll..."
              required
              className="input-field"
            />
            <p style={{ fontSize: '0.75rem', color: '#9b6f44', marginTop: 4 }}>Australian animals make great class names!</p>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#5c3a1e', display: 'block', marginBottom: 6 }}>
              Year Level <span style={{ color: '#cc2929' }}>*</span>
            </label>
            <select name="yearLevel" value={form.yearLevel} onChange={handleChange} className="input-field" required>
              <option value="">Select year level</option>
              <option value="Year 1">Year 1</option>
              <option value="Year 2">Year 2</option>
              <option value="Year 3">Year 3</option>
              <option value="Year 4">Year 4</option>
              <option value="Year 5">Year 5</option>
              <option value="Year 6">Year 6</option>
              <option value="Year 7">Year 7</option>
              <option value="Year 8">Year 8</option>
              <option value="Year 9">Year 9</option>
              <option value="Year 10">Year 10</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#5c3a1e', display: 'block', marginBottom: 6 }}>
              Optional Focus
            </label>
            <input
              name="focus"
              value={form.focus}
              onChange={handleChange}
              placeholder="e.g. ecosystems, sustainability, marine life"
              className="input-field"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" disabled={loading} className="btn btn-amber" style={{ flex: 1, justifyContent: 'center', padding: '0.75rem' }}>
              {loading ? 'Creating...' : 'Create Class'}
            </button>
            <Link href="/teacher/classes" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '0.75rem' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
