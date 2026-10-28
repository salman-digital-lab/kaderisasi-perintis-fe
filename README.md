# kaderisasi-perintis-fe

Aplikasi pembinaan **Beasiswa Perintis** BMKA Salman ITB: Catatan Perjalanan (lapbul), tanggapan
mentor, laporan mentoring, panel koordinator, dan area pengelola. Spesifikasi: `../docs/perintis/PRD.md`
dan `../docs/perintis/DB_DESIGN.md`.

Aplikasi web **mobile-first** yang tampil seperti aplikasi ponsel (bilah atas, menu bawah). Di
desktop (≥ 62em) halaman yang sama tampil sebagai dasbor: menu samping berwarna navy, konten
lebar, dan bilah aksi menempel di bawah kolom konten. Rencana berikutnya: PWA.

### Tata letak desktop

- Bingkai ada di `src/components/layout/` (`TabLayout` = menu bawah + menu samping, `Screen` =
  bilah atas, hero, konten, bilah aksi). Halaman tidak perlu tahu ukuran layar.
- Lebar konten per halaman lewat `<Screen width>`: `narrow` (bawaan, 45rem) untuk formulir dan
  detail, `wide` (75rem) untuk daftar dan dasbor.
- Pemilih peran pindah ke bawah menu samping; tombol di bilah atas disembunyikan (`hiddenFrom="md"`).
- Halaman masuk tampil sebagai kartu di tengah layar.
- Daftar yang panjang tampil sebagai tabel yang bisa diurutkan (`src/components/DataTable.tsx`)
  mulai 75em; di antara 62em dan 75em daftar kartu ponsel tetap dipakai agar tabel tidak
  bergeser ke samping. `useDesktop()` (62em) untuk tata letak dua kolom, `useTableLayout()`
  (75em) untuk tabel.
- Halaman baca + tindakan (tanggapi lapbul, periksa laporan, lapbul staf) memakai dua kolom:
  isi di kiri, kolom aksi di kanan yang tetap terlihat saat menggulir (`stickyAside stickyPane`).
- Urutan bagian di ponsel tidak berubah; cek di 375px dan 1440px setelah mengubah tata letak.

## Stack

React 19 + Vite 7, Mantine 9, TanStack Query 5, React Router 7, dayjs (zona Asia/Jakarta). Node 24.

