'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

interface Student {
  id: string
  nickname: string
  pathway: string
  progress_pct: number
}

interface ChartPoint {
  lesson: string
  avg: number
}

interface Insight {
  type: 'warning' | 'opportunity' | 'suggestion'
  message: string
}

interface WatchEvent {
  topic: string
  watch_pct: number | null
  avg_time_seconds: number | null
}

export default function ClassInsightsPage() {
  const { classId } = useParams<{ classId: string }>()
  const [className, setClassName] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [selected, setSelected] = useState<string>('all')
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [avgTime, setAvgTime] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: cls }, { data: studs }, { data: events }] = await Promise.all([
        supabase.from('classes').select('name').eq('id', classId).single(),
        supabase.from('students').select('id, nickname, pathway, progress_pct').eq('class_id', classId).order('nickname'),
        supabase.from('watch_events').select('*').eq('class_id', classId),
      ])

      setClassName(cls?.name ?? '')
      setStudents(studs ?? [])

      // Build chart data from events
      if (events && events.length > 0) {
        const byTopic: Record<string, number[]> = {}
        ;(events as WatchEvent[]).forEach((e) => {
          if (!byTopic[e.topic]) byTopic[e.topic] = []
          byTopic[e.topic].push(e.watch_pct ?? 0)
        })
        const points = Object.entries(byTopic).map(([topic, vals]) => ({
          lesson: topic,
          avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
        }))
        setChartData(points)
        const allVals = (events as WatchEvent[]).map((e) => e.avg_time_seconds ?? 0)
        setAvgTime(Math.round(allVals.reduce((a: number, b: number) => a + b, 0) / allVals.length))
      } else {
        // Demo data for empty state
        setChartData([
          { lesson: 'Camouflage', avg: 42 },
          { lesson: 'Structures', avg: 58 },
          { lesson: 'Pollination', avg: 35 },
          { lesson: 'Habitats', avg: 67 },
          { lesson: 'Behaviours', avg: 61 },
        ])
        setAvgTime(42)
      }

      // Generate insights
      const studsData = studs ?? []
      const low = studsData.filter((s: Student) => s.pathway === 'support').length
      const high = studsData.filter((s: Student) => s.pathway === 'explore').length
      const newInsights: Insight[] = []
      if (low > 0) newInsights.push({ type: 'warning', message: `${low} student${low > 1 ? 's' : ''} on Support pathway — consider checking in with them individually.` })
      if (high > 0) newInsights.push({ type: 'opportunity', message: `${high} student${high > 1 ? 's' : ''} on Explore pathway — ready for extension Edventures!` })
      newInsights.push({ type: 'suggestion', message: 'Class shows consistent engagement with habitat content — consider assigning the "Life in the Canopy" Edventure next.' })
      setInsights(newInsights)

      setLoading(false)
    }
    load()
  }, [classId])

  const insightIcon = (type: Insight['type']) => {
    if (type === 'warning') return '⚠️'
    if (type === 'opportunity') return '🚀'
    return '💡'
  }
  const insightColor = (type: Insight['type']) => {
    if (type === 'warning') return '#cc2929'
    if (type === 'opportunity') return '#3a7d3e'
    return '#e8920a'
  }

  if (loading) return <div style={{ padding: '2.5rem', color: '#9b6f44' }}>Loading insights...</div>

  return (
    <div style={{ padding: '2.5rem 2.5rem 4rem' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '0.8rem', color: '#9b6f44', marginBottom: '0.75rem' }}>
        <Link href="/teacher/classes" style={{ color: '#9b6f44', textDecoration: 'none' }}>Manage Classes</Link>
        {' › '}
        <Link href={`/teacher/classes/${classId}`} style={{ color: '#9b6f44', textDecoration: 'none' }}>{className}</Link>
        {' › '}
        <span>Class Insights</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">
            Class Insights
          </h1>
          <p style={{ color: '#7a5230', fontSize: '0.875rem', marginTop: 2 }}>Class: {className}</p>
        </div>
        <button
          onClick={() => window.print()}
          className="btn btn-green"
        >
          ⬇️ Download Report
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Student list */}
        <div className="card" style={{ padding: '1rem' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9b6f44', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
            Students
          </h3>
          <div className="space-y-1">
            <button
              onClick={() => setSelected('all')}
              style={{ width: '100%', textAlign: 'left', padding: '0.5rem 0.625rem', borderRadius: 6, fontSize: '0.875rem', fontWeight: selected === 'all' ? 700 : 400, background: selected === 'all' ? '#f0ead0' : 'transparent', border: 'none', cursor: 'pointer', color: '#2e1a0e' }}
            >
              📊 All Students
            </button>
            {students.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                style={{ width: '100%', textAlign: 'left', padding: '0.5rem 0.625rem', borderRadius: 6, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6, background: selected === s.id ? '#f0ead0' : 'transparent', border: 'none', cursor: 'pointer', color: '#2e1a0e', fontWeight: selected === s.id ? 700 : 400 }}
              >
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#e4dab8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>
                  {s.nickname.charAt(0)}
                </span>
                <span style={{ fontSize: '0.8rem' }}>{s.nickname}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main chart area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {[
              { label: 'Avg. Participation', value: `${avgTime}s/video`, icon: '⏱️' },
              { label: 'Explore Pathway', value: `${students.filter(s => s.pathway === 'explore').length} students`, icon: '🌿' },
              { label: 'Need Support', value: `${students.filter(s => s.pathway === 'support').length} students`, icon: '🌾' },
            ].map((stat) => (
              <div key={stat.label} className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>{stat.icon}</div>
                <div style={{ fontWeight: 900, fontSize: '1.4rem', color: '#2e1a0e' }}>{stat.value}</div>
                <div style={{ fontSize: '0.75rem', color: '#9b6f44', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, color: '#2e1a0e', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
              Class Average Engagement (%) by Topic
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4dab8" />
                <XAxis dataKey="lesson" tick={{ fontSize: 12, fill: '#7a5230' }} />
                <YAxis tick={{ fontSize: 12, fill: '#7a5230' }} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#faf5e4', border: '1px solid #b8895e', borderRadius: 8 }}
                  labelStyle={{ fontWeight: 700, color: '#2e1a0e' }}
                  formatter={(value) => [`${value}%`, 'Engagement']}
                />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#3a7d3e"
                  strokeWidth={2.5}
                  dot={{ fill: '#3a7d3e', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Insights */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, color: '#2e1a0e', marginBottom: '1rem', fontSize: '0.95rem' }}>
              🔍 Actionable Insights
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {insights.map((ins, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', gap: '0.75rem', background: '#faf5e4', borderLeft: `4px solid ${insightColor(ins.type)}`, borderRadius: 6, padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#2e1a0e' }}
                >
                  <span>{insightIcon(ins.type)}</span>
                  <span>{ins.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
