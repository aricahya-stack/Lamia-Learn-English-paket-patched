"use client";

import { useState } from "react";
import { UploadCloud } from "lucide-react";

export function MediaUploader({ name, label, accept, folder, initialUrl = "" }: { name: string; label: string; accept: string; folder: string; initialUrl?: string | null }) {
  const [url, setUrl] = useState(initialUrl || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(file?: File) {
    if (!file) return;
    setLoading(true);
    setMessage("");
    const form = new FormData();
    form.set("file", file);
    form.set("folder", folder);

    try {
      const response = await fetch("/api/blob/upload", { method: "POST", body: form });
      const json = await response.json();
      if (!response.ok || !json.url) throw new Error(json.error || "Upload gagal.");
      setUrl(json.url);
      setMessage("Upload berhasil.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <label className="field-block media-uploader">
      <span className="field-label">{label}</span>
      <input className="text-input" name={name} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL otomatis dari Blob atau tempel URL manual" />
      <span className="file-upload-button"><UploadCloud size={16} /> {loading ? "Mengupload..." : "Upload File"}<input type="file" accept={accept} onChange={(e) => upload(e.target.files?.[0])} disabled={loading} /></span>
      {message ? <small className="muted-text">{message}</small> : null}
    </label>
  );
}
