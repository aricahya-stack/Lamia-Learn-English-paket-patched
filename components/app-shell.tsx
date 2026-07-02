import Link from "next/link";
import { BarChart3, BookOpen, FileSpreadsheet, GraduationCap, Home, Layers3, LogOut, PlusCircle, Settings, UserRound, Users } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireUser, roleLabel } from "@/lib/auth";

const navs = {
  SUPER_ADMIN: [
    ["/dashboard/admin", "Dashboard", Home],
    ["/dashboard/admin/packages", "Paket", Layers3],
    ["/dashboard/admin/users", "User", Users],
    ["/dashboard/admin/reports", "Laporan", BarChart3]
  ],
  TEACHER: [
    ["/dashboard/teacher", "Dashboard", Home],
    ["/dashboard/teacher/packages", "Paket", Layers3],
    ["/dashboard/teacher/materials", "Materi", BookOpen],
    ["/dashboard/teacher/reports", "Nilai", BarChart3]
  ],
  STUDENT: [
    ["/dashboard/student", "Dashboard", Home],
    ["/dashboard/student/packages", "Paket", GraduationCap],
    ["/dashboard/student/progress", "Progres", BarChart3]
  ]
} as const;

export async function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const user = await requireUser();
  const role = user.role as keyof typeof navs;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <Link href="/dashboard" className="sidebar-logo"><AppLogo /></Link>
        <nav className="sidebar-nav" aria-label="Menu utama">
          {navs[role].map(([href, label, Icon]) => <Link key={href} href={href}><Icon size={18} /><span>{label}</span></Link>)}
        </nav>
        <div className="sidebar-note">
          <p className="eyebrow">Akses akun</p>
          <strong>{roleLabel(role)}</strong>
          <span>{user.email}</span>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">Lamia Learn English</p>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <div className="topbar-actions">
            <ThemeToggle />
            <button className="utility-button" title={`Profil ${user.name}`}><UserRound size={18} /></button>
            <button className="utility-button" title="Pengaturan"><Settings size={18} /></button>
            <form action="/api/auth/logout" method="post"><button className="secondary-button"><LogOut size={16} /> Logout</button></form>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
