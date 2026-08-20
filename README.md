# CertiChain — Digital Certificate Management Platform

CertiChain is a full-stack platform for issuing, managing, and verifying digital certificates. Organizations can issue tamper-proof PDF certificates with QR codes, manage recipients and templates, and allow anyone to publicly verify a certificate's authenticity — no blockchain required.

---

## Features

- **Certificate Issuance** — Issue professional PDF certificates individually or in bulk via CSV upload
- **QR Code Verification** — Every certificate gets a unique QR code linking to a public verification page
- **Tamper-Proof Records** — SHA-256 cryptographic hash of certificate data ensures records can't be silently modified
- **Public Verification** — Anyone can verify a certificate by scanning the QR or entering the certificate ID — no account needed
- **Certificate Templates** — Create reusable templates with custom colors, fonts, and layout options
- **Recipient Management** — Track all recipients and their certificate history in one place
- **Role-Based Access Control** — Owner, Admin, and Staff roles with fine-grained permissions
- **Audit Logs** — Full audit trail of every action taken within an organization
- **Analytics Dashboard** — Issuance trends, status breakdowns, and key metrics via charts
- **Google OAuth** — Sign in with Google via Firebase, in addition to email/password
- **Pluggable Storage** — Local filesystem, AWS S3, or Cloudinary — switch with a single env var
- **Pluggable Email** — Console log (dev), SMTP, or Resend — switch with a single env var
- **Swagger API Docs** — Interactive API documentation at `/api/docs`

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 5, TypeScript, Tailwind CSS 3 |
| **State & Forms** | React Hook Form, Zod, React Router v6 |
| **Charts** | Recharts |
| **HTTP Client** | Axios (with JWT interceptor) |
| **Auth (frontend)** | Firebase JS SDK (Google OAuth popup) |
| **Backend** | Node.js, Express 4, TypeScript |
| **ORM** | Prisma 5 |
| **Database** | PostgreSQL 16 |
| **Auth (backend)** | JWT (jsonwebtoken) + bcryptjs, Firebase Admin SDK |
| **PDF Generation** | PDFKit (server-side, A4 landscape) |
| **QR Codes** | `qrcode` library |
| **Email** | Nodemailer (SMTP) / Resend / console log |
| **Storage** | Local / AWS S3 / Cloudinary |
| **Security** | Helmet, express-rate-limit, CORS |
| **Testing** | Vitest + Supertest |
| **Containers** | Docker + Docker Compose |
| **API Docs** | Swagger UI |

---

## Project Structure

```
CertiChain/
├── .env.example                  # Environment variable template
├── docker-compose.yml            # Full-stack production compose
├── docker-compose.dev.yml        # Dev compose (Postgres only)
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema (8 models)
│   │   ├── seed.ts               # Demo data seeder
│   │   └── migrations/           # Migration history
│   └── src/
│       ├── server.ts             # Entry point — DB connect, HTTP server
│       ├── app.ts                # Express app (middleware, routes)
│       ├── config/
│       │   ├── env.ts            # Typed env var loader
│       │   ├── firebase.ts       # Firebase Admin SDK init
│       │   ├── prisma.ts         # Singleton Prisma client
│       │   └── swagger.ts        # Swagger doc config
│       ├── controllers/          # Business logic
│       │   ├── auth.controller.ts
│       │   ├── certificate.controller.ts
│       │   ├── organization.controller.ts
│       │   ├── template.controller.ts
│       │   ├── recipient.controller.ts
│       │   ├── verify.controller.ts
│       │   └── admin.controller.ts
│       ├── middleware/
│       │   ├── auth.middleware.ts     # requireAuth, requireOrgRole, requireSuperAdmin
│       │   ├── error.middleware.ts    # Global error + 404 handler
│       │   ├── upload.middleware.ts   # Multer (CSV, logo)
│       │   └── validate.middleware.ts # express-validator runner
│       ├── routes/
│       │   ├── auth.routes.ts
│       │   ├── certificate.routes.ts
│       │   ├── organization.routes.ts
│       │   ├── template.routes.ts
│       │   ├── recipient.routes.ts
│       │   ├── verify.routes.ts
│       │   └── admin.routes.ts
│       ├── services/
│       │   ├── email.service.ts   # Pluggable email (log/SMTP/Resend)
│       │   ├── pdf.service.ts     # PDFKit certificate generation
│       │   └── storage.service.ts # Pluggable storage (local/S3/Cloudinary)
│       └── utils/
│           ├── certId.ts          # ID generation (CC-YYYY-XXXXXXXX) + SHA-256 hash
│           ├── apiResponse.ts     # Response helpers (ok, created, badRequest, ...)
│           ├── auditLog.ts        # audit() helper
│           ├── logger.ts          # Winston logger
│           └── param.ts           # Safe req.params coercion
│
└── frontend/
    └── src/
        ├── App.tsx                # All route definitions
        ├── main.tsx               # React entry point
        ├── context/
        │   └── AuthContext.tsx    # Auth state, login/logout/Google OAuth
        ├── layouts/
        │   ├── PublicLayout.tsx   # Navbar + footer for public pages
        │   └── DashboardLayout.tsx # Sidebar + content for protected pages
        ├── pages/
        │   ├── Landing.tsx
        │   ├── Login.tsx
        │   ├── Register.tsx
        │   ├── ForgotPassword.tsx
        │   ├── ResetPassword.tsx
        │   ├── VerifyEmail.tsx
        │   ├── VerifySearch.tsx
        │   ├── VerifyDetail.tsx
        │   └── dashboard/
        │       ├── Dashboard.tsx
        │       ├── Certificates.tsx
        │       ├── NewCertificate.tsx  # Also used for bulk CSV upload
        │       ├── CertificateDetail.tsx
        │       ├── Templates.tsx
        │       ├── NewTemplate.tsx
        │       ├── Recipients.tsx
        │       ├── Analytics.tsx
        │       ├── AuditLogs.tsx
        │       ├── OrgProfile.tsx
        │       └── Settings.tsx
        ├── components/ui/
        │   ├── Badge.tsx           # Status badges (ACTIVE/REVOKED/EXPIRED)
        │   ├── EmptyState.tsx
        │   ├── Modal.tsx
        │   ├── Pagination.tsx
        │   └── Spinner.tsx
        ├── services/
        │   └── api.ts              # Axios instance with JWT interceptor
        └── types/                  # TypeScript interfaces
```

