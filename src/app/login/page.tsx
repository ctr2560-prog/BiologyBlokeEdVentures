'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
    e.preventDefault(); setError(''); setLoading(true)
    const supabase = createClient()
    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (authErr) { setError(authErr.message); setLoading(false); return }
    router.push(data.user?.user_metadata?.role === 'teacher' ? '/teacher/classes' : '/student/dashboard')
  }

  return (
    <div className="forest-bg" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', position: 'relative', zIndex: 10 }}>
        <Link href="/">
          <div style={{ background: '#fff8e8', borderRadius: 10, padding: 6, width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            <Image src="/logo.png" alt="The Biology Bloke" width={56} height={56} style={{ objectFit: 'contain' }} />
          </div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link href="/help" style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none' }}>Help</Link>
          <Link href="/login" style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none' }}>Log-in</Link>
          <Link href="/signup" className="btn btn-amber" style={{ fontSize: '0.9rem', padding: '0.5rem 1.4rem' }}>Sign Up</Link>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem 1rem 4rem', position: 'relative', zIndex: 10 }}>
        <div className="fade-in" style={{ background: '#fffcef', borderRadius: 20, padding: '2.5rem 2.25rem 2rem', width: '100%', maxWidth: 440, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
          <h1 className="font-display" style={{ textAlign: 'center', fontSize: '2.4rem', color: '#2d5a1e', letterSpacing: '0.06em', marginBottom: '1.5rem' }}>
            Log In
          </h1>
          {error && (
            <div style={{ background: '#fde8e8', border: '1px solid #cc2222', borderRadius: 8, padding: '0.6rem 0.875rem', marginBottom: '1rem', color: '#cc2222', fontSize: '0.85rem' }}>{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#3a1f0d', display: 'block', marginBottom: 5 }}>Email Address:</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Koala@example.com" required className="input-field" style={{ background: '#fffdf5' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#3a1f0d', display: 'block', marginBottom: 5 }}>Password:</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="•••••••••••••••" required className="input-field" style={{ background: '#fffdf5' }} />
            </div>
            <button type="submit" disabled={loading} className="btn btn-amber" style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem', marginTop: '0.5rem' }}>
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Link href="/signup" style={{ color: '#9b7a55', fontSize: '0.875rem', textDecoration: 'underline' }}>No account? Sign up as a teacher</Link>
            <Link href="/join" style={{ color: '#9b7a55', fontSize: '0.875rem', textDecoration: 'underline' }}>Student? Join with a class code</Link>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', paddingBottom: '2rem', position: 'relative', zIndex: 10 }}>
        <Link href="/signup" style={{ color: '#fff', fontSize: '0.9rem', textDecoration: 'underline', fontWeight: 600 }}>
          Have an account? Sign in
        </Link>
      </div>
    </div>
  )
}
