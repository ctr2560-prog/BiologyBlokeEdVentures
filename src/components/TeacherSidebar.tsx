'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/teacher/classes',  label: 'Manage Classes', icon: '👤+' },
  { href: '/teacher/programs', label: 'View Programs',  icon: '📖'  },
  { href: '/teacher/content',  label: 'Content Studio', icon: '🎬'  },
  { href: '/teacher/settings', label: 'Settings',       icon: '⚙️'  },
  { href: '/teacher/help',     label: 'Help',           icon: '?'   },
]

export default function TeacherSidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Link href="/teacher/classes" style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', textDecoration: 'none' }}>
          <div className="sidebar-logo-box">
            <Image
              src="/logo.png"
              alt="The Biology Bloke"
              width={74}
              height={74}
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <div>
            <div className="sidebar-brand-title">Biology Bloke</div>
            <div className="sidebar-brand-subtitle">Edventures Studio</div>
          </div>
        </Link>
      </div>

      <div className="sidebar-summary">
        <div className="sidebar-summary-label">Portal</div>
        <div className="sidebar-summary-title">Teacher command center</div>
        <p className="sidebar-summary-copy">
          Manage classes, publish adaptive videos, and keep pathway insights in one place.
        </p>
      </div>

      <nav style={{ padding: '0.5rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', zIndex: 1 }}>
        {navItems.map((item) => {
          const isActive =
            item.href === '/teacher/classes'
              ? pathname.startsWith('/teacher/classes') || pathname === '/teacher'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <span style={{ fontSize: '1.05rem', minWidth: 22, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '0 1rem 1rem', position: 'relative', zIndex: 1, marginTop: 'auto' }}>
        <Link
          href="/teacher/classes/new"
          className="btn btn-amber"
          style={{ width: '100%', padding: '0.85rem 1rem', fontSize: '0.8rem' }}
        >
          Create a Class
        </Link>
      </div>

      <div style={{ height: 60 }} />
    </aside>
  )
}
