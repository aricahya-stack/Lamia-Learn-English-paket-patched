import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MaterialForm } from "@/components/material-form";
import { requireRole } from "@/lib/auth";
import { getMaterialDetail, getPackages } from "@/lib/materials";

export const dynamic = "force-dynamic";

export default async function EditMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["TEACHER", "SUPER_ADMIN"]);
  const { id } = await params;
  const material = await getMaterialDetail(id);
  if (!material) notFound();
  const packages = await getPackages({ includeDraft: true, createdById: user.role === "TEACHER" ? user.id : undefined });

  return (
    <AppShell title="Edit Materi" subtitle="Admin dan guru dapat memperbarui materi, paket, media, tujuan, submateri, dan latihan speaking.">
      <MaterialForm packages={packages.map((item) => ({ id: item.id, name: item.name, code: item.code }))} initial={material} />
    </AppShell>
  );
}
