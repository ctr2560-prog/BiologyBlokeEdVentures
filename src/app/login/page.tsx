'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { data, error: authErr } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })
    if (authErr) { setError(authErr.message); setLoading(false); return }
    const role = data.user?.user_metadata?.role
    if (role === 'teacher') {
      router.push('/teacher/classes')
    } else {
      router.push('/student/dashboard')
    }
  }

  return (
    <div className="forest-bg flex flex-col min-h-screen items-center justify-center px-4 py-8">
      <div className="absolute top-4 right-6 flex gap-3">
        <Link href="/" style={{ color: '#e4dab8', fontSize: '0.85rem' }}>Help</Link>
        <Link href="/login" style={{ color: '#e4dab8', fontSize: '0.85rem' }}>Log-In</Link>
        <Link href="/signup" className="btn btn-amber btn-sm">Sign Up</Link>
      </div>

      <div
        className="card fade-in"
        style={{ width: '100%', maxWidth: 400, padding: '2.5rem 2rem', background: '#faf5e4', borderRadius: '1.25rem' }}
      >
        <div className="flex justify-center mb-1">
          <span style={{ fontSize: '2rem' }}>🐨</span>
        </div>
        <h1 style={{ textAlign: 'center', fontWeight: 900, fontSize: '1.4rem', color: '#2e1a0e', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Log In
        </h1>

        {error && (
          <div style={{ background: '#fde8e8', border: '1px solid #cc2929', borderRadius: 8, padding: '0.6rem 0.875rem', marginBottom: '1rem', color: '#cc2929', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#5c3a1e', display: 'block', marginBottom: 4 }}>Email Address</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@school.edu.au" required className="input-field" />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#5c3a1e', display: 'block', marginBottom: 4 }}>Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Your password" required className="input-field" />
          </div>
          <button type="submit" disabled={loading} className="btn btn-amber" style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem', padding: '0.75rem', fontSize: '0.9rem' }}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: '#7a5230' }}>
          No account?{' '}
          <Link href="/signup" style={{ color: '#e8920a', fontWeight: 700 }}>Sign up as a teacher</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem', color: '#7a5230' }}>
          Student?{' '}
          <Link href="/join" style={{ color: '#e8920a', fontWeight: 700 }}>Join with a class code</Link>
        </p>
      </div>
    </div>
  )
}
