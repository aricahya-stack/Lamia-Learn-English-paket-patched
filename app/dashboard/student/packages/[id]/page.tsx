import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MaterialCard } from "@/components/material-card";
import { requireRole } from "@/lib/auth";
import { getPackageWithMaterials, getStudentMaterialProgressMap } from "@/lib/materials";

export const dynamic = "force-dynamic";

export default async function StudentPackageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["STUDENT", "TEACHER", "SUPER_ADMIN"]);
  const { id } = await params;
  const pkg = await getPackageWithMaterials(id, { includeDraft: false });
  if (!pkg) notFound();
  const progressByMaterial = await getStudentMaterialProgressMap(user.id, pkg.materials.map((material) => material.id));

  return (
    <AppShell title={pkg.name} subtitle={`${pkg.materialCount} materi • ${pkg.questionCount} soal • ${pkg.level || "Paket belajar"}`}>
      <section className="package-summary card panel">
        <p className="eyebrow">{pkg.code}</p>
        <h3>Isi Paket</h3>
        <p>{pkg.description}</p>
      </section>
      <section className="material-grid">
        {pkg.materials.length ? pkg.materials.map((material: any) => <MaterialCard key={material.id} material={{ ...material, ...progressByMaterial[material.id] }} href={`/dashboard/student/materials/${material.id}`} />) : <div className="card panel empty-state"><h3>Belum ada materi published</h3><p className="muted-text">Materi dalam paket ini masih draft atau belum diinput.</p></div>}
      </section>
    </AppShell>
  );
}
