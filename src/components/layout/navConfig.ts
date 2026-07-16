import type { Role } from "@/types";
import {
  LayoutDashboard,
  Layers,
  Film,
  FileText,
  LibraryBig,
  Megaphone,
  GraduationCap,
  HelpCircle,
  School,
  Presentation,
  BarChart3,
  Settings,
  Users,
  ClipboardList,
  LineChart,
  FileBarChart,
  Home,
  Backpack,
  Compass,
  Sprout,
  Star,
  User,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  Icon: LucideIcon;
}

export const navByRole: Record<Role, NavItem[]> = {
  admin: [
    { label: "Dashboard",  href: "/admin",           Icon: LayoutDashboard },
    { label: "Content",    href: "/admin/content",   Icon: Layers },
    { label: "Videos",     href: "/admin/videos",    Icon: Film },
    { label: "Quizzes",    href: "/admin/quizzes",   Icon: HelpCircle },
    { label: "Resources",  href: "/admin/resources", Icon: FileText },
    { label: "Explore",    href: "/admin/explore",   Icon: Compass },
    { label: "Schools",    href: "/admin/schools",   Icon: School },
    { label: "Users",      href: "/admin/teachers",  Icon: Users },
    { label: "Banner",     href: "/admin/banner",    Icon: Megaphone },
    { label: "PL Sessions", href: "/admin/pl",       Icon: GraduationCap },
    { label: "Feedback",   href: "/admin/feedback",  Icon: ClipboardList },
    { label: "Analytics",  href: "/admin/analytics", Icon: BarChart3 },
    { label: "Settings",   href: "/admin/settings",  Icon: Settings },
  ],
  teacher: [
    { label: "Dashboard", href: "/teacher", Icon: LayoutDashboard },
    { label: "Library", href: "/teacher/library", Icon: LibraryBig },
    { label: "My Classes", href: "/teacher/classes", Icon: Users },
    { label: "Assign Lessons", href: "/teacher/assign", Icon: ClipboardList },
    { label: "Present", href: "/teacher/present", Icon: Presentation },
    { label: "Resources", href: "/teacher/resources", Icon: FileText },
    { label: "Professional Learning", href: "/teacher/pl", Icon: GraduationCap },
    { label: "Class Insights", href: "/teacher/insights", Icon: LineChart },
    { label: "Reports", href: "/teacher/reports", Icon: FileBarChart },
    { label: "Settings", href: "/teacher/settings", Icon: Settings },
  ],
  student: [
    { label: "Home", href: "/student", Icon: Home },
    { label: "Class Work", href: "/student/classwork", Icon: Backpack },
    { label: "Explore", href: "/student/explore", Icon: Compass },
    { label: "My Progress", href: "/student/progress", Icon: Sprout },
    { label: "Explorer Points", href: "/student/points", Icon: Star },
    { label: "Profile", href: "/student/profile", Icon: User },
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
