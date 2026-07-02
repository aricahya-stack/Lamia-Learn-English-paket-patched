import { AppShell } from "@/components/app-shell";
import { PackageCard } from "@/components/package-card";
import { requireRole } from "@/lib/auth";
import { getPackages } from "@/lib/materials";

export const dynamic = "force-dynamic";

export default async function StudentPackagesPage() {
  await requireRole(["STUDENT", "SUPER_ADMIN"]);
  const packages = await getPackages();

  return (
    <AppShell title="Paket Belajar" subtitle="Pilih satu paket. Di dalamnya ada kumpulan materi yang sudah disusun berurutan.">
      <section className="material-grid">
        {packages.length ? packages.map((item) => <PackageCard key={item.id} item={item} href={`/dashboard/student/packages/${item.id}`} />) : <div className="card panel empty-state"><h3>Belum ada paket published</h3><p className="muted-text">Guru dapat membuat paket dari dashboard guru.</p></div>}
      </section>
    </AppShell>
  );
}
