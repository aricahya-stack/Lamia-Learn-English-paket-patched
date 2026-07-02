"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

export function DeleteButton({ endpoint, label = "Hapus", confirmText = "Yakin ingin menghapus data ini?" }: { endpoint: string; label?: string; confirmText?: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(confirmText)) return;
    startTransition(async () => {
      const response = await fetch(endpoint, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        alert(data?.message || "Data gagal dihapus.");
        return;
      }
      window.location.reload();
    });
  }

  return <button className="danger-button small-button" type="button" onClick={handleClick} disabled={pending}><Trash2 size={14} /> {pending ? "..." : label}</button>;
}
