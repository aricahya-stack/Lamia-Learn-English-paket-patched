import Link from "next/link";
import { ArrowRight, FileSpreadsheet, Layers3, ListChecks, PlusCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { requireRole } from "@/lib/auth";
import { getTeacherStats } from "@/lib/materials";

export const dynamic = "force-dynamic";

export default async function TeacherDashboard() {
  const user = await requireRole(["TEACHER", "SUPER_ADMIN"]);
  const stats = await getTeacherStats(user.id);

  return (
    <AppShell title="Dashboard Guru" subtitle="Buat materi, sub materi, tujuan pembelajaran, kuis, dan import Excel.">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy"><span className="hero-kicker">Teacher Workspace</span><h2>Materi kini disimpan ke database dan dapat memakai media Blob.</h2><p>Gunakan WYSIWYG untuk input cepat, atau upload template Excel untuk banyak materi, sub materi, tujuan, dan soal sekaligus.</p><div className="dashboard-hero-actions"><Link className="primary-button" href="/dashboard/teacher/materials/new">Input WYSIWYG <ArrowRight size={16} /></Link><Link className="secondary-button" href="/dashboard/teacher/import">Import Excel</Link></div></div>
      </section>
      <section className="metrics-grid four">
        <StatCard icon={Layers3} value={String(stats.packages)} label="Paket saya" />
        <StatCard icon={ListChecks} value={String(stats.published)} label="Materi published" tone="accent" />
        <StatCard icon={FileSpreadsheet} value={String(stats.quizzes)} label="Kuis dibuat" tone="warning" />
        <StatCard icon={PlusCircle} value={String(stats.attempts)} label="Kuis dikumpulkan" />
      </section>
    </AppShell>
  );
}
