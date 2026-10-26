# Nexus PMS - Enterprise Agile Project Management & Real-Time Telemetry

[![Angular 19](https://img.shields.io/badge/Angular-19.2-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![SQLite / LibSQL](https://img.shields.io/badge/SQLite-LibSQL-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://turso.tech)
[![Vercel Ready](https://img.shields.io/badge/Vercel-Deployment%20Ready-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Nexus PMS** is an enterprise-grade, portfolio-ready Project Management and Real-Time Telemetry System. Engineered for distributed engineering, maritime logistics, and high-velocity product teams (modeled after **Kobkiat Global Co., Ltd.**), it demonstrates real-world software engineering practices while serving as a comprehensive educational showcase for modern **Angular 19+ standalone architecture** paired with a **Node.js + SQLite/LibSQL** backend.

---

## Table of Contents

- [Key Highlights & Features](#key-highlights--features)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Step-by-Step Installation & Local Setup](#step-by-step-installation--local-setup)
- [Running the Application](#running-the-application)
- [Pre-configured Demo Accounts](#pre-configured-demo-accounts)
- [Automated Testing & Production Builds](#automated-testing--production-builds)
- [Complete Vercel Deployment Guide](#complete-vercel-deployment-guide)
- [Project Directory Structure](#project-directory-structure)
- [Comprehensive Documentation Index](#comprehensive-documentation-index)
- [Troubleshooting & FAQs](#troubleshooting--faqs)

---

## Key Highlights & Features

### 1. Modern Angular 19 Architecture
- **100% Standalone Components**: Fully modular without legacy NgModules.
- **Native Reactive Signals**: Full adoption of `signal()`, `computed()`, `effect()`, `input()`, and `output()`.
- **Pure OnPush Change Detection**: Zero zone-overload, instantaneous fine-grained DOM updates.
- **Modern Control Flow**: Declarative `@if`, `@else`, `@for ... track`, and `@switch`.
- **Reactive Forms with Validation**: Strict client-side validation with real-time feedback.
- **Bespoke SCSS Design System**: Dark and Light theme switching via CSS custom properties, responsive navigation, custom scrollbars, and dedicated vector SVG icons (`app-icon`).

### 2. Real-World Business Modules
- **Authentication & Role-Based Access Control (RBAC)**: JWT authorization with 4 distinct permission roles (`ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`, `VIEWER`).
- **Interactive Kanban Board**: HTML5 Drag & Drop with **Optimistic UI updates** and automated rollback safeguards on network interruption.
- **Multi-Tenant Organizations**: Manage team members, invite colleagues, and elevate permissions dynamically.
- **Threaded Discussions**: Live task comments with relative timestamp formatting (`TimeAgoPipe`).
- **Real-Time Telemetry via Server-Sent Events (SSE)**: Persistent live stream (`/api/realtime/stream`) broadcasting task status changes, activity audits, and alert notifications without polling.
- **Executive Analytics**: Dynamic SVG status doughnut charts, velocity meters, and team member workload distribution.

### 3. Dual-Mode SQLite & Cloud Persistence
- Powered by `@libsql/client`:
  - **Local Development**: Fast, zero-network file persistence (`file:./data/nexus.db`).
  - **Vercel Serverless Production**: Seamlessly connects to distributed cloud LibSQL/Turso databases without changing backend logic.

---

## System Architecture

Nexus PMS employs a **Modular Monolith within a Full-Stack Monorepo**, deployed as a **Decoupled Serverless / Jamstack Application**:

```
+-----------------------------------------------------------------------+
|                         NEXUS PMS WORKSPACE                           |
|                      (npm Monorepo Workspace)                         |
+-----------------------------------+-----------------------------------+
|             FRONTEND              |              BACKEND              |
|   Feature-Sliced Reactive SPA     |          Modular Monolith         |
|          (Angular 19)             |   (Node.js + Express + TypeScript)|
|                                   |                                   |
| - core/ (Auth, Signals, Guards)   | - auth/ (JWT, bcrypt, RBAC)       |
| - shared/ (SVG Icons, Modals)     | - projects/ (CRUD, Metrics)       |
| - features/                       | - tasks/ (Kanban, Transitions)    |
|   * dashboard                     | - organizations/ (Roster, Roles)  |
|   * projects                      | - activities/ (Audit Log)         |
|   * tasks (Kanban Board)          | - realtime/ (SSE Broadcaster)     |
|   * analytics                     | - db/ (@libsql SQLite / Turso)    |
|   * organizations                 |                                   |
+-----------------------------------+-----------------------------------+
```

---

## Prerequisites

Before starting, ensure your system has:
- **Node.js**: `v20.x` or `v22.x` (verified on Node `v20.19.4` and `v18.19.1`)
- **npm**: `v10.x` or higher
- **Git**: Installed and configured
- **Operating System**: macOS, Linux, or Windows (WSL2 / PowerShell)

---

## Step-by-Step Installation & Local Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/Sohidul-Islam/nexus-pms.git
cd nexus-pms
```

### Step 2: Install Dependencies
The project uses npm workspaces to manage both frontend and backend dependencies cleanly from the root:
```bash
npm install
```

*(Alternatively, you can install each package individually:)*
```bash
npm install --prefix backend
npm install --prefix frontend
```

### Step 3: Configure Environment Variables
Create a `.env` file in the `backend/` directory. A sample template is provided at `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

Or manually create `backend/.env` with:
```ini
PORT=3001
JWT_SECRET=nexus-super-secret-jwt-key-2026-production
NODE_ENV=development
CORS_ORIGIN=*
DATABASE_URL=file:./data/nexus.db
```

> **Note on Port**: The backend defaults to port `3001` to prevent port collision with local Docker engines that frequently occupy port `3000`.

### Step 4: Seed the Database
Initialize the SQLite database schema and populate it with sample organizations, projects, Kanban tasks, and demo users:
```bash
npm run seed
```

Output:
```
[Database] Running schema migrations...
[Database] Migrations applied successfully.
[Seed] Seeding sample users, organizations, projects, and tasks...
[Seed] Seeding completed successfully!
```

---

## Running the Application

### Option A: Run Full Stack Concurrently (Recommended)
Launch both the Express backend API and the Angular frontend development server simultaneously:
```bash
npm run dev:all
```

- **Frontend Application**: [http://localhost:4200](http://localhost:4200)
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **API Health Check**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

### Option B: Run Services in Separate Terminals

**Terminal 1 (Backend API)**:
```bash
npm run dev:backend
# Starts Express server at http://localhost:3001 with hot reloading via tsx
```

**Terminal 2 (Frontend Client)**:
```bash
npm run dev:frontend
# Starts Angular CLI dev server at http://localhost:4200
```

---

## Pre-configured Demo Accounts

The login page at `http://localhost:4200` includes **One-Click Quick Login** buttons for instant role evaluation:

| Role | Email | Password | Permissions & Capabilities |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@nexus.io` | `Password123!` | Full access: delete projects, manage team roles, edit all tasks |
| **Project Manager** | `pm@nexus.io` | `Password123!` | Create & edit projects, assign tasks, delete tasks, review work |
| **Senior Developer** | `dev@nexus.io` | `Password123!` | Move Kanban cards, update progress, submit task comments |
| **Executive Viewer** | `viewer@nexus.io` | `Password123!` | Read-only access to dashboards, velocity charts, and activity feeds |

---

## Automated Testing & Production Builds

### Run Integration Tests
Execute the comprehensive 16-test suite covering authentication, RBAC authorization, CRUD lifecycles, and analytics:
```bash
npm run test
```

Test Output:
```
✔ Health check returns 200 OK
✔ POST /api/auth/login with valid credentials returns JWT and user
✔ POST /api/auth/login for developer returns JWT with TEAM_MEMBER role
✔ POST /api/auth/login for viewer returns JWT with VIEWER role
✔ POST /api/auth/login with wrong password returns 401
✔ GET /api/auth/me returns authenticated user details
✔ GET /api/organizations lists user organizations
✔ GET /api/projects returns seeded projects with progress metrics
✔ RBAC Security: VIEWER cannot create project (returns 403 Forbidden)
✔ ADMIN creates project successfully
✔ GET /api/tasks returns tasks and supports status filtering
✔ POST /api/tasks creates a new task with sequential numbering
✔ PATCH /api/tasks/:id/status updates task status and triggers activity
✔ POST and GET comments on task
✔ GET /api/analytics/overview calculates accurate status and priority distributions
✔ GET /api/notifications returns user notifications with unread count

Test Results: 16 Passed, 0 Failed
```

### Production Build
Compile both TypeScript backend and Angular 19 standalone frontend:
```bash
npm run build
```
- **Backend Output**: `backend/dist/` (compiled with `tsc`).
- **Frontend Output**: `frontend/dist/frontend/browser/` (emits 14 lazy chunks in ~3s, initial total bundle size: ~326 kB).

---

## Complete Vercel Deployment Guide

Nexus PMS is pre-configured with `vercel.json` and a serverless entrypoint at `api/index.ts`.

### How Vercel Deployment Works
1. **Frontend**: Served as high-performance static files directly from Vercel Edge CDN.
2. **Backend**: Express API runs in a serverless function via `api/index.ts` routing `/api/*`.
3. **Database**: `@libsql/client` connects to a persistent cloud LibSQL/Turso database.

### Step 1: Provision Cloud Database (Turso)
1. Install Turso CLI or sign up for free at [turso.tech](https://turso.tech):
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   turso auth signup
   ```
2. Create your cloud database:
   ```bash
   turso db create nexus-pms
   ```
3. Retrieve your database URL and authentication token:
   ```bash
   turso db show nexus-pms --url
   # Example: libsql://nexus-pms-username.turso.io

   turso db tokens create nexus-pms
   # Example: eyJhbGciOi... (JWT token)
   ```
4. Seed the cloud database:
   ```bash
   DATABASE_URL="libsql://nexus-pms-username.turso.io" DATABASE_AUTH_TOKEN="your-token" npm run seed --prefix backend
   ```

### Step 2: Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy preview
vercel

# Deploy to production
vercel --prod
```

### Step 3: Configure Environment Variables in Vercel
In your Vercel Project Dashboard under **Settings -> Environment Variables**, add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `libsql://nexus-pms-<user>.turso.io` | Cloud SQLite URL from Turso |
| `DATABASE_AUTH_TOKEN` | `<your-turso-jwt-token>` | Turso access token |
| `JWT_SECRET` | `<random-64-character-string>` | Secret key for signing JWT tokens |
| `NODE_ENV` | `production` | Environment mode |

---

## Project Directory Structure

```
nexus-pms/
|-- .agents/                        # Antigravity Workspace Customizations
|   |-- rules/
|   |   `-- angular-standards.md   # Angular 19+ standalone & Signals guidelines
|   `-- workflows/
|       `-- run-fullstack.md       # Fullstack runner workflow
|-- api/                            # Vercel Serverless Function Entry
|   `-- index.ts
|-- backend/                        # Node.js + Express + TypeScript Backend
|   |-- src/
|   |   |-- config/                # Environment configuration
|   |   |-- db/                    # @libsql client, SQLite schema & seed
|   |   |-- middleware/            # JWT auth, RBAC guards, error handling
|   |   |-- realtime/              # Server-Sent Events (SSE) broadcaster
|   |   |-- routes/                # Auth, Org, Project, Task, Comment, Analytics
|   |   `-- index.ts               # Express bootstrap & HTTP server
|   |-- tests/
|   |   `-- api.test.ts            # Automated API integration tests
|   `-- package.json
|-- frontend/                       # Angular 19 Standalone Client
|   |-- src/
|   |   |-- app/
|   |   |   |-- core/              # Models, Services, Interceptors, Guards
|   |   |   |-- features/          # Dashboard, Projects, Tasks, Analytics, Org, Settings
|   |   |   |-- shared/            # SVG Icons (app-icon), Modals, Pipes, Directives
|   |   |   |-- app.config.ts      # Application providers & HTTP client
|   |   |   `-- app.routes.ts      # Functional lazy routing table
|   |   |-- styles.scss            # Design system, CSS variables & themes
|   |   `-- index.html
|   `-- angular.json
|-- docs/                           # Comprehensive Engineering Documentation
|   |-- PROJECT_GUIDELINES.md      # Coding conventions, naming & architecture rules
|   |-- ARCHITECTURE.md            # Structural layout, data flow & security decisions
|   |-- ANGULAR_LEARNING_GUIDE.md  # Masterclass guide on modern Angular concepts
|   |-- MODULES.md                 # Module workflows, responsibilities & APIs
|   |-- STATE_MANAGEMENT.md        # Signals, RxJS, store patterns & optimistics
|   |-- DATABASE.md                # Schema, ERD, indexes, migrations & persistence
|   |-- API.md                     # Complete REST & SSE API specification
|   |-- USE_CASES.md               # User stories, workflows & permissions matrix
|   `-- SETUP_AND_DEPLOYMENT.md    # Local setup, environment vars & Vercel deploy
|-- vercel.json                     # Vercel deployment configuration
|-- package.json                    # Root workspace orchestration scripts
`-- README.md                       # This document
```

---

## Comprehensive Documentation Index

Explore the detailed architecture and educational guides in the `docs/` directory:

1. [**Project Guidelines**](docs/PROJECT_GUIDELINES.md) - Coding standards, strict typing rules, standalone component patterns, Git guidelines.
2. [**System Architecture**](docs/ARCHITECTURE.md) - Monorepo architecture, client-server data flow, security layers, design decisions.
3. [**Angular Learning Guide**](docs/ANGULAR_LEARNING_GUIDE.md) - Masterclass guide on Signals, RxJS, OnPush, and Modern Control Flow.
4. [**Functional Modules**](docs/MODULES.md) - Detailed breakdown of all 7 application modules, components, services, and routes.
5. [**State Management**](docs/STATE_MANAGEMENT.md) - Signal Store pattern, Signals vs RxJS vs NgRx decision matrix, optimistic updates, and rollbacks.
6. [**Database & Persistence**](docs/DATABASE.md) - Relational schema, ERD, indexing, and Vercel SQLite compatibility.
7. [**API Specification**](docs/API.md) - Exhaustive REST endpoints, schemas, authentication, and SSE contracts.
8. [**Real-World Use Cases**](docs/USE_CASES.md) - User personas, workflows, and role-based permissions matrix.
9. [**Setup & Deployment**](docs/SETUP_AND_DEPLOYMENT.md) - Step-by-step guide for local setup and production Vercel deployment.

---

## Troubleshooting & FAQs

### Q1: Why use port 3001 instead of 3000?
**A**: On many developer machines, Docker Desktop or existing local servers occupy port 3000. Nexus PMS defaults to port `3001` for backend API traffic to avoid port conflicts out of the box.

### Q2: Why does SQLite work on Vercel without data loss?
**A**: Standard SQLite writes to a flat local file that gets discarded when serverless micro-containers recycle. Nexus PMS uses `@libsql/client`, which writes to a local file in development, but connects to Turso (cloud LibSQL) in production with the exact same SQL queries.

### Q3: How do I handle CORS errors during development?
**A**: In `backend/.env`, `CORS_ORIGIN` defaults to `*` or `http://localhost:4200`. If hosting the frontend on a custom domain, update this variable in your backend configuration.

---

## License

This project is open-source under the [MIT License](LICENSE).
