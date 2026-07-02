import { notFound } from "next/navigation";
import { PackageForm } from "@/components/package-form";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TeacherPackageEditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["TEACHER", "SUPER_ADMIN"]);
  const { id } = await params;
  const item = await prisma.learningPackage.findFirst({ where: { id, ...(user.role === "TEACHER" ? { createdById: user.id } : {}) } });
  if (!item) notFound();
  return (
    <AppShell title="Edit Paket" subtitle="Perbarui nama, kode, status, dan deskripsi paket.">
      <PackageForm initial={{ id: item.id, name: item.name, packageCode: item.packageCode, description: item.description, level: item.level, status: item.status }} />
    </AppShell>
  );
}
