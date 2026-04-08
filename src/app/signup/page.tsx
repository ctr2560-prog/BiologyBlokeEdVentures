'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
    <div className="forest-bg" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', position: 'relative', zIndex: 10 }}>
        <Link href="/" style={{ display: 'block' }}>
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

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem 1rem 4rem', position: 'relative', zIndex: 10 }}>
        <div
          className="fade-in"
          style={{
            background: '#fffcef',
            borderRadius: 20,
            padding: '2.5rem 2.25rem 2rem',
            width: '100%',
            maxWidth: 500,
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          }}
        >
          <h1
            className="font-display"
            style={{ textAlign: 'center', fontSize: '2.4rem', color: '#2d5a1e', letterSpacing: '0.06em', marginBottom: '1.5rem' }}
          >
            Create an Account
          </h1>

          {error && (
            <div style={{ background: '#fde8e8', border: '1px solid #cc2222', borderRadius: 8, padding: '0.6rem 0.875rem', marginBottom: '1rem', color: '#cc2222', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {[
              { name: 'name',         label: 'Name:',            type: 'text',     placeholder: 'Carl Koala' },
              { name: 'email',        label: 'Email Address:',   type: 'email',    placeholder: 'Koala@example.com' },
              { name: 'school',       label: 'School Name:',     type: 'text',     placeholder: 'Your school' },
              { name: 'password',     label: 'Create a password:', type: 'password', placeholder: '•••••••••••••••' },
              { name: 'confirm',      label: 'Confirm password:', type: 'password', placeholder: '•••••••••••••••' },
            ].map((f) => (
              <div key={f.name}>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#3a1f0d', display: 'block', marginBottom: 5 }}>{f.label}</label>
                <input
                  name={f.name}
                  type={f.type}
                  value={(form as any)[f.name]}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                  required={f.name !== 'teachingFocus'}
                  className="input-field"
                  style={{ background: '#fffdf5', borderColor: '#ddd' }}
                />
              </div>
            ))}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
              <input type="checkbox" id="terms" required style={{ width: 18, height: 18, accentColor: '#e8a020', cursor: 'pointer' }} />
              <label htmlFor="terms" style={{ fontSize: '0.875rem', color: '#3a1f0d', cursor: 'pointer' }}>
                I have read and agree to the{' '}
                <span style={{ color: '#e8a020', fontWeight: 700 }}>terms of service.</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-amber"
              style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem', marginTop: '0.5rem', borderRadius: 9999 }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>

      {/* Bottom link */}
      <div style={{ textAlign: 'center', paddingBottom: '2rem', position: 'relative', zIndex: 10 }}>
        <Link href="/login" style={{ color: '#fff', fontSize: '0.9rem', textDecoration: 'underline', fontWeight: 600 }}>
          Have an account? Sign in
        </Link>
      </div>
    </div>
  )
}
