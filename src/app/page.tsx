import Link from 'next/link'
import Image from 'next/image'

const highlights = [
  'Teachers create classes and assign Edventures',
  'Students watch short-form biology videos',
  'Adaptive prompts and check-ins personalise the pathway',
]

const pathwayCards = [
  { label: 'Support', tone: '#d6b46a', copy: 'Simpler explanations and scaffolded next steps.' },
  { label: 'Grow', tone: '#7fb36f', copy: 'Core sequence for steady classroom progression.' },
  { label: 'Explore', tone: '#8bb8d8', copy: 'Extension challenges for highly curious learners.' },
]

export default function Home() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#986233',
        backgroundImage: `
          radial-gradient(circle at 15% 18%, rgba(162, 140, 58, 0.35), transparent 18%),
          radial-gradient(circle at 82% 12%, rgba(123, 95, 38, 0.28), transparent 14%),
          linear-gradient(180deg, rgba(91, 67, 19, 0.18), rgba(91, 67, 19, 0.18))
        `,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '0 0 auto 0',
          height: 270,
          background: 'url(/trees.png) center top / cover repeat-x',
          opacity: 0.52,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 'auto 0 0 0',
          height: 320,
          background: 'url(/trees.png) center bottom / cover repeat-x',
          opacity: 0.48,
          pointerEvents: 'none',
          transform: 'scaleY(1.15)',
        }}
      />

      <nav
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: '1.7rem 1.9rem 0',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          position: 'relative',
          zIndex: 5,
        }}
      >
        <Link href="/" style={{ display: 'block' }}>
          <div
            style={{
              width: 112,
              height: 112,
              borderRadius: 0,
              background: '#fff0cb',
              boxShadow: '0 12px 28px rgba(61, 37, 13, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image src="/logo.png" alt="The Biology Bloke" width={88} height={88} style={{ objectFit: 'contain' }} />
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', paddingTop: '0.7rem' }}>
          <Link href="/teacher/help" style={{ color: '#fff6d8', fontSize: '1.15rem', fontWeight: 800, textDecoration: 'none' }}>
            Help
          </Link>
          <Link href="/login" style={{ color: '#fff6d8', fontSize: '1.15rem', fontWeight: 800, textDecoration: 'none' }}>
            Log-in
          </Link>
          <Link
            href="/signup"
            style={{
              textDecoration: 'none',
              color: '#111',
              background: 'linear-gradient(180deg, #ffd26e 0%, #f6b742 100%)',
              borderRadius: 999,
              padding: '0.8rem 3rem',
              fontWeight: 900,
              fontSize: '1rem',
              boxShadow: '0 12px 24px rgba(74, 49, 8, 0.18)',
            }}
          >
            Sign Up
          </Link>
        </div>
      </nav>

      <main
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: '2rem 1.5rem 4rem',
          position: 'relative',
          zIndex: 4,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '17%',
            top: '1.8rem',
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #f4f0e6 0%, #cfc7b8 75%)',
            boxShadow: '0 18px 36px rgba(52, 33, 13, 0.14)',
            display: 'grid',
            placeItems: 'center',
            fontSize: '5rem',
          }}
        >
          🐨
        </div>

        <div
          style={{
            position: 'absolute',
            right: '7%',
            top: '5rem',
            width: 170,
            height: 220,
            borderRadius: 32,
            background: 'linear-gradient(180deg, rgba(255,223,171,0.75), rgba(208,144,69,0.28))',
            boxShadow: '0 18px 36px rgba(52, 33, 13, 0.16)',
            display: 'grid',
            placeItems: 'center',
            fontSize: '6rem',
          }}
        >
          🦧
        </div>

        <section
          style={{
            maxWidth: 840,
            margin: '2.8rem auto 0',
            background: 'rgba(249, 244, 230, 0.96)',
            borderRadius: 34,
            boxShadow: '0 22px 60px rgba(58, 36, 13, 0.22)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #fff1b9 0%, #fff7de 100%)',
              padding: '2rem 2rem 1.2rem',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                color: '#215c39',
                fontFamily: 'var(--font-bangers, "Space Grotesk", sans-serif)',
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                lineHeight: 0.95,
                letterSpacing: '-0.06em',
              }}
            >
              Explore Biology Like An Edventure
            </div>
          </div>

          <div style={{ padding: '1.65rem 2.1rem 2rem' }}>
            <p
              style={{
                color: '#33412d',
                fontSize: '1.05rem',
                lineHeight: 1.8,
                textAlign: 'center',
                maxWidth: 650,
                margin: '0 auto',
              }}
            >
              Bring a lush, nature-first learning experience into class. Teachers assign video journeys, students move through rainforest-inspired biology stories, and the platform adapts from engagement signals in real time.
            </p>

            <div style={{ display: 'flex', gap: '0.9rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.45rem' }}>
              <Link href="/signup" className="btn btn-amber" style={{ padding: '1rem 1.6rem', borderRadius: 999 }}>
                Start As A Teacher
              </Link>
              <Link href="/teacher/content" className="btn btn-outline" style={{ padding: '1rem 1.6rem', borderRadius: 999, background: '#fff7e6' }}>
                Open Admin Portal
              </Link>
            </div>

            <div
              style={{
                marginTop: '1.75rem',
                display: 'grid',
                gridTemplateColumns: '1.15fr 0.85fr',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  borderRadius: 24,
                  background: 'linear-gradient(180deg, #285539 0%, #1f472f 100%)',
                  padding: '1.2rem',
                  color: '#f5eedf',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 'auto 0 0 0',
                    height: 90,
                    background: 'url(/trees.png) center bottom / cover no-repeat',
                    opacity: 0.28,
                  }}
                />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(233, 241, 216, 0.74)' }}>
                    Live lesson preview
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, marginTop: '0.45rem' }}>Stage 3: Adaptations</div>
                  <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 58, height: 58, borderRadius: 18, background: 'rgba(255,255,255,0.14)', display: 'grid', placeItems: 'center', fontSize: '2rem' }}>
                      🌿
                    </div>
                    <div>
                      <div style={{ fontWeight: 800 }}>Into the Jungle</div>
                      <div style={{ fontSize: '0.82rem', color: 'rgba(233, 241, 216, 0.75)', marginTop: '0.15rem' }}>
                        Prompt at 90s • Check-in at 135s
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    {highlights.map((item) => (
                      <div key={item} style={{ display: 'flex', gap: '0.55rem', alignItems: 'start' }}>
                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#f0c674', marginTop: '0.45rem', flexShrink: 0 }} />
                        <div style={{ color: 'rgba(245, 238, 223, 0.9)', fontSize: '0.86rem', lineHeight: 1.5 }}>{item}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {pathwayCards.map((card) => (
                  <div
                    key={card.label}
                    style={{
                      borderRadius: 22,
                      padding: '1rem',
                      background: '#fff8ea',
                      border: `2px solid ${card.tone}`,
                    }}
                  >
                    <div style={{ color: '#2a3926', fontWeight: 900, fontSize: '1rem' }}>{card.label}</div>
                    <div style={{ color: '#6f6d5d', fontSize: '0.83rem', lineHeight: 1.55, marginTop: '0.35rem' }}>{card.copy}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
