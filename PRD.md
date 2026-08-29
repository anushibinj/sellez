# Product Requirements Document (PRD)

# SellEZ

Private community marketplace for companies, universities & closed organizations

v1 MVP

SSR Web App

Firebase Deploy

## 1. Product Vision

SellEZ is a privacy-first marketplace where members of the same organization can safely buy and sell items using only their work or institutional email.

Unlike Facebook Marketplace or OLX, users never reveal their email address, phone number, or identity inside the app. Every interaction happens through anonymous in-app messaging while still ensuring accountability through community moderation.

### One-line value proposition

> A private marketplace where only your community can buy and sell — without exposing your identity.

# 2. Product Goals

### Primary goals

* Enable trusted buying/selling inside closed communities.

* Keep seller & buyer identities anonymous.

* Minimize spam through community moderation.

* Make onboarding effortless using email OTP.

### Non-goals (v1)

* Payments

* Shipping/logistics

* Image AI enhancement

* Multi-language support

* Mobile native apps

# 3. User Roles

|
Role

|

Description

|
| --- | --- |
|

Super Admin

|

Platform owner

|
|

Community Admin

|

Moderates one email-domain community

|
|

Community Member

|

Buy, sell and chat anonymously

|

# 4. Core Product Principles

## Privacy First

This is the most important product principle.

Visible everywhere in the UI:

* “Your email is never shared.”

* “Your identity stays private.”

* “Only verified members of your community can see listings.”

* “Chats are anonymous.”

### What users CAN see

|
Data

|

Visible?

|
| --- | --- |
|

Display alias

|

✅

|
|

Rating

|

✅

|
|

Organization

|

✅

|
|

Email

|

❌

|
|

Phone

|

❌

|
|

Real name

|

❌ (unless user voluntarily puts it in description)

|

Internally the database stores the email, but it is never returned by public APIs.

# 5. Community Model

## Source of truth

Community is determined only from email domain.

Example:

|
Email

|

Community

|
| --- | --- |
|

[alice@google.com](mailto:alice@google.com)

|

google.com

|
|

[bob@google.com](mailto:bob@google.com)

|

google.com

|
|

[john@mit.edu](mailto:john@mit.edu)

|

mit.edu

|

Users cannot manually choose or change communities.

If a domain doesn't exist, it is created automatically.

# 6. User Journey

![](data\:image/svg+xml;charset=utf-8,%3Csvg%20font-family%3D%22-apple-system-body%2C%20ui-sans-serif%2C%20-apple-system%2C%20system-ui%2C%20%26quot%3BSegoe%20UI%26quot%3B%2C%20Helvetica%2C%20%26quot%3BApple%20Color%20Emoji%26quot%3B%2C%20Arial%2C%20sans-serif%2C%20%26quot%3BSegoe%20UI%20Emoji%26quot%3B%2C%20%26quot%3BSegoe%20UI%20Symbol%26quot%3B%22%20font-weight%3D%22400%22%20data-d-component%3D%22svg%22%20fill%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20style%3D%22color%3Argb\(255%2C%20255%2C%20255\)%22%20viewBox%3D%220%200%20320%20420%22%20width%3D%22100%25%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ctext%20x%3D%22160%22%20y%3D%2240%22%20font-size%3D%2212%22%20font-family%3D%22Arial%22%20font-weight%3D%22600%22%20text-anchor%3D%22middle%22%20fill%3D%22%23FFFFFF%22%3ELanding%20Page%3C%2Ftext%3E%3Ctext%20x%3D%22160%22%20y%3D%22358%22%20font-size%3D%2212%22%20font-family%3D%22Arial%22%20font-weight%3D%22600%22%20text-anchor%3D%22middle%22%20fill%3D%22%23FFFFFF%22%3EBuy%20%E2%80%A2%20Sell%20%E2%80%A2%20Chat%3C%2Ftext%3E%3C%2Fsvg%3E)

# 7. Functional Requirements

## 7.1 Authentication

### Login

* Email input only

* Send 6-digit OTP

* OTP expires in 10 minutes

* Maximum 5 attempts

* Persist login using secure HTTP-only JWT cookie

* Session lasts 30 days

* Manual logout invalidates refresh token

### First Login

Collect:

|
Field

|

Required

|
| --- | --- |
|

Email

|

Yes

|
|

Name

|

No

|

Generate automatically:

* Anonymous Alias (e.g. `Silver Fox`)

* Avatar color

* Community

## 7.2 Landing Page

Sections:

1. Hero

2. How it works

