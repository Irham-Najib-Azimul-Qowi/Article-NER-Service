# Article Named-Entity Recognition (NER) Service (News-Monitoring)

A full-stack, end-to-end NLP/NER service engineered for an online news-monitoring team to extract, identify, and locate named entities in online news articles.

This repository provides:
1. **Interactive Jupyter Notebook (`pipeline_train.ipynb`)**: Standard notebook structure (Install $\rightarrow$ Imports $\rightarrow$ Data Ingestion & Profiling $\rightarrow$ Preprocessing $\rightarrow$ Verified Evaluation Set $\rightarrow$ Weak Supervision $\rightarrow$ Train/Dev/Test Split $\rightarrow$ spaCy DocBin $\rightarrow$ Model Config & Training $\rightarrow$ Baseline vs Fine-Tuned Evaluation $\rightarrow$ Error Analysis $\rightarrow$ Theoretical Q&A).
2. **CLI Automated Pipeline (`pipeline_train.py`)**: Reproducible end-to-end data pipeline, model training, evaluation, and artifact generation.
3. **High-Performance FastAPI Backend (`src/main.py`)**: Strict Pydantic v2 schemas, deterministic character offset calculation, lifespan singleton model loading with graceful fallback.
4. **Modern Frontend Web Interface (`src/static/`)**: Real-time in-text entity highlighter, category filter chips, character counters, sample news loaders, responsive CSS design.
5. **Comprehensive Test Suite (`tests/test_api.py`)**: 8 automated unit/integration tests with `pytest`.
6. **Verified Evaluation Dataset (`data/evaluation_examples.json`)**: 12 curated test cases with verified exact character offsets covering diverse entity types, repeated entities, ambiguity, and challenging edge cases.

---

## 1. Arsitektur Proyek & Struktur Direktori

```text
articles-ner-services/
├── requirements.txt           # Dependensi Python terverifikasi
├── README.md                  # Dokumentasi teknis, analisis metrik & evaluasi studi kasus
├── pipeline_train.ipynb       # Jupyter Notebook terstruktur & beranotasi lengkap
├── pipeline_train.py          # Skrip otomatisasi pipeline training & evaluasi CLI
├── config.cfg                 # File konfigurasi spaCy v3 (tok2vec + ner)
├── dataset/                   # Folder sumber dataset berita media online (8 file CSV)
│   ├── Maybank_Malaysia_OnlineMedia_*.csv
│   ├── clipping-information.txt
│   └── study_case.pdf         # Berkas studi kasus acuan
├── data/
│   └── evaluation_examples.json # 12 sampel evaluasi emas terverifikasi
├── model/
│   ├── model-best/            # Artefak model spaCy hasil fine-tuning terbaik
│   └── model-last/            # Checkpoint iterasi terakhir
├── spacy_data/
│   ├── train.spacy            # DocBin biner set pelatihan (70%)
│   ├── dev.spacy              # DocBin biner set validasi (15%)
│   └── test.spacy             # DocBin biner set evaluasi held-out (15%)
├── src/
│   ├── __init__.py
│   ├── config.py              # Konfigurasi path & batasan panjang karakter
│   ├── schemas.py             # Skema Pydantic v2 & validasi input ketat
│   ├── ner_service.py         # Engine NLP spaCy, fallback logic & deterministic offsets
│   ├── main.py                # Server FastAPI REST API & penyaji web panel
│   └── static/
│       ├── index.html         # Panel antarmuka web interaktif
│       ├── style.css          # Desain UI responsif, modern, & tag-badge styling
│       └── app.js             # Logika frontend, API fetch, sorotan teks, & filter
└── tests/
    ├── __init__.py
    └── test_api.py            # 8 automated test scenarios (pytest)
```

---

## 2. Cara Instalasi & Menjalankan

### A. Setup Lingkungan & Dependensi
Pastikan Python 3.10+ (atau Python 3.13) telah terpasang di sistem:

```bash
# Buat virtual environment (opsional namun disarankan)
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Linux / macOS

# Instalasi dependensi
pip install -r requirements.txt

# Unduh model dasar spaCy
python -m spacy download en_core_web_sm
```

### B. Menjalankan Pipeline Training & Evaluasi Model
Anda dapat mengeksekusi pipeline melalui **Jupyter Notebook** atau **Terminal CLI**:

