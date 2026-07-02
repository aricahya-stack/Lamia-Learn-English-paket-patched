# Patch Notes - Lamia Learn English

Perbaikan dalam paket ini:

1. Matching interaktif
   - Siswa sekarang bisa memilih kartu kiri lalu memilih pasangan kanan.
   - Jawaban matching disimpan sebagai JSON mapping.
   - Skor matching dihitung proporsional berdasarkan jumlah pasangan benar.

2. Speech Recognition
   - Sistem meminta akses mikrofon dengan `getUserMedia()` sebelum memulai Speech Recognition.
   - Pesan error dibuat lebih jelas untuk `not-allowed`, `no-speech`, `audio-capture`, `network`, dan `aborted`.
   - Ditambahkan input cadangan jika mikrofon/browser tidak mendukung Speech Recognition.
   - Catatan: Speech Recognition paling stabil di Chrome/Edge dan membutuhkan `localhost` atau HTTPS.

3. Super Admin tambah user
   - Halaman `/dashboard/admin/users` sekarang memiliki form tambah user.
   - Super Admin dapat membuat akun Super Admin, Guru, dan Murid.
   - Endpoint baru: `POST /api/admin/users`.
   - Password user baru otomatis di-hash memakai bcrypt.

4. Import Excel lebih tahan error
   - `pronunciation_mode` kosong tidak lagi dianggap enum invalid; sistem memakai default `SENTENCE`.

5. Perbaikan tambahan
   - `package-lock.json` internal dihapus agar `npm install` memakai registry publik.
   - `.npmrc` ditambahkan dengan `registry=https://registry.npmjs.org/`.
   - `body suppressHydrationWarning` ditambahkan untuk mengurangi warning akibat browser extension.

Setelah mengganti folder aplikasi, jalankan:

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Jika database sudah ada dan user seed sudah ada, cukup jalankan:

```bash
npm install
npm run db:generate
npm run db:push
npm run dev
```