3. Privacy promise

4. Features

5. Login CTA

No marketplace content is visible before login.

## 7.3 Marketplace

### Listing states

```
DRAFT
↓
UNDER_REVIEW
↓
ACTIVE
↓
SOLD

or

REVOKED
```

### Create Listing

Fields:

|
Field

|

Required

|
| --- | --- |
|

Title

|

✅

|
|

Description

|

✅

|
|

Price

|

✅

|
|

Category

|

✅

|
|

Images (max 6)

|

✅

|
|

Condition

|

✅

|
|

Location (optional text)

|

❌

|

Rules:

* Saved as Draft

* Submit sends to review

* User can revoke while under review

* Cannot edit once sold

## 7.4 Browse Listings

Features:

* Search

* Categories

* Price filter

* Newest

* Recently updated

* Seller rating

* Shareable URL

Example:

`/listing/9XJ82K`

Public URL works only for authenticated members of the same community.

Different community → 403.

## 7.5 Anonymous Chat

Every listing has one chat thread per buyer.

Identity shown as:

* Seller → “Seller”

* Buyer → “Interested Buyer”

Never reveal:

* Email

* Name

* User ID

System messages:

> This item has been marked as SOLD.

Chat supports:

* Text

* Images

* Read receipts

* Report user

## 7.6 Ratings

Only after listing becomes SOLD.

Buyer can rate:

* ⭐ 1–5

* Optional review

Seller cannot rate themselves.

Average rating appears on future listings.

## 7.7 Reports

User can report from:

* Listing

* Chat

Reasons:

* Spam

* Scam

* Offensive

* Fake listing

* Other

Creates moderation case.

## 7.8 Ban Appeal

If banned:

User sees:

> You are temporarily restricted until 14 Sept.

Button:

Appeal Ban

Appeal contains:

* Message

* Evidence (optional image)

Super admin reviews.

# 8. Community Admin Features

## Dashboard

Metrics:

* Active listings

* Pending review

* Sold today

* Reports

* Banned users

## Listing Moderation

Actions:

* Approve

* Reject

* Return with reason

Rejection requires mandatory reason.

## User Moderation

Ban types:

|
Permission

|

Supported

|
| --- | --- |
|

Post listings

|

✅

|
|

Chat

|

✅

|
|

Both

|

✅

|

Rules:

* Duration: 1–10 days

* Auto expires

* User notified

* Fully audited

# 9. Super Admin Features

## Global Dashboard

See:

* Total communities

* Total users

* Listings

* Revenue (future)

* Appeals

## Community Management

Actions:

* Promote member → Community Admin

* Remove admin

* View community health

* Review ban appeals

# 10. Audit Logging

Every important action creates immutable audit record.

### Events

|
Event

|

Logged

|
| --- | --- |
|

Login

|

✅

|
|

OTP verified

|

✅

|
|

Listing created

|

✅

|
|

Listing approved

|

✅

|
|

Listing sold

|

✅

|
|

Chat started

|

✅

|
|

Report filed

|

✅

|
|

Ban

|

✅

|
|

Appeal

|

✅

|
|

Admin promotion

|

✅

|

Audit record:

TypeScript

```
id
actorId
communityId
eventType
entityType
entityId
metadata (JSON)
ipAddress
createdAt
```

# 11. Email Notifications

Use SNS + SES.

|
Event

|

Recipient

|
| --- | --- |
|

OTP

|

User

|
|

Listing approved

|

Seller

|
|

Listing rejected

|

Seller

|
|

New chat

|

Seller

|
|

New reply

|

Other participant

|
|

Item sold

|

All chat participants

|
|

Ban

|

User

|
|

Ban expired

|

User

|
|

Appeal resolved

|

User

|

Emails should be clean HTML.

# 12. Non-functional Requirements

## Performance

* First load: under 2 sec

* API response: under 300 ms

* Image lazy loading

* Infinite scrolling

## Security

* HTTP-only cookies

* CSRF protection

* Rate limit OTP

* XSS sanitization

* Image validation

* SQL injection prevention

## Accessibility

* WCAG AA

* Keyboard navigation

* Dark mode

* Responsive

# 13. Recommended Architecture

## Frontend

|
Technology

|

Choice

|
| --- | --- |
|

Framework

|

Next.js 15

|
|

Language

|

TypeScript

|
|

Styling

|

Tailwind CSS v4

|
|

UI

|

shadcn/ui

|
|

State

|

TanStack Query

|
|

Forms

|

React Hook Form + Zod

|

Why Next.js instead of React?

