# Deploy ke Vercel + Neon + Blob

## 1. Neon PostgreSQL

Buat project Neon lalu salin connection string ke env:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"
```

## 2. Vercel Blob

Buat Blob Store di Vercel dan isi:

```env
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxx"
```

## 3. Environment Variables Vercel

Tambahkan semua variabel dari `.env.example`.

## 4. Build Command

```bash
npm run build
```

## 5. Setelah Deploy

Jalankan migrasi/schema push:

```bash
npm run db:push
npm run db:seed
```

## 6. Catatan

Jangan simpan file audio/gambar ke PostgreSQL. Simpan file ke Vercel Blob, lalu simpan URL ke tabel `Material`, `SubMaterial`, atau `Question`.
