import Link from "next/link";
import { ArrowRight, Layers3 } from "lucide-react";
import type { PackageCardData } from "@/lib/materials";

export function PackageCard({ item, href, manageHref }: { item: PackageCardData; href: string; manageHref?: string }) {
  return (
    <article className="card material-card package-card">
      <div className="material-card-head">
        <span className="skill-icon package"><Layers3 size={21} /></span>
        <span className="badge">{item.code}</span>
      </div>
      <div>
        <h3>{item.name}</h3>
        {item.status ? <span className="mini-status">{item.status}</span> : null}
      </div>
      <p>{item.description}</p>
      <div className="material-meta">
        <span>{item.level || "Semua level"}</span>
        <span>{item.materialCount} materi</span>
        <span>{item.questionCount} soal</span>
      </div>
      <div className="card-actions compact-actions">
        <Link className="primary-button" href={href}>Buka Paket <ArrowRight size={16} /></Link>
        {manageHref ? <Link className="secondary-button" href={manageHref}>Kelola</Link> : null}
      </div>
    </article>
  );
}