* SSR landing page (better SEO)

* Faster routing

* Image optimization

* Easier Firebase hosting

## Backend

|
Technology

|

Choice

|
| --- | --- |
|

Framework

|

Spring Boot 3

|
|

Security

|

Spring Security

|
|

Auth

|

JWT + Refresh Cookie

|
|

Migration

|

Flyway

|
|

ORM

|

Spring Data JPA

|
|

Validation

|

Jakarta Validation

|

## Infrastructure

![](data\:image/svg+xml;charset=utf-8,%3Csvg%20font-family%3D%22-apple-system-body%2C%20ui-sans-serif%2C%20-apple-system%2C%20system-ui%2C%20%26quot%3BSegoe%20UI%26quot%3B%2C%20Helvetica%2C%20%26quot%3BApple%20Color%20Emoji%26quot%3B%2C%20Arial%2C%20sans-serif%2C%20%26quot%3BSegoe%20UI%20Emoji%26quot%3B%2C%20%26quot%3BSegoe%20UI%20Symbol%26quot%3B%22%20font-weight%3D%22400%22%20data-d-component%3D%22svg%22%20fill%3D%22currentColor%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20style%3D%22color%3Argb\(255%2C%20255%2C%20255\)%22%20viewBox%3D%220%200%20340%20220%22%20width%3D%22100%25%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%2F%3E)

# 14. Database Schema

### Users

```
id
email
name
alias
community_id
rating
created_at
```

### Communities

```
id
domain
display_name
created_at
```

### Listings

```
id
seller_id
title
description
price
status
category
created_at
```

### Chats

```
id
listing_id
buyer_id
seller_id
created_at
```

### Messages

```
id
chat_id
sender_id
message
created_at
```

### Bans

```
id
user_id
ban_posting
ban_chat
expires_at
```

### Reports

```
id
reporter_id
reported_user_id
reason
status
```

### Audit Logs

```
id
actor_id
event
metadata
created_at
```

# 15. REST API (High Level)

## Auth

```
POST /auth/send-otp
POST /auth/verify-otp
POST /auth/logout
GET  /auth/me
```

## Listings

```
GET    /listings
POST   /listings
GET    /listings/:id
PATCH  /listings/:id
POST   /listings/:id/submit
POST   /listings/:id/sold
```

## Chat

```
GET  /chats
POST /chats/start
GET  /chats/:id/messages
POST /chats/:id/messages
```

## Admin

```
GET /admin/listings
POST /admin/listings/:id/approve
POST /admin/users/:id/ban
```

# 16. UI Pages

