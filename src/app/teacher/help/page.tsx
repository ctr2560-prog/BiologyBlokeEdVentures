export default function HelpPage() {
  const faqs = [
    { q: 'How do students join my class?', a: 'Share your class code (found on the class detail page) with students. They visit the Join page and enter the code, then pick a nickname. They\'re added to your class automatically.' },
    { q: 'What is an Edventure?', a: 'An Edventure is a nature-based learning journey made up of 8–12 short-form videos, guiding questions, optional reflections, and adaptive checkpoints. They spark curiosity first, build understanding second, and apply knowledge third.' },
    { q: 'How does the adaptive system work?', a: 'The platform interprets student watch behaviour as signals: high watch & rewatch = curiosity (Explore pathway), standard completion = Grow pathway, low watch = Support pathway. Students receive personalised next steps automatically.' },
    { q: 'What do the pathways mean?', a: '🌿 Explore: deeper concepts and open challenges for highly curious students. 🌱 Grow: structured core pathway for most students. 🌾 Support: simplified content and scaffolded tasks for students needing more connection.' },
    { q: 'How do I read the Class Insights?', a: 'Click "Class Insights" on any class page. You\'ll see engagement by topic, average watch time, and pathway distribution. The system also generates plain-English recommendations you can act on immediately.' },
    { q: 'Can I assign content to specific students?', a: 'Currently, content is assigned to the whole class. Individual pathway adjustments happen automatically based on engagement data. Manual override for individual students is coming in a future update.' },
    { q: 'Is student data private?', a: 'Yes. Students have no public profiles. Only their teacher can see their data. Students are identified by nicknames only. No external sharing of data occurs.' },
  ]

  return (
    <div style={{ padding: '2.5rem', maxWidth: 700 }}>
      <h1 style={{ fontWeight: 900, fontSize: '2rem', color: '#2e1a0e', textTransform: 'uppercase', fontFamily: 'Georgia, serif', marginBottom: '2rem' }}>
        Help
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {faqs.map((faq, i) => (
          <div key={i} className="card" style={{ padding: '1.25rem 1.5rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#2e1a0e', marginBottom: '0.5rem' }}>
              {faq.q}
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#5c3a1e', lineHeight: 1.7 }}>{faq.a}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '1.5rem', marginTop: '1.5rem', background: '#f0ead0' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#2e1a0e', marginBottom: '0.5rem' }}>
          Need more help?
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#5c3a1e', marginBottom: '0.75rem' }}>
          Contact Biology Bloke Edventures support and we'll get back to you within 24 hours.
        </p>
        <a href="mailto:support@biologyblokeedventures.com" className="btn btn-amber btn-sm">
          📧 Contact Support
        </a>
      </div>
    </div>
  )
}
