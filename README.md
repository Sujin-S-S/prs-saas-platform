# PRS - Multi-Tenant E-Commerce SaaS Platform

PRS is a production-ready, multi-tenant e-commerce SaaS platform. It consists of a Node.js Express & TypeScript REST API backend using Prisma ORM with PostgreSQL database, and three Angular frontend applications hosted in an Nx Monorepo workspace.

---

## Technical Stack

### Backend
- **Node.js** with **Express.js** and **TypeScript**
- **Prisma ORM** for PostgreSQL database interaction
- **JWT + Refresh Token Authentication** with Role-Based Access Control (RBAC)
- **Zod** for schema validations
- **Rate Limiting** via `rate-limiter-flexible`
- **Global Error Handling** and Request Logging

### Frontend (Nx Monorepo)
- **Angular (v21)** with **Signals** and **Angular Material**
- **Reactive Forms** and **RxJS**
- **Lazy-Loaded Modules** for optimized loading times
- **Shared Libraries**:
  - `libs/ui`: Reusable Material UI components (Data Table, Spinner Loader, Confirmation Dialog, drag-and-drop File Upload).
  - `libs/auth`: Signals-based Session state, Route guards, and JWT + Tenant HTTP Interceptors.
  - `libs/shared`: Common TypeScript interfaces and SnackBar Notification Service.
  - `libs/api-client`: Client services mapping backend REST API routes.

---

## Directory Structure

```text
Project PRS/
├── backend/
│   ├── prisma/                  # Prisma Database schema and seeder
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/              # Prisma DB instance configuration
│   │   ├── controllers/         # REST controller handlers (Zod validation, audit logging)
│   │   ├── middleware/          # JWT auth, rate limiter, custom tenant resolver
│   │   ├── routes/              # Express API route registrations
│   │   ├── types/               # Type declarations (Express Request extensions)
│   │   ├── utils/               # Audit logger helpers
│   │   ├── app.ts               # Express application config
│   │   └── server.ts            # Server bootstrap
│   ├── Dockerfile               # Multi-stage production build
│   └── package.json
│
├── frontend/
│   ├── apps/
│   │   ├── store/               # Customer storefront portal
│   │   ├── admin/               # Merchant dashboard portal
│   │   └── super-admin/         # Platform administration portal
│   ├── libs/
│   │   ├── ui/                  # Reusable components (Tables, Loaders, Dialogs, Uploads)
│   │   ├── auth/                # JWT Interceptors, Route Guards, Login state
│   │   ├── shared/              # Central Typescript Models & Notifications
│   │   └── api-client/          # HTTP Client services for all endpoints
│   ├── nx.json                  # Nx workspace configuration
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml            # GitHub Actions Build & Test Pipeline
│
├── docker-compose.yml           # Local database & API container orchestration
└── README.md
```

---

## Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- **Node.js** (v20 or higher)
- **npm** (v10 or higher)
- **Docker & Docker Compose** (for running database)

---

### Database Setup & Seeding

1. **Start the database**:
   Run the following command at the root of the project to spin up the PostgreSQL database container:
   ```bash
   docker-compose up -d postgres
   ```

2. **Configure environment**:
   Create a `.env` file in the `/backend` folder. A default configuration is provided:
   ```env
   PORT=3000
   NODE_ENV=development
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/prs_saas?schema=public"
   JWT_SECRET="super_secret_jwt_sign_key_prs_saas"
   ```

3. **Run database migrations**:
   Run the following command inside `/backend` to create the schema and update the database structure:
   ```bash
   cd backend
   npm run prisma:migrate
   ```

4. **Seed the database**:
   Prisma will automatically run the seeder script after migrations are initialized, or you can run:
   ```bash
   npx prisma db seed
   ```
   This populates:
   - **Super Admin**: Account `superadmin@prs.com` (password: `admin123`)
   - **Tenant A (A-Mart Electronics)**: Admin `admin@a-mart.com` (password: `admin123`), products, custom categories, coupon `SAVE10` and sample orders.
   - **Tenant B (B-Boutique Home)**: Admin `admin@b-boutique.com` (password: `admin123`), home appliances, category, and customer checkouts.

---

### Running the API Backend

Start the API backend in development mode with hot-reloading:
```bash
cd backend
npm run dev
```
The server will boot on `http://localhost:3000`. You can inspect the health check endpoint at `http://localhost:3000/health`.

---

### Running the Frontend Portals

Ensure dependencies are installed and boot any of the portals inside the `/frontend` directory:

1. **Install workspace dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start Store Frontend** (Customer portal):
   ```bash
   npx nx serve store
   ```
   Open `http://localhost:4200` in your browser.

3. **Start Merchant Admin Portal**:
   ```bash
   npx nx serve admin
   ```

4. **Start Super Admin Portal**:
   ```bash
   npx nx serve super-admin
   ```

---

## Multi-Tenant Data Isolation Strategy

1. **Discriminator Key**:
   Every tenant-specific entity has a `tenantId` property. Users, Categories, Products, ProductVariants, ProductImages, Customers, Orders, OrderItems, Payments, and Coupons are isolated on database query levels.
2. **Tenant Resolving Middleware**:
   The backend extracts `tenantId` context from request payloads:
   - Public requests parse the subdomain or `X-Tenant-Id` header.
   - Authenticated operations decode the `tenantId` claim directly from user JWT tokens.
3. **Database Scoping**:
   Prisma queries are appended with explicit tenant scopes:
   ```typescript
   const products = await prisma.product.findMany({
     where: { tenantId: req.tenantId }
   });
   ```
   This guarantees that merchants and storefront visitors from one tenant can never access or modify data belonging to another tenant.
