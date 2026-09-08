# SellEZ

A private marketplace where only your community can buy and sell — without exposing your identity.

SellEZ is a privacy-first marketplace for closed communities (companies, universities, organizations). Members onboard with a work/institutional email via OTP, and every buyer/seller interaction happens through anonymous in-app chat — no email, phone number, or identity is ever revealed. Community admins moderate every listing before it goes live.

See [PRD.md](PRD.md) for the full product spec.

## Tech stack

**Backend** — Java 17, Spring Boot 3.5 (Web, Security, Data JPA, WebSocket, Actuator), PostgreSQL, Flyway migrations, JWT auth (jjwt), AWS SES/SNS for email/notifications, pluggable file storage (local disk, S3-compatible, or Firebase Storage) with Thumbnailator for image compression, Maven.

**Frontend** — Next.js 15 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4, TanStack Query, React Hook Form + Zod, Radix UI, STOMP over WebSocket for chat.

## Project structure

```
backend/    Spring Boot API (com.sellez.*: auth, user, community, listing, chat,
            moderation, report, rating, audit, email, storage, security, config)
frontend/   Next.js app (src/app: marketplace, listing, listings, chats, login,
            onboarding, admin, super)
```

Each backend package is a self-contained module (entity, repository, service, controller) for its domain area. The browser calls the backend directly at `NEXT_PUBLIC_BACKEND_URL` (no proxy) — `src/lib/config.ts` derives the REST base (`/api`) and the chat WebSocket URL (`/ws`) from it. Because the calls are cross-origin, the backend's `CORS_ALLOWED_ORIGINS` must list the frontend's origin, and cookies are sent with `credentials: "include"` (so a cross-site deployment needs `COOKIE_SAMESITE=None` + `COOKIE_SECURE=true`).

## File storage & image uploads

Every image a user uploads (listing photos, chat images, appeal evidence) is downscaled and re-encoded to JPEG before it's stored — see `ImageCompressor` in `com.sellez.storage`. This runs the same way regardless of where the bytes end up, so file size and quality are consistent across backends.

Where the bytes actually land is chosen by `STORAGE_TYPE` (`sellez.storage.type` in `application.yml`), with one `StorageBackend` implementation per option:

- **`local`** (default) — written to `STORAGE_LOCAL_PATH` on disk.
- **`s3`** — written via the plain AWS SDK v2 `S3Client`. Pointing `S3_ENDPOINT` at a self-hosted S3-compatible server (SeaweedFS, MinIO, ...) instead of leaving it blank is enough to swap providers — nothing else in the code is AWS-specific. Leave `S3_ACCESS_KEY`/`S3_SECRET_KEY` blank against an unauthenticated dev gateway (e.g. a bare SeaweedFS S3 gateway); leave them blank with no custom endpoint to fall back to the SDK's normal AWS credential chain instead.
- **`firebase`** — written to a Firebase Storage bucket via the Firebase Admin SDK. `FIREBASE_STORAGE_BUCKET` is the bare bucket name (no `gs://` prefix), e.g. `my-project.firebasestorage.app`. `FIREBASE_CREDENTIALS_PATH` points at a service-account JSON key; leave it blank to use Application Default Credentials (the runtime service account on Firebase App Hosting / Cloud Run).

**Reads always go through the backend.** Whatever backend is active, the browser only ever loads images from `GET /api/media/{key}` — `MediaController` fetches the bytes from the backend (authenticated the same way writes are, for S3/Firebase) and streams them back. The storage bucket itself never needs to be public, and no S3/Firebase credentials or URLs reach the client. `STORAGE_PUBLIC_BASE_URL` is the base URL of that endpoint, prepended to every stored key.

See the [environment variables](#backend-environment-variables) table below for the full set of `S3_*`/`FIREBASE_*` options.

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
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated origins allowed to call the API and open the chat WebSocket; must include the frontend's own origin since it calls the backend directly |
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
| `STORAGE_TYPE` | `local` | Which backend stores uploads: `local`, `s3`, or `firebase` |
| `STORAGE_LOCAL_PATH` | `./uploads` | Local disk path for uploaded images (`local` only) |
| `STORAGE_PUBLIC_BASE_URL` | `http://localhost:8080/api/media` | Base URL of `GET /api/media/{key}`, which serves images for every backend; prepended to each stored key |
| `STORAGE_IMAGE_MAX_DIMENSION` | `1600` | Every uploaded image is downscaled so its longest edge is at most this many pixels (never upscaled) |
| `STORAGE_IMAGE_QUALITY` | `0.82` | JPEG re-encode quality (0–1) applied to every uploaded image, regardless of backend |
| `S3_BUCKET` | *(empty)* | Bucket name (`s3` only) |
| `S3_REGION` | `us-east-1` | AWS region, or any placeholder value your S3-compatible server expects (`s3` only) |
| `S3_ENDPOINT` | *(empty)* | Custom endpoint for an S3-compatible server such as SeaweedFS or MinIO; leave empty for real AWS S3 (`s3` only) |
| `S3_ACCESS_KEY` | *(empty)* | Access key; leave both key vars empty for an unauthenticated dev gateway, or omit both to use the AWS SDK's default credential chain (`s3` only) |
| `S3_SECRET_KEY` | *(empty)* | Secret key (`s3` only) |
| `S3_PATH_STYLE_ACCESS` | `false` | Force path-style bucket addressing (`https://host/bucket/key`) — needed by most self-hosted S3-compatible servers (`s3` only) |
| `FIREBASE_STORAGE_BUCKET` | *(empty)* | Firebase Storage bucket name, no `gs://` prefix, e.g. `my-project.firebasestorage.app` (`firebase` only) |
| `FIREBASE_CREDENTIALS_PATH` | *(empty)* | Path to a service-account JSON key; empty falls back to Application Default Credentials (`firebase` only) |
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
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:8080` | Root URL of the Spring Boot backend; the browser calls it directly. REST base (`/api`) and the chat WebSocket URL (`/ws`, `ws`/`wss` matched to the scheme) are derived from it |
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
