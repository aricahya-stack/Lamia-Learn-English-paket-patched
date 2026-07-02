import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { QuizRenderer } from "@/components/quiz-renderer";
import { SpeechReader } from "@/components/speech-reader";
import { requireRole } from "@/lib/auth";
import { getLatestQuizAttempt, getMaterialDetail, skillMap } from "@/lib/materials";

export const dynamic = "force-dynamic";

export default async function StudentMaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["STUDENT", "TEACHER", "SUPER_ADMIN"]);
  const { id } = await params;
  const material = await getMaterialDetail(id);
  if (!material) notFound();
  const latestAttempt = material.quizId ? await getLatestQuizAttempt(user.id, material.quizId) : null;
  return (
    <AppShell title={material.title} subtitle={`${skillMap[material.skill].label} • ${material.level} • ${material.theme}`}>
      <section className="lesson-layout">
        <article className="card panel lesson-main">
          <div className="panel-heading"><div><p className="eyebrow">{material.code}</p><h3>Tujuan Pembelajaran</h3></div><span className="badge">{material.skill}</span></div>
          {material.objectives.length ? <ol className="objective-list">{material.objectives.map((item) => <li key={item}>{item}</li>)}</ol> : <p className="muted-text">Tujuan pembelajaran belum diisi.</p>}
          <div className="rich-content lesson-content" dangerouslySetInnerHTML={{ __html: material.contentHtml }} />
          {material.imageUrl ? <img className="material-image" src={material.imageUrl} alt={material.title} /> : null}
        </article>
        <aside className="lesson-side">
          <SpeechReader text={material.contentText} />
          {material.audioUrl ? <article className="card panel"><p className="eyebrow">Audio Materi</p><audio controls src={material.audioUrl} className="audio-player" /></article> : null}
          <article className="card panel"><p className="eyebrow">Sub Materi</p><div className="sub-list">{material.subMaterials.length ? material.subMaterials.map((item, index) => <details key={item.title} open={index === 0}><summary>{item.title}</summary><div className="rich-content" dangerouslySetInnerHTML={{ __html: item.contentHtml }} /></details>) : <p className="muted-text">Belum ada sub materi.</p>}</div></article>
        </aside>
      </section>
      {material.quizId ? <QuizRenderer quizId={material.quizId} questions={material.questions} latestAttempt={latestAttempt} /> : <section className="card panel"><h3>Belum ada kuis</h3><p className="muted-text">Materi ini belum memiliki kuis.</p></section>}
    </AppShell>
  );
}
