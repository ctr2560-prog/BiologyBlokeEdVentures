'use client'

import { useEffect, useMemo, useState } from 'react'
import { STAGES } from '@/lib/data/programs'
import { VIDEO_SEED, formatDuration, type ManagedVideo } from '@/lib/data/videoSeed'
import { createClient } from '@/lib/supabase/client'

type VideoFormState = {
  id: string | null
  stage_id: string
  topic_id: string
  title: string
  description: string
  video_url: string
  thumbnail_emoji: string
  duration_seconds: string
  sequence_index: string
  curiosity_prompt: string
  curiosity_prompt_at_seconds: string
  check_in_question: string
  check_in_options: string
  correct_option: string
  check_in_at_seconds: string
  support_threshold_pct: string
  explore_threshold_pct: string
  adaptive_focus: string
  support_resource_url: string
  explore_resource_url: string
  is_published: boolean
}

const defaultStage = STAGES[2]?.id ?? STAGES[0].id
const defaultTopic = STAGES[2]?.topics[0]?.id ?? STAGES[0].topics[0].id

function emptyForm(): VideoFormState {
  return {
    id: null,
    stage_id: defaultStage,
    topic_id: defaultTopic,
    title: '',
    description: '',
    video_url: '',
    thumbnail_emoji: '🌿',
    duration_seconds: '120',
    sequence_index: '1',
    curiosity_prompt: '',
    curiosity_prompt_at_seconds: '60',
    check_in_question: '',
    check_in_options: 'Option 1\nOption 2\nOption 3\nOption 4',
    correct_option: '',
    check_in_at_seconds: '95',
    support_threshold_pct: '40',
    explore_threshold_pct: '80',
    adaptive_focus: '',
    support_resource_url: '',
    explore_resource_url: '',
    is_published: true,
  }
}

function formFromVideo(video: ManagedVideo): VideoFormState {
  return {
    id: video.id,
    stage_id: video.stage_id,
    topic_id: video.topic_id,
    title: video.title,
    description: video.description,
    video_url: video.video_url,
    thumbnail_emoji: video.thumbnail_emoji,
    duration_seconds: String(video.duration_seconds),
    sequence_index: String(video.sequence_index),
    curiosity_prompt: video.curiosity_prompt,
    curiosity_prompt_at_seconds: String(video.curiosity_prompt_at_seconds),
    check_in_question: video.check_in_question,
    check_in_options: video.check_in_options.join('\n'),
    correct_option: video.correct_option,
    check_in_at_seconds: String(video.check_in_at_seconds),
    support_threshold_pct: String(video.support_threshold_pct),
    explore_threshold_pct: String(video.explore_threshold_pct),
    adaptive_focus: video.adaptive_focus,
    support_resource_url: video.support_resource_url ?? '',
    explore_resource_url: video.explore_resource_url ?? '',
    is_published: video.is_published,
  }
}

function topicOptions(stageId: string) {
  return STAGES.find((stage) => stage.id === stageId)?.topics ?? []
}

