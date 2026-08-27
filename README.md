# CertiChain — Digital Certificate Management Platform

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-20%2B-339933)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)](https://www.postgresql.org/)

</div>

CertiChain is a full-stack digital certificate management platform built for organizations that need a secure, scalable, and auditable way to issue, manage, and validate credentials. It combines a modern React frontend, a TypeScript backend, database-driven certificate logic, and optional blockchain anchoring to give institutions a trustworthy certificate workflow from issuance to verification.

## Overview

CertiChain helps universities, training providers, bootcamps, NGOs, corporates, and internal teams:

- create branded certificate templates
- issue certificates to recipients individually or in bulk
- verify authenticity through public QR or certificate ID lookup
- revoke or expire certificates when needed
- track actions through audit log trails
- manage organization members and permissions
- optionally anchor hashes to a blockchain network for extra evidence

## At a Glance

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL via Prisma ORM
- Auth: JWT + Firebase Google OAuth
- Storage: local / S3 / Cloudinary
- Email: log / SMTP / Resend
- Verification: public certificate lookup and QR-based validation
- Security: SHA-256 hashing, JWT auth, role-based access, rate limiting, audit logs
- Blockchain: optional Polygon Amoy integration for certificate registration and verification

## Project Modules

### 1. Frontend Application
The React frontend provides public pages, registration and login flows, organization dashboards, certificate issuance workflows, analytics, templates, and verification pages. It is built as a SPA with route-based access control.

### 2. Backend API
The Express + TypeScript backend exposes REST APIs for authentication, organization management, recipients, certificates, templates, verification, and admin controls. It handles business logic, access checks, Prisma queries, PDF generation, and email/storage integration.

### 3. Blockchain Layer
The blockchain folder includes the Hardhat project and the `CertiChainRegistry.sol` smart contract. It anchors certificate hashes on Polygon Amoy and enables public verification of certificate authenticity on-chain.

### 4. Database & Identity Layer
Prisma manages the PostgreSQL schema for users, organizations, memberships, certificates, templates, recipients, revocations, audit logs, and verification logs. This keeps certificate records relational, searchable, and auditable.

### 5. Security & Compliance Layer
The platform includes JWT-based protected routes, organization-role enforcement, rate limiting, request validation, audit logs, and SHA-256 hash verification for tamper-evidence.

## Core User Flows

### Organization Setup
- create a new organization
- add admin/owner/staff users
- configure branding, description, and profile data

### Certificate Lifecycle
- create recipient records
- define certificate templates
- issue a certificate
- generate PDF and QR output
- store hash and verification metadata
- optionally revoke or expire the certificate

### Public Verification
- user enters certificate ID or scans QR code
- backend checks certificate status and hash
- frontend displays certificate metadata and blockchain verification state

### Admin Oversight
- view platform stats
- inspect all organizations
- suspend or unsuspend organizations as needed
- monitor blockchain and certificate status

---

## ✨ New Features & Highlights

This version includes a complete certificate lifecycle workflow with modern operational features:

- **Single & Bulk Certificate Issuance** — Issue one certificate at a time or upload CSV files for bulk generation
- **Template Builder with Live Preview** — Create reusable certificate layouts with branding, colors, fonts, and custom content
- **Multi-Role Organization Access** — OWNER, ADMIN, and STAFF permissions with controlled access to certificates, templates, and settings
- **Google OAuth + Email Authentication** — Login with Firebase Google Sign-In or traditional email/password flow
- **Public Certificate Verification** — Anyone can verify a certificate using the public endpoint or QR scan without logging in
- **Blockchain Anchoring Support** — Optional on-chain registration and verification using Polygon Amoy smart contract integration
- **Certificate Revocation & Status Tracking** — Mark certificates as ACTIVE, REVOKED, or EXPIRED with audit provenance
- **Analytics Dashboard** — View platform and organization stats, status breakdowns, and certificate activity trends
- **Admin Panel for Platform Oversight** — Super admins can monitor organizations, see summaries, and suspend/unsuspend accounts
- **Recipient Management & History** — Maintain organized recipient records and associate each cert with its issuing context
- **Audit Logs & Verification Logs** — Track internal actions and public verification attempts for compliance and transparency
- **Flexible Storage & Email Backends** — Switch between local, S3, Cloudinary for files and log/SMTP/Resend for email workflows
- **Swagger API Documentation** — Explore REST endpoints and payloads interactively at `/api/docs`
- **Dockerized Setup** — Run the entire stack locally or deploy with container-based infrastructure

---

## Features

- **Certificate Issuance** — Professional PDF certificates for individuals or large batches via CSV upload
- **QR Code Verification** — Every certificate generates a unique QR code that links to a public verification page
- **Tamper-Proof Records** — SHA-256 certificate hashing protects metadata from silent modification
- **Blockchain Verification** — Optional on-chain registration and revocation workflow using Polygon/Smart Contract support
- **Public Verification** — Verify certificate validity by ID or QR code without creating an account
- **Certificate Templates** — Reusable branded templates with custom colors, logos, fonts, and layout variants
- **Recipient Management** — Track recipients, maintain unique org-level records, and view certificate history
- **Role-Based Access Control** — Fine-grained access rules for OWNER, ADMIN, STAFF, and SUPER_ADMIN
- **Audit Logs** — Full historical trail of organization and platform actions
- **Analytics Dashboard** — Summary cards, charts, and insights for certificate issuance and organization health
- **Google OAuth** — Sign in with Google via Firebase alongside standard email/password registration
- **Organization Administration** — Edit organization profile, upload branding, manage members, and suspend organizations
- **Admin Tools** — Platform-level stats and oversight for all organizations across the system
- **Pluggable Storage** — Local filesystem, AWS S3, or Cloudinary
- **Pluggable Email** — Console logging, SMTP, or Resend integration
- **Swagger API Docs** — Interactive API documentation at `/api/docs`

---

## Architecture

CertiChain follows a classic **three-tier architecture** — a React SPA on the frontend, a REST API backend, and a PostgreSQL database — with pluggable adapters for storage and email.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                           │
│                                                                     │
│   React 18 + Vite  ──  React Router v6  ──  Tailwind CSS           │
│   React Hook Form  ──  Axios  ──  Firebase JS SDK (Google OAuth)    │
└────────────────────────────┬────────────────────────────────────────┘
                             │  HTTPS / REST API (JSON)
                             │  Authorization: Bearer <JWT>
┌────────────────────────────▼────────────────────────────────────────┐
│                        BACKEND (Node.js)                            │
│                                                                     │
│  Express 4 + TypeScript                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Routes    │→ │ Controllers │→ │  Services   │                 │
│  │  (7 files)  │  │  (7 files)  │  │ pdf/email/  │                 │
│  └─────────────┘  └─────────────┘  │   storage   │                 │
│                                    └──────┬──────┘                 │
│  Middleware stack:                        │                         │
│  Helmet → CORS → Rate Limit → Auth        │                         │
│  → OrgRole → Validate → Controller        │                         │
│                                           │                         │
│  Prisma ORM ──────────────────────────────┘                         │
└──────┬──────────────┬──────────────┬──────────────┬────────────────┘
       │              │              │              │
┌──────▼──────┐ ┌─────▼──────┐ ┌────▼──────┐ ┌────▼──────────┐
│  PostgreSQL │ │ Cloudinary │ │  Firebase │ │  Email        │
│  (Supabase) │ │  / S3 /    │ │  (Google  │ │  SMTP /       │
│             │ │   Local    │ │   OAuth)  │ │  Resend / Log │
└─────────────┘ └────────────┘ └───────────┘ └───────────────┘
```

### Request Lifecycle

```
Browser Request
    │
    ▼
Helmet (security headers)
    │
    ▼
CORS (allow frontend origin)
    │
    ▼
Rate Limiter (global: 100/15min, verify: 30/15min)
    │
    ▼
Morgan (request logging)
    │
    ▼
Route Handler
    │
    ├── requireAuth         → verifies JWT, attaches req.user
    ├── requireOrgRole      → checks OrgMember role, attaches req.orgId
    ├── validate middleware → runs express-validator rules
    │
    ▼
Controller (business logic)
    │
    ├── Prisma ORM  → PostgreSQL
    ├── PDF Service → PDFKit → Storage Service → Cloudinary/S3/Local
    ├── Email Service → SMTP/Resend/Log
    │
    ▼
apiResponse helper (ok / created / badRequest / unauthorized / ...)
    │
    ▼
JSON Response → Browser
```

### Certificate Issuance Pipeline

```
POST /api/organizations/:orgId/certificates
    │
    ▼
Upsert Recipient (by org + email)
    │
    ▼
generateCertificateId()  →  CC-2026-A8F92D71
    │
    ▼
QR Code PNG buffer  ←  qrcode library
    │
    ▼
generateCertificatePdf()  ←  PDFKit (A4 landscape, in-memory)
    │
    ▼
storageService.upload() × 2  →  Cloudinary / S3 / Local
  PDF URL + QR URL
    │
    ▼
SHA-256 Hash  ←  certId + orgId + recipientId + title + issueDate
    │
    ▼
prisma.certificate.create()  →  PostgreSQL
    │
    ▼
Blockhain registration (optional) → Polygon Amoy if enabled
    │
    ▼
emailService.send()  →  recipient notified (non-blocking)
    │
    ▼
201 Created  →  { certificate, pdfUrl, qrCodeUrl }
```

### Blockchain Metadata & Verification Flow

The project stores a certificate hash as a tamper-evident fingerprint and, when enabled, registers it on Polygon Amoy using the `CertiChainRegistry` contract.

- `certificateHash` is a SHA-256 hex string stored in PostgreSQL
- the backend sends that hash to the smart contract for on-chain registration
- the contract stores the hash as a keccak-based key with metadata including:
  - `certificateId`
  - `issuer` wallet address
  - `timestamp`
  - `revoked` status
- verification checks the hash against the chain and returns:
  - `exists`
  - `revoked`
  - `issuer`
  - `timestamp`
  - `certId`
- the public verification endpoint exposes this in `data.blockchain`

```
Certificate PDF
  ↓
SHA-256 Hash
  ↓
Postgres record + verification metadata
  ↓
Polygon Amoy smart contract (optional)
  ↓
Public verification result with blockchain status
```

### Authentication Architecture

```
                    ┌─────────────────────────────────┐
                    │         Two Auth Paths           │
                    └────────────┬────────────────────┘
                                 │
          ┌──────────────────────┴──────────────────────┐
          │                                             │
   Email / Password                            Google OAuth
          │                                             │
   bcrypt compare                          Firebase JS SDK
   (cost factor: 12)                       signInWithPopup()
          │                                             │
          │                                    Firebase ID Token
          │                                             │
          │                             POST /api/auth/firebase
          │                                             │
          │                             Firebase Admin SDK
          │                             verifyIdToken()
          │                                             │
          └──────────────────┬──────────────────────────┘
                             │
                    JWT signed (HS256)
                    { userId, email, role }
                    expires in 7d
                             │
                    stored in localStorage
                    sent as: Authorization: Bearer <token>
                             │
                    requireAuth middleware
                    verifies on every protected request
```

### Role-Based Access Control

```
Organization Roles (per org, not global):

  OWNER  →  Full control: manage members, delete templates, all ADMIN actions
    │
  ADMIN  →  Issue bulk, revoke certs, edit org, upload logo, view analytics
    │
  STAFF  →  Issue single certs, view certs, view recipients, view templates

Global Role (platform-wide):

  SUPER_ADMIN  →  View all orgs, suspend/unsuspend organizations, view platform stats
```

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI library |
| Vite | 5 | Build tool + dev server |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 3 | Utility-first styling |
| React Router | v6 | Client-side routing (lazy loaded pages) |
| React Hook Form | 7 | Form state management |
| Zod | 3 | Schema validation |
| Axios | 1.7 | HTTP client with JWT interceptor |
| Firebase JS SDK | 11 | Google OAuth popup flow |
| Recharts | 2 | Charts (line, pie) for analytics |
| react-hot-toast | 2 | Toast notifications |
| Lucide React | 0.469 | Icon library |
| qrcode | 1.5 | QR code rendering on verify page |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20+ | Runtime |
| Express | 4 | HTTP framework |
| TypeScript | 5 | Type safety |
| tsx | 4 | TypeScript execution + hot reload in dev |
| Prisma | 5 | ORM + migrations |
| PostgreSQL | 16 | Primary database |
| jsonwebtoken | 9 | JWT sign + verify |
| bcryptjs | 2 | Password hashing (cost 12) |
| Firebase Admin SDK | 13 | Google ID token verification |
| PDFKit | 0.15 | Server-side PDF generation |
| qrcode | 1.5 | QR code buffer generation |
| cloudinary | 2 | Cloud storage (optional) |
| Nodemailer | 6 | SMTP email sending (optional) |
| Helmet | 8 | HTTP security headers |
| express-rate-limit | 7 | Request rate limiting |
| express-validator | 7 | Input validation |
| cors | 2 | Cross-origin resource sharing |
| morgan | 1 | HTTP request logging |
| winston | 3 | Application logging |
| multer | 1.4 | File upload handling (CSV, logo) |
| csv-parse | 5 | CSV parsing for bulk issuance |
| uuid | 10 | UUID generation |

### Infrastructure & DevOps

| Technology | Purpose |
|---|---|
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |
| Supabase | Managed PostgreSQL (production) |
| Cloudinary | Media storage (PDFs, QR codes, logos) |
| Polygon Amoy | Blockchain testnet for certificate hash anchoring |
| GitHub Actions | CI pipeline (`.github/workflows/ci.yml`) |
| Swagger UI | Interactive API documentation at `/api/docs` |
| Vitest | Unit + integration testing |
| Supertest | HTTP endpoint testing |

### Blockchain & Metadata Stack

| Component | Description |
|---|---|
| `CertiChainRegistry.sol` | Smart contract that stores certificate hash records and revocation state |
| `ethers.js` | Connects the backend to Polygon via JSON-RPC |
| `Polygon Amoy` | Official testnet for deploying and validating blockchain-backed certificates |
| `certificateHash` | SHA-256 fingerprint stored in the database and sent to the blockchain |
| `blockchainStatus` | Enum values: `PENDING`, `CONFIRMED`, `FAILED` |
| `blockchainTxHash` | Transaction hash for the issuance or revocation transaction |
| `verificationUrl` | Public URL for cert lookup and validation |
| `transaction explorer` | Links to `amoy.polygonscan.com` for viewing on-chain activity |

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
| `BLOCKCHAIN_ENABLED` | Enables Polygon-based certificate hashing and verification | `false` |
| `BLOCKCHAIN_RPC_URL` | Polygon Amoy RPC endpoint | `https://rpc-amoy.polygon.technology` |
| `BLOCKCHAIN_PRIVATE_KEY` | Wallet private key for signing blockchain transactions | empty |
| `BLOCKCHAIN_CONTRACT_ADDRESS` | Deployed contract address for `CertiChainRegistry` | empty |
| `BLOCKCHAIN_EXPLORER_URL` | Block explorer base URL for transaction links | `https://amoy.polygonscan.com` |

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

### Polygon / Blockchain Metadata

| Variable | Usage |
|---|---|
| `BLOCKCHAIN_ENABLED` | Turns on smart contract registration and verification |
| `BLOCKCHAIN_CHAIN_ID` | Polygon Amoy testnet chain ID is `80002` |
| `BLOCKCHAIN_EXPLORER_URL` | Generates explorer links for tx hashes and verification metadata |
| `VITE_BLOCKCHAIN_EXPLORER_URL` | Frontend uses it for explorer links on the verification page |
| `certificateHash` | Used as immutable fingerprint in DB and on-chain registry |
| `blockchainTxHash` | Stores the transaction hash from the issued or revoked certificate |
| `blockchainStatus` | Tracks if the blockchain registration is `PENDING`, `CONFIRMED`, or `FAILED` |

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

## Troubleshooting

### Backend not starting

- confirm PostgreSQL is running and `.env` contains a valid `DATABASE_URL`
- run `npx prisma migrate deploy` inside `backend`
- verify Node.js version is 20 or above

### Firebase OAuth not working

- ensure `VITE_FIREBASE_*` values are set in the frontend env
- ensure backend `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` are valid
- make sure the Firebase project is configured for the correct auth domain

### Google login fails after deploy

- add your deployed frontend/backend domains to the allowed CORS and redirect settings
- verify that `FRONTEND_URL` matches your deployed frontend origin

### Blockchain integration is disabled

- set `BLOCKCHAIN_ENABLED=true`
- ensure `BLOCKCHAIN_RPC_URL`, `BLOCKCHAIN_PRIVATE_KEY`, and `BLOCKCHAIN_CONTRACT_ADDRESS` are configured
- confirm the wallet has funds and the contract address is correct

### Verification page shows nothing

- check the certificate ID format and ensure it exists in the database
- confirm the backend is running and the `FRONTEND_URL`/`BACKEND_URL` values are correct

---

## License

MIT
