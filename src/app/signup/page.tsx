'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '',
    school: '', yearLevel: '', teachingFocus: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error: authErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
          school: form.school,
          year_level: form.yearLevel,
          teaching_focus: form.teachingFocus,
          role: 'teacher',
        },
      },
    })
    if (authErr) { setError(authErr.message); setLoading(false); return }
    router.push('/teacher/classes')
  }

  return (
    <div className="forest-bg flex flex-col min-h-screen items-center justify-center px-4 py-8">
      {/* Top bar */}
      <div className="absolute top-4 right-6 flex gap-3">
        <Link href="/" style={{ color: '#e4dab8', fontSize: '0.85rem' }}>Help</Link>
        <Link href="/login" style={{ color: '#e4dab8', fontSize: '0.85rem' }}>Log-In</Link>
        <Link href="/signup" className="btn btn-amber btn-sm">Sign Up</Link>
      </div>

      <div
        className="card fade-in"
        style={{ width: '100%', maxWidth: 440, padding: '2.5rem 2rem', background: '#faf5e4', borderRadius: '1.25rem' }}
      >
        <div className="flex justify-center mb-3">
          <Logo href="/" size="md" variant="light" />
        </div>
        <h1 style={{ textAlign: 'center', fontWeight: 900, fontSize: '1.4rem', color: '#2e1a0e', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Create an Account
        </h1>

        {error && (
          <div style={{ background: '#fde8e8', border: '1px solid #cc2929', borderRadius: 8, padding: '0.6rem 0.875rem', marginBottom: '1rem', color: '#cc2929', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#5c3a1e', display: 'block', marginBottom: 4 }}>Name</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" required className="input-field" />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#5c3a1e', display: 'block', marginBottom: 4 }}>Email Address</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@school.edu.au" required className="input-field" />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#5c3a1e', display: 'block', marginBottom: 4 }}>School Name</label>
            <input name="school" value={form.school} onChange={handleChange} placeholder="Your school" required className="input-field" />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#5c3a1e', display: 'block', marginBottom: 4 }}>Year Level(s) Taught</label>
            <select name="yearLevel" value={form.yearLevel} onChange={handleChange} className="input-field" required>
              <option value="">Select year level</option>
              <option value="K-2">K–2</option>
              <option value="3-4">Year 3–4</option>
              <option value="5-6">Year 5–6</option>
              <option value="7-8">Year 7–8</option>
              <option value="9-10">Year 9–10</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#5c3a1e', display: 'block', marginBottom: 4 }}>Teaching Focus (optional)</label>
            <input name="teachingFocus" value={form.teachingFocus} onChange={handleChange} placeholder="e.g. ecosystems, sustainability" className="input-field" />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#5c3a1e', display: 'block', marginBottom: 4 }}>Create a Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min. 8 characters" required className="input-field" />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#5c3a1e', display: 'block', marginBottom: 4 }}>Confirm Password</label>
            <input name="confirm" type="password" value={form.confirm} onChange={handleChange} placeholder="Repeat password" required className="input-field" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <input type="checkbox" id="terms" required style={{ accentColor: '#e8920a' }} />
            <label htmlFor="terms" style={{ fontSize: '0.8rem', color: '#7a5230' }}>
              I have read and agree to the <span style={{ textDecoration: 'underline' }}>terms of service</span>
            </label>
          </div>

          <button type="submit" disabled={loading} className="btn btn-amber" style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem', padding: '0.75rem', fontSize: '0.9rem' }}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: '#7a5230' }}>
          Have an account?{' '}
          <Link href="/login" style={{ color: '#e8920a', fontWeight: 700 }}>Log in</Link>
        </p>
      </div>
    </div>
  )
}
