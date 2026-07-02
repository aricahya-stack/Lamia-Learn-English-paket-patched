"use client";

import { type FormEvent, useState, useTransition } from "react";
import { PlusCircle, ShieldCheck } from "lucide-react";

const roles = [
  { value: "STUDENT", label: "Murid" },
  { value: "TEACHER", label: "Guru" },
  { value: "SUPER_ADMIN", label: "Super Admin" }
] as const;

export function UserCreateForm() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      role: String(formData.get("role") ?? "STUDENT")
    };

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.message || "User gagal dibuat.");

        setMessage(`User ${data.user.email} berhasil dibuat.`);
        form.reset();
        window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "User gagal dibuat.");
      }
    });
  }

  return (
    <section className="card panel user-create-panel">
      <div className="panel-heading compact">
        <div>
          <p className="eyebrow">Tambah User</p>
          <h3>Buat akun baru</h3>
        </div>
        <span className="badge"><ShieldCheck size={14} /> Super Admin</span>
      </div>
      <form className="form-grid user-create-form" onSubmit={handleSubmit}>
        <label className="field-block">
          <span className="field-label">Nama</span>
          <input className="text-input" name="name" placeholder="Contoh: Budi Santoso" required minLength={2} />
        </label>
        <label className="field-block">
          <span className="field-label">Email</span>
          <input className="text-input" name="email" type="email" placeholder="user@lamia.local" required />
        </label>
        <label className="field-block">
          <span className="field-label">Password awal</span>
          <input className="text-input" name="password" type="password" placeholder="Minimal 8 karakter" required minLength={8} />
        </label>
        <label className="field-block">
          <span className="field-label">Role</span>
          <select className="select-input" name="role" defaultValue="STUDENT">
            {roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
          </select>
        </label>
        <div className="full-row toolbar">
          <button className="primary-button" type="submit" disabled={pending}>
            <PlusCircle size={16} /> {pending ? "Menyimpan..." : "Tambah User"}
          </button>
          {message ? <span className="feedback correct">{message}</span> : null}
          {error ? <span className="feedback wrong">{error}</span> : null}
        </div>
      </form>
    </section>
  );
}
