"use client";

import { type FormEvent, useState, useTransition } from "react";
import { Save } from "lucide-react";

const roles = [
  { value: "STUDENT", label: "Murid" },
  { value: "TEACHER", label: "Guru" },
  { value: "SUPER_ADMIN", label: "Super Admin" }
] as const;

export function UserEditForm({ user }: { user: { id: string; name: string; email: string; role: string } }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      role: String(formData.get("role") ?? "STUDENT"),
      password: String(formData.get("password") ?? "")
    };
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.message || "User gagal diperbarui.");
        window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "User gagal diperbarui.");
      }
    });
  }

  return (
    <div className="inline-edit">
      <button className="secondary-button small-button" type="button" onClick={() => setOpen((value) => !value)}>{open ? "Tutup" : "Edit"}</button>
      {open ? (
        <form className="inline-edit-form" onSubmit={handleSubmit}>
          <input className="text-input" name="name" defaultValue={user.name} aria-label="Nama" required />
          <input className="text-input" name="email" defaultValue={user.email} aria-label="Email" type="email" required />
          <select className="select-input" name="role" defaultValue={user.role} aria-label="Role">
            {roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
          </select>
          <input className="text-input" name="password" placeholder="Password baru, opsional" type="password" minLength={8} aria-label="Password baru" />
          <button className="primary-button small-button" type="submit" disabled={pending}><Save size={14} /> {pending ? "..." : "Simpan"}</button>
          {error ? <span className="feedback wrong">{error}</span> : null}
        </form>
      ) : null}
    </div>
  );
}
