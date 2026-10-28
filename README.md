# kaderisasi-perintis-fe

Aplikasi pembinaan **Beasiswa Perintis** BMKA Salman ITB: Catatan Perjalanan (lapbul), tanggapan
mentor, laporan mentoring, panel koordinator, dan area pengelola. Spesifikasi: `../docs/perintis/PRD.md`
dan `../docs/perintis/DB_DESIGN.md`.

Aplikasi web **mobile-first** yang tampil seperti aplikasi ponsel (bilah atas, menu bawah, kolom
selebar ponsel di layar lebar). Rencana berikutnya: PWA.

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

| Akun             | Peran                                             |
| ---------------- | ------------------------------------------------- |
| Aisyah Rahmawati | Mentee, lapbul Desember masih draf                |
| Rizky Pratama    | Mentor, 4 mentee, 1 bendera terbuka               |
| Hana Lestari     | Koordinator, 3 mentor                             |
| Fajar Nugraha    | Mentee sekaligus mentor (pemilih peran di header) |
| Salsabila Putri  | Mentor, bendera tereskalasi                       |
| Pengelola BMKA   | Staf, semua izin `perintis.*`                     |

Untuk memakai backend asli: salin `.env.example` ke `.env.local`, isi `VITE_USE_MOCK_API=false`,
`VITE_WEB_API`, `VITE_ADMIN_API`. Klien ada di `src/api/client.ts` (token Bearer per backend).

### Endpoint tambahan yang belum ada di PRD

Mock memakai beberapa endpoint kecil yang perlu disepakati saat backend dibuat:

| Endpoint                                           | Backend | Kegunaan                                                              |
| -------------------------------------------------- | ------- | --------------------------------------------------------------------- |
| `GET /perintis/me` → `markers`                     | web     | Badge menu (lapbul belum dikirim, perlu ditanggapi, laporan menunggu) |
| `GET /perintis/me/profile`                         | web     | Profil gabungan milik sendiri (pengganti beberapa panggilan profil)   |
| `POST /perintis/me/journals/{month}/response/read` | web     | Hapus tanda **Baru** tanggapan mentor                                 |
| `GET /perintis/reports/me`                         | web     | Daftar laporan mentor per bulan                                       |
| `POST /perintis/reports/me/{month}/review/read`    | web     | Hapus tanda **Baru** tanggapan koordinator                            |
| `POST /perintis/uploads`                           | web     | Unggah foto laporan sebelum disimpan di draf                          |
| `POST /perintis/journals/reopen`                   | admin   | Buka kembali lapbul yang belum pernah dibuat (body: mentee + bulan)   |

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
