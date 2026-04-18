# StockMaster SaaS — Production-Grade Inventory Management

A full-stack SaaS application built with Next.js 14, PostgreSQL, Prisma, and NextAuth.

---

## ✅ Tech Stack

| Layer       | Technology                         |
|-------------|-------------------------------------|
| Frontend    | Next.js 14 (App Router) + Tailwind  |
| Backend     | Next.js API Routes                  |
| Database    | PostgreSQL (Neon / Supabase / Render) |
| ORM         | Prisma 5                            |
| Auth        | NextAuth v5 (JWT strategy)          |
| Validation  | Zod                                 |
| State       | React Query + Zustand               |
| Charts      | Recharts                            |
| Deployment  | Vercel                              |

---

## 🚀 Quick Start

### 1. Clone and install

```bash
cd "project 1"
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Get from Neon (neon.tech) / Supabase / Render
DATABASE_URL="postgresql://USER:PASS@HOST:5432/stockmaster?sslmode=require"
DIRECT_URL="postgresql://USER:PASS@HOST:5432/stockmaster"

# Generate: openssl rand -base64 32
AUTH_SECRET="your-secret-here"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Set up database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations (creates tables)
npm run db:migrate

# OR push schema directly (no migration files)
npm run db:push

# Seed with demo data + users
npm run db:seed
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo credentials:**
- Admin: `admin@stockmaster.com` / `Admin@123`
- Employee: `employee@stockmaster.com` / `Employee@123`

---

## 🗄️ DBeaver Connection Guide

### Step 1 — Create connection

1. Open DBeaver → **Database** → **New Database Connection**
2. Select **PostgreSQL** → Click **Next**

### Step 2 — Connection settings

| Field    | Value                                        |
|----------|----------------------------------------------|
| Host     | Your PostgreSQL host (e.g., `ep-xxx.neon.tech`) |
| Port     | `5432`                                       |
| Database | `stockmaster`                                |
| Username | Your DB username                             |
| Password | Your DB password                             |

### Step 3 — SSL (required for Neon/Supabase)

- Click **SSL** tab
- Enable **Use SSL**
- Set **SSL Mode** to `require`

### Step 4 — Test & Connect

Click **Test Connection** → should show "Connected"

### Step 5 — Explore tables

After connecting, expand:
```
stockmaster
  └── Schemas
        └── public
              └── Tables
                    ├── users
                    ├── products
                    ├── product_sizes
                    ├── stock_movements
                    ├── activity_logs
                    ├── accounts
                    ├── sessions
                    └── verification_tokens
              └── Views
                    ├── v_product_inventory
                    ├── v_low_stock
                    └── v_stock_movements_detail
```

### Step 6 — Run SQL schema manually (alternative)

If you prefer to create tables manually instead of using Prisma:
1. In DBeaver: right-click your database → **SQL Editor** → **New SQL Script**
2. Paste the contents of `prisma/sql_schema.sql`
3. Execute (Ctrl+Enter / Cmd+Enter)

### Useful DBeaver queries

```sql
-- Check all products with inventory
SELECT * FROM v_product_inventory;

-- Check low stock items
SELECT * FROM v_low_stock;

-- Recent stock movements
SELECT * FROM v_stock_movements_detail LIMIT 50;

-- User activity
SELECT u.name, a.action, a.entity, a."createdAt"
FROM activity_logs a
LEFT JOIN users u ON u.id = a."userId"
ORDER BY a."createdAt" DESC
LIMIT 100;
```

---

## 🌐 Deployment Guide (Vercel + Neon)

### Step 1 — PostgreSQL on Neon (free tier)

1. Go to [neon.tech](https://neon.tech) → Create account
2. Create a new project → name it `stockmaster`
3. Copy the **Connection string** (both pooled and direct URLs)

### Step 2 — Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: stockmaster
# - Framework: Next.js
```

### Step 3 — Set environment variables in Vercel

In Vercel dashboard → Project → Settings → Environment Variables:

```
DATABASE_URL     = postgresql://...?sslmode=require  (pooled connection)
DIRECT_URL       = postgresql://...                   (direct connection for migrations)
AUTH_SECRET      = (run: openssl rand -base64 32)
AUTH_URL         = https://your-app.vercel.app
NEXTAUTH_URL     = https://your-app.vercel.app
NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
```

### Step 4 — Run migrations in production

```bash
# After setting env vars locally
DATABASE_URL="your-prod-url" npm run db:migrate:prod
DATABASE_URL="your-prod-url" npm run db:seed
```

### Step 5 — Redeploy

```bash
vercel --prod
```

---

## 📁 Project Structure

