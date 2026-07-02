"use client";

import { type FormEvent, useState, useTransition } from "react";
import { Plus, Save, Trash2, UploadCloud } from "lucide-react";
import { WysiwygEditor } from "@/components/wysiwyg-editor";
import { MediaUploader } from "@/components/media-uploader";

type PackageOption = { id: string; name: string; code: string };
type MaterialInitial = {
  id?: string;
  code?: string;
  title?: string;
  skill?: string;
  level?: string;
  theme?: string;
  description?: string;
  instruction?: string;
  contentHtml?: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  status?: string;
  packageId?: string | null;
  packageName?: string | null;
  objectives?: string[];
  subMaterials?: { title: string; contentHtml: string }[];
  questions?: { targetText?: string; minScore?: number; maxAttempts?: number; type?: string }[];
};

export function MaterialForm({ packages = [], initial }: { packages?: PackageOption[]; initial?: MaterialInitial }) {
  const [objectives, setObjectives] = useState(initial?.objectives?.length ? initial.objectives : ["Murid memahami kosakata utama sesuai tema."]);
  const [subs, setSubs] = useState(initial?.subMaterials?.length ? initial.subMaterials.map((item) => ({ title: item.title, content: item.contentHtml })) : [{ title: "Sub Materi 1", content: "" }]);
  const [speakingQuestions, setSpeakingQuestions] = useState(
    initial?.questions?.filter((q) => q.targetText)?.length
      ? initial.questions.filter((q) => q.targetText).map((q) => ({ targetText: q.targetText || "", minScore: q.minScore || 70, maxAttempts: q.maxAttempts || 3, type: q.type || "READ_ALOUD" }))
      : [{ targetText: "I have a cat", minScore: 70, maxAttempts: 3, type: "READ_ALOUD" }]
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const editing = Boolean(initial?.id);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const response = await fetch(editing ? `/api/materials/${initial?.id}` : "/api/materials", { method: editing ? "PATCH" : "POST", body: formData });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.message || "Materi gagal disimpan.");
        window.location.href = data.redirectTo || "/dashboard/teacher/materials";
      } catch (err) {
        setError(err instanceof Error ? err.message : "Materi gagal disimpan.");
      }
    });
  }

  return (
    <form className="form-grid card panel" onSubmit={handleSubmit}>
      <div className="panel-heading full-row">
        <div>
          <p className="eyebrow">{editing ? "Edit materi" : "Input manual guru"}</p>
          <h3>{editing ? "Perbarui Materi" : "Tambah Materi dengan WYSIWYG"}</h3>
          <p className="muted-text">Materi bisa dimasukkan ke Paket Belajar agar murid tidak melihat terlalu banyak tombol.</p>
        </div>
        <button className="primary-button" type="submit" disabled={pending}><Save size={16} /> {pending ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Materi"}</button>
      </div>

      <label className="field-block"><span className="field-label">Paket</span><select className="select-input" name="packageId" defaultValue={initial?.packageId ?? ""}><option value="">-- Buat/isi paket lewat kolom Nama Paket --</option>{packages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="field-block"><span className="field-label">Nama Paket Baru/Otomatis</span><input className="text-input" name="package" defaultValue={initial?.packageName ?? ""} placeholder="Contoh: English Practice Kelas 2 Semester 1" /></label>
      <label className="field-block"><span className="field-label">Kode Materi</span><input className="text-input" name="materialCode" defaultValue={initial?.code ?? ""} placeholder="Opsional. Contoh: M001" /></label>
      <label className="field-block"><span className="field-label">Status</span><select className="select-input" name="status" defaultValue={initial?.status ?? "PUBLISHED"}><option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option><option value="ARCHIVED">Archived</option></select></label>

      <label className="field-block"><span className="field-label">Judul Materi</span><input className="text-input" name="title" required defaultValue={initial?.title ?? ""} placeholder="Contoh: My Pet Cat" /></label>
      <label className="field-block"><span className="field-label">Kategori</span><select className="select-input" name="skill" required defaultValue={initial?.skill?.toUpperCase() ?? "READING"}><option value="READING">Reading</option><option value="LISTENING">Listening</option><option value="GRAMMAR">Grammar</option></select></label>
      <label className="field-block"><span className="field-label">Level</span><select className="select-input" name="level" required defaultValue={initial?.level ?? "Beginner"}><option>Beginner</option><option>Basic</option><option>Intermediate</option><option>Kelas 2 SD</option></select></label>
      <label className="field-block"><span className="field-label">Tema</span><input className="text-input" name="theme" required defaultValue={initial?.theme ?? ""} placeholder="Animals, Colors, Family" /></label>
      <label className="field-block full-row"><span className="field-label">Deskripsi</span><input className="text-input" name="description" defaultValue={initial?.description ?? ""} placeholder="Ringkasan materi untuk murid" /></label>
      <label className="field-block full-row"><span className="field-label">Instruksi Belajar</span><input className="text-input" name="instruction" defaultValue={initial?.instruction ?? ""} placeholder="Baca teks lalu kerjakan kuis" /></label>

      <div className="field-block full-row">
        <span className="field-label">Isi Materi Utama</span>
        <WysiwygEditor name="contentHtml" initialHtml={initial?.contentHtml ?? ""} placeholder="Masukkan teks, daftar, contoh kalimat, atau penjelasan grammar..." />
      </div>

      <section className="full-row nested-panel">
        <div className="panel-heading compact"><div><p className="eyebrow">Tujuan pembelajaran</p><h3>Learning Objectives</h3></div><button className="secondary-button" type="button" onClick={() => setObjectives([...objectives, ""])}><Plus size={16} /> Tambah</button></div>
        {objectives.map((objective, index) => (
          <div className="inline-row" key={index}>
            <input className="text-input" name={`objective_${index + 1}`} value={objective} onChange={(e) => setObjectives(objectives.map((item, i) => i === index ? e.target.value : item))} />
            <button className="secondary-button icon-only" type="button" onClick={() => setObjectives(objectives.filter((_, i) => i !== index))}><Trash2 size={16} /></button>
          </div>
        ))}
      </section>

      <section className="full-row nested-panel">
        <div className="panel-heading compact"><div><p className="eyebrow">Sub materi</p><h3>Materi Turunan</h3></div><button className="secondary-button" type="button" onClick={() => setSubs([...subs, { title: `Sub Materi ${subs.length + 1}`, content: "" }])}><Plus size={16} /> Tambah</button></div>
        {subs.map((sub, index) => (
          <div className="submaterial-editor" key={index}>
            <input className="text-input" name={`sub_title_${index + 1}`} value={sub.title} onChange={(e) => setSubs(subs.map((item, i) => i === index ? { ...item, title: e.target.value } : item))} />
            <WysiwygEditor name={`sub_content_${index + 1}`} initialHtml={sub.content} placeholder="Isi sub materi..." />
          </div>
        ))}
      </section>

      <section className="full-row nested-panel">
        <div className="panel-heading compact">
          <div><p className="eyebrow">Kuis speaking</p><h3>Latihan Cara Baca Siswa</h3><p className="muted-text">Sistem memakai speech recognition browser. Kosongkan jika tidak ingin membuat soal speaking manual.</p></div>
          <button className="secondary-button" type="button" onClick={() => setSpeakingQuestions([...speakingQuestions, { targetText: "", minScore: 70, maxAttempts: 3, type: "READ_ALOUD" }])}><Plus size={16} /> Tambah</button>
        </div>
        {speakingQuestions.map((item, index) => (
          <div className="speaking-form-grid" key={index}>
            <label className="field-block"><span className="field-label">Jenis Speaking</span><select className="select-input" name={`speaking_type_${index + 1}`} value={item.type} onChange={(e) => setSpeakingQuestions(speakingQuestions.map((q, i) => i === index ? { ...q, type: e.target.value } : q))}><option value="PRONUNCIATION_CHECK">Pronunciation Check</option><option value="READ_ALOUD">Read Aloud</option><option value="LISTEN_AND_REPEAT">Listen and Repeat</option><option value="SPEAKING_PROMPT">Speaking Prompt</option></select></label>
            <label className="field-block"><span className="field-label">Target Text</span><input className="text-input" name={`speaking_target_${index + 1}`} value={item.targetText} onChange={(e) => setSpeakingQuestions(speakingQuestions.map((q, i) => i === index ? { ...q, targetText: e.target.value } : q))} placeholder="Contoh: This is a book" /></label>
            <label className="field-block"><span className="field-label">Minimal Skor</span><input className="text-input" name={`speaking_min_score_${index + 1}`} type="number" min="0" max="100" value={item.minScore} onChange={(e) => setSpeakingQuestions(speakingQuestions.map((q, i) => i === index ? { ...q, minScore: Number(e.target.value) } : q))} /></label>
            <label className="field-block"><span className="field-label">Maksimal Percobaan</span><input className="text-input" name={`speaking_max_attempt_${index + 1}`} type="number" min="0" value={item.maxAttempts} onChange={(e) => setSpeakingQuestions(speakingQuestions.map((q, i) => i === index ? { ...q, maxAttempts: Number(e.target.value) } : q))} /></label>
          </div>
        ))}
      </section>

      <section className="full-row nested-panel media-grid">
        <div><p className="eyebrow">Media</p><h3>Gambar dan Audio</h3><p className="muted-text">Upload gambar/audio ke Vercel Blob atau paste URL manual.</p></div>
        <MediaUploader name="imageUrl" label="Gambar Materi" accept="image/*" folder="materials/images" initialUrl={initial?.imageUrl ?? ""} />
        <MediaUploader name="audioUrl" label="Audio Materi" accept="audio/*" folder="materials/audio" initialUrl={initial?.audioUrl ?? ""} />
        <a className="secondary-button" href="/dashboard/teacher/import"><UploadCloud size={16} /> Import lewat Excel</a>
      </section>
      {error ? <div className="alert-error full-row">{error}</div> : null}
    </form>
  );
}
