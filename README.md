# SellEZ

A private marketplace where only your community can buy and sell — without exposing your identity.

SellEZ is a privacy-first marketplace for closed communities (companies, universities, organizations). Members onboard with a work/institutional email via OTP, and every buyer/seller interaction happens through anonymous in-app chat — no email, phone number, or identity is ever revealed. Community admins moderate every listing before it goes live.

See [PRD.md](PRD.md) for the full product spec.

## Tech stack

**Backend** — Java 17, Spring Boot 3.5 (Web, Security, Data JPA, WebSocket, Actuator), PostgreSQL, Flyway migrations, JWT auth (jjwt), AWS SES/SNS for email/notifications, Maven.

**Frontend** — Next.js 15 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4, TanStack Query, React Hook Form + Zod, Radix UI, STOMP over WebSocket for chat.

## Project structure

```
backend/    Spring Boot API (com.sellez.*: auth, user, community, listing, chat,
            moderation, report, rating, audit, email, storage, security, config)
frontend/   Next.js app (src/app: marketplace, listing, listings, chats, login,
            onboarding, admin, super)
```

Each backend package is a self-contained module (entity, repository, service, controller) for its domain area. The frontend calls the backend through a Next.js rewrite (`/backend-api/*` → `${API_PROXY_TARGET}/api/*`, `/backend-ws/*` → `.../ws/*`), so the browser never talks to the backend origin directly.

## Prerequisites

- Java 17+
- Maven 3.9+
- Node.js 20+
- Docker (for local PostgreSQL) — or a PostgreSQL 16 instance of your own

## Getting started

### 1. Database

```bash
docker compose up -d
```

This starts PostgreSQL 16 on port 5432 with the credentials from `.env` (see `.env.example` at the repo root). Flyway applies migrations automatically on backend startup.

### 2. Backend

```bash
cd backend
mvn spring-boot:run
```

Runs on `http://localhost:8080`. Configuration lives in `backend/src/main/resources/application.yml`, all overridable via environment variables (see [Backend environment variables](#backend-environment-variables) below). By default, OTP emails are just logged to the console (`EMAIL_PROVIDER=logging`), so you can sign in locally without configuring AWS SES — check the backend logs for the code.

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local   # if not already present
npm install
npm run dev
```

Runs on `http://localhost:3000`.

### 4. Sign in

Visit `http://localhost:3000`, enter any email, and grab the OTP code from the backend console logs (or set `OTP_FIXED_CODE` for a static dev code).

## Environment variables

### Root (`.env`, used by `docker-compose.yml`)

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_DB` | `sellez` | Database name |
| `POSTGRES_USER` | `sellez` | Database user |
| `POSTGRES_PASSWORD` | `sellez` | Database password |
| `POSTGRES_PORT` | `5432` | Host port for Postgres |

### Backend environment variables

| Variable | Default | Description |
|---|---|---|
| `SERVER_PORT` | `8080` | HTTP port |
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/sellez` | JDBC connection string |
| `DATABASE_USERNAME` | `sellez` | DB username |
| `DATABASE_PASSWORD` | `sellez` | DB password |
| `UPLOAD_MAX_FILE_SIZE` | `8MB` | Max size per uploaded file |
| `UPLOAD_MAX_REQUEST_SIZE` | `20MB` | Max total multipart request size |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Allowed CORS origins |
| `JWT_SECRET` | *(dev placeholder)* | Secret for signing JWTs — must be ≥32 chars in production |
| `ACCESS_TOKEN_MINUTES` | `15` | Access token lifetime |
| `REFRESH_TOKEN_DAYS` | `30` | Refresh token lifetime |
| `COOKIE_SECURE` | `false` | Set cookies as `Secure` |
| `COOKIE_SAMESITE` | `Lax` | Cookie `SameSite` policy |
| `COOKIE_DOMAIN` | *(empty)* | Cookie domain |
| `ACCESS_COOKIE_NAME` | `sellez_access` | Access token cookie name |
| `REFRESH_COOKIE_NAME` | `sellez_refresh` | Refresh token cookie name |
| `OTP_TTL_MINUTES` | `10` | OTP code validity window |
| `OTP_MAX_ATTEMPTS` | `5` | Max verification attempts per OTP |
| `OTP_SEND_LIMIT` | `5` | Max OTP sends per window |
| `OTP_SEND_WINDOW_MINUTES` | `10` | OTP send rate-limit window |
| `OTP_FIXED_CODE` | *(empty)* | If set, always use this code instead of a random one (local dev only) |
| `SUPER_ADMIN_EMAILS` | `owner@sellez.local` | Comma-separated emails granted super-admin role |
| `STORAGE_LOCAL_PATH` | `./uploads` | Local disk path for uploaded images |
| `STORAGE_PUBLIC_BASE_URL` | `http://localhost:8080/api/media` | Public base URL for serving stored images |
| `EMAIL_PROVIDER` | `logging` | `logging` (console) or the AWS SES-backed provider |
| `EMAIL_FROM` | `noreply@sellez.local` | From address for outgoing email |
| `AWS_REGION` | `us-east-1` | AWS region for SES/SNS |
| `SNS_TOPIC_ARN` | *(empty)* | SNS topic ARN for notifications |
| `LISTING_MAX_IMAGES` | `6` | Max images per listing |
| `LISTING_CURRENCIES` | `USD,INR,EUR,GBP,AED,CAD,AUD` | Currencies sellers can choose from |
| `LISTING_DEFAULT_CURRENCY` | `USD` | Default listing currency |
| `CHAT_MAX_IMAGE_BYTES` | `5242880` | Max chat image size (bytes) |
| `BAN_EXPIRY_JOB_MS` | `60000` | Interval for the ban-expiry background job |

### Frontend environment variables (`frontend/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `/backend-api` | Base path the browser calls (proxied by Next.js) |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8080/ws` | WebSocket URL for chat |
| `API_PROXY_TARGET` | `http://localhost:8080` | Backend origin the Next.js rewrite proxies to (server-side only) |
| `NEXT_PUBLIC_LISTING_CURRENCIES` | `USD,INR,EUR,GBP,AED,CAD,AUD` | Currency options shown in the listing form |
| `NEXT_PUBLIC_LISTING_DEFAULT_CURRENCY` | `USD` | Default currency preselected in the listing form |

## Testing

```bash
# Backend
cd backend && mvn clean test

# Frontend
cd frontend && npm run lint && npm run build
```

## Deployment

The project is configured for Firebase App Hosting (`firebase.json`, `apphosting.yaml`, `.firebaserc`) with a standalone Next.js build (`output: "standalone"` in `frontend/next.config.ts`) and a Docker image for the backend (`backend/Dockerfile`).
