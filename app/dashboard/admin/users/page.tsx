import { UserCreateForm } from "@/components/user-create-form";
import { UserEditForm } from "@/components/user-edit-form";
import { DeleteButton } from "@/components/delete-button";
import { AppShell } from "@/components/app-shell";
import { requireRole, roleLabel } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const current = await requireRole(["SUPER_ADMIN"]);
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <AppShell title="Manajemen User" subtitle="Super Admin dapat tambah, edit, dan hapus akun. Password dapat direset dari tabel.">
      <div className="admin-users-layout">
        <UserCreateForm />
        <section className="card panel">
          <p className="eyebrow">User Management</p>
          <h3>Daftar akun terdaftar</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Dibuat</th><th>Aksi</th></tr></thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{roleLabel(user.role as any)}</td>
                    <td>{user.createdAt.toLocaleDateString("id-ID")}</td>
                    <td><div className="row-actions"><UserEditForm user={{ id: user.id, name: user.name, email: user.email, role: user.role }} />{current.id !== user.id ? <DeleteButton endpoint={`/api/admin/users/${user.id}`} label="Hapus" confirmText="Hapus user ini? Data terkait seperti attempt juga dapat ikut terhapus sesuai relasi database." /> : <span className="mini-status">Akun aktif</span>}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
