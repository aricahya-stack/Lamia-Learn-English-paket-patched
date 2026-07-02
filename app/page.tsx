import Link from "next/link";
import { ArrowRight, BookOpen, Headphones, PenTool, ShieldCheck, Smartphone, Sparkles, UploadCloud } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <AppLogo />
        <div className="landing-actions"><ThemeToggle /><Link className="primary-button" href="/login">Masuk <ArrowRight size={16} /></Link></div>
      </nav>
      <section className="landing-hero">
        <div className="landing-copy">
          <span className="hero-kicker"><Sparkles size={16} /> Platform belajar bahasa Inggris anak</span>
          <h1>Lamia Learn English dibuat ringan, interaktif, dan nyaman dibuka lewat HP.</h1>
          <p>Guru dapat mengelola materi berbasis database, mengunggah media ke Vercel Blob, memantau progres murid, dan melihat laporan nilai. Murid belajar Reading, Listening, dan Grammar melalui tampilan mobile-first.</p>
          <div className="dashboard-hero-actions">
            <Link className="primary-button" href="/login">Masuk ke Aplikasi <ArrowRight size={16} /></Link>
            <a className="secondary-button" href="/templates/lamia-import-template.xlsx"><UploadCloud size={16} /> Template Excel</a>
          </div>
        </div>
        <div className="landing-card-grid">
          <article className="feature-card"><Smartphone /><h3>Mobile-first</h3><p>Tampilan utama dioptimalkan untuk layar HP.</p></article>
          <article className="feature-card"><BookOpen /><h3>Reading</h3><p>Materi teks, tujuan belajar, dan tombol baca.</p></article>
          <article className="feature-card"><Headphones /><h3>Listening</h3><p>Audio, gambar, dan latihan dengar interaktif.</p></article>
          <article className="feature-card"><PenTool /><h3>Grammar</h3><p>Latihan pola kalimat dan kuis otomatis.</p></article>
          <article className="feature-card"><ShieldCheck /><h3>Login asli</h3><p>Akses dibatasi berdasarkan akun dan role.</p></article>
        </div>
      </section>
    </main>
  );
}
