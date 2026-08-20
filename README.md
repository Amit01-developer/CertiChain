# CertiChain

A production-ready digital certificate management and verification platform.

Organizations can issue, manage and revoke digital certificates. Anyone can verify a certificate's authenticity instantly via QR code or certificate ID — no account required.

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend      │────▶│   PostgreSQL    │
│  React + Vite   │     │ Express + TS    │     │   (Docker)      │
│  Tailwind CSS   │     │ Prisma ORM      │     │                 │
│  Port 5173      │     │  Port 4000      │     │  Port 5433      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                        ┌──────┴──────┐
                        │  Storage    │
                        │  (local /   │
                        │  S3 / CDN)  │
                        └─────────────┘
```

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18, Vite, TypeScript, Tailwind CSS        |
| Backend    | Node.js, Express, TypeScript                    |
| Database   | PostgreSQL 16 via Prisma ORM                    |
| Auth       | JWT (jsonwebtoken) + bcryptjs                   |
| PDF        | PDFKit (server-side generation)                 |
| QR Code    | qrcode library                                  |
| Email      | Nodemailer / Resend (pluggable)                 |
| Storage    | Local filesystem / AWS S3 / Cloudinary          |
| Testing    | Vitest + Supertest                              |
| Container  | Docker + Docker Compose                         |

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- Docker Desktop

### 1. Clone and install

```bash
git clone <repo-url>
cd CertiChain
```

### 2. Create environment file

```bash
cp .env.example .env
```

The default `.env` works out of the box for local development.

### 3. Start PostgreSQL (dedicated container)

```bash
docker run -d \
  --name certichain_postgres \
  -e POSTGRES_USER=certichain \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=certichain \
  -p 5433:5432 \
  -v certichain_pg_data:/var/lib/postgresql/data \
  postgres:16-alpine
```

### 4. Install backend dependencies and run migrations

```bash
cd backend
npm install
npx prisma migrate deploy
npx tsx prisma/seed.ts    # loads demo data
cd ..
```

### 5. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 6. Start backend

```bash
cd backend
npm run dev
```

Backend starts at **http://localhost:4000**

### 7. Start frontend (new terminal)

```bash
cd frontend
npm run dev
```

Frontend starts at **http://localhost:5173**

---

## Environment Variables

| Variable                | Description                                  | Default                        |
|-------------------------|----------------------------------------------|--------------------------------|
| `DATABASE_URL`          | PostgreSQL connection string                 | `postgresql://certichain:password@localhost:5433/certichain` |
| `JWT_SECRET`            | Secret for signing JWT tokens                | change in production           |
| `JWT_EXPIRES_IN`        | Token expiry duration                        | `7d`                           |
| `PORT`                  | Backend server port                          | `4000`                         |
| `FRONTEND_URL`          | Frontend origin (for CORS + email links)     | `http://localhost:5173`        |
| `STORAGE_PROVIDER`      | `local` \| `s3` \| `cloudinary`              | `local`                        |
| `STORAGE_LOCAL_DIR`     | Directory for local file uploads             | `./uploads`                    |
| `EMAIL_PROVIDER`        | `log` \| `smtp` \| `resend`                  | `log`                          |
| `EMAIL_FROM`            | Sender email address                         | `noreply@certichain.com`       |
| `RATE_LIMIT_MAX`        | Max requests per window (global)             | `100`                          |
| `VERIFY_RATE_LIMIT_MAX` | Max requests per window (verify endpoint)    | `30`                           |

---

## Database Setup

```bash
cd backend

# Run migrations
npx prisma migrate deploy

# Seed demo data
npx tsx prisma/seed.ts

# Open Prisma Studio (visual DB browser)
npm run studio
```

### Demo credentials (after seed)

| Field    | Value                    |
|----------|--------------------------|
| Email    | admin@certichain.demo    |
| Password | Demo@1234                |

### Demo certificate IDs

| ID               | Status  |
|------------------|---------|
| CC-2026-DEMO01   | ACTIVE  |
| CC-2026-REVOKED  | REVOKED |

---

## Running Tests

```bash
cd backend
npm test
```

Tests cover:
- Auth (registration, login, protected routes)
- Certificate ID generation and hashing
- Public verification (active, revoked, not found)

---

## Docker — Full Stack

Run everything (postgres + backend + frontend) with one command:

```bash
docker compose up --build
```

| Service  | URL                       |
|----------|---------------------------|
| Frontend | http://localhost:3000     |
| Backend  | http://localhost:4000     |
| API      | http://localhost:4000/api |

Stop everything:

```bash
docker compose down
```

Stop and remove volumes (full reset):

```bash
docker compose down -v
```

---

## Project Structure

```
CertiChain/
├── frontend/
│   ├── src/
│   │   ├── components/ui/     # Badge, Modal, Spinner, Pagination, EmptyState
│   │   ├── context/           # AuthContext
│   │   ├── layouts/           # PublicLayout, DashboardLayout
│   │   ├── pages/             # Landing, Login, Register, Verify, Dashboard pages
│   │   ├── services/          # axios API client
│   │   ├── types/             # TypeScript interfaces
│   │   └── App.tsx            # Routes
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/       # auth, certificate, organization, template, recipient, verify, admin
│   │   ├── middleware/        # auth, error, upload, validate
│   │   ├── routes/            # all route definitions
│   │   ├── services/          # pdf, storage, email
│   │   ├── utils/             # logger, apiResponse, auditLog, certId
│   │   ├── config/            # env, prisma
│   │   └── tests/             # auth, certId, verify tests
│   ├── prisma/
│   │   ├── schema.prisma      # full DB schema
│   │   ├── seed.ts            # demo data
│   │   └── migrations/        # migration files
│   ├── Dockerfile
│   └── package.json
│
├── .env                       # local dev config (git-ignored)
├── .env.example               # template for env vars
├── docker-compose.yml         # full stack compose
└── README.md
```