```
project-1/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Login page
│   │   └── register/page.tsx       # Register page
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard layout (auth guard)
│   │   ├── dashboard/page.tsx      # Stats dashboard
│   │   ├── products/               # Product management
│   │   ├── stock/                  # Stock movements + low stock
│   │   ├── users/                  # User management (admin)
│   │   └── logs/                   # Activity logs (admin)
│   ├── api/
│   │   ├── auth/                   # NextAuth + register endpoint
│   │   ├── products/               # CRUD + stats
│   │   ├── stock/                  # Movements + chart + low stock
│   │   ├── users/                  # User management
│   │   └── logs/                   # Audit log queries
│   ├── layout.tsx                  # Root layout
│   └── globals.css                 # Tailwind + CSS vars
│
├── components/
│   ├── ui/                         # Headless UI components (shadcn-style)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── badge.tsx
│   │   ├── toast.tsx
│   │   └── toaster.tsx
│   ├── dashboard/
│   │   ├── sidebar.tsx             # Navigation sidebar
│   │   └── dashboard-chart.tsx     # Stock movement chart
│   └── providers.tsx               # React Query + NextAuth providers
│
├── lib/
│   ├── db.ts                       # Prisma client singleton
│   ├── auth.ts                     # NextAuth configuration
│   ├── utils.ts                    # Helpers (cn, format, paginate)
│   ├── rate-limit.ts               # IP-based rate limiting
│   ├── activity-logger.ts          # Audit trail helper
│   └── validations/
│       ├── auth.ts                 # Zod schemas (login, register)
│       ├── product.ts              # Zod schemas (create, update)
│       └── stock.ts                # Zod schemas (movement)
│
├── modules/
│   ├── auth/auth.service.ts        # Registration logic
│   ├── products/products.service.ts # Product CRUD + stats (transactions)
│   ├── stock/stock.service.ts      # Stock movements (atomic transactions)
│   ├── users/users.service.ts      # User management
│   └── logs/logs.service.ts        # Activity log queries
│
├── prisma/
│   ├── schema.prisma               # Database schema
│   ├── sql_schema.sql              # Raw SQL for DBeaver
│   └── seed.ts                     # Demo data seeder
│
├── middleware.ts                   # Auth guard + rate limiting
├── types/next-auth.d.ts           # Type augmentation
├── vercel.json                     # Vercel deployment config
└── .env.example                    # Environment variable template
```

---

## 🔐 Security Features

| Feature               | Implementation                                    |
|-----------------------|---------------------------------------------------|
| Password hashing      | bcrypt (cost factor 12)                           |
| JWT sessions          | NextAuth v5, httpOnly cookies                     |
| Input validation      | Zod on all API routes                             |
| Rate limiting         | In-memory (per-IP, auth routes: 5 req/15min)      |
| RBAC                  | Admin / Employee enforced in middleware + API      |
| XSS protection        | React DOM escaping + CSP headers                  |
| SQL injection         | Prisma ORM (parameterized queries)                |
| Secure headers        | X-Frame-Options, X-Content-Type-Options, CSP      |
| Audit logging         | All mutations logged with IP, userId, old/new vals |

---

## ⚡ PostgreSQL Transactions

Atomic operations used in:

1. **Create product + sizes** — `prisma.$transaction` ensures both succeed or both roll back
2. **Stock movements** — quantity read + update + movement record in single transaction
3. **Stock validation** — insufficient stock throws before any mutation

---

## 📊 API Endpoints

| Method | Endpoint              | Auth    | Description              |
|--------|-----------------------|---------|--------------------------|
| POST   | /api/auth/register    | Public  | Register new user        |
| POST   | /api/auth/signin      | Public  | NextAuth sign in         |
| GET    | /api/products         | User    | List products (paginated)|
| POST   | /api/products         | Admin   | Create product (atomic)  |
| GET    | /api/products/:id     | User    | Get product detail       |
| PATCH  | /api/products/:id     | Admin   | Update product           |
| DELETE | /api/products/:id     | Admin   | Delete product           |
| GET    | /api/products/stats   | User    | Dashboard statistics     |
| GET    | /api/stock            | User    | List movements           |
| POST   | /api/stock            | User    | Record movement (atomic) |
| GET    | /api/stock/low        | User    | Low stock alerts         |
| GET    | /api/stock/chart      | User    | Chart data (30 days)     |
| GET    | /api/users            | Admin   | List users               |
| PATCH  | /api/users/:id        | Admin   | Update user              |
| DELETE | /api/users/:id        | Admin   | Delete user              |
| GET    | /api/logs             | Admin   | Activity logs            |