Tampilan mengikuti **Beasiswa Perintis Design System**
(https://claude.ai/artifact/2QfBnFgAs4wLeVVzr65hkC): Montserrat untuk judul (display miring kapital),
Plus Jakarta Sans untuk isi; biru langit/navy sebagai dasar, emas dan jingga sebagai aksen; tombol
kapsul, kartu radius 16, chip status bertitik, dan info pill bergaris emas. Token ada di
`src/theme/theme.ts` (`BRAND`), komponen merek di `src/components/brand.tsx`.

## Menjalankan

```bash
npm ci
npm run dev        # http://localhost:3020
npm run dev:phone  # also on your LAN IP, to open on a real phone
npm run typecheck
npm run lint
npm run build
```

## API tiruan (mock)

Belum ada backend. Selama `VITE_USE_MOCK_API` bukan `false`, semua permintaan dijawab oleh
`src/api/mock/` dengan **path yang sama** seperti rencana di PRD (`/v2/perintis/...` di
`kaderisasi-web-be-go` untuk peserta, `kaderisasi-admin-be-go` untuk staf). Data contoh disimpan di
`localStorage` peramban (`perintis.mock.db`).

- Halaman **Akun → Mode demo**: ganti tanggal simulasi (4, 8, 13, 16 Jan 2027) untuk mencoba tenggat
  tgl 5/12/15, dan kembalikan data contoh.
- Akun demo ada di halaman masuk (kata sandi apa pun). Peserta di `/masuk`, staf di `/staf/masuk`.

| Akun             | Peran                                                |
| ---------------- | ---------------------------------------------------- |
| Aisyah Rahmawati | Mentee, lapbul Desember masih draf                   |
| Rizky Pratama    | Mentor, 4 mentee, 1 bendera terbuka                  |
| Hana Lestari     | Koordinator, 3 mentor                                |
| Fajar Nugraha    | Mentee sekaligus mentor (pemilih peran di header)    |
| Salsabila Putri  | Mentor, bendera tereskalasi                          |
| Pengelola BMKA   | Staf (Pengelola Perintis)                            |
| Super Admin      | Staf, juga bisa **Tambah peserta** dari data anggota |

## Backend asli

Endpoint `/v2/perintis/*` sudah ada di `kaderisasi-web-be-go` (peserta) dan
`kaderisasi-admin-be-go` (pengelola), dengan tabel dari migrasi Ace di
`kaderisasi-admin-be` (lihat `kaderisasi-admin-be-go/docs/PERINTIS.md`).

1. Salin `.env.example` ke `.env.local`, isi `VITE_USE_MOCK_API=false`, `VITE_WEB_API`,
   `VITE_ADMIN_API`.
2. Tambahkan origin aplikasi ini (mis. `http://localhost:3020`) ke `ADMIN_CORS_ORIGINS`
   admin-be-go; web-be-go menerima semua origin.
3. Masuk memakai email + kata sandi akun Kaderisasi (peserta) atau akun admin (staf).
   Token staf diperbarui otomatis lewat cookie refresh.

Catatan mode backend asli:

- **Masuk dengan Google** baru tersedia di mock; versi asli butuh Google Identity
  Services dan disembunyikan untuk sementara.
- Berkas (bukti, KHS, foto kelompok) privat dan dimuat lewat `GET /perintis/files?key=`
  dengan sesi, bukan URL publik.
- Jam aplikasi memakai waktu nyata. Untuk demo, isi `VITE_PERINTIS_CLOCK` sama dengan
  `PERINTIS_CLOCK` di kedua backend.

### Endpoint tambahan di luar PRD

Endpoint kecil ini dipakai aplikasi dan sudah diimplementasikan di backend:

| Endpoint                                           | Backend | Kegunaan                                                              |
| -------------------------------------------------- | ------- | --------------------------------------------------------------------- |
| `GET /perintis/me` → `markers`                     | web     | Badge menu (lapbul belum dikirim, perlu ditanggapi, laporan menunggu) |
| `GET /perintis/me/profile`                         | web     | Profil gabungan milik sendiri (pengganti beberapa panggilan profil)   |
| `POST /perintis/me/journals/{month}/response/read` | web     | Hapus tanda **Baru** tanggapan mentor                                 |
| `GET /perintis/reports/me`                         | web     | Daftar laporan mentor per bulan                                       |
| `POST /perintis/reports/me/{month}/review/read`    | web     | Hapus tanda **Baru** tanggapan koordinator                            |
| `POST /perintis/uploads`                           | web     | Unggah foto laporan sebelum disimpan di draf                          |
| `POST /perintis/journals/reopen`                   | admin   | Buka kembali lapbul yang belum pernah dibuat (body: mentee + bulan)   |
| `GET /perintis/members?q=`                         | admin   | Super Admin: cari anggota kaderisasi (nama, email, no. anggota)       |
| `POST /perintis/participants`                      | admin   | Super Admin: jadikan anggota itu peserta dengan peran pilihan         |

## Struktur

```
src/
  api/          client, endpoint per backend, tipe, mock/ (seed, aturan bisnis, rute)
  auth/         dua sesi (peserta & staf), peran aktif
  components/   Screen (bilah atas + footer), TabLayout (menu bawah), UI bersama
  content/      formulir lapbul, kurikulum, label — ditetapkan di kode (PRD §10.5)
  features/     mentee, mentor, coordinator, staff, account, shared
  lib/          waktu & tenggat (Asia/Jakarta), berkas, peran
```
