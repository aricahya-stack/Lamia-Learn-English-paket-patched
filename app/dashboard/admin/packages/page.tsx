import Link from "next/link";
import { PackageForm } from "@/components/package-form";
import { DeleteButton } from "@/components/delete-button";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { getPackages } from "@/lib/materials";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  await requireRole(["SUPER_ADMIN"]);
  const packages = await getPackages({ includeDraft: true });

  return (
    <AppShell title="Manajemen Paket" subtitle="Paket adalah wadah kumpulan materi, misalnya 24 materi kelas 2 SD semester 1.">
      <div className="admin-users-layout">
        <PackageForm />
        <section className="card panel">
          <p className="eyebrow">Package Management</p>
          <h3>Daftar paket belajar</h3>
          <div className="table-wrap">
            <table className="data-table compact-table">
              <thead><tr><th>Paket</th><th>Kode</th><th>Materi</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {packages.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong><br /><small>{item.description}</small></td>
                    <td>{item.code}</td>
                    <td>{item.materialCount} materi</td>
                    <td>{item.status}</td>
                    <td><div className="row-actions"><Link className="secondary-button small-button" href={`/dashboard/admin/packages/${item.id}/edit`}>Edit</Link><DeleteButton endpoint={`/api/packages/${item.id}`} label="Hapus" confirmText="Hapus paket ini? Materi di dalamnya tidak ikut dihapus, hanya dilepas dari paket." /></div></td>
                  </tr>
                ))}
                {!packages.length ? <tr><td colSpan={5}>Belum ada paket.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
