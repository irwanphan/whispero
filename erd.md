# PDCA/TTFU – ERD, Prisma Models (NeonDB) & Wireframes

## 1) ERD (high-level)

Entities & relations (→ many-to-one unless noted):

* **User** ⟷ **MeetingParticipant** (1\:N)
* **Meeting** ⟷ **MeetingParticipant** (1\:N)
* **Meeting** ⟶ **TTFU** (1\:N)
* **TTFU** ⟶ **Evidence** (1\:N)
* **Evidence** ⟶ **Review** (1\:N)
* **User** (as SPV/Assignee/Reviewer) referenced by **TTFU** & **Evidence**/**Review**

Key constraints:

* A TTFU belongs to exactly one Meeting.
* Evidence belongs to exactly one TTFU.
* Review belongs to exactly one Evidence.
* MeetingParticipant ensures role-in-meeting (spv/reviewer/participant) membership.
* Unique combo: (meeting\_id, user\_id) in MeetingParticipant.

## 2) Prisma Schema (NeonDB / PostgreSQL)

> Notes:
>
> * Uses Prisma `postgresql` provider.
> * Includes enums for roles & statuses.
> * Includes optional NextAuth tables (Accounts, Sessions, VerificationToken) for easy Auth.js integration.

```prisma
// schema.prisma
// Generator
generator client {
  provider = "prisma-client-js"
}

// Datasource
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ===== Enums =====

enum GlobalRole {
  ADMIN
  SPV
  REVIEWER
  USER
}

enum MeetingRole {
  spv
  reviewer
  participant
}

enum TtfuStatus {
  OPEN
  IN_PROGRESS
  DONE
  REJECTED
}

enum EvidenceType {
  link
  file
}

enum ReviewStatus {
  approved
  rejected
  needs_revision
}

// ===== Core Models =====

model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  passwordHash  String?  // if using email/password; optional if OAuth only
  globalRole    GlobalRole @default(USER)

  // Relations
  meetingsCreated   Meeting[]     @relation("MeetingsCreated")
  ttfuAssigned      TTFU[]        @relation("TTFU_Assignee")
  ttfuReviewed      TTFU[]        @relation("TTFU_Reviewer")
  evidencesSubmitted Evidence[]   @relation("Evidence_Submitter")
  reviewsMade       Review[]      @relation("Review_Reviewer")
  meetingMemberships MeetingParticipant[]

  // NextAuth
  accounts      Account[]
  sessions      Session[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Meeting {
  id          String   @id @default(cuid())
  title       String
  date        DateTime // meeting date-time
  notes       String?
  createdById String
  createdBy   User     @relation("MeetingsCreated", fields: [createdById], references: [id], onDelete: Restrict)

  participants MeetingParticipant[]
  ttfus         TTFU[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([date])
}

model MeetingParticipant {
  id         String      @id @default(cuid())
  meetingId  String
  userId     String
  role       MeetingRole

  meeting    Meeting     @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt  DateTime    @default(now())

  @@unique([meetingId, userId])
  @@index([userId])
}

model TTFU {
  id           String     @id @default(cuid())
  meetingId    String
  title        String
  description  String?
  assigneeId   String
  reviewerId   String
  status       TtfuStatus @default(OPEN)
  dueDate      DateTime?

  meeting      Meeting    @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  assignee     User       @relation("TTFU_Assignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  reviewer     User       @relation("TTFU_Reviewer", fields: [reviewerId], references: [id], onDelete: SetNull)
  evidences    Evidence[]

  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@index([meetingId])
  @@index([assigneeId])
  @@index([reviewerId])
  @@index([status])
}

model Evidence {
  id           String       @id @default(cuid())
  ttfuId       String
  type         EvidenceType
  url          String?      // for link evidence
  filePath     String?      // for uploaded file evidence (S3/Supabase path)
  description  String?
  submittedById String

  ttfu         TTFU         @relation(fields: [ttfuId], references: [id], onDelete: Cascade)
  submittedBy  User         @relation("Evidence_Submitter", fields: [submittedById], references: [id], onDelete: SetNull)
  reviews      Review[]

  createdAt    DateTime     @default(now())

  @@index([ttfuId])
  @@index([submittedById])
}

model Review {
  id          String       @id @default(cuid())
  evidenceId  String
  reviewerId  String
  status      ReviewStatus
  comment     String?

  evidence    Evidence     @relation(fields: [evidenceId], references: [id], onDelete: Cascade)
  reviewer    User         @relation("Review_Reviewer", fields: [reviewerId], references: [id], onDelete: SetNull)

  createdAt   DateTime     @default(now())

  @@index([evidenceId])
  @@index([reviewerId])
}

// ===== Optional: Audit Log =====
model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String   // e.g., "TTFU_STATUS_CHANGE"
  entity    String   // e.g., "TTFU", "EVIDENCE"
  entityId  String
  metadata  Json?
  createdAt DateTime @default(now())

  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([entity, entityId])
}

// ===== NextAuth (Prisma Adapter) =====
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

### Indexing & Cascade Notes

* `onDelete: Cascade` untuk child-critical (Meeting → TTFU → Evidence → Review).
* `onDelete: SetNull` untuk referensi ke user agar histori tidak putus saat user dinonaktifkan.
* Indeks disiapkan untuk query umum: by meeting, assignee, reviewer, status.

## 3) API Surface (Next.js API Routes – ringkas)

* `POST /api/auth/*` → handled by NextAuth
* `GET /api/meetings` – list + filter by date
* `POST /api/meetings` – create
* `GET /api/meetings/:id` – detail (+TTFU summary)
* `POST /api/meetings/:id/participants` – add participant/role
* `GET /api/ttfu?meetingId=...` – list
* `POST /api/ttfu` – create
* `PATCH /api/ttfu/:id` – update status/assignee/reviewer
* `POST /api/evidence` – create (link or file signedURL initiation)
* `POST /api/reviews` – create review (approve/reject/needs\_revision)
* `GET /api/reports/meeting/:id` – recap for export

## 4) Wireframes (low-fidelity)

### A. Login

* Email, Password
* CTA: **Sign In**
* Link: Forgot password (optional)

### B. Dashboard – Meetings

* Header: Date filter (From/To), Quick filter: Today / This Week
* Button: **+ New Meeting**
* Table:

  * Title | DateTime | SPV | #TTFU (Open/Done) | Actions (View)

### C. Meeting Detail

* Breadcrumb: Dashboard / Meeting Title
* Panel Left: Meeting info (Title, DateTime, SPV, Participants)
* Panel Right: **TTFU List** (tabs by status: Open / In Progress / Done / Rejected)
* Button: **+ Add TTFU**
* TTFU Row:

  * Title (click → detail)
  * Assignee | Reviewer | Due Date | Status | % Done

### D. Create/Edit TTFU (Modal)

* Fields: Title, Description, Assignee (select), Reviewer (select), Due Date
* Buttons: **Save**, Cancel

### E. TTFU Detail

* Header: Title + Status dropdown (Open/In Progress/Done/Rejected)
* Info: Assignee, Reviewer, Due Date, Description
* Section: **Evidence**

  * **Add Evidence** (Link or Upload)
  * Evidence list items: type icon, description, createdAt, submittedBy, \[View]
* Section: **Reviews**

  * Reviewer adds: status (approved/rejected/needs\_revision) + comment
  * History list of reviews

### F. Report (Meeting Recap)

* Filters: Meeting, Date Range, SPV
* Cards: Total TTFU, Open, In Progress, Done, Rejected
* Table: TTFU with columns (Title, Assignee, Reviewer, Status, Last Update)
* Export: **PDF** / **CSV**

---

## 5) Tailwind UI Hints

* Use Cards with `rounded-2xl shadow-sm p-4`.
* Tables: sticky header + compact rows.
* Status badges: `bg-gray-100`, `bg-yellow-100`, `bg-green-100`, `bg-red-100`.
* Forms: `react-hook-form` + Zod schema for validation.

## 6) Next Steps

* Generate Prisma client & run initial migration on NeonDB.
* Scaffold Next.js App Router pages & API routes.
* Add NextAuth with Prisma Adapter.
* Implement signed URL flow if enabling file uploads.
