import Link from "next/link";
import { PackageForm } from "@/components/package-form";
import { DeleteButton } from "@/components/delete-button";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { getPackages } from "@/lib/materials";

export const dynamic = "force-dynamic";

export default async function TeacherPackagesPage() {
  const user = await requireRole(["TEACHER", "SUPER_ADMIN"]);
  const packages = await getPackages({ includeDraft: true, createdById: user.role === "TEACHER" ? user.id : undefined });

  return (
    <AppShell title="Paket Materi" subtitle="Kelola paket agar 24 materi tampil sebagai satu jalur belajar yang rapi.">
      <div className="admin-users-layout">
        <PackageForm />
        <section className="card panel">
          <p className="eyebrow">Paket Guru</p>
          <h3>Daftar paket saya</h3>
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
                    <td><div className="row-actions"><Link className="secondary-button small-button" href={`/dashboard/teacher/packages/${item.id}/edit`}>Edit</Link><Link className="secondary-button small-button" href={`/dashboard/student/packages/${item.id}`}>Lihat</Link><DeleteButton endpoint={`/api/packages/${item.id}`} label="Hapus" confirmText="Hapus paket ini? Materi di dalamnya tidak ikut dihapus, hanya dilepas dari paket." /></div></td>
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
