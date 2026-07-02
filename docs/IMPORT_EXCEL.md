# Spesifikasi Import Excel Lamia Learn English

## Prinsip

Guru bisa menambahkan banyak materi sekaligus melalui Excel. Setiap materi memiliki:

- materi utama,
- sub materi,
- tujuan pembelajaran,
- kuis,
- soal,
- opsi jawaban,
- pasangan matching,
- referensi media gambar/audio.

## Sheet Materials

Kolom wajib:

- `temp_material_id`
- `title`
- `skill` berisi `READING`, `LISTENING`, atau `GRAMMAR`
- `level`
- `theme`
- `status` berisi `DRAFT` atau `PUBLISHED`

Kolom opsional:

- `description`
- `instruction`
- `content_text`
- `content_html`
- `image_file_or_url`
- `audio_file_or_url`
- `default_voice_type`
- `default_language`
- `default_speech_rate`

## Sheet Questions

Jenis soal yang didukung:

- `MULTIPLE_CHOICE`
- `MATCHING`
- `SHORT_ANSWER`
- `TRUE_FALSE`
- `FILL_BLANK`
- `WORD_ARRANGEMENT`
- `SENTENCE_ARRANGEMENT`
- `LISTEN_AND_CHOOSE`
- `LISTEN_AND_TYPE`
- `PICTURE_CHOICE`
- `AUDIO_MATCHING`
- `ODD_ONE_OUT`
- `LABEL_PICTURE`
- `PRONUNCIATION_CHECK`
- `READ_ALOUD`
- `LISTEN_AND_REPEAT`
- `SPEAKING_PROMPT`

## Alur Import

1. Guru download template Excel.
2. Guru isi sheet sesuai format.
3. Guru upload Excel melalui dashboard.
4. Sistem validasi.
5. Jika valid, data dapat disimpan ke database.
6. Media besar disarankan diupload ke Vercel Blob, lalu URL dimasukkan ke Excel.


## Kolom Tambahan untuk Speaking Quiz

Pada sheet `Questions`, tipe speaking memerlukan kolom berikut:

- `target_text`: teks target yang harus dibaca/diucapkan siswa. Wajib untuk speaking.
- `sample_text`: teks contoh yang dapat dibacakan browser. Opsional; jika kosong, sistem memakai `target_text`.
- `pronunciation_mode`: `WORD`, `PHRASE`, `SENTENCE`, atau `PARAGRAPH`.
- `min_score`: skor minimal kelulusan speaking, misalnya `70` atau `75`.
- `allow_retry`: `TRUE` atau `FALSE`.
- `max_attempts`: jumlah maksimal percobaan, misalnya `3`. Gunakan `0` untuk bebas.
- `use_browser_tts`: `TRUE` jika contoh suara memakai browser.
- `save_recording`: `TRUE` jika rekaman siswa akan disimpan ke Blob. Untuk anak-anak, default disarankan `FALSE` kecuali ada izin.

Contoh baris speaking:

```text
temp_material_id: MAT001
quiz_title: Reading Practice
question_no: 4
question_type: READ_ALOUD
question_text: Read this sentence aloud.
target_text: I have a cat
min_score: 70
max_attempts: 3
use_browser_tts: TRUE
save_recording: FALSE
```
