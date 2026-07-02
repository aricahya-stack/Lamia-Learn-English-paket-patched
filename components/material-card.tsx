import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Headphones, PenTool, RotateCcw } from "lucide-react";
import { DeleteButton } from "@/components/delete-button";
import type { MaterialCardData } from "@/lib/materials";

const iconMap = {
  reading: BookOpen,
  listening: Headphones,
  grammar: PenTool
};

function scoreLabel(material: MaterialCardData) {
  if (typeof material.latestScore !== "number" || typeof material.latestMaxScore !== "number") return "Sudah dikerjakan";
  return `Nilai terakhir ${material.latestScore}/${material.latestMaxScore}`;
}

export function MaterialCard({ material, href, editHref, showDelete = false }: { material: MaterialCardData; href: string; editHref?: string; showDelete?: boolean }) {
  const Icon = iconMap[material.skill];
  return (
    <article className={`card material-card ${material.isDone ? "is-done" : ""}`}>
      <div className="material-card-head">
        <span className={`skill-icon ${material.skill}`}><Icon size={21} /></span>
        <span className="badge">{material.code}</span>
      </div>
      <div>
        <h3>{material.title}</h3>
        <div className="status-stack">
          {material.status ? <span className="mini-status">{material.status}</span> : null}
          {material.isDone ? (
            <span className="completion-badge"><CheckCircle2 size={14} /> {scoreLabel(material)}</span>
          ) : null}
        </div>
      </div>
      <p>{material.description}</p>
      <div className="material-meta">
        <span>{material.packageName || "Tanpa paket"}</span>
        <span>{material.level}</span>
        <span>{material.theme}</span>
        <span>{material.questionCount} soal</span>
        {material.isDone ? <span>{material.attemptCount ?? 1}x dikerjakan</span> : null}
      </div>
      <div className="card-actions compact-actions">
        <Link className={material.isDone ? "secondary-button" : "primary-button"} href={href}>{material.isDone ? "Kerjakan Lagi" : "Buka"} {material.isDone ? <RotateCcw size={16} /> : <ArrowRight size={16} />}</Link>
        {editHref ? <Link className="secondary-button" href={editHref}>Edit</Link> : null}
        {showDelete ? <DeleteButton endpoint={`/api/materials/${material.id}`} label="Hapus" confirmText="Hapus materi ini beserta kuisnya?" /> : null}
      </div>
    </article>
  );
}