---

## Database Schema

```
User
  ├── id, name, email, passwordHash
  ├── role (SUPER_ADMIN | USER)
  ├── emailVerified, emailToken, resetToken
  ├── oauthProvider, oauthId, avatarUrl
  └── → memberships[], auditLogs[]

Organization
  ├── id, name, type, logoUrl, website, email
  ├── suspended (admin can suspend orgs)
  └── → members[], templates[], certificates[], recipients[]

OrgMember  (User ↔ Organization junction)
  ├── userId, organizationId
  └── role (OWNER | ADMIN | STAFF)

CertificateTemplate
  ├── organizationId, name
  └── configuration (JSON: primaryColor, accentColor, fontFamily, showLogo, showQR)

Recipient
  ├── organizationId, name, email
  └── Unique: (organizationId, email)

Certificate
  ├── certificateId  (CC-2026-XXXXXXXX — human readable, unique)
  ├── organizationId, templateId, recipientId, issuedById
  ├── title, description, achievement, customMessage
  ├── issueDate, expiryDate, status (ACTIVE | REVOKED | EXPIRED)
  ├── pdfUrl, qrCodeUrl, verificationUrl
  └── certificateHash  (SHA-256 tamper-evidence fingerprint)

Revocation  (1:1 with Certificate)
  └── reason, revokedById, revokedAt

AuditLog
  └── organizationId, userId, action, resourceType, resourceId, metadata, ipAddress

VerificationLog
  └── certificateId, ipAddress, userAgent  (tracks public verify hits)
```

---

## API Reference

All routes are prefixed with `/api`. Interactive docs available at `http://localhost:4000/api/docs`.

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Register + create org; sends verification email |
| POST | `/login` | No | Email/password login; returns JWT |
| POST | `/firebase` | No | Exchange Firebase Google ID token for CertiChain JWT |
| GET | `/verify-email?token=` | No | Verify email address |
| POST | `/forgot-password` | No | Request password reset email |
| POST | `/reset-password` | No | Reset password using token |
| GET | `/me` | JWT | Get current user + memberships |
| PUT | `/me/password` | JWT | Change password |

### Public Verification — `/api/verify`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/:certificateId` | Publicly verify any certificate (rate-limited: 30 req/15 min) |

### Organization — `/api/organizations/:orgId`

| Method | Endpoint | Min Role |
|---|---|---|
| GET | `/` | STAFF |
| PUT | `/` | ADMIN |
| POST | `/logo` | ADMIN |
| POST | `/members` | OWNER |
| DELETE | `/members/:memberId` | OWNER |
| GET | `/analytics` | ADMIN |
| GET | `/audit-logs` | ADMIN |

### Certificates — `/api/organizations/:orgId/certificates`

| Method | Endpoint | Min Role |
|---|---|---|
| GET | `/` | STAFF — supports `?page`, `?limit`, `?status`, `?search` |
| POST | `/` | STAFF — issue single certificate |
| POST | `/bulk` | ADMIN — CSV upload for batch issuance |
| GET | `/:id` | STAFF |
| POST | `/:id/revoke` | ADMIN |
| GET | `/:id/download` | STAFF — download PDF |

### Templates — `/api/organizations/:orgId/templates`

| Method | Endpoint | Min Role |
|---|---|---|
| GET | `/` | STAFF |
| POST | `/` | ADMIN |
| GET | `/:id` | STAFF |
| PUT | `/:id` | ADMIN |
| DELETE | `/:id` | OWNER |

### Recipients — `/api/organizations/:orgId/recipients`

| Method | Endpoint | Min Role |
|---|---|---|
| GET | `/` | STAFF — supports `?page`, `?search` |
| GET | `/:id` | STAFF |

