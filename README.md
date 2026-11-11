# KrishiConnect (कृषि कनेक्ट) - Production Agricultural Marketplace

KrishiConnect is an end-to-end, multi-vendor agricultural e-commerce marketplace built for the Indian market (INR ₹, English/Hindi multilingual support). It connects farmers, agricultural input vendors (seeds, fertilizers, bio-pesticides, irrigation tools), and platform administrators with end-to-end workflows: vendor onboarding & verification, product compliance reviews, multi-vendor cart & checkout, payment gateway integration with sandbox simulation, real-time Socket.IO chat, telephony calling integration, and admin oversight.

Visual Design: Replicated with 90%+ fidelity from the **GREEN ROOTS** agricultural design reference (deep forest green `#222D1D`, meadow lime `#D8EE88`, soft cream-lime `#F4F8DE`, pill badges, rounded cards, accessible typography).

---

## Architecture & Technology Stack

### Frontend (`apps/web`)
- **Framework:** Next.js 14 (App Router) with TypeScript strict mode
- **Styling & UI:** Tailwind CSS, Lucide React icons, GreenRoots design system tokens
- **State & Query:** React Context (Auth, Cart, Language), TanStack Query
- **Real-Time:** Socket.IO Client for instant farmer-vendor messaging and call signals
- **Internationalization:** Maintainable English & Hindi (`en` / `hi`) i18n switcher

### Backend (`apps/api`)
- **Runtime:** Node.js, Express, TypeScript
- **Database & ORM:** PostgreSQL 16, Prisma ORM with versioned schema & migrations
- **Real-Time Engine:** Socket.IO server with channel-based security (`user:${id}`, `conversation:${id}`)
- **Security & RBAC:** JWT authentication, bcryptjs password hashing, role-based access control (`FARMER`, `VENDOR`, `ADMIN`), vendor profile ownership validation
- **Payments:** Dedicated payment service with Razorpay adapter, HMAC SHA256 webhook signature verification, and local development sandbox simulator
- **Telephony / Voice:** Telephony provider adapter (Mock / Twilio / Exotel) with session tracking and masked calling metadata

### Monorepo Workspaces (`pnpm`)
- `apps/web`: Next.js 14 App Router frontend
- `apps/api`: Express + Socket.IO backend
- `packages/shared`: Shared TypeScript types, enums, DTOs, and Zod validation schemas
- `prisma`: Normalized Prisma schema (30+ models), migrations, and realistic seed script

---

## 3 Distinct User Roles

### 1. Farmer / Customer
- Register, login, manage farm delivery addresses
- Browse and search agricultural catalog by crop suitability, category, price, organic certification
- Add products from multiple vendors to a unified cart
- Checkout with server-side stock reservation, discount coupons (`KISAN50`, `HARVEST10`), and UPI / Card / COD payment methods
- Track orders through fulfillment lifecycle (`PENDING_PAYMENT` → `PAID` → `PROCESSING` → `SHIPPED` → `DELIVERED`)
- Chat in real time with suppliers, request bulk quotations, and submit verified reviews

### 2. Vendor / Seller
- Register business profile, submit GSTIN and State Seed / Insecticide licenses
- Track verification status: `PENDING` → `APPROVED` | `REJECTED` | `MORE_INFORMATION_REQUIRED`
- Manage storefront, create listings with variants, pack sizes, stock quantities, CIB registration, batch and expiry dates
- Newly submitted products enter `PENDING_REVIEW` and remain unpublished until admin verification
- Process orders: Confirm → Pack → Dispatch (with carrier tracking number) → Deliver
- Respond to bulk RFQ quotation requests and track gross revenue, commissions (5%), and net payouts

### 3. Platform Administrator
- Protected admin dashboard (`/admin/dashboard`) with real-time Gross Merchandise Value (GMV), order counts, and commission revenue
- Vendor verification queue: inspect business licenses, approve or reject vendors with audit remarks
- Product review queue: inspect agricultural compliance, dosage instructions, and approve/reject listings
- Platform-wide order and payout tracking
- Immutable chronological audit trail (`/admin/audit-logs`)

---

## Quick Start & Local Setup

### Prerequisites
- Node.js 18+ (tested on Node v20/v22)
- pnpm 9+ / 10+ (`corepack enable && corepack prepare pnpm@latest --activate`)
- PostgreSQL 16 & Redis 7 (or run via Docker Compose)

### 1. Clone & Install Dependencies
```bash
cd Kishani
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default local PostgreSQL credentials in `.env`:
```env
DATABASE_URL=postgresql://krishiconnect:krishiconnect@localhost:5432/krishiconnect?schema=public
JWT_SECRET=krishi_connect_super_jwt_secret_dev_32char_minimum
PAYMENT_SANDBOX_MODE=true
```

### 3. Generate Prisma Client & Sync Database
```bash
# Push schema to database
pnpm prisma db push --schema=./prisma/schema.prisma

# Seed realistic Indian agricultural catalog & test accounts
pnpm db:seed
```

### 4. Build Shared Types & Packages
```bash
pnpm --filter @krishiconnect/shared build
pnpm --filter @krishiconnect/api build
pnpm --filter @krishiconnect/web build
```

### 5. Start Development Servers
```bash
# In terminal 1: Start Backend API (Port 4000)
pnpm --filter @krishiconnect/api dev

# In terminal 2: Start Next.js Frontend (Port 3000)
pnpm --filter @krishiconnect/web dev
```
Access the application at `http://localhost:3000`.

---

## Seed Accounts & Demo Credentials

Use the Quick-Fill buttons on the `/login` page or use these credentials:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Platform Administrator** | `admin@krishiconnect.in` | `AdminKrishi#2026` | Platform GMV, vendor audits, product review |
| **Approved Vendor** | `vendor1@krishiconnect.in` | `Vendor#12345` | Bharat Krishi Seva Kendra (Ludhiana, Punjab) |
| **Approved Vendor** | `vendor2@krishiconnect.in` | `Vendor#12345` | Harit Organic Bio-Tech (Nashik, Maharashtra) |
| **Pending Vendor** | `vendor3@krishiconnect.in` | `Vendor#12345` | Annapurna Agri Traders (Pending Verification) |
| **Farmer / Customer** | `farmer@krishiconnect.in` | `Farmer#12345` | Ramesh Kumar Patel (Anand, Gujarat) |

---

## Automated Test Suite

A comprehensive test suite in `apps/api/test/api.test.ts` validates:
- API health check
- Role-based authentication & JWT issuance
- RBAC protection (Farmer blocked from admin endpoints)
- Admin platform metrics
- Vendor product submission & compliance quarantine (unpublished before review)
- Admin review & approval state transitions
- Multi-vendor cart calculations & stock reservation
- Multi-vendor checkout & coupon application
- Payment webhook verification & simulation
- Administrative audit logs

Run tests with:
```bash
pnpm --filter @krishiconnect/api test
```
Result: **16 passed (100% passing)**.

---

## Production Build Verification

```bash
# Build all workspaces
pnpm --filter @krishiconnect/shared build
pnpm --filter @krishiconnect/api build
pnpm --filter @krishiconnect/web build
```
All 25 Next.js App Router routes compile and prerender cleanly.

---

## Docker Compose Deployment

To run PostgreSQL, Redis, API, and Web in containers:
```bash
docker-compose up --build -d
```
- API will be accessible at: `http://localhost:4000`
- Web application at: `http://localhost:3000`

