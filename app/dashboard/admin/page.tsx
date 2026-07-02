import { BookOpen, ClipboardCheck, GraduationCap, Headphones, Layers3, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { requireRole } from "@/lib/auth";
import { getAdminStats } from "@/lib/materials";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireRole(["SUPER_ADMIN"]);
  const stats = await getAdminStats();

  return (
    <AppShell title="Dashboard Super Admin" subtitle="Pantau user, materi, kelas, kuis, dan aktivitas belajar.">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <span className="hero-kicker">Ruang kendali platform</span>
          <h2>Lamia Learn English siap untuk Vercel, Neon PostgreSQL, dan Vercel Blob.</h2>
          <p>Super Admin mengelola guru, murid, kelas, validasi materi, dan laporan progres belajar dari data asli aplikasi.</p>
        </div>
        <div className="dashboard-hero-visual"><div className="hero-floating-card hero-card-one"><ClipboardCheck size={18} /> Role Protection</div><div className="hero-floating-card hero-card-two"><Headphones size={18} /> Media Blob</div></div>
      </section>
      <section className="metrics-grid">
        <StatCard icon={Users} value={String(stats.users)} label="Total user" />
        <StatCard icon={GraduationCap} value={String(stats.teachers)} label="Guru aktif" tone="accent" />
        <StatCard icon={GraduationCap} value={String(stats.students)} label="Murid aktif" />
        <StatCard icon={Layers3} value={String(stats.packages)} label="Paket belajar" tone="warning" />
        <StatCard icon={BookOpen} value={String(stats.materials)} label="Materi database" />
        <StatCard icon={ClipboardCheck} value={String(stats.attempts)} label="Kuis dikumpulkan" />
      </section>
      <section className="card panel">
        <p className="eyebrow">Fitur produksi</p>
        <h3>Fondasi aplikasi sudah diarahkan ke data asli</h3>
        <div className="two-col-list">
          <span>Login email dan password</span><span>Proteksi role halaman</span><span>Mode gelap/terang</span><span>Materi tersimpan ke Prisma</span><span>Upload media Blob</span><span>Laporan nilai dan progres</span>
        </div>
      </section>
    </AppShell>
  );
}