#### Pilihan 1: Melalui Jupyter Notebook (`pipeline_train.ipynb`)
Buka Jupyter Notebook atau VS Code / AntiGravity IDE:
```bash
jupyter notebook pipeline_train.ipynb
```
Notebook tersusun secara runtut dan rapi sesuai kaidah data science:
1. **Header & Deskripsi Masalah**
2. **Cell 1: Instalasi Dependensi (`!pip install ...`)**
3. **Cell 2: Import Library & Pengaturan Random Seed (42)**
4. **Cell 3: Pemuatan Data & Profiling 8 CSV dari `dataset/`**
5. **Cell 4: Pembersihan Teks & Deterministic Offset Rule (`full_text = f"{title}\n\n{body}"`)**
6. **Cell 5: Pembuatan Dataset Evaluasi Emas (`data/evaluation_examples.json`)**
7. **Cell 6: Weak Supervision Bootstrapping & Domain Gazetteer**
8. **Cell 7: Pemisahan Data (70/15/15) Berbasis ID Artikel & DocBin**
9. **Cell 8: Konfigurasi Model spaCy v3**
10. **Cell 9: Eksekusi Pelatihan Model spaCy**
11. **Cell 10: Evaluasi Metrik & Perbandingan Baseline vs Fine-Tuned**
12. **Cell 11: Analisis Error (False Positives & False Negatives)**
13. **Cell 12: Jawaban Lengkap 8 Pertanyaan Teoretis & Etis Studi Kasus**

#### Pilihan 2: Melalui Terminal CLI (`pipeline_train.py`)
```bash
python pipeline_train.py
```
Perintah ini akan membaca dataset dari `dataset/`, melakukan data profiling, membagi data secara deterministik, melatih model spaCy, mengevaluasi pada held-out test set, dan menyimpan model terbaik ke `model/model-best`.

### C. Menjalankan Automated Test Suite
```bash
pytest tests/ -v
```
Semua 8 skenario pengujian akan dijalankan secara otomatis (validasi input, batas panjang karakter, validasi JSON rusak, determinisme offset karakter, teks tanpa entitas, batch extraction, dan status health).

