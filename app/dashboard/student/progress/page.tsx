import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { getStudentProgress } from "@/lib/materials";

export const dynamic = "force-dynamic";

export default async function StudentProgressPage() {
  const user = await requireRole(["STUDENT", "SUPER_ADMIN"]);
  const progress = await getStudentProgress(user.id);

  return (
    <AppShell title="Progres Belajar" subtitle="Riwayat materi, skor, bintang, dan badge murid.">
      <section className="card panel">
        <p className="eyebrow">Student Progress</p>
        <h3>Ringkasan progres</h3>
        <div className="summary-grid"><div><strong>{progress.openedMaterials}</strong><span>Materi dikerjakan</span></div><div><strong>{progress.averageScore}%</strong><span>Rata-rata skor</span></div><div><strong>{progress.attempts.length}</strong><span>Kuis selesai</span></div></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Paket</th><th>Materi</th><th>Kuis</th><th>Nilai</th><th>Tanggal</th></tr></thead>
            <tbody>
              {progress.attempts.map((attempt: any) => <tr key={attempt.id}><td>{attempt.quiz.material.package?.name ?? "Tanpa paket"}</td><td>{attempt.quiz.material.title}</td><td>{attempt.quiz.title}</td><td>{attempt.totalScore}/{attempt.maxScore}</td><td>{attempt.submittedAt?.toLocaleDateString("id-ID") ?? "-"}</td></tr>)}
              {!progress.attempts.length ? <tr><td colSpan={5}>Belum ada kuis yang dikumpulkan.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
