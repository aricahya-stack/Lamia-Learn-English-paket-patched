import Link from "next/link";
import { ArrowRight, BookOpen, Headphones, PenTool, Trophy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { requireRole } from "@/lib/auth";
import { getStudentProgress } from "@/lib/materials";

export const dynamic = "force-dynamic";

export default async function StudentDashboard() {
  const user = await requireRole(["STUDENT", "SUPER_ADMIN"]);
  const progress = await getStudentProgress(user.id);
  return (
    <AppShell title="Dashboard Murid" subtitle="Pilih paket belajar yang berisi materi berurutan.">
      <section className="dashboard-hero student-hero">
        <div className="dashboard-hero-copy"><span className="hero-kicker">Learning Map</span><h2>Mulai belajar bahasa Inggris dari materi yang ringan.</h2><p>Buka Paket Belajar. Setiap paket dapat berisi 24 materi, lengkap dengan sub materi, tombol suara, dan kuis interaktif.</p><Link className="primary-button" href="/dashboard/student/packages">Mulai Belajar <ArrowRight size={16} /></Link></div>
      </section>
      <section className="metrics-grid four"><StatCard icon={BookOpen} value="Reading" label="Baca cerita" /><StatCard icon={Headphones} value="Listening" label="Dengar audio" tone="warning" /><StatCard icon={PenTool} value="Grammar" label="Latihan pola" tone="accent" /><StatCard icon={Trophy} value={`${progress.averageScore}%`} label="Rata-rata skor" /></section>
    </AppShell>
  );
}
