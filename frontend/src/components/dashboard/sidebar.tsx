"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, BookOpen, Calendar, Settings, LogOut, CheckSquare, GraduationCap, Receipt, User } from "lucide-react"
import { useAuth } from "@/lib/auth/AuthContext"

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname()
  const { logout } = useAuth()
  
  let links: any[] = []
  if (role === 'STUDENT') {
    links = [
      { href: "/student", label: "Dashboard", icon: LayoutDashboard },
      { href: "/student/attendance", label: "Attendance", icon: CheckSquare },
      { href: "/student/assignments", label: "Assignments", icon: BookOpen },
      { href: "/student/timetable", label: "Timetable", icon: Calendar },
      { href: "/student/results", label: "Results", icon: GraduationCap },
      { href: "/student/fees", label: "Fees", icon: Receipt },
      { href: "/student/profile", label: "Profile", icon: User },
    ]
  } else if (role === 'FACULTY') {
    links = [
      { href: "/faculty", label: "Dashboard", icon: LayoutDashboard },
      { href: "/faculty/students", label: "Students", icon: Users },
      { href: "/faculty/attendance", label: "Mark Attendance", icon: CheckSquare },
      { href: "/faculty/assignments", label: "Assignments", icon: BookOpen },
    ]
  } else if (role === 'ADMIN') {
    links = [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/users", label: "User Management", icon: Users },
      { href: "/admin/students", label: "Students", icon: Users },
      { href: "/admin/faculty", label: "Faculty", icon: GraduationCap },
      { href: "/admin/departments", label: "Departments", icon: BookOpen },
      { href: "/admin/courses", label: "Courses", icon: BookOpen },
      { href: "/admin/subjects", label: "Subjects", icon: BookOpen },
      { href: "/admin/sections", label: "Sections", icon: Users },
      { href: "/admin/timetable", label: "Timetable Master", icon: Calendar },
      { href: "/admin/examinations", label: "Examinations", icon: CheckSquare },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ]
  }

  return (
    <div className="h-screen w-64 border-r border-border bg-card flex flex-col p-4 fixed left-0 top-0">
      <div className="mb-8 px-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Smart Campus
        </h2>
        <p className="text-xs text-muted-foreground uppercase mt-1">{role} Portal</p>
      </div>

      <nav className="space-y-2 flex-1">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto">
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-destructive hover:bg-destructive/10 w-full transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  )
}
