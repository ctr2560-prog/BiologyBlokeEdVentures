'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from './Logo'

const navItems = [
  { href: '/teacher/classes', label: 'Manage Classes', icon: '👥' },
  { href: '/teacher/programs', label: 'View Programs', icon: '📚' },
  { href: '/teacher/settings', label: 'Settings', icon: '⚙️' },
  { href: '/teacher/help', label: 'Help', icon: '❓' },
]

export default function TeacherSidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      <div className="p-4 flex justify-center mt-2">
        <Logo href="/teacher/classes" size="md" variant="dark" />
      </div>

      <nav className="px-3 mt-4 flex-1 space-y-1">
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
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pb-6 mt-4">
        <Link href="/teacher/classes/new" className="btn btn-amber w-full justify-center" style={{ display: 'flex' }}>
          + Create a Class
        </Link>
      </div>
    </aside>
  )
}
