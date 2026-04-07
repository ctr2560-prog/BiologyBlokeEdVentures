import Link from 'next/link'

export default function Home() {
  return (
    <div className="forest-bg flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4">
        <div style={{ color: '#faf5e4', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Biology Bloke Edventures
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="btn btn-outline" style={{ borderColor: '#faf5e4', color: '#faf5e4' }}>
            Log In
          </Link>
          <Link href="/signup" className="btn btn-amber">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-col items-center justify-center flex-1 px-6 text-center py-24">
        <div className="fade-in" style={{ maxWidth: 720 }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌿</div>
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 900,
              color: '#faf5e4',
              lineHeight: 1.15,
              marginBottom: '1.5rem',
              fontFamily: 'Georgia, serif',
            }}
          >
            We don&apos;t just teach biology —{' '}
            <span style={{ color: '#f5a623' }}>we use nature to teach how to think.</span>
          </h1>
          <p style={{ color: '#e4dab8', fontSize: '1.15rem', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: 560, margin: '0 auto 2.5rem' }}>
            A behaviour-driven, nature-based learning platform powered by short-form media.
            Built for classrooms. Designed for curiosity.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/signup" className="btn btn-amber" style={{ padding: '0.875rem 2rem', fontSize: '0.95rem' }}>
              Start as a Teacher
            </Link>
            <Link href="/join" className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: '#faf5e4', padding: '0.875rem 2rem', fontSize: '0.95rem', borderRadius: 9999 }}>
              Join a Class (Student)
            </Link>
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-20" style={{ maxWidth: 900, width: '100%' }}>
          {[
            { icon: '🎬', title: 'Short-form Video', desc: 'Nature-based content that sparks curiosity before building understanding.' },
            { icon: '🔬', title: 'Adaptive Pathways', desc: 'The platform reads engagement signals and personalises each student\'s journey.' },
            { icon: '📊', title: 'Teacher Insights', desc: 'Actionable data translated into clear recommendations — not raw numbers.' },
          ].map((f) => (
            <div
              key={f.title}
              className="card"
              style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', padding: '1.75rem', textAlign: 'center', borderRadius: '1rem' }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{f.icon}</div>
              <h3 style={{ color: '#faf5e4', fontWeight: 800, fontSize: '1rem', marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ color: '#b8895e', fontSize: '0.875rem', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Learning loop */}
        <div className="mt-16" style={{ maxWidth: 700, width: '100%' }}>
          <p style={{ color: '#9b6f44', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
            The Learning Loop
          </p>
          <div className="flex items-center justify-center gap-1 flex-wrap" style={{ color: '#e4dab8', fontSize: '0.8rem', fontWeight: 600 }}>
            {['Experience', '→', 'Curiosity', '→', 'Understanding', '→', 'Application'].map((step, i) => (
              <span key={i} style={{ color: i % 2 === 0 ? '#f5a623' : '#9b6f44', padding: '0 2px' }}>{step}</span>
            ))}
          </div>
        </div>
      </main>

      <footer style={{ textAlign: 'center', padding: '1.5rem', color: '#7a5230', fontSize: '0.8rem' }}>
        © 2026 Biology Bloke Edventures · Built to connect students with nature
      </footer>
    </div>
  )
}