export default function ContentStudioPage() {
  const [videos, setVideos] = useState<ManagedVideo[]>([])
  const [form, setForm] = useState<VideoFormState>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [dbReady, setDbReady] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('edventure_videos')
        .select('*')
        .order('stage_id')
        .order('topic_id')
        .order('sequence_index')

      if (error) {
        setDbReady(false)
        setVideos(VIDEO_SEED)
      } else {
        setVideos((data as ManagedVideo[]) ?? [])
      }

      setLoading(false)
    }

    load()
  }, [])

  const selectedTopics = useMemo(() => topicOptions(form.stage_id), [form.stage_id])
  const filteredVideos = useMemo(
    () => videos.filter((video) => video.stage_id === form.stage_id && video.topic_id === form.topic_id),
    [videos, form.stage_id, form.topic_id]
  )

  const publishedCount = videos.filter((video) => video.is_published).length
  const averageDuration = videos.length
    ? Math.round(videos.reduce((sum, video) => sum + video.duration_seconds, 0) / videos.length)
    : 0

  function updateForm<K extends keyof VideoFormState>(key: K, value: VideoFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function resetForm() {
    setForm(emptyForm())
    setStatus(null)
  }

  function editVideo(video: ManagedVideo) {
    setForm(formFromVideo(video))
    setStatus(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveVideo(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setStatus(null)

    const options = form.check_in_options
      .split('\n')
      .map((option) => option.trim())
      .filter(Boolean)

    const payload = {
      stage_id: form.stage_id,
      topic_id: form.topic_id,
      title: form.title.trim(),
      description: form.description.trim(),
      video_url: form.video_url.trim(),
      thumbnail_emoji: form.thumbnail_emoji.trim() || '🌿',
      duration_seconds: Number(form.duration_seconds),
      sequence_index: Number(form.sequence_index),
      curiosity_prompt: form.curiosity_prompt.trim(),
      curiosity_prompt_at_seconds: Number(form.curiosity_prompt_at_seconds),
      check_in_question: form.check_in_question.trim(),
      check_in_options: options,
      correct_option: form.correct_option.trim(),
      check_in_at_seconds: Number(form.check_in_at_seconds),
      support_threshold_pct: Number(form.support_threshold_pct),
      explore_threshold_pct: Number(form.explore_threshold_pct),
      adaptive_focus: form.adaptive_focus.trim(),
      support_resource_url: form.support_resource_url.trim() || null,
      explore_resource_url: form.explore_resource_url.trim() || null,
      is_published: form.is_published,
    }

    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    const teacherId = userData.user?.id

    if (!teacherId) {
      setSaving(false)
      setStatus('Log in again to save video content.')
      return
    }

    const query = form.id
      ? supabase.from('edventure_videos').update(payload).eq('id', form.id).select().single()
      : supabase.from('edventure_videos').insert({ ...payload, teacher_id: teacherId }).select().single()

    const { data, error } = await query

    if (error) {
      setDbReady(false)
      setStatus('Save failed. Run the updated Supabase schema to enable the video library.')
      setSaving(false)
      return
    }

    const saved = data as ManagedVideo
    setVideos((current) => {
      const next = form.id
        ? current.map((video) => (video.id === saved.id ? saved : video))
        : [...current, saved]
      return next.sort((a, b) =>
        a.stage_id.localeCompare(b.stage_id) ||
        a.topic_id.localeCompare(b.topic_id) ||
        a.sequence_index - b.sequence_index
      )
    })
    setForm(formFromVideo(saved))
    setDbReady(true)
    setStatus(form.id ? 'Video updated.' : 'Video added to the studio.')
    setSaving(false)
  }

  async function deleteVideo(id: string) {
    if (!confirm('Delete this video from the content studio?')) return

    setDeleting(id)
    const supabase = createClient()
    const { error } = await supabase.from('edventure_videos').delete().eq('id', id)

    if (error) {
      setStatus('Delete failed. Run the updated Supabase schema first.')
      setDeleting(null)
      return
    }

    setVideos((current) => current.filter((video) => video.id !== id))
    if (form.id === id) resetForm()
    setDeleting(null)
    setStatus('Video removed.')
  }

  return (
    <div style={{ padding: '2.25rem 2.5rem 4rem' }}>
      <div className="studio-hero">
        <section className="studio-banner">
          <div className="studio-pill">Admin Portal</div>
          <h1 style={{ fontSize: 'clamp(2.3rem, 4vw, 4rem)', lineHeight: 0.95, marginTop: '0.85rem', marginBottom: '0.9rem', fontFamily: 'var(--font-bangers, cursive)', letterSpacing: '0.05em' }}>
            Content Studio
          </h1>
          <p style={{ maxWidth: 620, color: 'rgba(255,247,234,0.88)', fontSize: '1rem', lineHeight: 1.7 }}>
            Build the adaptive engine from one place. Add videos, set curiosity and check-in timings, and control the watch thresholds that decide when a learner needs support or extension.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
            <div className="studio-pill">Timing-Driven Pathways</div>
            <div className="studio-pill">Teacher Managed</div>
            <div className="studio-pill">Student Ready</div>
          </div>
        </section>

        <section className="studio-stat-grid">
          <div className="studio-stat">
            <div style={{ color: '#8b5e3c', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Video Library</div>
            <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#2f1c10', marginTop: '0.35rem' }}>{videos.length}</div>
            <p style={{ color: '#7a5230', fontSize: '0.88rem', marginTop: '0.4rem' }}>Managed adaptive reels across all stages and topics.</p>
          </div>
          <div className="studio-stat">
            <div style={{ color: '#8b5e3c', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Published</div>
            <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#2f1c10', marginTop: '0.35rem' }}>{publishedCount}</div>
            <p style={{ color: '#7a5230', fontSize: '0.88rem', marginTop: '0.4rem' }}>Visible to students right now.</p>
          </div>
          <div className="studio-stat">
            <div style={{ color: '#8b5e3c', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Average Length</div>
            <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#2f1c10', marginTop: '0.35rem' }}>{formatDuration(averageDuration || 0)}</div>
            <p style={{ color: '#7a5230', fontSize: '0.88rem', marginTop: '0.4rem' }}>Optimised for short-form viewing in class.</p>
          </div>
          <div className="studio-stat">
            <div style={{ color: '#8b5e3c', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Schema Status</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: dbReady ? '#2d6a4f' : '#b2561b', marginTop: '0.55rem' }}>
              {dbReady ? 'Connected' : 'Seed Mode'}
            </div>
            <p style={{ color: '#7a5230', fontSize: '0.88rem', marginTop: '0.4rem' }}>
              {dbReady ? 'Supabase video library is ready.' : 'Apply `supabase/schema.sql` to persist content changes.'}
            </p>
          </div>
        </section>
      </div>

      <div className="studio-layout">
        <section className="card" style={{ padding: '1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ color: '#8b5e3c', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Video Library</p>
              <h2 style={{ fontSize: '1.45rem', color: '#2f1c10', fontWeight: 900 }}>Stage and topic sequence</h2>
            </div>
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <select
                className="input-field"
                value={form.stage_id}
                onChange={(e) => {
                  const nextStage = e.target.value
                  const nextTopic = topicOptions(nextStage)[0]?.id ?? ''
                  setForm((current) => ({ ...current, stage_id: nextStage, topic_id: nextTopic }))
                }}
                style={{ minWidth: 160 }}
              >
                {STAGES.map((stage) => (
                  <option key={stage.id} value={stage.id}>{stage.label} · {stage.years}</option>
                ))}
              </select>
              <select className="input-field" value={form.topic_id} onChange={(e) => updateForm('topic_id', e.target.value)} style={{ minWidth: 180 }}>
                {selectedTopics.map((topic) => (
                  <option key={topic.id} value={topic.id}>{topic.label}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="studio-empty">Loading managed content…</div>
          ) : filteredVideos.length === 0 ? (
            <div className="studio-empty">
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎬</div>
              <h3 style={{ fontSize: '1.05rem', color: '#3a1f0d', fontWeight: 900, marginBottom: '0.35rem' }}>No videos in this topic yet</h3>
              <p style={{ color: '#7a5230', fontSize: '0.9rem' }}>Use the editor to add the first reel and set the adaptive timing rules.</p>
            </div>
          ) : (
            <div className="studio-list">
              {filteredVideos.map((video) => (
                <article key={video.id} className="studio-video-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.8rem' }}>{video.thumbnail_emoji}</span>
                        <div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#2f1c10' }}>{video.sequence_index}. {video.title}</h3>
                          <p style={{ color: '#7a5230', fontSize: '0.84rem' }}>{formatDuration(video.duration_seconds)} · Prompt at {video.curiosity_prompt_at_seconds}s · Check-in at {video.check_in_at_seconds}s</p>
                        </div>
                      </div>
                      <p style={{ color: '#5d3a21', fontSize: '0.92rem', lineHeight: 1.6, marginTop: '0.75rem' }}>{video.description}</p>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.85rem' }}>
                        <span className="badge badge-support">Support below {video.support_threshold_pct}%</span>
                        <span className="badge badge-grow">Core journey</span>
                        <span className="badge badge-explore">Explore above {video.explore_threshold_pct}%</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                      <button className="btn btn-amber btn-sm" onClick={() => editVideo(video)}>Edit</button>
                      <button className="btn btn-outline btn-sm" onClick={() => window.open(`/student/experience/${video.id}`, '_blank')}>Preview</button>
                      <button className="btn btn-red btn-sm" disabled={deleting === video.id} onClick={() => deleteVideo(video.id)}>
                        {deleting === video.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="studio-form">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'start', marginBottom: '1rem' }}>
            <div>
              <p style={{ color: '#8b5e3c', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {form.id ? 'Edit video' : 'New video'}
              </p>
              <h2 style={{ fontSize: '1.35rem', color: '#2f1c10', fontWeight: 900 }}>
                {form.id ? form.title || 'Video setup' : 'Adaptive reel builder'}
              </h2>
            </div>
            <button className="btn btn-outline btn-sm" type="button" onClick={resetForm}>Reset</button>
          </div>

          {status && (
            <div style={{ marginBottom: '0.9rem', borderRadius: 14, padding: '0.8rem 0.95rem', background: 'rgba(232,160,32,0.12)', color: '#6c431a', fontSize: '0.88rem', fontWeight: 700 }}>
              {status}
            </div>
          )}

          <form onSubmit={saveVideo} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="studio-field-grid">
              <label>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#5c3a1e', display: 'block', marginBottom: 6 }}>Stage</span>
                <select
                  className="input-field"
                  value={form.stage_id}
                  onChange={(e) => {
                    const nextStage = e.target.value
                    const nextTopic = topicOptions(nextStage)[0]?.id ?? ''
                    setForm((current) => ({ ...current, stage_id: nextStage, topic_id: nextTopic }))
                  }}
                >
                  {STAGES.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
                </select>
              </label>
              <label>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#5c3a1e', display: 'block', marginBottom: 6 }}>Topic</span>
                <select className="input-field" value={form.topic_id} onChange={(e) => updateForm('topic_id', e.target.value)}>
                  {selectedTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.label}</option>)}
                </select>
              </label>
            </div>

            <label>
              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#5c3a1e', display: 'block', marginBottom: 6 }}>Video title</span>
              <input className="input-field" value={form.title} onChange={(e) => updateForm('title', e.target.value)} required />
            </label>

            <label>
              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#5c3a1e', display: 'block', marginBottom: 6 }}>Description</span>
              <textarea className="input-field" value={form.description} onChange={(e) => updateForm('description', e.target.value)} rows={3} />
            </label>

            <div className="studio-field-grid">
              <label>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#5c3a1e', display: 'block', marginBottom: 6 }}>Video URL</span>
                <input className="input-field" value={form.video_url} onChange={(e) => updateForm('video_url', e.target.value)} placeholder="YouTube or hosted URL" required />
              </label>
              <label>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#5c3a1e', display: 'block', marginBottom: 6 }}>Thumbnail emoji</span>
                <input className="input-field" value={form.thumbnail_emoji} onChange={(e) => updateForm('thumbnail_emoji', e.target.value)} maxLength={4} />
              </label>
            </div>

            <div className="studio-field-grid">
              <label>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#5c3a1e', display: 'block', marginBottom: 6 }}>Duration (seconds)</span>
                <input className="input-field" type="number" min={15} value={form.duration_seconds} onChange={(e) => updateForm('duration_seconds', e.target.value)} required />
              </label>
              <label>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#5c3a1e', display: 'block', marginBottom: 6 }}>Sequence</span>
                <input className="input-field" type="number" min={1} value={form.sequence_index} onChange={(e) => updateForm('sequence_index', e.target.value)} required />
              </label>
            </div>

            <label>
              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#5c3a1e', display: 'block', marginBottom: 6 }}>Curiosity prompt</span>
              <textarea className="input-field" value={form.curiosity_prompt} onChange={(e) => updateForm('curiosity_prompt', e.target.value)} rows={3} required />
            </label>

            <div className="studio-field-grid">
              <label>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#5c3a1e', display: 'block', marginBottom: 6 }}>Prompt appears at (s)</span>
                <input className="input-field" type="number" min={0} value={form.curiosity_prompt_at_seconds} onChange={(e) => updateForm('curiosity_prompt_at_seconds', e.target.value)} required />
              </label>
              <label>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#5c3a1e', display: 'block', marginBottom: 6 }}>Check-in appears at (s)</span>
                <input className="input-field" type="number" min={0} value={form.check_in_at_seconds} onChange={(e) => updateForm('check_in_at_seconds', e.target.value)} required />
              </label>
            </div>

            <label>
              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#5c3a1e', display: 'block', marginBottom: 6 }}>Check-in question</span>
              <textarea className="input-field" value={form.check_in_question} onChange={(e) => updateForm('check_in_question', e.target.value)} rows={2} required />
            </label>

            <label>
              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#5c3a1e', display: 'block', marginBottom: 6 }}>Check-in options</span>
              <textarea className="input-field" value={form.check_in_options} onChange={(e) => updateForm('check_in_options', e.target.value)} rows={4} required />
            </label>

            <label>
              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#5c3a1e', display: 'block', marginBottom: 6 }}>Correct option</span>
              <input className="input-field" value={form.correct_option} onChange={(e) => updateForm('correct_option', e.target.value)} required />
            </label>

            <div className="studio-field-grid">
              <label>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#5c3a1e', display: 'block', marginBottom: 6 }}>Support below (%)</span>
                <input className="input-field" type="number" min={0} max={100} value={form.support_threshold_pct} onChange={(e) => updateForm('support_threshold_pct', e.target.value)} required />
              </label>
              <label>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#5c3a1e', display: 'block', marginBottom: 6 }}>Explore above (%)</span>
                <input className="input-field" type="number" min={0} max={100} value={form.explore_threshold_pct} onChange={(e) => updateForm('explore_threshold_pct', e.target.value)} required />
              </label>
            </div>

            <label>
              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#5c3a1e', display: 'block', marginBottom: 6 }}>Adaptive focus</span>
              <input className="input-field" value={form.adaptive_focus} onChange={(e) => updateForm('adaptive_focus', e.target.value)} placeholder="What this reel helps diagnose or deepen" />
            </label>

            <div className="studio-field-grid">
              <label>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#5c3a1e', display: 'block', marginBottom: 6 }}>Support resource URL</span>
                <input className="input-field" value={form.support_resource_url} onChange={(e) => updateForm('support_resource_url', e.target.value)} />
              </label>
              <label>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#5c3a1e', display: 'block', marginBottom: 6 }}>Explore resource URL</span>
                <input className="input-field" value={form.explore_resource_url} onChange={(e) => updateForm('explore_resource_url', e.target.value)} />
              </label>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#5c3a1e', fontWeight: 800, fontSize: '0.88rem' }}>
              <input type="checkbox" checked={form.is_published} onChange={(e) => updateForm('is_published', e.target.checked)} />
              Published for student viewing
            </label>

            <button className="btn btn-amber" type="submit" disabled={saving} style={{ width: '100%', justifyContent: 'center', padding: '0.82rem 1rem' }}>
              {saving ? 'Saving…' : form.id ? 'Update video' : 'Add video'}
            </button>
          </form>
        </aside>
      </div>
    </div>
  )
}