### Admin — `/api/admin` (SUPER_ADMIN only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/stats` | Platform-wide statistics |
| GET | `/organizations` | All organizations |
| POST | `/organizations/:id/suspend` | Suspend organization |
| POST | `/organizations/:id/unsuspend` | Reinstate organization |

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- Docker Desktop

### Steps

**1. Clone the repo and copy env file**

```bash
git clone https://github.com/Amit01-developer/CertiChain.git
cd CertiChain
cp .env.example .env
```

The default `.env` values work out of the box for local development.

**2. Start PostgreSQL via Docker**

```bash
docker compose -f docker-compose.dev.yml up -d
```

This starts PostgreSQL on port `5433` (avoids conflicts with any local Postgres on `5432`).

**3. Setup and start the backend**

```bash
cd backend
npm install
npx prisma migrate deploy
npx tsx prisma/seed.ts   # optional: loads demo data
npm run dev              # starts at http://localhost:4000
```

**4. Setup and start the frontend (new terminal)**

```bash
cd frontend
npm install
npm run dev              # starts at http://localhost:5173
```

Open `http://localhost:5173` in your browser.

**Demo credentials (after seeding):**
- Email: `admin@certichain.demo`
- Password: `Demo@1234`

---

## Running with Docker (Full Stack)

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000/api |
| API Docs | http://localhost:4000/api/docs |
| Health Check | http://localhost:4000/health |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values.

### Required

| Variable | Description | Dev Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://certichain:password@localhost:5433/certichain` |
| `JWT_SECRET` | JWT signing secret (use 64+ random chars in production) | `dev-secret` |
| `FRONTEND_URL` | Frontend origin (used for CORS and email links) | `http://localhost:5173` |
| `BACKEND_URL` | Backend URL (used for local storage file URLs) | `http://localhost:4000` |
| `VITE_API_URL` | Frontend → backend API base URL | `http://localhost:4000/api` |

### Storage — `STORAGE_PROVIDER`

Set to `local`, `s3`, or `cloudinary`.

| Variable | Required for |
|---|---|
| `STORAGE_LOCAL_DIR` | `local` |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` | `s3` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | `cloudinary` |

### Email — `EMAIL_PROVIDER`

Set to `log` (console), `smtp`, or `resend`.

| Variable | Required for |
|---|---|
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | `smtp` |
| `RESEND_API_KEY` | `resend` |

### Firebase (Google OAuth)

| Variable | Where to get it |
|---|---|
| `FIREBASE_PROJECT_ID` | Firebase Console → Project Settings |
| `FIREBASE_CLIENT_EMAIL` | Firebase Console → Service Accounts → Generate key |
| `FIREBASE_PRIVATE_KEY` | Same JSON file as above |
| `VITE_FIREBASE_API_KEY` | Firebase Console → Your Apps → Web app config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Same as above |
| `VITE_FIREBASE_PROJECT_ID` | Same as above |
| `VITE_FIREBASE_APP_ID` | Same as above |

### Supabase / Neon (production DB)

```env
DATABASE_URL="postgresql://postgres.xxxx:password@pooler-host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxx:password@pooler-host:5432/postgres"
```

---

## Certificate Issuance Flow

1. `generateCertificateId()` — creates a unique ID in format `CC-{YEAR}-{8 hex chars}`
2. QR code PNG buffer is generated pointing to `FRONTEND_URL/verify/{certId}`
3. Organization, recipient, and template data is fetched in parallel
4. `generateCertificatePdf()` — PDFKit generates an A4 landscape PDF in-memory
5. PDF and QR are uploaded in parallel via `storageService`
6. `certificateHash` = SHA-256 of `{ certificateId, organizationId, recipientId, title, issueDate }` — tamper-evidence fingerprint
7. `Certificate` record is saved to database
8. Optional email sent to recipient (failure is caught and logged — does not rollback the certificate)

---

## Authentication Flow

### Email/Password

1. Register → user created with `emailVerified: false` → verification email sent
2. User clicks verification link → `emailVerified: true`
3. Login → JWT returned (7d expiry by default)
4. JWT stored in `localStorage` as `cc_token`

### Google OAuth

1. Frontend calls Firebase `signInWithPopup` → gets ID token
2. ID token sent to `POST /api/auth/firebase`
3. Backend verifies token with Firebase Admin SDK
4. User found by `oauthId`, or linked by email, or created fresh with auto-org
5. CertiChain JWT returned — same flow as email login from here

### Role Hierarchy

```
OWNER > ADMIN > STAFF
```

Each route specifies a minimum required role. The middleware checks the user's membership in the target organization before allowing access.

---

## Available Scripts

### Backend

```bash
npm run dev           # Start with hot reload (tsx watch)
npm run build         # Compile TypeScript
npm run start         # Run compiled output
npm run migrate       # Create and apply a new migration
npm run seed          # Load demo data
npm run studio        # Open Prisma Studio (visual DB browser)
npm test              # Run Vitest tests
```

### Frontend

```bash
npm run dev           # Start Vite dev server
npm run build         # Type-check + build for production
npm run preview       # Preview production build
npm test              # Run Vitest tests
npm run lint          # Run ESLint
```

---

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions including Render, Railway, Vercel, and full Docker production setup.

---

## License

MIT
