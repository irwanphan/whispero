Business Requirement Document (BRD)

Project: Meeting PDCA & TTFU Tracker
Tech Stack: Next.js (App Router), Prisma ORM, Tailwind CSS, NeonDB (Postgres), S3/Supabase (opsional storage)

1. Executive Summary

Tujuan proyek ini adalah membangun aplikasi berbasis web untuk mendukung manajemen rapat dengan pendekatan PDCA (Plan–Do–Check–Action). Sistem memungkinkan SPV untuk membuat Things To Follow Up (TTFU), menugaskan ke assignee, melampirkan evidence, dan mendapatkan review dari reviewer.
Aplikasi ini membantu perusahaan memastikan tindak lanjut rapat tercatat, terdokumentasi, dan dapat dimonitor secara transparan.

2. Objectives

Menyediakan platform digital untuk mengelola recap meeting.

Membuat TTFU/Checklist yang bisa di-assign ke user tertentu.

Mendukung evidence submission (link atau upload file).

Menyediakan workflow review/approval dari reviewer.

Menghasilkan laporan rekap (per meeting, per user, per status).

Sistem bisa diakses via browser (PWA-ready).

3. Scope of Work
In-Scope

User Management

Role: Admin, SPV, Reviewer, Assignee.

Login via email/password (NextAuth, JWT session).

Role-based access control.

Meeting Management

Create meeting (judul, tanggal, waktu, peserta).

Assign SPV dan peserta.

Lihat daftar meeting + filter by date.

TTFU Management

SPV membuat TTFU (judul, deskripsi, assignee, reviewer, due date).

Status tracking: Open, In Progress, Done, Rejected.

Evidence Management

Submit evidence → link (hemat) atau file upload (via S3/Supabase).

Multi evidence per TTFU.

Evidence punya deskripsi tambahan.

Review Workflow

Reviewer approve/reject evidence.

Feedback/comment pada evidence.

Audit trail untuk review status.

Reporting

Rekap status TTFU per meeting.

Export laporan ke PDF/Excel.

Dashboard status by SPV/Reviewer/Assignee.

Out of Scope (for MVP)

Integrasi AI transkrip otomatis.

Integrasi dengan kalender eksternal (Google/Outlook).

Mobile app native (fokus PWA web).

4. User Stories

SPV:
“Sebagai SPV, saya ingin membuat TTFU untuk setiap meeting agar tindak lanjut jelas dan ada PIC.”

Assignee:
“Sebagai Assignee, saya ingin melihat tugas saya, mengunggah evidence, dan menandai pekerjaan selesai.”

Reviewer:
“Sebagai Reviewer, saya ingin memeriksa evidence, memberi komentar, dan menyetujui atau menolak.”

Admin:
“Sebagai Admin, saya ingin memantau semua meeting dan laporan agar bisa mengevaluasi kinerja tim.”

5. Functional Requirements

[FR-01] Sistem harus bisa membuat, mengedit, menghapus meeting.

[FR-02] Sistem harus bisa membuat, mengedit, menghapus TTFU dalam meeting.

[FR-03] Sistem harus bisa assign assignee & reviewer untuk setiap TTFU.

[FR-04] Sistem harus mendukung evidence submission (link/file).

[FR-05] Reviewer harus bisa approve/reject evidence dengan komentar.

[FR-06] Sistem harus menyediakan dashboard recap per meeting.

[FR-07] Sistem harus bisa ekspor laporan (PDF/Excel).

[FR-08] Sistem harus berjalan sebagai PWA (offline cache minimal).

6. Non-Functional Requirements

Performance: Sistem mampu handle 100 concurrent users.

Security: Role-based access control, JWT session, file upload dengan signed URL.

Availability: Deploy di Vercel (FE/BE), NeonDB untuk Postgres DB.

Scalability: Prisma ORM untuk kemudahan migrasi schema & integrasi.

Maintainability: Codebase monorepo dengan struktur modular.

7. Tech Stack

Frontend: Next.js 14 (App Router), Tailwind CSS, React Query.

Backend: Next.js API Routes (REST), Middleware untuk auth.

Database: NeonDB (Postgres), Prisma ORM.

Auth: NextAuth (JWT session, email/password).

Storage: Supabase Storage / AWS S3 (opsional).

Deployment: Vercel (Next.js), NeonDB Cloud (DB).

8. Deliverables

Web app dengan fitur sesuai scope.

Database schema (NeonDB, Prisma migration).

Dokumentasi API & ERD.

BRD + User Guide.

MVP deploy (Vercel + NeonDB).

9. Timeline (Estimasi MVP – 6 minggu)

Week 1: Setup project, DB schema (Prisma + NeonDB).

Week 2–3: Meeting + TTFU module (CRUD, role).

Week 4: Evidence module + file storage integration.

Week 5: Review workflow + dashboard.

Week 6: Reporting + testing + deploy.

10. Risks & Mitigation

Risk: Penyimpanan evidence besar → biaya storage tinggi.

Mitigation: Default pakai link ke Drive, storage opsional.

Risk: User tidak terbiasa pakai web app.

Mitigation: UI sederhana dengan checklist style (mirip task manager).

Risk: Migrasi ke SaaS scale.

Mitigation: Arsitektur modular, siap integrasi AI/kalender ke depan.