# KrishiConnect (कृषि कनेक्ट) – Production Agricultural Marketplace

KrishiConnect is an end-to-end, multi-vendor agricultural e-commerce marketplace built for the Indian market. It connects farmers, agricultural input vendors, and platform administrators through a unified digital platform.

The platform supports vendor onboarding and verification, agricultural product compliance reviews, multi-vendor shopping carts, checkout, payment integration, real-time chat, calling integration, and administrative oversight.

**Visual Design:** Inspired by the GREEN ROOTS agricultural design reference, featuring a deep forest green (`#222D1D`), meadow lime (`#D8EE88`), soft cream-lime (`#F4F8DE`), pill badges, rounded cards, and accessible typography.

---

## Architecture & Technology Stack

### Frontend (`apps/web`)

- **Framework:** Next.js 14 (App Router) with TypeScript strict mode
- **Styling & UI:** Tailwind CSS, Lucide React icons, GreenRoots design system
- **State Management:** React Context (Auth, Cart, Language)
- **Data Fetching:** TanStack Query
- **Real-Time:** Socket.IO Client for instant farmer-vendor messaging and call signals
- **Internationalization:** English and Hindi (`en` / `hi`)

### Backend (`apps/api`)

- **Runtime:** Node.js, Express, TypeScript
- **Database & ORM:** PostgreSQL 16, Prisma ORM
- **Real-Time Engine:** Socket.IO server with channel-based security (`user:${id}`, `conversation:${id}`)
- **Security & RBAC:** JWT authentication, bcryptjs password hashing, and role-based access control (`FARMER`, `VENDOR`, `ADMIN`)
- **Payments:** Razorpay adapter, HMAC SHA256 webhook signature verification, and local sandbox simulator
- **Telephony:** Provider adapter supporting Mock, Twilio, and Exotel with session tracking and masked calling metadata

### Monorepo Workspaces (`pnpm`)

- `apps/web` – Next.js frontend
- `apps/api` – Express and Socket.IO backend
- `packages/shared` – Shared TypeScript types, enums, DTOs, and Zod validation schemas
- `prisma` – Prisma schema, migrations, and seed scripts

---

## Three Distinct User Roles

### 1. Farmer / Customer

- Register, log in, and manage farm delivery addresses.
- Browse and search agricultural products by crop suitability, category, price, and organic certification.
- Add products from multiple vendors to a unified cart.
- Complete checkout with server-side stock reservation.
- Apply discount coupons (`KISAN50`, `HARVEST10`).
- Choose UPI, card, or Cash on Delivery (COD).
- Track orders through the fulfillment lifecycle:

  `PENDING_PAYMENT` → `PAID` → `PROCESSING` → `SHIPPED` → `DELIVERED`

- Chat with suppliers in real time.
- Request bulk quotations and submit verified reviews.

### 2. Vendor / Seller

- Register a business profile and submit GSTIN and applicable State Seed / Insecticide licenses.
- Track verification status:

  `PENDING` → `APPROVED` / `REJECTED` / `MORE_INFORMATION_REQUIRED`

- Manage storefronts and create product listings.
- Manage product variants, pack sizes, stock quantities, CIB registration, batch numbers, and expiry dates.
- Newly submitted products enter `PENDING_REVIEW` and remain unpublished until administrator approval.
- Process orders: Confirm → Pack → Dispatch → Deliver.
- Add carrier tracking numbers.
- Respond to bulk RFQ quotation requests.
- Track gross revenue, 5% commissions, and net payouts.

### 3. Platform Administrator

- Access the protected admin dashboard at `/admin/dashboard`.
- Monitor real-time Gross Merchandise Value (GMV), order counts, and commission revenue.
- Review vendor registrations and business licenses.
- Approve or reject vendors with audit remarks.
- Review agricultural product compliance, dosage instructions, and product listings.
- Approve or reject submitted products.
- Monitor platform-wide orders and payouts.
- Access chronological audit logs at `/admin/audit-logs`.

