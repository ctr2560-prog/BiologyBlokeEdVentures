'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function JoinPage() {
  const router = useRouter()
  const [step, setStep] = useState<'code' | 'name'>('code')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [classCode, setClassCode] = useState('')
  const [classInfo, setClassInfo] = useState<{ id: string; name: string; year_level: string } | null>(null)
  const [nickname, setNickname] = useState('')

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { data: cls } = await supabase
      .from('classes')
      .select('id, name, year_level')
      .eq('code', classCode.toUpperCase().trim())
      .single()
    if (!cls) {
      setError('Class code not found. Please check with your teacher.')
      setLoading(false)
      return
    }
    setClassInfo(cls)
    setStep('name')
    setLoading(false)
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!classInfo) return
    setError('')
    setLoading(true)
    const supabase = createClient()

    // Generate a simple password for the student
    const password = Math.random().toString(36).slice(2, 10)
    const email = `${nickname.toLowerCase().replace(/\s+/g, '_')}_${classInfo.id.slice(0, 6)}@biologybloke.internal`

    const { data, error: authErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname,
          class_id: classInfo.id,
          role: 'student',
          generated_password: password,
        },
      },
    })

    if (authErr) { setError(authErr.message); setLoading(false); return }

    // Create student record
    await supabase.from('students').insert({
      id: data.user?.id,
      nickname,
      class_id: classInfo.id,
      pathway: 'grow',
    })

    router.push('/student/dashboard')
  }

  return (
    <div className="forest-bg flex flex-col min-h-screen items-center justify-center px-4">
      <div className="card fade-in" style={{ width: '100%', maxWidth: 420, padding: '2.5rem 2rem', background: '#faf5e4', borderRadius: '1.25rem' }}>
        <div className="flex justify-center mb-2">
          <span style={{ fontSize: '2.5rem' }}>🌿</span>
        </div>
        <h1 style={{ textAlign: 'center', fontWeight: 900, fontSize: '1.4rem', color: '#2e1a0e', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
          Join a Class
        </h1>
        <p style={{ textAlign: 'center', color: '#7a5230', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Enter the code your teacher gave you
        </p>

        {error && (
          <div style={{ background: '#fde8e8', border: '1px solid #cc2929', borderRadius: 8, padding: '0.6rem 0.875rem', marginBottom: '1rem', color: '#cc2929', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {step === 'code' ? (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#5c3a1e', display: 'block', marginBottom: 4 }}>Class Code</label>
              <input
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                placeholder="e.g. W7CR4"
                required
                className="input-field"
                style={{ textTransform: 'uppercase', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '0.15em', fontWeight: 700 }}
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-amber" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
              {loading ? 'Checking...' : 'Continue →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            {classInfo && (
              <div style={{ background: '#f0ead0', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: '#7a5230', fontWeight: 600 }}>Joining: </span>
                <span style={{ color: '#2e1a0e', fontWeight: 800 }}>{classInfo.name}</span>
                <span style={{ color: '#9b6f44' }}> ({classInfo.year_level})</span>
              </div>
            )}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#5c3a1e', display: 'block', marginBottom: 4 }}>Your Nickname</label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. Eric Echidna"
                required
                className="input-field"
              />
              <p style={{ fontSize: '0.75rem', color: '#9b6f44', marginTop: 4 }}>
                Pick an Australian animal name — keep it fun & safe!
              </p>
            </div>
            <button type="submit" disabled={loading} className="btn btn-green" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
              {loading ? 'Joining...' : '🌿 Start My Edventure'}
            </button>
            <button type="button" onClick={() => setStep('code')} style={{ width: '100%', textAlign: 'center', color: '#9b6f44', fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer' }}>
              ← Back
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: '#9b6f44' }}>
          Teacher?{' '}
          <Link href="/signup" style={{ color: '#e8920a', fontWeight: 700 }}>Create an account</Link>
        </p>
      </div>
    </div>
  )
}
