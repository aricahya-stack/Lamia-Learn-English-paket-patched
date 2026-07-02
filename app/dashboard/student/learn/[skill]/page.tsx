import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MaterialCard } from "@/components/material-card";
import { requireRole } from "@/lib/auth";
import { getMaterialCards, skillMap, type SkillSlug } from "@/lib/materials";

export const dynamic = "force-dynamic";

export default async function SkillMaterialPage({ params }: { params: Promise<{ skill: string }> }) {
  await requireRole(["STUDENT", "SUPER_ADMIN"]);
  const { skill } = await params;
  if (!["reading", "listening", "grammar"].includes(skill)) notFound();
  const slug = skill as SkillSlug;
  const materials = await getMaterialCards({ skill: slug });
  return (
    <AppShell title={`Materi ${skillMap[slug].label}`} subtitle={skillMap[slug].description}>
      <section className="material-grid">
        {materials.length ? materials.map((material: any) => <MaterialCard key={material.id} material={material} href={`/dashboard/student/materials/${material.id}`} />) : <div className="card panel empty-state"><h3>Belum ada materi published</h3><p className="muted-text">Guru dapat menambahkan materi dari dashboard guru.</p></div>}
      </section>
    </AppShell>
  );
}
