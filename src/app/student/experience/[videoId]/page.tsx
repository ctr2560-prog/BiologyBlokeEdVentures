'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const VIDEOS: Record<string, { title: string; curiosityPrompt: string; checkIn: { question: string; options: string[] }; nextId: string | null }> = {
  v1: {
    title: 'Into the Jungle',
    curiosityPrompt: 'Why do you think some animals are so hard to spot in the jungle?',
    checkIn: {
      question: 'What is camouflage?',
      options: ['A way to hide by blending in', 'A type of animal movement', 'A sound animals make', 'A kind of food'],
    },
    nextId: 'v2',
  },
  v2: {
    title: 'Masters of Camouflage',
    curiosityPrompt: 'If you were an animal, what habitat would your camouflage suit best?',
    checkIn: {
      question: 'Which animal uses camouflage as a predator (not prey)?',
      options: ['Leaf insect', 'Leopard', 'Stick bug', 'Flatfish'],
    },
    nextId: 'v3',
  },
  v3: {
    title: 'Built to Survive',
    curiosityPrompt: 'What physical adaptation would YOU want if you had to survive in the rainforest?',
    checkIn: {
      question: 'A structural adaptation is:',
      options: ['A body part that helps survival', 'A behaviour learnt from parents', 'A change in environment', 'A type of migration'],
    },
    nextId: null,
  },
}

