# Patch Paket Materi - Lamia Learn English

## Fitur baru

1. **Paket Materi**
   - Menambahkan model `LearningPackage` di Prisma.
   - Setiap materi bisa masuk ke satu paket.
   - Murid membuka materi lewat menu `Paket`, sehingga tampilan lebih ringkas.

2. **Import Excel berbasis paket**
   - Sheet `Materials` sekarang wajib memiliki kolom `package`.
   - Sheet `Materials` mendukung kolom `material_code`.
   - Jika kombinasi `package + material_code` sama, import ulang akan menimpa materi lama.

3. **Manajemen Paket**
   - Super Admin: `/dashboard/admin/packages`.
   - Guru: `/dashboard/teacher/packages`.
   - Paket dapat ditambah, diedit, dan dihapus.

4. **Edit/Delete data utama**
   - User: tambah, edit, hapus dari Super Admin.
   - Paket: tambah, edit, hapus dari Super Admin/Guru.
   - Materi: tambah, edit, hapus dari Super Admin/Guru.

5. **Tampilan murid lebih sederhana**
   - Sidebar murid: Dashboard, Paket, Progres.
   - Materi ditampilkan di dalam paket, bukan langsung semua tombol skill.

## Perintah setelah update

Karena ada perubahan schema Prisma, jalankan:

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Jika Prisma meminta konfirmasi saat `db:push`, baca pesan dengan teliti. Backup database terlebih dahulu jika data penting sudah ada.

## Template Excel baru

Template baru tersedia di:

- `public/templates/lamia-import-template-paket.xlsx`
- `templates/lamia-import-template-paket.xlsx`

Kolom penting di sheet `Materials`:

- `package` wajib diisi.
- `material_code` sebaiknya diisi agar import ulang bisa menimpa materi yang sama.
- `temp_material_id` tetap dipakai untuk menghubungkan submateri, tujuan, soal, opsi, dan matching pairs.