---

## Quick Start & Local Setup

### Prerequisites

- Node.js 18+ (tested with Node.js 20/22)
- pnpm 9+ / 10+
- PostgreSQL 16
- Redis 7 (or Docker Compose)

Enable pnpm using Corepack:

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

### 1. Clone the Repository

```bash
git clone https://github.com/nitian1devansh/krishiconnect.git
cd krishiconnect
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Configure your local environment variables in `.env`:

```env
DATABASE_URL=postgresql://krishiconnect:krishiconnect@localhost:5432/krishiconnect?schema=public
JWT_SECRET=replace_with_a_secure_secret_of_at_least_32_characters
PAYMENT_SANDBOX_MODE=true
```

**Important:** Never commit `.env` or expose production credentials, API keys, or secrets publicly.

### 4. Generate Prisma Client & Sync Database

```bash
pnpm prisma db push --schema=./prisma/schema.prisma
```

Seed the database with sample agricultural products and demo accounts:

```bash
pnpm db:seed
```

### 5. Build Shared Types & Packages

```bash
pnpm --filter @krishiconnect/shared build
pnpm --filter @krishiconnect/api build
pnpm --filter @krishiconnect/web build
```

### 6. Start Development Servers

**Terminal 1 – Backend API (Port 4000):**

```bash
pnpm --filter @krishiconnect/api dev
```

**Terminal 2 – Frontend (Port 3000):**

```bash
pnpm --filter @krishiconnect/web dev
```

Open the application:

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

---

## Seed Accounts & Demo Credentials

Use the Quick-Fill buttons on the `/login` page or the following development credentials.

| Role | Email | Password | Details |
|---|---|---|---|
| Platform Administrator | `admin@krishiconnect.in` | `AdminKrishi#2026` | Platform administration |
| Approved Vendor | `vendor1@krishiconnect.in` | `Vendor#12345` | Bharat Krishi Seva Kendra |
| Approved Vendor | `vendor2@krishiconnect.in` | `Vendor#12345` | Harit Organic Bio-Tech |
| Pending Vendor | `vendor3@krishiconnect.in` | `Vendor#12345` | Annapurna Agri Traders |
| Farmer / Customer | `farmer@krishiconnect.in` | `Farmer#12345` | Ramesh Kumar Patel |

**Note:** These are development/demo credentials only. Never use them in production.

---

## Automated Test Suite

The API test suite (`apps/api/test/api.test.ts`) covers:

- API health checks
- Role-based authentication and JWT issuance
- RBAC protection (farmers blocked from admin endpoints)
- Admin platform metrics
- Vendor product submission and compliance quarantine
- Admin review and approval workflows
- Multi-vendor cart calculations and stock reservation
- Multi-vendor checkout and coupon application
- Payment webhook verification and simulation
- Administrative audit logs

Run the tests:

```bash
pnpm --filter @krishiconnect/api test
```

**Reported test result:** 16 tests passed (100%).

---

## Production Build Verification

Build all workspaces:

```bash
pnpm --filter @krishiconnect/shared build
pnpm --filter @krishiconnect/api build
pnpm --filter @krishiconnect/web build
```

The project has been reported to compile and prerender all 25 Next.js App Router routes successfully.

---

## Docker Compose Deployment

To run PostgreSQL, Redis, API, and Web services using Docker Compose:

```bash
docker-compose up --build -d
```

Services:

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

---

## Project Highlights

- Multi-vendor agricultural marketplace
- Farmer, Vendor, and Administrator role-based access
- Vendor verification and product moderation
- Real-time communication using Socket.IO
- Multi-vendor cart and checkout
- Payment integration with sandbox simulation
- English and Hindi language support
- Agricultural product compliance workflows
- Prisma-powered relational database
- Docker-based deployment support

---

**KrishiConnect – Connecting Farmers, Empowering Agriculture.**