---

## Key Features

- **Certificate issuance** — fill form, auto-generate unique ID (CC-YYYY-XXXXXXXX), PDF + QR
- **Bulk CSV import** — upload CSV to issue multiple certificates at once
- **Public verification** — `/verify/:id` — no login required, rate-limited
- **Certificate revocation** — with reason, audit trail, stays verifiable as REVOKED
- **Role-based access** — OWNER / ADMIN / STAFF per organization
- **Audit logs** — every important action recorded
- **Analytics** — charts for certificates issued over time, status distribution
- **Email notifications** — pluggable provider (log in dev, SMTP/Resend in production)
- **Storage abstraction** — local disk in dev, swap to S3 or Cloudinary via env var
- **SHA-256 certificate hash** — tamper-evidence fingerprint stored with each certificate

---

## API Reference

### Auth

| Method | Endpoint                   | Auth | Description          |
|--------|----------------------------|------|----------------------|
| POST   | `/api/auth/register`       | —    | Register + create org |
| POST   | `/api/auth/login`          | —    | Login                |
| GET    | `/api/auth/verify-email`   | —    | Verify email token   |
| POST   | `/api/auth/forgot-password`| —    | Request reset link   |
| POST   | `/api/auth/reset-password` | —    | Reset password       |
| GET    | `/api/auth/me`             | JWT  | Get current user     |
| PUT    | `/api/auth/me/password`    | JWT  | Change password      |

### Verification (Public)

| Method | Endpoint                        | Auth | Description          |
|--------|---------------------------------|------|----------------------|
| GET    | `/api/verify/:certificateId`    | —    | Verify a certificate |

### Organization

| Method | Endpoint                                   | Role         |
|--------|--------------------------------------------|--------------|
| GET    | `/api/organizations/:orgId`                | STAFF+       |
| PUT    | `/api/organizations/:orgId`                | ADMIN+       |
| POST   | `/api/organizations/:orgId/logo`           | ADMIN+       |
| POST   | `/api/organizations/:orgId/members`        | OWNER        |
| DELETE | `/api/organizations/:orgId/members/:id`    | OWNER        |
| GET    | `/api/organizations/:orgId/analytics`      | ADMIN+       |
| GET    | `/api/organizations/:orgId/audit-logs`     | ADMIN+       |

### Certificates

| Method | Endpoint                                              | Role   |
|--------|-------------------------------------------------------|--------|
| GET    | `/api/organizations/:orgId/certificates`              | STAFF+ |
| POST   | `/api/organizations/:orgId/certificates`              | STAFF+ |
| POST   | `/api/organizations/:orgId/certificates/bulk`         | ADMIN+ |
| GET    | `/api/organizations/:orgId/certificates/:id`          | STAFF+ |
| POST   | `/api/organizations/:orgId/certificates/:id/revoke`   | ADMIN+ |
| GET    | `/api/organizations/:orgId/certificates/:id/download` | STAFF+ |

### Templates

| Method | Endpoint                                        | Role   |
|--------|-------------------------------------------------|--------|
| GET    | `/api/organizations/:orgId/templates`           | STAFF+ |
| POST   | `/api/organizations/:orgId/templates`           | ADMIN+ |
| GET    | `/api/organizations/:orgId/templates/:id`       | STAFF+ |
| PUT    | `/api/organizations/:orgId/templates/:id`       | ADMIN+ |
| DELETE | `/api/organizations/:orgId/templates/:id`       | OWNER  |

### Recipients

| Method | Endpoint                                       | Role   |
|--------|------------------------------------------------|--------|
| GET    | `/api/organizations/:orgId/recipients`         | STAFF+ |
| GET    | `/api/organizations/:orgId/recipients/:id`     | STAFF+ |

---

## Production Deployment

### Frontend — Vercel / Netlify

```bash
cd frontend
npm run build          # outputs to dist/
```

Set env var in Vercel/Netlify:
```
VITE_API_URL=https://your-backend.com/api
```

### Backend — Render / Railway

Set these environment variables:
```
DATABASE_URL=postgresql://...
JWT_SECRET=<64 random bytes>
NODE_ENV=production
FRONTEND_URL=https://your-frontend.com
STORAGE_PROVIDER=s3         # or cloudinary
EMAIL_PROVIDER=resend        # or smtp
```

On deploy, run:
```bash
npx prisma migrate deploy
node dist/server.js
```

### Database — Neon / Supabase / Railway

Use the connection string as `DATABASE_URL`.

For Neon add `?sslmode=require`:
```
DATABASE_URL=postgresql://user:pass@host.neon.tech/certichain?sslmode=require
```

---

## Health Check

```
GET /health
→ { "status": "ok", "timestamp": "..." }
```

---

## Troubleshooting

**Backend won't start — DATABASE_URL error**
Make sure PostgreSQL is running and `DATABASE_URL` in `.env` is correct.

**`prisma migrate dev` fails**
Set `DATABASE_URL` as environment variable before running:
```powershell
$env:DATABASE_URL = "postgresql://certichain:password@localhost:5433/certichain"
npx prisma migrate dev --name init
```

**Port 5432 already in use**
This project uses port **5433** to avoid conflicts. Check `.env` has `@localhost:5433`.

**PDF not generating**
Make sure `uploads/` directory is writable. It's created automatically on first upload.

**Email not sending**
Set `EMAIL_PROVIDER=log` in dev — emails print to console. Configure SMTP or Resend for production.
