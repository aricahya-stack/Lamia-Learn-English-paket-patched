import Link from "next/link";
import { ArrowLeft, LockKeyhole, Mail } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <main className="login-page auth-page">
      <section className="login-card card auth-card">
        <div className="auth-card-top">
          <AppLogo />
          <ThemeToggle />
        </div>

        <div>
          <p className="eyebrow">Login Pengguna</p>
          <h1>Masuk ke Lamia Learn English</h1>
          <p className="muted-text">Gunakan email dan password akun yang sudah dibuat melalui seed database atau oleh Super Admin.</p>
        </div>

        {error ? (
          <div className="alert-error">
            {error === "invalid" ? "Email atau password tidak sesuai." : "Login belum dapat diproses. Periksa koneksi database dan environment variable."}
          </div>
        ) : null}

        <form className="auth-form" action="/api/auth/login" method="post">
          <label className="field-block">
            <span className="field-label">Email</span>
            <span className="input-with-icon"><Mail size={18} /><input name="email" type="email" autoComplete="email" placeholder="nama@email.com" required /></span>
          </label>
          <label className="field-block">
            <span className="field-label">Password</span>
            <span className="input-with-icon"><LockKeyhole size={18} /><input name="password" type="password" autoComplete="current-password" placeholder="Masukkan password" required /></span>
          </label>
          <button className="primary-button full-button" type="submit">Masuk</button>
        </form>

        <Link className="secondary-button back-link" href="/"><ArrowLeft size={16} /> Kembali ke Beranda</Link>
      </section>
    </main>
  );
}
