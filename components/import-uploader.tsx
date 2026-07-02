"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, UploadCloud } from "lucide-react";

type ImportResponse = {
  valid: boolean;
  summary: Record<string, number>;
  issues: { sheet: string; row: number; level: string; message: string }[];
  data?: Record<string, unknown[]>;
  message?: string;
};

export function ImportUploader() {
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const response = await fetch("/api/materials/import", { method: "POST", body: form });
    const json = await response.json();
    setResult(json);
    setLoading(false);
  }

  return (
    <div className="import-layout">
      <form className="card panel import-box" onSubmit={submit}>
        <div>
          <p className="eyebrow">Import Excel</p>
          <h3>Upload Template Materi</h3>
          <p className="muted-text">Sistem membaca kolom Paket pada sheet Materials. Jika package + material_code sama, materi lama akan ditimpakan otomatis.</p>
        </div>
        <input className="text-input" name="file" type="file" accept=".xlsx,.xls" required />
        <label className="inline-check"><input type="checkbox" name="save" value="true" /> Simpan ke database setelah valid</label>
        <button className="primary-button" disabled={loading} type="submit"><UploadCloud size={16} /> {loading ? "Memvalidasi..." : "Upload dan Validasi"}</button>
        <a className="secondary-button" href="/templates/lamia-import-template-paket.xlsx"><FileSpreadsheet size={16} /> Download Template Excel Paket</a>
      </form>

      {result ? (
        <article className="card panel result-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">Hasil validasi</p><h3>{result.valid ? "File valid" : "Ada kesalahan"}</h3></div>
            {result.valid ? <CheckCircle2 className="success-icon" /> : <AlertTriangle className="warning-icon" />}
          </div>
          <div className="summary-grid">
            {Object.entries(result.summary).map(([key, value]) => <div key={key}><strong>{value}</strong><span>{key}</span></div>)}
          </div>
          <div className="issue-list">
            {result.message ? <p className="feedback correct">{result.message}</p> : null}
            {result.issues.length ? result.issues.map((issue, index) => (
              <div className={`issue-row ${issue.level.toLowerCase()}`} key={index}>
                <strong>{issue.sheet} baris {issue.row}</strong>
                <span>{issue.message}</span>
              </div>
            )) : <p className="muted-text">Tidak ada error. Data siap dipreview/disimpan.</p>}
          </div>
        </article>
      ) : null}
    </div>
  );
}