export default function ExperiencePage() {
  const { videoId } = useParams<{ videoId: string }>()
  const router = useRouter()
  const video = VIDEOS[videoId] ?? VIDEOS['v1']

  const [phase, setPhase] = useState<'watching' | 'curiosity' | 'checkin' | 'complete'>('watching')
  const [startTime] = useState(Date.now())
  const [answer, setAnswer] = useState<string | null>(null)
  const [reflection, setReflection] = useState('')
  const [curiosityResponse, setCuriosityResponse] = useState('')
  const [videoProgress, setVideoProgress] = useState(0)
  const progressRef = useRef<NodeJS.Timeout | null>(null)

  // Simulate video progress
  useEffect(() => {
    if (phase !== 'watching') return
    progressRef.current = setInterval(() => {
      setVideoProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressRef.current!)
          return 100
        }
        return prev + 2
      })
    }, 300)
    return () => clearInterval(progressRef.current!)
  }, [phase])

  async function submitWatchData(watchPct: number) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const elapsed = Math.round((Date.now() - startTime) / 1000)
    await supabase.from('watch_events').insert({
      student_id: user.id,
      video_id: videoId,
      topic: video.title,
      watch_pct: watchPct,
      avg_time_seconds: elapsed,
      engagement_level: watchPct >= 80 ? 'high' : watchPct >= 40 ? 'mid' : 'low',
      adaptive_focus: video.title,
      curiosity_response: curiosityResponse || null,
      check_in_correct: answer === video.checkIn.options[0],
    })
  }

  async function handlePhaseComplete() {
    if (phase === 'watching') {
      clearInterval(progressRef.current!)
      setPhase('curiosity')
    } else if (phase === 'curiosity') {
      setPhase('checkin')
    } else if (phase === 'checkin') {
      await submitWatchData(videoProgress)
      setPhase('complete')
    }
  }

  async function goNext() {
    if (video.nextId) {
      router.push(`/student/experience/${video.nextId}`)
    } else {
      router.push('/student/dashboard')
    }
  }

  const phaseLabels = ['watching', 'curiosity', 'checkin', 'complete']
  const phaseIndex = phaseLabels.indexOf(phase)

  return (
    <div className="experience-bg" style={{ minHeight: '100vh', padding: '0 0 4rem' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Link href="/student/dashboard" style={{ color: '#9b6f44', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Dashboard
        </Link>
        <h1 style={{ color: '#faf5e4', fontWeight: 800, fontSize: '1rem' }}>{video.title}</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          {phaseLabels.slice(0, 3).map((p, i) => (
            <div
              key={p}
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: i <= phaseIndex ? '#f5a623' : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* ── WATCHING phase ── */}
        {phase === 'watching' && (
          <div className="fade-in">
            <p style={{ color: '#9b6f44', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.75rem', textAlign: 'center' }}>
              Experience
            </p>

            {/* Video placeholder */}
            <div
              style={{
                borderRadius: '1rem',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #1a3a1a 0%, #2d5a1e 100%)',
                aspectRatio: '16/9',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '5rem' }}>🌿</span>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                {video.title}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                [Your video content goes here]
              </p>
              {/* Progress bar at bottom */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.2)' }}>
                <div style={{ height: '100%', background: '#f5a623', width: `${videoProgress}%`, transition: 'width 0.3s linear' }} />
              </div>
            </div>

            {/* Video progress info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ color: '#9b6f44', fontSize: '0.8rem' }}>{Math.round(videoProgress)}% watched</span>
              {videoProgress >= 80 && (
                <span style={{ color: '#3a7d3e', fontSize: '0.8rem', fontWeight: 700 }}>✓ Great watch!</span>
              )}
            </div>

            <button
              onClick={handlePhaseComplete}
              className="btn btn-amber"
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '1rem' }}
            >
              {videoProgress < 80 ? 'Skip to Questions →' : 'Continue to Curiosity Prompt →'}
            </button>
          </div>
        )}

        {/* ── CURIOSITY phase ── */}
        {phase === 'curiosity' && (
          <div className="fade-in">
            <p style={{ color: '#9b6f44', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '1rem', textAlign: 'center' }}>
              🌿 Curiosity Prompt
            </p>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '1.25rem', padding: '2rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.12)', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤔</div>
              <p style={{ color: '#faf5e4', fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.5, fontFamily: 'Georgia, serif' }}>
                {video.curiosityPrompt}
              </p>
            </div>
            <textarea
              value={curiosityResponse}
              onChange={(e) => setCuriosityResponse(e.target.value)}
              placeholder="Share your thoughts... (optional)"
              style={{
                width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8, padding: '0.875rem', color: '#faf5e4', fontSize: '0.9rem',
                resize: 'vertical', minHeight: 100, outline: 'none', marginBottom: '1rem',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handlePhaseComplete}
              className="btn btn-amber"
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '1rem' }}
            >
              Continue to Check-In →
            </button>
          </div>
        )}

        {/* ── CHECK-IN phase ── */}
        {phase === 'checkin' && (
          <div className="fade-in">
            <p style={{ color: '#9b6f44', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '1rem', textAlign: 'center' }}>
              🔍 Quick Check-In
            </p>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '1.25rem', padding: '2rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.12)' }}>
              <p style={{ color: '#faf5e4', fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.5, marginBottom: '1.25rem' }}>
                {video.checkIn.question}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {video.checkIn.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAnswer(opt)}
                    style={{
                      textAlign: 'left', padding: '0.875rem 1rem', borderRadius: 8, border: '2px solid',
                      borderColor: answer === opt ? '#f5a623' : 'rgba(255,255,255,0.2)',
                      background: answer === opt ? 'rgba(245,166,35,0.15)' : 'rgba(255,255,255,0.05)',
                      color: '#faf5e4', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handlePhaseComplete}
              disabled={!answer}
              className="btn btn-amber"
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '1rem' }}
            >
              Submit →
            </button>
          </div>
        )}

        {/* ── COMPLETE phase ── */}
        {phase === 'complete' && (
          <div className="fade-in" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🌿</div>
            <h2 style={{ color: '#faf5e4', fontWeight: 900, fontSize: '1.75rem', fontFamily: 'Georgia, serif', marginBottom: '0.5rem' }}>
              Experience Complete!
            </h2>
            <p style={{ color: '#9b6f44', fontSize: '0.9rem', marginBottom: '2rem' }}>
              {answer === video.checkIn.options[0]
                ? '✅ Correct answer! You\'re showing great understanding.'
                : '🌱 Keep exploring — the answer was the first option. Don\'t worry, that\'s what learning is for!'}
            </p>

            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '1rem', padding: '1.25rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ color: '#f5a623', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>+10 Explorer Points</div>
              <div style={{ color: '#9b6f44', fontSize: '0.8rem' }}>Added to your total</div>
            </div>

            <button
              onClick={goNext}
              className="btn btn-amber"
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '1rem', marginBottom: '0.75rem' }}
            >
              {video.nextId ? '→ Next Experience' : '← Back to Dashboard'}
            </button>
            <Link href="/student/dashboard" style={{ color: '#9b6f44', fontSize: '0.85rem', textDecoration: 'none' }}>
              Return to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
