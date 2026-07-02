import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { getReportRows } from "@/lib/materials";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  await requireRole(["SUPER_ADMIN"]);
  const rows = await getReportRows();

  return (
    <AppShell title="Laporan Super Admin" subtitle="Rekap materi, kuis, nilai, dan aktivitas sistem.">
      <section className="card panel">
        <p className="eyebrow">Reports</p>
        <h3>Rekap pengumpulan kuis</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Murid</th><th>Paket</th><th>Materi</th><th>Kuis</th><th>Nilai</th><th>Tanggal</th></tr></thead>
            <tbody>
              {rows.map((row: any) => <tr key={row.id}><td>{row.student.name}</td><td>{row.quiz.material.package?.name ?? "Tanpa paket"}</td><td>{row.quiz.material.title}</td><td>{row.quiz.title}</td><td>{row.totalScore}/{row.maxScore}</td><td>{row.submittedAt?.toLocaleDateString("id-ID") ?? "-"}</td></tr>)}
              {!rows.length ? <tr><td colSpan={6}>Belum ada kuis yang dikumpulkan.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
