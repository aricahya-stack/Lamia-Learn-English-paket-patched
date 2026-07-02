import { AppShell } from "@/components/app-shell";
import { MaterialForm } from "@/components/material-form";
import { requireRole } from "@/lib/auth";
import { getPackages } from "@/lib/materials";

export const dynamic = "force-dynamic";

export default async function NewMaterialPage() {
  const user = await requireRole(["TEACHER", "SUPER_ADMIN"]);
  const packages = await getPackages({ includeDraft: true, createdById: user.role === "TEACHER" ? user.id : undefined });
  return (
    <AppShell title="Input Materi Baru" subtitle="Pilih paket terlebih dahulu agar materi tersusun rapi untuk murid.">
      <MaterialForm packages={packages.map((item) => ({ id: item.id, name: item.name, code: item.code }))} />
    </AppShell>
  );
}