![Business community Landing page by Masud Rana on Dribbble](https://images.openai.com/static-rsc-4/6RNIocGmDK-AqxBiYbecnMxyyMJmwCy5bU6aAmDAk7blJqsNE1g4h5Km_2fuw6mrTwtZwoKf5uvpa7bkstNUxL4G-tEZwEpgN1ZI8msDNC4j7KvBrP0T9HfGeX5FF8OGl0sQIiLf919jIrRHMFInqsWquUHxt9jmNchFBJic65Q?purpose=inline)

Landing

Privacy-first hero

![E-commerce (products) Components](https://images.openai.com/static-rsc-4/eRL0_wVvKDPv_PCPyiWpd7lpxB4aSp6L-2JFzZpaUkHZczMTaVoBVWJTGmPqB3j2Unm-D8lk4Rui_WqvEUJrwwaOLOlZJPJzRPk9BHj0LU3sjRZS-RTl5LLsF3pI13OEoWn7qJRUgAUs9xUYhr_Mp4xTxx4Q0PsN4XHOwr74O-4?purpose=inline)

Marketplace

Search + filters

![Karma Design: Wireframe & UI Kits for Figma](https://images.openai.com/static-rsc-4/D4My7MI_R-SQxyo0x9h-m3gonS03fOoEq0oRUgaG_YQ8BbZdarURQ_ODLYx7kkTti-yx8wo7nfyPVU46N_hH1V_rLaK6KBE2wgcJgMy2TesMOGmK8sQtrkPnqd7LHmqRIDzwgGJUDnRMV9y7_XP_mQKBkx0HPab5HJTqI2xt6x8?purpose=inline)

Listing Detail

Images + chat CTA

![Anonymous Real-Time Chat | Peerlist](https://images.openai.com/static-rsc-4/oEK_u43jGX9fqCLB0cKnGLpscQcmeh2fuvxrVOiQZF_eKzfKoc6ByoQ0qdyDZ93bTvOg5Nx6E_MiE_xXneg78sPKc_i0mUQj27VKYonnXrY0RSVYw3uvTYDSuyQ8ZcAucGQhmsbH1QO9jzdEGiadz08lBC-nNBI9foM-JZAWXsg?purpose=inline)

Anonymous Chat

Buyer / Seller only

![Review Queues | Documentation](https://images.openai.com/static-rsc-4/LkMnSJsmlTBxeQ6gs45T71pZBo4UreIo3gV9k-xJp7o9ojoXgFchpX6VJyDYnRc4tCeIdHyzrgo5c1YRPbqOXeoR6mO-m082ptpkkMAVVk3sMNdTU853bdfF_OGNNTXVWDePcFih_ModzK1RfKtIrtIPAPTxuKvrOhQVi2x4F-0?purpose=inline)

Community Admin

Review queue

![How to Use GPT Image 2: Complete Guide to AI Image Generation (2025) | GPT Image 2](https://images.openai.com/static-rsc-4/Eqp8HzyHx-pKsNfDFMFNIBMuDLulid8Jd4qio0vpR9Uikgnsjjnt0bMY563SfM0wlhVRy1CPkYbRqrXFPMn4bWjkqfnsZOWl0ukK0F--TZH4FgL04n05ktjz2haflFQYSx8WzJQGOsQ0lVXeM9QJP_9TqbgSkNse0DaTq62HHls?purpose=inline)

Super Admin

Global analytics

# 17. Development Roadmap (For Coding Agent)

## Phase 0 — Project Foundation

Goal: Working app shell

### Tasks

* Create Next.js app

* Tailwind + shadcn

* Spring Boot project

* PostgreSQL + Flyway

* Docker Compose

* CI pipeline

* Environment configuration

Deliverable: Empty application deploys successfully.

## Phase 1 — Authentication

### Backend

* OTP generation

* Email sending

* JWT cookies

* Refresh tokens

### Frontend

* Landing page

* Login flow

* OTP screen

* First-time onboarding

Acceptance Criteria

* User logs in using email only.

* Community created automatically.

* Session persists after refresh.

## Phase 2 — Marketplace

### Features

* Create listing

* Upload images

* Drafts

* Submit for review

* Browse listings

* Listing detail

* Share URLs

Acceptance

* Users only see their community's listings.

## Phase 3 — Anonymous Chat

### Features

* Create chat

* Realtime messaging

* Read receipts

* Sold system message

* Image attachments

Acceptance

* Neither side ever sees email/name.

## Phase 4 — Moderation

### Community Admin

* Review queue

* Approve/reject

* Ban users

* Auto unban job

### Super Admin

* Promote admins

* Audit viewer

## Phase 5 — Trust System

### Features

* Ratings

* Reports

* Appeals

* Email notifications

* Audit logs everywhere

## Phase 6 — Polish

* Dark mode

* Skeleton loaders

* Empty states

* Mobile responsiveness

* Accessibility

* Performance optimization

# 18. Acceptance Checklist

## MVP is complete when:

* Email OTP authentication works

* Communities are derived from email domains

* Anonymous identities are enforced

* Listings require admin approval

* Buyers and sellers can chat

* Listings can be marked sold

* Ratings work

* Reports work

* Community admins can moderate

* Super admins can promote admins

* Ban system auto-expires

* Audit logs exist for every critical action

* Email notifications are sent

* App is deployed on Firebase Hosting with Spring Boot backend

# 19. Coding Agent Rules (Important)

These instructions should be treated as mandatory implementation constraints.

### Architecture Rules

* Use Next.js App Router (no Vite/CRA).

* Use TypeScript everywhere.

* Use Server Components by default; Client Components only when necessary.

* Use Spring Boot 3.5+.

* Database changes must go through Flyway migrations only.

* Never expose email addresses in any API response except `/auth/me`.

### Code Quality

* Feature-first folder structure.

* DTOs instead of exposing entities.

* Zod validation on frontend.

* Jakarta validation on backend.

* 90%+ unit test coverage for business logic.

* Every endpoint must have integration tests.

### UI Rules

* Premium Apple/Linear-inspired design.

* 8px spacing system.

* Fully responsive (320px–1440px).

* Dark mode from day one.

* Empty, loading, and error states for every page.

### Privacy Rules

The coding agent must never accidentally leak identity.

Specifically:

* No email in chat payloads.

* No name in listing payloads.

* Admins cannot view member emails.

* Public APIs use only alias + rating.

* Audit logs store identities server-side only.
