import TeacherSidebar from '@/components/TeacherSidebar'

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="teacher-shell">
      <TeacherSidebar />
      <main className="teacher-main">
        {children}
      </main>
    </div>
  )
}
