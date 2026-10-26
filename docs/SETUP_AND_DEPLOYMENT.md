# Setup, Configuration, and Vercel Deployment

This guide covers the prerequisites, local installation, environment variables, database migrations, testing, and production deployment of **Nexus PMS** to **Vercel**.

---

## 1. Prerequisites

Ensure your development environment meets the following minimum requirements:
- **Node.js**: `v20.x` or `v22.x` (verified on Node `v20.19.4`)
- **Package Manager**: `npm` `v10.x` or higher
- **Git**: Installed and configured
- **Operating System**: macOS, Linux, or Windows (WSL2 / PowerShell)

---

## 2. Local Development Setup

### Step 1: Install Dependencies
From the repository root, install dependencies for the root orchestrator, backend, and frontend:
```bash
# Root dependencies
npm install

# Backend dependencies
cd backend && npm install && cd ..

# Frontend dependencies
cd frontend && npm install && cd ..
```

### Step 2: Configure Environment Variables
Create a `.env` file in the `backend/` directory:
```bash
# backend/.env
PORT=3000
NODE_ENV=development
JWT_SECRET=super-secret-jwt-token-nexus-pms-2026-production-grade
DATABASE_URL=file:./data/nexus.db
CLIENT_URL=http://localhost:4200
```

> **Note**: In development mode, `DATABASE_URL=file:./data/nexus.db` instructs `@libsql/client` to maintain a local SQLite file in `backend/data/nexus.db`. The application automatically creates this directory on startup if it does not exist.

### Step 3: Seed the Database
Populate the local SQLite database with demo organizations, users, projects, tasks, and audit logs:
```bash
npm run seed
# Or directly: npm run seed --prefix backend
```

Output:
```
[Seed] Initializing SQLite database schema...
[Seed] Database schema ready.
[Seed] Seeding sample users, organizations, projects, and tasks...
[Seed] Seeding completed successfully!
```

### Step 4: Run the Full-Stack Application
Start both the backend Express API and the Angular development server simultaneously using the root orchestrator script:
```bash
npm run dev:all
```

- **Backend API**: Running at `http://localhost:3000`
- **Frontend App**: Running at `http://localhost:4200`

### Step 5: Demo Login Accounts
You can log in immediately using any of the pre-configured accounts:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@nexus.io` | `Password123!` | Full system administration, member management, project deletion |
| **Project Manager** | `pm@nexus.io` | `Password123!` | Create/edit projects, create/manage tasks, review work |
| **Developer** | `dev@nexus.io` | `Password123!` | Move Kanban cards, update status, submit task comments |
| **Viewer** | `viewer@nexus.io` | `Password123!` | Read-only access to dashboards, boards, and analytics |

*(The login screen also includes convenient **One-Click Demo Login** buttons for instant testing).*

---

## 3. Running Automated Tests

Run the backend integration test suite:
```bash
npm run test
# Or: npm run test --prefix backend
```

This executes 16 end-to-end integration tests using Node's native test runner against an isolated SQLite test database:
- Health check endpoint verification
- Authentication tokens & credential validation
- Role-based authorization enforcement (RBAC 403 checks)
- Project lifecycle operations (CRUD)
- Kanban task status transitions & audit activity logging
- Threaded discussions & comment creation
- Multi-dimensional analytics aggregation

---

## 4. Building for Production

Compile both the TypeScript backend and the Angular standalone frontend:
```bash
npm run build
```

- **Backend**: Emits compiled JavaScript to `backend/dist/`.
- **Frontend**: Emits optimized static assets with differential chunking to `dist/frontend/browser/` (typically under 350 kB total bundle size).

---

## 5. Deploying to Vercel

### Architecture for Vercel
Vercel is a serverless platform where filesystem storage is ephemeral. Nexus PMS is architected with dual-mode storage to achieve 100% compatibility with Vercel:
1. **Frontend**: Served as static assets via Vercel's Edge CDN.
2. **Backend**: Express API runs inside a Vercel Serverless Function via `api/index.ts`.
3. **Database**: `@libsql/client` connects seamlessly to a persistent cloud database (such as **Turso** or any LibSQL-compatible serverless cluster) using `DATABASE_URL` and `DATABASE_AUTH_TOKEN`.

### Step 1: Provision a Cloud LibSQL Database (Turso)
1. Install the Turso CLI or log in at [turso.tech](https://turso.tech):
   ```bash
   turso auth signup
   ```
2. Create a new database:
   ```bash
   turso db create nexus-pms
   ```
3. Retrieve your database URL and authentication token:
   ```bash
   turso db show nexus-pms --url
   # Output: libsql://nexus-pms-<username>.turso.io

   turso db tokens create nexus-pms
   # Output: eyJhbGciOi... (JWT token)
   ```
4. Run schema migration on Turso:
   ```bash
   DATABASE_URL="libsql://nexus-pms-<username>.turso.io" DATABASE_AUTH_TOKEN="your-token" npm run seed --prefix backend
   ```

### Step 2: Configure `vercel.json`
The repository includes a pre-configured `vercel.json` in the root:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/frontend/browser"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "api/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "dist/frontend/browser/$1"
    }
  ]
}
```

### Step 3: Deploy via Vercel CLI
```bash
# Install Vercel CLI if not already present
npm install -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Step 4: Set Environment Variables in Vercel Dashboard
In your Vercel Project Settings under **Environment Variables**, add:
- `JWT_SECRET`: A secure 64-character random string.
- `DATABASE_URL`: Your cloud LibSQL URL (e.g., `libsql://nexus-pms-<user>.turso.io`).
- `DATABASE_AUTH_TOKEN`: Your Turso access token.
- `NODE_ENV`: `production`.

---

## 6. Troubleshooting & FAQs

### Q: Why not use a local SQLite file directly on Vercel?
**A**: Vercel functions run in read-only or ephemeral micro-containers. Any changes written to a local `.db` file are discarded when the container spins down. Using `@libsql/client` allows zero-friction local development with a local file while supporting global cloud persistence in production with identical SQL syntax.

### Q: How do I handle CORS errors in development?
**A**: The backend Express server configures CORS to accept `CLIENT_URL` (defaulting to `http://localhost:4200`). If hosting the frontend on a custom domain, update `CLIENT_URL` in the backend environment variables.

### Q: What if Angular build complains about budget limits?
**A**: In `frontend/angular.json`, component style budgets are calibrated for modern CSS/SCSS design systems (warning at 12kB, error at 20kB). The entire production build generates ~326 kB total bundle size with lazy routing across 14 chunks.
