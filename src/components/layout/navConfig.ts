import type { Role } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const navByRole: Record<Role, NavItem[]> = {
  admin: [
    { label: "Dashboard", href: "/admin", icon: "🏠" },
    { label: "Content Library", href: "/admin/content", icon: "📚" },
    { label: "Units & Topics", href: "/admin/units", icon: "🗂️" },
    { label: "Videos", href: "/admin/videos", icon: "🎬" },
    { label: "Resources", href: "/admin/resources", icon: "📄" },
    { label: "Quizzes", href: "/admin/quizzes", icon: "❓" },
    { label: "Schools", href: "/admin/schools", icon: "🏫" },
    { label: "Teachers", href: "/admin/teachers", icon: "👩‍🏫" },
    { label: "Students", href: "/admin/students", icon: "🎓" },
    { label: "Analytics", href: "/admin/analytics", icon: "📊" },
    { label: "Settings", href: "/admin/settings", icon: "⚙️" },
  ],
  teacher: [
    { label: "Dashboard", href: "/teacher", icon: "🏠" },
    { label: "My Classes", href: "/teacher/classes", icon: "👥" },
    { label: "Assign Lessons", href: "/teacher/assign", icon: "📌" },
    { label: "Resources", href: "/teacher/resources", icon: "📄" },
    { label: "Class Insights", href: "/teacher/insights", icon: "🔍" },
    { label: "Reports", href: "/teacher/reports", icon: "📈" },
    { label: "Settings", href: "/teacher/settings", icon: "⚙️" },
  ],
  student: [
    { label: "Home", href: "/student", icon: "🏠" },
    { label: "Class Work", href: "/student/classwork", icon: "🎒" },
    { label: "Explore", href: "/student/explore", icon: "🧭" },
    { label: "My Progress", href: "/student/progress", icon: "🌱" },
    { label: "Explorer Points", href: "/student/points", icon: "⭐" },
    { label: "Profile", href: "/student/profile", icon: "🙂" },
  ],
};

export const roleHome: Record<Role, string> = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
};

export const roleLabel: Record<Role, string> = {
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
};
