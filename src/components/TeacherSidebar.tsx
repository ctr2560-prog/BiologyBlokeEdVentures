'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/teacher/classes',  label: 'Manage Classes', icon: '👤+' },
  { href: '/teacher/programs', label: 'View Programs',  icon: '📖'  },
  { href: '/teacher/settings', label: 'Settings',       icon: '⚙️'  },
  { href: '/teacher/help',     label: 'Help',           icon: '?'   },
]

export default function TeacherSidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '1.25rem 1.25rem 0.75rem', display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        <Link href="/teacher/classes" style={{ display: 'block' }}>
          <div className="sidebar-logo-box">
            <Image
              src="/logo.png"
              alt="The Biology Bloke"
              width={90}
              height={90}
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ padding: '0.5rem 0.875rem', flex: 1, display: 'flex', flexDirection: 'column', gap: 4, position: 'relative', zIndex: 1 }}>
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

      {/* Create a Class button */}
      <div style={{ padding: '0 0.875rem 1rem', position: 'relative', zIndex: 1, marginTop: 'auto' }}>
        <Link
          href="/teacher/classes/new"
          className="btn btn-amber"
          style={{ width: '100%', padding: '0.65rem', fontSize: '0.82rem' }}
        >
          Create a Class
        </Link>
      </div>

      {/* Spacer for trees overlay */}
      <div style={{ height: 60 }} />
    </aside>
  )
}
