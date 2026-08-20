# CertiChain — Deployment Guide

## Architecture Overview

```
Internet
   │
   ├── frontend.certichain.app  ──▶  Vercel / Netlify (static)
   │
   └── api.certichain.app       ──▶  Render / Railway (Node.js)
                                           │
                                     PostgreSQL (Neon / Supabase)
                                           │
                                     File Storage (S3 / Cloudinary)
                                           │
                                     Email (Resend / SMTP)
```

---

## Option A — Recommended Free Stack

| Service    | Provider         | Notes                        |
|------------|------------------|------------------------------|
| Frontend   | Vercel           | Free, auto-deploy from Git   |
| Backend    | Render           | Free tier, sleeps after 15m  |
| Database   | Neon             | Free 0.5GB PostgreSQL        |
| Storage    | Cloudinary       | Free 25GB                    |
| Email      | Resend           | Free 100/day                 |

---

## Option B — Production Stack

| Service    | Provider         | Notes                          |
|------------|------------------|--------------------------------|
| Frontend   | Vercel Pro       | Edge CDN, custom domain        |
| Backend    | Railway          | Always-on, $5/month            |
| Database   | Neon Pro / RDS   | Connection pooling             |
| Storage    | AWS S3           | Cheap, reliable                |
| Email      | Resend / SES     | High deliverability            |

---

## Step 1 — Database Setup (Neon)

1. Go to [neon.tech](https://neon.tech) → Create account → New project
2. Copy connection string:
   ```
   postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/certichain?sslmode=require
   ```
3. Run migrations:
   ```bash
   cd backend
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
   ```

---

## Step 2 — Backend Deployment (Render)

1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repo
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm ci && npx prisma generate && npm run build`
   - **Start Command:** `npx prisma migrate deploy && node dist/server.js`
   - **Node Version:** 20

4. Set Environment Variables:
   ```
   DATABASE_URL=postgresql://...neon.tech/certichain?sslmode=require
   JWT_SECRET=<64 random hex chars>
   NODE_ENV=production
   PORT=4000
   FRONTEND_URL=https://certichain.vercel.app
   STORAGE_PROVIDER=cloudinary   # or s3
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_xxxxx
   ```

5. Note the backend URL: `https://certichain-api.onrender.com`

---

## Step 3 — Frontend Deployment (Vercel)

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import GitHub repo
3. Settings:
   - **Root Directory:** `frontend`
   - **Framework:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

4. Set Environment Variables:
   ```
   VITE_API_URL=https://certichain-api.onrender.com/api
   VITE_APP_URL=https://certichain.vercel.app
   ```

5. Deploy → Note the frontend URL

---

## Step 4 — Storage Setup

### Cloudinary (Recommended for simplicity)

1. [cloudinary.com](https://cloudinary.com) → Free account
2. Get credentials from Dashboard
3. Set in backend:
   ```
   STORAGE_PROVIDER=cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud
   CLOUDINARY_API_KEY=xxx
   CLOUDINARY_API_SECRET=xxx
   ```

### AWS S3

1. Create S3 bucket: `certichain-files`
2. Set CORS policy on the bucket:
   ```json
   [{"AllowedOrigins": ["*"], "AllowedMethods": ["GET", "PUT"], "AllowedHeaders": ["*"]}]
   ```
3. Create IAM user with S3 read/write access
4. Set in backend:
   ```
   STORAGE_PROVIDER=s3
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=AKIAxxxxxxxx
   AWS_SECRET_ACCESS_KEY=xxxxxxxx
   AWS_S3_BUCKET=certichain-files
   ```

---

## Step 5 — Email Setup (Resend)

1. [resend.com](https://resend.com) → Free account
2. Add and verify your domain (or use the default sandbox)
3. Get API key
4. Set in backend:
   ```
   EMAIL_PROVIDER=resend
   EMAIL_FROM=noreply@yourdomain.com
   RESEND_API_KEY=re_xxxxxxxxxx
   ```

---

## Step 6 — Custom Domain (Optional)

### Backend (Render)
- Settings → Custom Domain → Add `api.certichain.com`
- Update `FRONTEND_URL` and `BACKEND_URL` env vars

### Frontend (Vercel)
- Project Settings → Domains → Add `certichain.com`
- Update `VITE_API_URL` to use new backend domain

---

## Step 7 — Post-Deploy Checklist

```
[ ] Health check: GET https://api.certichain.com/health
[ ] API docs:     GET https://api.certichain.com/api/docs
[ ] Verify page:  https://certichain.com/verify
[ ] Register:     Create test organization
[ ] Issue cert:   Issue test certificate
[ ] QR scan:      Scan QR code from PDF
[ ] Verify:       https://certichain.com/verify/CC-xxxx-xxxxx
[ ] Email:        Check email delivery in logs
[ ] HTTPS:        Confirm SSL on all endpoints
```

---

## Docker Self-Hosting

If you prefer to self-host on a VPS (DigitalOcean, Hetzner, etc.):

```bash
# On your server
git clone <repo-url>
cd CertiChain
cp .env.example .env
# Edit .env with production values
nano .env

# Build and start all services
docker compose up -d --build

# Run migrations (first time only)
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx tsx prisma/seed.ts  # optional demo data

# View logs
docker compose logs -f backend
```

### Nginx reverse proxy (recommended)

```nginx
server {
    server_name certichain.com www.certichain.com;

    location / {
        proxy_pass http://localhost:3000;
    }
}

server {
    server_name api.certichain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Use `certbot --nginx` for free SSL.

---

## Environment Variables — Production Checklist

| Variable          | Required | Notes                                |
|-------------------|----------|--------------------------------------|
| `DATABASE_URL`    | ✅        | PostgreSQL connection string         |
| `JWT_SECRET`      | ✅        | 64+ random chars, never expose       |
| `FRONTEND_URL`    | ✅        | Exact frontend origin (for CORS)     |
| `NODE_ENV`        | ✅        | Must be `production`                 |
| `STORAGE_PROVIDER`| ✅        | `s3` or `cloudinary` (not `local`)   |
| `EMAIL_PROVIDER`  | ✅        | `resend` or `smtp` (not `log`)       |
| `JWT_EXPIRES_IN`  | optional | Default `7d`                         |
| `RESEND_API_KEY`  | if resend | Required if EMAIL_PROVIDER=resend    |
| `AWS_*`           | if s3     | Required if STORAGE_PROVIDER=s3      |
| `CLOUDINARY_*`    | if cdn    | Required if STORAGE_PROVIDER=cloudinary |

---

## Monitoring

For production, consider adding:
- **Uptime monitoring:** UptimeRobot (free) — monitor `/health`
- **Error tracking:** Sentry — add `@sentry/node` to backend
- **Logs:** LogTail / Papertrail (log aggregation)
- **DB monitoring:** Neon/Supabase built-in dashboards
