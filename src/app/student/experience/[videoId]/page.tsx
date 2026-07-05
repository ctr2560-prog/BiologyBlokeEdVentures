'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getPlayableVideoUrl, getSeedVideoById, type ManagedVideo } from '@/lib/data/videoSeed'

export default function ExperiencePage() {
  const { videoId } = useParams<{ videoId: string }>()
  const router = useRouter()

  const [video, setVideo] = useState<ManagedVideo | null>(null)
  const [nextId, setNextId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<'watching' | 'curiosity' | 'checkin' | 'complete'>('watching')
  const [answer, setAnswer] = useState<string | null>(null)
  const [curiosityResponse, setCuriosityResponse] = useState('')
  const [videoProgress, setVideoProgress] = useState(0)
  const startTimeRef = useRef<number>(0)
  const progressRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    async function loadVideo() {
      startTimeRef.current = Date.now()
      const supabase = createClient()
      const { data, error } = await supabase
        .from('edventure_videos')
        .select('*')
        .eq('id', videoId)
        .eq('is_published', true)
        .single()

      const currentVideo = error ? getSeedVideoById(videoId) : (data as ManagedVideo)
      setVideo(currentVideo)

      const { data: topicVideos } = await supabase
        .from('edventure_videos')
        .select('id, sequence_index')
        .eq('stage_id', currentVideo.stage_id)
        .eq('topic_id', currentVideo.topic_id)
        .eq('is_published', true)
        .order('sequence_index')

      const sequence = topicVideos?.length
        ? topicVideos
        : [{ id: currentVideo.id, sequence_index: currentVideo.sequence_index }]
      const currentIndex = sequence.findIndex((item) => item.id === currentVideo.id)
      setNextId(sequence[currentIndex + 1]?.id ?? null)
      setLoading(false)
    }

    loadVideo()
  }, [videoId])

  useEffect(() => {
    if (phase !== 'watching' || !video) return

    progressRef.current = setInterval(() => {
      setVideoProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressRef.current!)
          return 100
        }

        const step = Math.max(2, Math.round(250 / Math.max(video.duration_seconds, 30)))
        return Math.min(100, prev + step)
      })
    }, 300)

    return () => clearInterval(progressRef.current!)
  }, [phase, video])

  async function submitWatchData(watchPct: number) {
    if (!video) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: studentRow } = await supabase
      .from('students')
      .select('class_id')
      .eq('id', user.id)
      .single()

    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
    await supabase.from('watch_events').insert({
      student_id: user.id,
      class_id: studentRow?.class_id ?? null,
      video_id: video.id,
      topic: video.title,
      watch_pct: watchPct,
      avg_time_seconds: elapsed,
      engagement_level: watchPct >= video.explore_threshold_pct ? 'high' : watchPct >= video.support_threshold_pct ? 'mid' : 'low',
      adaptive_focus: video.adaptive_focus,
      curiosity_response: curiosityResponse || null,
      check_in_correct: answer === video.correct_option,
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

  function goNext() {
    if (nextId) {
      router.push(`/student/experience/${nextId}`)
    } else {
      router.push('/student/dashboard')
    }
  }

  const phaseLabels = ['watching', 'curiosity', 'checkin', 'complete']
  const phaseIndex = phaseLabels.indexOf(phase)
  const playableUrl = getPlayableVideoUrl(video.video_url)
  const isEmbeddedFrame = playableUrl.includes('youtube.com/embed/')
  const isDirectVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(playableUrl)

  if (loading || !video) {
    return (
      <div className="experience-bg" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#faf5e4' }}>
        Loading experience…
      </div>
    )
  }

  return (
    <div className="experience-bg" style={{ minHeight: '100vh', padding: '0 0 4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Link href="/student/dashboard" style={{ color: '#9b6f44', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Dashboard
        </Link>
        <h1 style={{ color: '#faf5e4', fontWeight: 800, fontSize: '1rem' }}>{video.title}</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          {phaseLabels.slice(0, 3).map((step, i) => (
            <div
              key={step}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: i <= phaseIndex ? '#f5a623' : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {phase === 'watching' && (
          <div className="fade-in">
            <p style={{ color: '#9b6f44', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.75rem', textAlign: 'center' }}>
              Experience
            </p>

            <div style={{ marginBottom: '1rem', position: 'relative' }}>
              {isEmbeddedFrame ? (
                <iframe
                  className="video-frame"
                  src={playableUrl}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : isDirectVideo ? (
                <video className="video-frame" src={playableUrl} controls playsInline preload="metadata" />
              ) : (
                <div className="video-frame" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '5rem' }}>{video.thumbnail_emoji}</span>
                  <p style={{ color: 'rgba(255,255,255,0.84)', fontSize: '0.95rem', marginTop: '0.5rem', fontWeight: 700 }}>
                    {video.title}
                  </p>
                  <a href={video.video_url} target="_blank" rel="noreferrer" style={{ color: '#fff7ea', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    Open video source
                  </a>
                </div>
              )}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.2)' }}>
                <div style={{ height: '100%', background: '#f5a623', width: `${videoProgress}%`, transition: 'width 0.3s linear' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ color: '#9b6f44', fontSize: '0.8rem' }}>{Math.round(videoProgress)}% watched</span>
              {videoProgress >= video.explore_threshold_pct && (
                <span style={{ color: '#3a7d3e', fontSize: '0.8rem', fontWeight: 700 }}>✓ Extension-ready</span>
              )}
            </div>

            <p style={{ color: '#d1c3a6', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '1.2rem' }}>
              Prompt at {video.curiosity_prompt_at_seconds}s · Check-in at {video.check_in_at_seconds}s · Support below {video.support_threshold_pct}%
            </p>

            <button
              onClick={handlePhaseComplete}
              className="btn btn-amber"
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '1rem' }}
            >
              {videoProgress < video.explore_threshold_pct ? 'Continue to Questions →' : 'Continue to Curiosity Prompt →'}
            </button>
          </div>
        )}

        {phase === 'curiosity' && (
          <div className="fade-in">
            <p style={{ color: '#9b6f44', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '1rem', textAlign: 'center' }}>
              🌿 Curiosity Prompt
            </p>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '1.25rem', padding: '2rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.12)', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤔</div>
              <p style={{ color: '#faf5e4', fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.5, fontFamily: 'Georgia, serif' }}>
                {video.curiosity_prompt}
              </p>
            </div>
            <textarea
              value={curiosityResponse}
              onChange={(e) => setCuriosityResponse(e.target.value)}
              placeholder="Share your thoughts... (optional)"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                padding: '0.875rem',
                color: '#faf5e4',
                fontSize: '0.9rem',
                resize: 'vertical',
                minHeight: 100,
                outline: 'none',
                marginBottom: '1rem',
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

        {phase === 'checkin' && (
          <div className="fade-in">
            <p style={{ color: '#9b6f44', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '1rem', textAlign: 'center' }}>
              🔍 Quick Check-In
            </p>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '1.25rem', padding: '2rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.12)' }}>
              <p style={{ color: '#faf5e4', fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.5, marginBottom: '1.25rem' }}>
                {video.check_in_question}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {video.check_in_options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAnswer(opt)}
                    style={{
                      textAlign: 'left',
                      padding: '0.875rem 1rem',
                      borderRadius: 8,
                      border: '2px solid',
                      borderColor: answer === opt ? '#f5a623' : 'rgba(255,255,255,0.2)',
                      background: answer === opt ? 'rgba(245,166,35,0.15)' : 'rgba(255,255,255,0.05)',
                      color: '#faf5e4',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
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

        {phase === 'complete' && (
          <div className="fade-in" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>{video.thumbnail_emoji}</div>
            <h2 style={{ color: '#faf5e4', fontWeight: 900, fontSize: '1.75rem', fontFamily: 'Georgia, serif', marginBottom: '0.5rem' }}>
              Experience Complete!
            </h2>
            <p style={{ color: '#9b6f44', fontSize: '0.9rem', marginBottom: '2rem' }}>
              {answer === video.correct_option
                ? '✅ Correct answer! You\'re showing great understanding.'
                : '🌱 Keep exploring — this reel will help shape your next adaptive step.'}
            </p>

            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '1rem', padding: '1.25rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ color: '#f5a623', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                {videoProgress >= video.explore_threshold_pct ? 'Explore pathway unlocked' : videoProgress < video.support_threshold_pct ? 'Support pathway recommended' : 'Core pathway maintained'}
              </div>
              <div style={{ color: '#9b6f44', fontSize: '0.8rem' }}>{video.adaptive_focus}</div>
            </div>

            <button
              onClick={goNext}
              className="btn btn-amber"
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '1rem', marginBottom: '0.75rem' }}
            >
              {nextId ? '→ Next Experience' : '← Back to Dashboard'}
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
