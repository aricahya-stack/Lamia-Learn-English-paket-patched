import Link from "next/link";
import { BookOpen, Headphones, PenTool } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { skillMap } from "@/lib/materials";

export const dynamic = "force-dynamic";

const cards = [
  { slug: "reading", icon: BookOpen },
  { slug: "listening", icon: Headphones },
  { slug: "grammar", icon: PenTool }
] as const;

export default async function LearnPage() {
  await requireRole(["STUDENT", "SUPER_ADMIN"]);
  return (
    <AppShell title="Pilih Jalur Belajar" subtitle="Materi dibedakan menjadi Reading, Listening, dan Grammar.">
      <section className="learning-grid">
        {cards.map(({ slug, icon: Icon }) => (
          <Link className={`learning-card ${slug}`} href={`/dashboard/student/learn/${slug}`} key={slug}>
            <span><Icon size={31} /></span>
            <h2>{skillMap[slug].label}</h2>
            <p>{skillMap[slug].description}</p>
            <strong>{skillMap[slug].accent}</strong>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
