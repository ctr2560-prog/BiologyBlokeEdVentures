import TeacherSidebar from '@/components/TeacherSidebar'

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <TeacherSidebar />
      <main style={{ flex: 1, background: '#faf5e4', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
