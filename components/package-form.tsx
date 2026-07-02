"use client";

import { type FormEvent, useState, useTransition } from "react";
import { PlusCircle, Save } from "lucide-react";

type PackageInitial = {
  id?: string;
  name?: string;
  packageCode?: string;
  description?: string | null;
  level?: string | null;
  status?: string;
};

export function PackageForm({ initial, compact = false }: { initial?: PackageInitial; compact?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const editing = Boolean(initial?.id);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") ?? ""),
      packageCode: String(formData.get("packageCode") ?? ""),
      description: String(formData.get("description") ?? ""),
      level: String(formData.get("level") ?? ""),
      status: String(formData.get("status") ?? "PUBLISHED")
    };

    startTransition(async () => {
      try {
        const response = await fetch(editing ? `/api/packages/${initial?.id}` : "/api/packages", {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.message || "Paket gagal disimpan.");
        setMessage(editing ? "Paket berhasil diperbarui." : "Paket berhasil dibuat.");
        if (!editing) form.reset();
        window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Paket gagal disimpan.");
      }
    });
  }

  return (
    <section className={`card panel ${compact ? "compact-form" : ""}`}>
      <div className="panel-heading compact">
        <div>
          <p className="eyebrow">{editing ? "Edit Paket" : "Tambah Paket"}</p>
          <h3>{editing ? "Perbarui paket belajar" : "Buat paket belajar"}</h3>
        </div>
      </div>
      <form className="form-grid user-create-form" onSubmit={handleSubmit}>
        <label className="field-block">
          <span className="field-label">Nama Paket</span>
          <input className="text-input" name="name" defaultValue={initial?.name ?? ""} placeholder="Contoh: English Practice Kelas 2 Semester 1" required minLength={2} />
        </label>
        <label className="field-block">
          <span className="field-label">Kode Paket</span>
          <input className="text-input" name="packageCode" defaultValue={initial?.packageCode ?? ""} placeholder="Opsional, otomatis jika kosong" />
        </label>
        <label className="field-block">
          <span className="field-label">Level/Kelas</span>
          <input className="text-input" name="level" defaultValue={initial?.level ?? "Kelas 2 SD"} />
        </label>
        <label className="field-block">
          <span className="field-label">Status</span>
          <select className="select-input" name="status" defaultValue={initial?.status ?? "PUBLISHED"}>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
        <label className="field-block full-row">
          <span className="field-label">Deskripsi</span>
          <input className="text-input" name="description" defaultValue={initial?.description ?? ""} placeholder="Ringkasan paket untuk murid" />
        </label>
        <div className="full-row toolbar slim-toolbar">
          <button className="primary-button" type="submit" disabled={pending}>{editing ? <Save size={16} /> : <PlusCircle size={16} />} {pending ? "Menyimpan..." : editing ? "Simpan Paket" : "Tambah Paket"}</button>
          {message ? <span className="feedback correct">{message}</span> : null}
          {error ? <span className="feedback wrong">{error}</span> : null}
        </div>
      </form>
    </section>
  );
}
