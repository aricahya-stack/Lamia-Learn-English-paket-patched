import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { getReportRows } from "@/lib/materials";

export const dynamic = "force-dynamic";

export default async function TeacherReportsPage() {
  const user = await requireRole(["TEACHER", "SUPER_ADMIN"]);
  const rows = await getReportRows({ teacherId: user.role === "TEACHER" ? user.id : undefined });

  return (
    <AppShell title="Nilai dan Progres" subtitle="Guru melihat nilai murid, hasil kuis, dan perkembangan belajar.">
      <section className="card panel">
        <p className="eyebrow">Teacher Reports</p>
        <h3>Nilai kuis murid</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Murid</th><th>Paket</th><th>Materi</th><th>Kuis</th><th>Nilai</th><th>Tanggal</th></tr></thead>
            <tbody>
              {rows.map((row: any) => <tr key={row.id}><td>{row.student.name}</td><td>{row.quiz.material.package?.name ?? "Tanpa paket"}</td><td>{row.quiz.material.title}</td><td>{row.quiz.title}</td><td>{row.totalScore}/{row.maxScore}</td><td>{row.submittedAt?.toLocaleDateString("id-ID") ?? "-"}</td></tr>)}
              {!rows.length ? <tr><td colSpan={6}>Belum ada nilai dari murid.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
