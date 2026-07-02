# Database Lamia Learn English

Database memakai Neon PostgreSQL dan Prisma.

Model utama:

- `User`
- `ClassRoom`
- `Enrollment`
- `Material`
- `SubMaterial`
- `LearningObjective`
- `Quiz`
- `Question`
- `QuestionOption`
- `MatchingPair`
- `StudentAttempt`
- `StudentAnswer`

Kode materi otomatis menggunakan format:

```text
ENG-RD-BEG-000001
ENG-LS-BEG-000002
ENG-GR-BEG-000003
```

Kode kuis:

```text
QZ-RD-000001
QZ-LS-000002
QZ-GR-000003
```

Untuk produksi, kode sebaiknya dibuat berdasarkan sequence database agar benar-benar urut dan bebas race condition.

## Tambahan Speaking Quiz

Model `Question` sudah diperluas untuk tipe speaking:

- `PRONUNCIATION_CHECK`
- `READ_ALOUD`
- `LISTEN_AND_REPEAT`
- `SPEAKING_PROMPT`

Kolom penting pada `Question`:

- `targetText`: teks yang harus dibaca siswa.
- `pronunciationMode`: `WORD`, `PHRASE`, `SENTENCE`, atau `PARAGRAPH`.
- `minPronunciationScore`: skor minimal kelulusan.
- `allowRetry`: apakah siswa boleh mengulang.
- `maxAttempts`: batas percobaan.
- `sampleAudioUrl`: audio contoh dari Vercel Blob jika tersedia.
- `useBrowserTts`: gunakan suara browser sebagai contoh.

Model `PronunciationAttempt` menyimpan riwayat percobaan speaking siswa:

- teks target,
- teks yang terbaca browser,
- skor,
- daftar kata yang perlu dilatih,
- URL rekaman jika penyimpanan audio diaktifkan.

Untuk privasi anak, penyimpanan rekaman audio siswa sebaiknya dibuat opsional dan default `false`.
