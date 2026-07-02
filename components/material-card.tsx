import Link from "next/link";
import { ArrowRight, BookOpen, Headphones, PenTool } from "lucide-react";
import { DeleteButton } from "@/components/delete-button";
import type { MaterialCardData } from "@/lib/materials";

const iconMap = {
  reading: BookOpen,
  listening: Headphones,
  grammar: PenTool
};

export function MaterialCard({ material, href, editHref, showDelete = false }: { material: MaterialCardData; href: string; editHref?: string; showDelete?: boolean }) {
  const Icon = iconMap[material.skill];
  return (
    <article className="card material-card">
      <div className="material-card-head">
        <span className={`skill-icon ${material.skill}`}><Icon size={21} /></span>
        <span className="badge">{material.code}</span>
      </div>
      <div>
        <h3>{material.title}</h3>
        {material.status ? <span className="mini-status">{material.status}</span> : null}
      </div>
      <p>{material.description}</p>
      <div className="material-meta">
        <span>{material.packageName || "Tanpa paket"}</span>
        <span>{material.level}</span>
        <span>{material.theme}</span>
        <span>{material.questionCount} soal</span>
      </div>
      <div className="card-actions compact-actions">
        <Link className="primary-button" href={href}>Buka <ArrowRight size={16} /></Link>
        {editHref ? <Link className="secondary-button" href={editHref}>Edit</Link> : null}
        {showDelete ? <DeleteButton endpoint={`/api/materials/${material.id}`} label="Hapus" confirmText="Hapus materi ini beserta kuisnya?" /> : null}
      </div>
    </article>
  );
}
