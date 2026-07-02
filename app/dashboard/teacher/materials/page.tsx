import Link from "next/link";
import { FileSpreadsheet, PlusCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MaterialCard } from "@/components/material-card";
import { requireRole } from "@/lib/auth";
import { getMaterialCards, getPackages } from "@/lib/materials";

export const dynamic = "force-dynamic";

export default async function TeacherMaterialsPage() {
  const user = await requireRole(["TEACHER", "SUPER_ADMIN"]);
  const ownerFilter = user.role === "TEACHER" ? user.id : undefined;
  const [materials, packages] = await Promise.all([
    getMaterialCards({ includeDraft: true, createdById: ownerFilter }),
    getPackages({ includeDraft: true, createdById: ownerFilter })
  ]);

  return (
    <AppShell title="Materi Guru" subtitle="Materi dikelompokkan ke dalam Paket agar tampilan murid lebih sederhana.">
      <div className="toolbar"><Link className="primary-button" href="/dashboard/teacher/materials/new"><PlusCircle size={16} /> Tambah Materi</Link><Link className="secondary-button" href="/dashboard/teacher/import"><FileSpreadsheet size={16} /> Import Excel</Link><Link className="secondary-button" href="/dashboard/teacher/packages">Kelola Paket</Link></div>
      <section className="card panel package-summary">
        <p className="eyebrow">Ringkasan Paket</p>
        <h3>{packages.length} paket aktif/draft</h3>
        <p className="muted-text">Gunakan paket sebagai folder besar. Contoh: “Kelas 2 SD Semester 1” berisi 24 materi.</p>
      </section>
      <section className="material-grid">
        {materials.length ? materials.map((material: any) => <MaterialCard key={material.id} material={material} href={`/dashboard/student/materials/${material.id}`} editHref={`/dashboard/teacher/materials/${material.id}/edit`} showDelete />) : <div className="card panel empty-state"><h3>Belum ada materi</h3><p className="muted-text">Tambahkan materi manual atau import Excel agar tampil di sini.</p></div>}
      </section>
    </AppShell>
  );
}
