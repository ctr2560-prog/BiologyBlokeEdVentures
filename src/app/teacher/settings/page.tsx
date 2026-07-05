'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type ProfileForm = {
  name: string
  school: string
  yearLevel: string
  teachingFocus: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState<ProfileForm>({ name: '', school: '', yearLevel: '', teachingFocus: '' })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user: u } } = await supabase.auth.getUser()
      if (u) {
        setUser(u)
        setForm({
          name: u.user_metadata?.name ?? '',
          school: u.user_metadata?.school ?? '',
          yearLevel: u.user_metadata?.year_level ?? '',
          teachingFocus: u.user_metadata?.teaching_focus ?? '',
        })
      }
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.updateUser({
      data: { name: form.name, school: form.school, year_level: form.yearLevel, teaching_focus: form.teachingFocus },
    })
    setSaved(true)
    setLoading(false)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div style={{ padding: '2.5rem', maxWidth: 560 }}>
      <h1 style={{ fontWeight: 900, fontSize: '2rem', color: '#2e1a0e', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: '2rem' }}>
        Settings
      </h1>

      <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#5c3a1e', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Teacher Profile
        </h2>
        {saved && (
          <div style={{ background: '#d4edbc', border: '1px solid #3a7d3e', borderRadius: 8, padding: '0.6rem 0.875rem', marginBottom: '1rem', color: '#2d6a4f', fontSize: '0.85rem' }}>
            ✓ Settings saved!
          </div>
        )}
        <form onSubmit={handleSave} className="space-y-4">
          {[
            { name: 'name', label: 'Full Name', placeholder: 'Your name' },
            { name: 'school', label: 'School', placeholder: 'School name' },
            { name: 'yearLevel', label: 'Year Level', placeholder: 'e.g. Year 7–8' },
            { name: 'teachingFocus', label: 'Teaching Focus', placeholder: 'e.g. ecosystems' },
          ].map((f: { name: keyof ProfileForm; label: string; placeholder: string }) => (
            <div key={f.name}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#5c3a1e', display: 'block', marginBottom: 5 }}>{f.label}</label>
              <input
                name={f.name}
                value={form[f.name]}
                onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })}
                placeholder={f.placeholder}
                className="input-field"
              />
            </div>
          ))}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" disabled={loading} className="btn btn-amber" style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
        {user && (
          <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#9b6f44' }}>
            Logged in as: {user.email}
          </p>
        )}
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#5c3a1e', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Account
        </h2>
        <button onClick={handleLogout} className="btn btn-red" style={{ borderRadius: 8, padding: '0.6rem 1.25rem' }}>
          Log Out
        </button>
      </div>
    </div>
  )
}
