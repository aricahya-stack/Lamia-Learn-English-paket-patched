import type { LucideIcon } from "lucide-react";

export function StatCard({ icon: Icon, value, label, tone = "brand" }: { icon: LucideIcon; value: string; label: string; tone?: "brand" | "accent" | "warning" }) {
  return (
    <article className={`stat-card ${tone}`}>
      <span className="stat-icon"><Icon size={21} /></span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}
