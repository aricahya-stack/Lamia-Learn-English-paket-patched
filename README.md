# Lamia Learn English

Aplikasi web mobile-first untuk belajar bahasa Inggris anak-anak. Fitur utama meliputi login asli berbasis database, proteksi role, mode gelap/terang, manajemen materi, upload media ke Vercel Blob, progres belajar murid, dan laporan nilai.

## Role Pengguna

- **Super Admin**: melihat user, materi, kuis, dan laporan seluruh sistem.
- **Guru**: membuat materi manual dengan WYSIWYG, import Excel, upload gambar/audio, dan melihat laporan nilai murid.
- **Murid**: memilih jalur Reading, Listening, atau Grammar, membuka materi, mengerjakan kuis, dan melihat progres belajar.

## Stack

- Next.js App Router + TypeScript
- Prisma + PostgreSQL/Neon PostgreSQL
- Vercel Blob untuk gambar/audio/file media
- `bcryptjs` untuk validasi password
- Cookie session bertanda tangan HMAC
- Import Excel memakai `xlsx`
- WYSIWYG sederhana berbasis `contenteditable`
- Text-to-speech reading memakai browser `speechSynthesis`

## Instalasi Lokal

```bash
npm install
cp .env.example .env.local
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Buka `http://localhost:3000`.

## Login

Login memakai email dan password dari tabel `User`. Jalankan `npm run db:seed` untuk membuat akun awal berdasarkan environment variable berikut:

```text
SEED_SUPERADMIN_EMAIL
SEED_SUPERADMIN_PASSWORD
SEED_TEACHER_EMAIL
SEED_TEACHER_PASSWORD
SEED_STUDENT_EMAIL
SEED_STUDENT_PASSWORD
```

Halaman login hanya memakai email dan password. Session disimpan pada cookie `lle_session` dan halaman dashboard diproteksi berdasarkan role.

## Environment Production

Variabel penting tersedia di `.env.example`:

```text
DATABASE_URL
DIRECT_URL
BLOB_READ_WRITE_TOKEN
SESSION_SECRET
AUTH_SECRET
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_APP_NAME
```

Gunakan `DATABASE_URL` dari Neon PostgreSQL atau PostgreSQL lain. Jika Neon memakai pooler, isi `DIRECT_URL` dengan direct connection untuk operasi migrasi.

## Materi dan Media

Materi manual disimpan ke database melalui:

```text
POST /api/materials
```

Upload media menggunakan Vercel Blob melalui:

```text
POST /api/blob/upload
```

Form materi otomatis menyimpan URL gambar/audio hasil upload ke kolom `imageUrl` dan `audioUrl`.

## Import Excel

Template tersedia di:

```text
public/templates/lamia-import-template.xlsx
```

Route validasi dan penyimpanan:

```text
POST /api/materials/import
```

Jika checkbox **Simpan ke database setelah valid** aktif dan file valid, sistem akan menyimpan Materials, SubMaterials, Objectives, Questions, Options, dan MatchingPairs ke Prisma/PostgreSQL.

## Progress dan Laporan

Saat murid mengumpulkan kuis, aplikasi membuat data:

- `StudentAttempt`
- `StudentAnswer`

Data ini digunakan oleh halaman:

- `/dashboard/student/progress`
- `/dashboard/teacher/reports`
- `/dashboard/admin/reports`

## Deploy Vercel

1. Buat database di Neon PostgreSQL.
2. Isi `DATABASE_URL` dan `DIRECT_URL`.
3. Buat Vercel Blob Store dan isi `BLOB_READ_WRITE_TOKEN`.
4. Isi `SESSION_SECRET` dengan string acak panjang.
5. Deploy ke Vercel.
6. Jalankan `npm run db:push` dan `npm run db:seed`.

## Update Paket Materi

Versi ini menambahkan fitur **Paket Materi**. Satu paket dapat berisi 24 materi atau lebih. Murid disarankan membuka materi melalui menu **Paket**, sehingga tampilan tidak terlalu penuh tombol.

### Import Excel Paket

Gunakan template baru:

```text
public/templates/lamia-import-template-paket.xlsx
```

Pada sheet `Materials`, kolom `package` wajib diisi. Jika `package` dan `material_code` sama dengan data yang sudah ada, proses import akan menimpa materi lama.

Setelah mengganti kode aplikasi, jalankan:

```bash
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

# Patch Student Answers & Progress

Perbaikan:

1. Jawaban terakhir siswa dimuat ulang saat membuka materi yang sama.
2. Kartu materi di dalam paket diberi tanda warna berbeda jika sudah dikerjakan.
3. Kuis menampilkan panel “Sudah dikerjakan” beserta nilai terakhir, percobaan keberapa, dan tanggal submit.
4. Pilihan radio, input teks, matching, dan speaking akan terisi dari jawaban terakhir.
5. Siswa tetap bisa mengerjakan ulang dan menyimpan percobaan baru.
6. API `/api/attempts` mengembalikan `submittedAt` dan `attemptNumber` setelah submit.

File berubah:

- lib/materials.ts
- components/material-card.tsx
- components/matching-question.tsx
- components/speaking-quiz.tsx
- components/quiz-renderer.tsx
- app/api/attempts/route.ts
- app/dashboard/student/packages/[id]/page.tsx
- app/dashboard/student/materials/[id]/page.tsx
- app/globals.css

Catatan:

Patch ini tidak menambah tabel baru. Tidak perlu `db:push` kecuali ada perubahan schema lain di luar patch ini.