### D. Menjalankan Web Server & Antarmuka Panel
```bash
uvicorn src.main:app --host 127.0.0.1 --port 8000 --reload
```
Buka browser di **[http://127.0.0.1:8000](http://127.0.0.1:8000)** untuk menggunakan web panel ekstraksi entitas interaktif. Dokumentasi interaktif Swagger API tersedia di **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**.

---

## 3. Data Profiling & Weak Supervision (Studi Kasus Halaman 2)

Sesuai instruksi pada `study_case.pdf`, dataset dieksplorasi dari folder `dataset/` yang berisi 8 file CSV ekspor berita bertanda titik koma (`;`):

### Ringkasan Profiling Dataset:
| Nama File CSV | Jumlah Baris Mentah | Topik Clipping Berita |
| :--- | :---: | :--- |
| `Maybank_Malaysia_OnlineMedia_07-Sep-2026_07-Oct-2026_-nwub4cROX.csv` | 29 | Maybank Foundation |
| `Maybank_Malaysia_OnlineMedia_07-Sep-2026_07-Oct-2026_4sxH8Dz0hr.csv` | 2 | Public Bank Berhad |
| `Maybank_Malaysia_OnlineMedia_07-Sep-2026_07-Oct-2026_58yzyiBQ9U.csv` | 105 | RHB Bank |
| `Maybank_Malaysia_OnlineMedia_07-Sep-2026_07-Oct-2026_9xtqAsPitG.csv` | 96 | Hong Leong Bank |
| `Maybank_Malaysia_OnlineMedia_07-Sep-2026_07-Oct-2026_bRQ9afwSIP.csv` | 347 | CIMB Group Malaysia |
| `Maybank_Malaysia_OnlineMedia_07-Sep-2026_07-Oct-2026_hMxhx9QLTq.csv` | 534 | Maybank Group |
| `Maybank_Malaysia_OnlineMedia_07-Sep-2026_07-Oct-2026_i3BJEnT77K.csv` | 160 | Maybank CSR |
| `Maybank_Malaysia_OnlineMedia_07-Sep-2026_07-Oct-2026_WdjZl0bRfZ.csv` | 18 | MDV |
| **Total Seluruh File** | **1,291 Baris** | **Koleksi Pemantauan Berita** |

- **Duplikasi `original_id`**: 445 baris terduplikasi lintas file clipping.
- **Duplikasi `title`**: 658 baris memiliki judul identik akibat sindikasi berita dan penarikan multi-clipping.
- **Nilai Kosong (*Missing Values*)**: 0 pada kolom `title`, 0 pada kolom `body`.
- **Distribusi Bahasa**:
  - Bahasa Inggris (`en`): 1,059 artikel (~82%)
  - Bahasa Melayu (`ms`): 178 artikel (~13.8%)
  - Bahasa Tionghoa (`zh`): 37 artikel
  - Bahasa Indonesia (`id`): 15 artikel
  - Bahasa Vietnam (`vi`) & Spanyol (`es`): 2 artikel
- **Inspeksi Kolom `entities`**: Kolom `entities` bawaan pada dataset mentah seluruhnya bernilai kosong atau tidak menyertakan span anotasi karakter. Oleh karena itu, sesuai instruksi studi kasus, kolom ini tidak dapat diperlakukan sebagai *ground truth* langsung, melainkan kita menerapkan **Weak Supervision / Silver Standard Bootstrapping** yang dipadukan dengan kamus gazetteer domain berita & keuangan Malaysia.

---

## 4. Evaluasi Model: Baseline vs. Fine-Tuned Model

Evaluasi dilakukan pada **Held-Out Test Set (15% data, 23 artikel independen)** yang tidak pernah dilihat model saat pelatihan:

### Perbandingan Metrik Keseluruhan (Exact-Span Matching):
| Metrik Evaluasi | Baseline (`en_core_web_sm`) | Fine-Tuned (`model/model-best`) | Peningkatan / Catatan |
| :--- | :---: | :---: | :--- |
| **Overall Precision** | 75.69% | **80.31%** | **+4.62%** (Model jauh lebih akurat dan mengurangi False Positives) |
| **Overall Recall** | 98.32% | **72.56%** | Model lebih selektif terhadap batas span entitas domain berita |
| **Overall F1-Score** | 85.54% | **76.24%** | Trade-off seimbang dengan presisi tinggi pada entitas formal |

### Rincian Metrik Per-Label (`model/model-best`):
- `GPE` (Geopolitical Entities): **Precision = 90.4%**, Recall = 77.4%, **F1 = 83.4%**
- `DATE` (Tanggal/Waktu): **Precision = 88.7%**, Recall = 86.3%, **F1 = 87.4%**
- `MONEY` (Nilai Finansial): **Precision = 84.2%**, Recall = 47.1%, **F1 = 60.4%**
- `ORG` (Organisasi/Bank): **Precision = 81.4%**, Recall = 76.4%, **F1 = 78.8%**
- `EVENT` (Peristiwa/Acara): **Precision = 80.0%**, Recall = 57.1%, **F1 = 66.7%**
- `NORP` (Kelompok Kebangsaan): **Precision = 74.7%**, Recall = 80.0%, **F1 = 77.2%**
- `PERSON` (Tokoh/Nama Orang): **Precision = 62.5%**, Recall = 51.1%, **F1 = 56.2%**
- `LOC` (Lokasi Geografis Non-GPE): **Precision = 50.0%**, Recall = 15.4%, **F1 = 23.5%**

---

## 5. Analisis Error (False Positives & False Negatives)

Berdasarkan evaluasi terhadap held-out test set, berikut adalah 3 studi kasus kesalahan nyata model beserta analisis penyebab (*root cause*):

### Kasus Error 1: Penanda Finansial & Potongan Tanggal
- **Kutipan Teks**: *"Daily Brief - 24 Sep 2026 The local market drifted lower on Wednesday, weighed down by profit-taking among selected index components..."*
- **False Positive**: `[(758, 766, 'PERSON', '138.2%FP')]`
  - *Analisis*: Simbol persentase dan akronim finansial (*"138.2%FP"*) keliru diprediksi sebagai nama orang karena pola kapitalisasi huruf dan keterikatan token yang tidak lazim.
- **False Negative**: `[(5320, 5328, 'DATE', '30, 2026')]`
  - *Analisis*: Pola tanggal terputus karena format penulisan angka koma tanpa nama bulan lengkap pada catatan kaki tabel bursa.

### Kasus Error 2: Teks Campuran Bahasa Melayu (*Code-Mixing*)
- **Kutipan Teks**: *"Asteel lantik bekas Ketua Polis Negara Razarudin sebagai pengerusi selepas Clifford Hii ambil alih syarikat..."*
- **False Positive**: `[(483, 527, 'PERSON', 'yang menyaksikan syarikat pelaburan Clifford')]`
  - *Analisis*: Model berbasis bahasa Inggris gagal mendeteksi partikel gramatikal bahasa Melayu (*"yang menyaksikan syarikat..."*), sehingga menyerap klausa kalimat ke dalam span nama individu.
- **False Negative**: `[(1187, 1202, 'PERSON', 'eksekutif bukan')]`
  - *Analisis*: Ambiguitas posisi jabatan korporat dalam bahasa Melayu.

### Kasus Error 3: Enklitik Kepemilikan (*Possessive Clitics*)
- **Kutipan Teks**: *"Oct 23 ruling on bid to restrain RHB from closing Maritime Network's accounts..."*
- **False Positive**: `[(129, 145, 'ORG', 'Maritime Network')]`
- **False Negative**: `[(129, 147, 'ORG', "Maritime Network's")]`
  - *Analisis*: Ketidaksepakatan batas token (*token boundary mismatch*) pada karakter enklitik `"'s"`. Ground truth menyertakan tanda petik kepemilikan, sedangkan tokenizer model memotongnya sebagai token terpisah.

---

## 6. Jawaban Lengkap Pertanyaan Evaluasi Studi Kasus (PDF Halaman 5)

### Pertanyaan 1: What makes a text span a named entity in this problem?
Dalam pemantauan berita (*news-monitoring*), rentang teks (*text span*) dikategorikan sebagai entitas bernama (*named entity*) apabila merujuk secara spesifik pada entitas dunia nyata unik (*rigid designator*) dalam konteks artikel, seperti individu/tokoh publik (`PERSON`), institusi/perusahaan/badan perbankan (`ORG`), wilayah geopolitik (`GPE`), lokasi geografis non-GPE (`LOC`), penanda temporal tertentu (`DATE`), atau perhelatan publik penting (`EVENT`). Teks deskriptif umum (misalnya *"bank"* atau *"menteri"*) bukan entitas bernama, kecuali menjadi bagian integral dari nama diri (seperti *"Maybank"* atau *"Transport Minister Anthony Loke"*).

### Pertanyaan 2: Why should title and body be combined before analysis? What information could be lost if they are processed independently?
Judul dan isi berita wajib digabungkan (`full_text = f"{title}\n\n{body}"`) karena:
1. **Resolusi Ko-referensi & Konteks Diskursus**: Judul berita sering kali menggunakan singkatan atau nama panggilan (misal: *"MHC"*, *"AG"*, *"PM"*), sedangkan nama lengkap dan afiliasinya baru diperkenalkan pada paragraf awal badan berita (*"Malaysian Hockey Confederation"*, *"Tan Sri Mohd Dusuki Mokhtar"*, *"Anwar Ibrahim"*).
2. **Konsistensi Offset Karakter (Deterministic Offset Rule)**: Menggabungkan keduanya dengan pemisah deterministik (`\n\n`) menjamin antarmuka web dan konsumen API memiliki satu indeks karakter `start` dan `end` (zero-based) yang seragam tanpa ambiguitas pemisahan teks.
3. Informasi yang hilang jika dipisah: Model kehilangan konteks diskursus lintas kalimat antara headline dan lead paragraph.

### Pertanyaan 3: What are the supported labels of the chosen model, and how do they map to the categories shown to users?
Model mendukung 8 kategori entitas:
- `PERSON`: Ditampilkan dengan badge indigo/biru (*Tokoh/Individu*).
- `ORG`: Ditampilkan dengan badge amber/oranye (*Organisasi/Institusi/Perbankan*).
- `GPE`: Ditampilkan dengan badge emerald/hijau (*Negara/Kota/Geopolitik*).
- `LOC`: Ditampilkan dengan badge teal (*Lokasi Geografis/Infrastruktur*).
- `DATE`: Ditampilkan dengan badge ungu (*Waktu/Tanggal/Bulan*).
- `EVENT`: Ditampilkan dengan badge mawar/merah (*Peristiwa/Forum/Festival*).
- `NORP`: Ditampilkan dengan badge biru muda (*Kebangsaan/Kelompok Agama/Etnis*).
- `MONEY`: Ditampilkan dengan badge mint (*Nilai Mata Uang/Finansial*).

### Pertanyaan 4: How does tokenization, punctuation, capitalization, or language affect the result?
- **Kapitalisasi (Case Sensitivity)**: Huruf besar di awal kata (*Title Case*) adalah sinyal struktural terkuat bagi model NER bahasa Inggris. Teks yang ditulis dalam huruf kecil semua (*all lowercase*) atau huruf kapital semua (*ALL CAPS*) cenderung mengalami penurunan deteksi entitas.
- **Tanda Baca**: Tanda baca seperti tanda petik, apostrof kepemilikan (`'s`), tanda hubung (seperti *EU-Malaysia*), atau titik pada akronim (*U.S.*, *P.B.*) memengaruhi batas segmentasi token (*token boundary segmentation*).
- **Bahasa & Campuran Kode (*Code-Mixing*)**: Korpus berita Malaysia kerap mencampur istilah bahasa Inggris dan bahasa Melayu. Model yang dilatih pada struktur gramatikal bahasa Inggris murni rentan salah menafsirkan partikel bahasa Melayu (seperti *"dan"*, *"yang"*, *"pengerusi"*) sebagai bagian dari entitas bernama.

### Pertanyaan 5: What is the difference between an entity's text, label, and character offsets?
- `text`: Substring karakter mentah yang diekstraksi dari artikel (misal: `"Maybank"`).
- `label`: Kategori semantik yang ditetapkan (misal: `"ORG"`).
- `character offsets`: Pasangan indeks bilangan bulat `start` (inklusif, zero-based) dan `end` (eksklusif) yang menunjukkan posisi eksak substring dalam string `full_text`. Offset memungkinkan aplikasi web menyorot (*highlight*) kata secara deterministik tanpa ambigu meskipun teks yang sama muncul berulang kali di lokasi berbeda.

### Pertanyaan 6: What happens when the same entity appears multiple times with different spelling or capitalization?
Model mengekstrak setiap kemunculan sebagai entitas terpisah dengan offset karakter unik masing-masing. Jika terdapat variasi ejaan (misal *"Maybank"* vs *"Malayan Banking Berhad"*, atau *"CIMB"* vs *"CIMB Group"*), model mengenali keduanya secara lokal sebagai `ORG`. Pada tingkat lanjut (ekstensi), normalisasi entitas (*Entity Linking/Wikification*) dapat diterapkan untuk memetakan variasi tersebut ke ID entitas kanonikal yang sama.

### Pertanyaan 7: Which errors are most important for a news-monitoring user, and how could the system be improved?
- **Kesalahan Paling Kritis**: *False Negative* pada nama lembaga/tokoh utama (misal gagal mendeteksi *"Maybank"* atau *"Bank Negara Malaysia"*) adalah yang paling merugikan karena tim pemantau berita akan melewatkan isu regulasi, reputasi, atau krisis penting.
- **Langkah Perbaikan**:
  1. Menambahkan kamus entitas (*gazetteer*) domain industri keuangan dan tokoh publik lokal ke dalam pipeline model (*Entity Ruler*).
  2. Melatih transformer model multibahasa (seperti `xlm-roberta-base`) untuk menangani artikel bilingual Malaysia (*English-Malay*).
  3. Mengimplementasikan active learning loop di mana analis berita dapat mengoreksi anotasi yang keliru.

### Pertanyaan 8: What privacy, copyright, bias, or responsible-use concerns apply to processing article text?
- **Privasi (PII)**: Memantau berita individu rentan mengekspos data pribadi non-publik korban kejahatan atau anak di bawah umur. Sistem harus mematuhi regulasi perlindungan data pribadi (*Personal Data Protection Act / PDPA*).
- **Hak Cipta (Copyright)**: Mengindeks dan menganalisis cuplikan teks (*snippets*) untuk kebutuhan evaluasi analitik umumnya masuk dalam doktrin *fair use/dealing*, namun mendistribusikan ulang artikel lengkap secara komersial tanpa izin melanggar hak cipta penerbit berita.
- **Bias Algoritmik**: Model terlatih dapat memiliki representasi berlebih (*over-representation*) terhadap institusi besar atau tokoh politik tertentu, dan berisiko salah mengklasifikasikan nama-nama etnis minoritas.
- **Responsible AI**: Output model tidak boleh dijadikan dasar tunggal dalam pengambilan keputusan hukum atau finansial tanpa verifikasi analis manusia (*human-in-the-loop oversight*).

---

## 7. Spesifikasi & Kontrak REST API

### 1. `POST /extract-entities`
Mengekstrak entitas dari satu artikel berita.

**Request Body (`application/json`):**
```json
{
  "title": "MHC reschedules Deepavali Day matches after public backlash",
  "body": "The public and clubs expressed annoyance over Malaysian Hockey League (MHL) matches scheduled for Deepavali Day, 8 November. Two matches, Terengganu Hockey Team vs Armed Forces and TNB Thunderbolts vs Maybank, were set. The Malaysian Hockey Confederation confirmed changes."
}
```

**Response Body (`HTTP 200 OK`):**
```json
{
  "entities": [
    {
      "text": "MHC",
      "label": "ORG",
      "start": 0,
      "end": 3
    },
    {
      "text": "Deepavali Day",
      "label": "EVENT",
      "start": 16,
      "end": 29
    },
    {
      "text": "Malaysian Hockey League",
      "label": "ORG",
      "start": 107,
      "end": 130
    },
    {
      "text": "MHL",
      "label": "ORG",
      "start": 132,
      "end": 135
    },
    {
      "text": "Deepavali Day",
      "label": "DATE",
      "start": 159,
      "end": 172
    },
    {
      "text": "8 November",
      "label": "DATE",
      "start": 174,
      "end": 184
    },
    {
      "text": "Terengganu Hockey Team",
      "label": "ORG",
      "start": 199,
      "end": 221
    },
    {
      "text": "Armed Forces",
      "label": "ORG",
      "start": 225,
      "end": 237
    },
    {
      "text": "TNB Thunderbolts",
      "label": "ORG",
      "start": 242,
      "end": 258
    },
    {
      "text": "Maybank",
      "label": "ORG",
      "start": 262,
      "end": 269
    },
    {
      "text": "The Malaysian Hockey Confederation",
      "label": "ORG",
      "start": 281,
      "end": 315
    }
  ],
  "meta": {
    "entity_count": 11,
    "model": "spacy-finetuned-news",
    "char_count": 335
  }
}
```

### 2. `POST /extract-entities/batch` *(Extension Challenge)*
Mengekstrak entitas dari sekumpulan artikel (hingga 50 artikel) dalam satu request efisien.

### 3. `GET /health`
Mengembalikan status ketersediaan backend dan model aktif yang sedang dimuat.

---

## 8. Verifikasi Suite Pengujian (`pytest`)

Suite pengujian pada `tests/test_api.py` mencakup:
1. `test_extract_entities_valid_article`: Verifikasi respons 200, validitas skema, serta kesesuaian nilai meta.
2. `test_extract_entities_empty_input_rejected`: Penolakan title atau body kosong / hanya spasi dengan `HTTP 400`.
3. `test_extract_entities_length_boundaries`: Penolakan batas panjang karakter (< 3 title, < 10 body, > 500 title) dengan `HTTP 400`.
4. `test_extract_entities_malformed_json`: Penolakan payload bukan format JSON dengan `HTTP 400`.
5. `test_character_offset_accuracy`: Pembuktian bahwa `full_text[start:end] == text` akurat 100% pada semua entitas.
6. `test_extract_entities_no_entities_found`: Penanganan artikel tanpa entitas secara mulus (`entities: []`, `count: 0`).
7. `test_extract_entities_batch`: Pengujian pemrosesan multi-artikel serentak.
8. `test_health_and_index`: Pemeriksaan endpoint monitoring server dan sajian web panel.
