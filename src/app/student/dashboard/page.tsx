'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface StudentData {
  nickname: string
  pathway: 'explore' | 'grow' | 'support'
  progress_pct: number
  class_id: string
  class_name: string
  active_edventure: string | null
  explorer_points: number
}

const pathwayInfo = {
  explore: { label: '🌿 Explore', desc: 'You\'re on the deep-dive path! Ready for the next challenge?', color: '#2d6a4f' },
  grow:    { label: '🌱 Grow',    desc: 'You\'re making great progress. Keep exploring!', color: '#52796f' },
  support: { label: '🌾 Support', desc: 'Take your time — nature reveals itself slowly.', color: '#c97f0a' },
}

const DEMO_EDVENTURE = {
  title: 'Adaptations',
  stage: 'Stage 3',
  nextVideo: { id: 'v1', title: 'Into the Jungle', duration: '2:45', icon: '🌿' },
  totalVideos: 5,
  watchedVideos: 2,
}

export default function StudentDashboard() {
  const router = useRouter()
  const [student, setStudent] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/join'); return }

      const { data: s } = await supabase
        .from('students')
        .select('*, classes(name, active_edventure)')
        .eq('id', user.id)
        .single()

      if (s) {
        setStudent({
          nickname: s.nickname,
          pathway: s.pathway ?? 'grow',
          progress_pct: s.progress_pct ?? 0,
          class_id: s.class_id,
          class_name: s.classes?.name ?? '',
          active_edventure: s.classes?.active_edventure ?? null,
          explorer_points: s.explorer_points ?? 0,
        })
      }
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="experience-bg flex items-center justify-center min-h-screen">
        <div style={{ color: '#e4dab8', fontSize: '1.1rem' }}>Loading your Edventure...</div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="experience-bg flex flex-col items-center justify-center min-h-screen" style={{ color: '#e4dab8', textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌿</div>
        <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>You haven't joined a class yet.</p>
        <Link href="/join" className="btn btn-amber">Join a Class</Link>
      </div>
    )
  }

  const pathway = pathwayInfo[student.pathway]
  const edventure = DEMO_EDVENTURE
  const progressPct = (edventure.watchedVideos / edventure.totalVideos) * 100

  return (
    <div className="experience-bg" style={{ minHeight: '100vh', padding: '0 0 4rem' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10%', padding: 4 }}>
            <img src="/logo.png" alt="Biology Bloke" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          </div>
          <span style={{ color: '#e4dab8', fontSize: '0.85rem', fontWeight: 700 }}>Biology Bloke Edventures</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#f5a623', fontWeight: 700, fontSize: '0.85rem' }}>
            ⭐ {student.explorer_points} Explorer Points
          </span>
          <button
            onClick={async () => { const s = createClient(); await s.auth.signOut(); router.push('/') }}
            style={{ color: '#9b6f44', fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Leave
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Greeting */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#9b6f44', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            Welcome back,
          </p>
          <h1 style={{ color: '#faf5e4', fontWeight: 900, fontSize: '2.25rem', fontFamily: 'Georgia, serif' }}>
            {student.nickname}
          </h1>
          <div style={{ display: 'inline-block', marginTop: '0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.35rem 0.875rem' }}>
            <span style={{ color: pathway.color, fontWeight: 700, fontSize: '0.85rem' }}>{pathway.label}</span>
          </div>
          <p style={{ color: '#b8895e', fontSize: '0.875rem', marginTop: '0.5rem' }}>{pathway.desc}</p>
        </div>

        {/* Current Edventure card */}
        <div
          style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', borderRadius: '1.25rem', padding: '1.75rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <p style={{ color: '#9b6f44', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            Current Edventure
          </p>
          <h2 style={{ color: '#faf5e4', fontWeight: 900, fontSize: '1.5rem', fontFamily: 'Georgia, serif', marginBottom: '0.25rem' }}>
            {edventure.title}
          </h2>
          <p style={{ color: '#9b6f44', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
            {edventure.stage} · {student.class_name}
          </p>

          {/* Progress */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ color: '#b8895e', fontSize: '0.8rem' }}>Your progress</span>
              <span style={{ color: '#faf5e4', fontWeight: 700, fontSize: '0.85rem' }}>
                {edventure.watchedVideos} / {edventure.totalVideos} experiences
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progressPct}%`, background: '#f5a623' }} />
            </div>
          </div>

          {/* Next video */}
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '0.875rem', padding: '1.125rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: '0.75rem', background: '#3a7d3e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', flexShrink: 0 }}>
              {edventure.nextVideo.icon}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#9b6f44', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Up next</p>
              <p style={{ color: '#faf5e4', fontWeight: 800, fontSize: '1rem' }}>{edventure.nextVideo.title}</p>
              <p style={{ color: '#9b6f44', fontSize: '0.75rem' }}>⏱ {edventure.nextVideo.duration}</p>
            </div>
          </div>

          <Link
            href={`/student/experience/${edventure.nextVideo.id}`}
            className="btn btn-amber"
            style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '1rem' }}
          >
            🌿 Start Experience
          </Link>
        </div>

        {/* Recent activity */}
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '1rem', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: '#9b6f44', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.875rem' }}>
            Completed
          </p>
          {edventure.watchedVideos === 0 ? (
            <p style={{ color: '#7a5230', fontSize: '0.875rem' }}>Nothing yet — start your first experience above!</p>
          ) : (
            Array.from({ length: edventure.watchedVideos }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: i < edventure.watchedVideos - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <span style={{ color: '#3a7d3e', fontSize: '1rem' }}>✅</span>
                <span style={{ color: '#b8895e', fontSize: '0.875rem' }}>Experience {i + 1} — Completed</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
