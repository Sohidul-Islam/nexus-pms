# Nexus PMS ? Modern Full-Stack Project Management System

[![Angular 19](https://img.shields.io/badge/Angular-19.2-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![SQLite / LibSQL](https://img.shields.io/badge/SQLite-LibSQL-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://turso.tech)
[![Vercel Ready](https://img.shields.io/badge/Vercel-Deployment%20Ready-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

**Nexus PMS** is an enterprise-grade, portfolio-ready Project Management and Real-Time Telemetry System. Engineered for international engineering and maritime logistics operations (modeled after **Kobkiat Global**), it demonstrates real-world software engineering practices and serves as a premier showcase of **modern Angular 19+ architecture** paired with a robust **Node.js + SQLite/LibSQL** backend.

---

## ?? Key Highlights & Engineering Features

### 1. Modern Angular 19 Architecture
- **100% Standalone Components**: Built without legacy NgModules.
- **Native Reactive Signals**: Full adoption of `signal()`, `computed()`, `effect()`, `input()`, and `output()`.
- **Pure `OnPush` Change Detection**: Zero zone-overload, blistering rendering speeds.
- **Angular 19 Modern Control Flow**: Clean, declarative `@if`, `@else`, `@for ... track`, and `@switch`.
- **Reactive Forms with Custom Validators**: Robust client-side validation with real-time error reflection.
- **Custom SCSS Design System**: Sleek Light and Dark themes, custom scrollbars, and fluid glassmorphism without heavy third-party CSS libraries.

### 2. Real-World Business Modules
- **Authentication & RBAC**: JWT authorization with four distinct permission tiers (`ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`, `VIEWER`).
- **Interactive Kanban Board**: HTML5 Drag & Drop with **Optimistic UI updates** and automatic rollback on network failure.
- **Multi-Tenant Organizations**: Manage team members, invite colleagues, and elevate roles.
- **Threaded Discussions & Comments**: Live task discussions with relative timestamps.
- **Real-Time Telemetry & SSE**: Persistent Server-Sent Events (SSE) broadcasting task updates, activity events, and instant toast notifications across connected clients.
- **Executive Analytics**: Dynamic SVG status doughnuts, velocity meters, and team workload bar charts.

### 3. Production Persistence: Local SQLite & Vercel Cloud Compatibility
- Employs `@libsql/client` for a unified database API:
  - **Local Development**: Instant zero-network file persistence (`file:./data/nexus.db`).
  - **Vercel Serverless Production**: Seamlessly connects to distributed cloud LibSQL/Turso databases without changing backend logic.

---

## ?? Quick Start Guide

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (verified on Node `v20.19.4`)
- **npm**: `v10.x` or higher

### 1. Installation
Clone the repository and install root, backend, and frontend dependencies:
```bash
git clone https://github.com/your-username/nexus-pms.git
cd nexus-pms

# Install all dependencies
npm install
npm install --prefix backend
npm install --prefix frontend
```

### 2. Seed Database
Initialize SQLite schema and populate sample organizations, projects, tasks, and users:
```bash
npm run seed
```

### 3. Launch Development Servers
Run both backend Express API and Angular frontend concurrently:
```bash
npm run dev:all
```

- **Frontend Application**: [http://localhost:4200](http://localhost:4200)
- **Backend API**: [http://localhost:3000](http://localhost:3000)

---

## ?? Demo Login Accounts

The application includes four pre-seeded user accounts to test different role permissions. The login page also features **One-Click Quick Login** buttons:

| Role | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@nexus.io` | `Password123!` | Full control: delete projects, manage team roles, edit all tasks |
| **Project Manager** | `pm@nexus.io` | `Password123!` | Create & edit projects, assign tasks, delete tasks, review work |
| **Senior Developer** | `dev@nexus.io` | `Password123!` | Move Kanban cards, update progress, post comments |
| **Executive Viewer** | `viewer@nexus.io` | `Password123!` | Read-only dashboards, velocity charts, and activity feeds |

---

## ?? Automated Testing & Production Builds

### Run Backend Integration Tests
Execute the comprehensive 16-test suite covering authentication, RBAC authorization, CRUD lifecycles, and analytics:
```bash
npm run test
# Or: npm run test --prefix backend
```

```
? Health check returns 200 OK
? POST /api/auth/login succeeds with valid credentials
? POST /api/auth/login rejects invalid credentials
? GET /api/auth/me returns authenticated user
? Enforces RBAC: VIEWER cannot create project (403 Forbidden)
? ADMIN can create a new project (201 Created)
? GET /api/projects returns seeded project list
? DEVELOPER can create a task
? PATCH /api/tasks/:id/status updates Kanban status
? POST /api/tasks/:id/comments adds threaded comment
? GET /api/analytics/overview returns aggregated metrics
...
? tests 16
? pass 16
? fail 0
```

### Build Production Bundles
```bash
npm run build
```
- **Backend**: Compiles TypeScript to `backend/dist/`.
- **Frontend**: Compiles optimized Angular 19 bundles to `dist/frontend/browser/` (~326 kB total with 14 lazy chunks).

---

## ?? Project Architecture

```
nexus-pms/
??? .agents/                        # Antigravity Workspace Customizations
?   ??? rules/
?   ?   ??? angular-standards.md   # Modern Angular coding guidelines
?   ??? workflows/
?       ??? run-fullstack.md       # Full-stack dev runner workflow
??? api/                            # Vercel Serverless Function Handler
?   ??? index.ts
??? backend/                        # Node.js + Express + TypeScript Backend
?   ??? src/
?   ?   ??? config/                # Environment configuration
?   ?   ??? db/                    # @libsql client, SQLite schema & seed
?   ?   ??? middleware/            # JWT auth, RBAC guards, error handler
?   ?   ??? realtime/              # Server-Sent Events (SSE) broadcaster
?   ?   ??? routes/                # Auth, Org, Project, Task, Comments, Analytics
?   ?   ??? index.ts               # Express bootstrap & HTTP server
?   ??? tests/
?   ?   ??? api.test.ts            # Automated API integration tests
?   ??? package.json
??? frontend/                       # Angular 19 Standalone Client
?   ??? src/
?   ?   ??? app/
?   ?   ?   ??? core/              # Models, Services, Interceptors, Guards
?   ?   ?   ??? features/          # Auth, Dashboard, Projects, Tasks, Analytics, Org
?   ?   ?   ??? shared/            # Directives, Pipes, Modals, Navbar, Sidebar
?   ?   ?   ??? app.config.ts      # Application config & providers
?   ?   ?   ??? app.routes.ts      # Functional lazy routing table
?   ?   ??? styles.scss            # Design system, CSS variables & themes
?   ?   ??? index.html
?   ??? angular.json
??? docs/                           # Comprehensive Engineering Documentation
?   ??? PROJECT_GUIDELINES.md      # Standards, naming & architecture rules
?   ??? ARCHITECTURE.md            # Structural layout, data flow & decisions
?   ??? ANGULAR_LEARNING_GUIDE.md  # Angular concepts from beginner to advanced
?   ??? MODULES.md                 # Module workflows, responsibilities & APIs
?   ??? STATE_MANAGEMENT.md        # Signals, RxJS, store patterns & optimistics
?   ??? DATABASE.md                # Schema, ERD, indexes, migrations & persistence
?   ??? API.md                     # Complete REST & SSE API specification
?   ??? USE_CASES.md               # User stories, workflows & permissions matrix
?   ??? SETUP_AND_DEPLOYMENT.md    # Local setup, environment vars & Vercel deploy
??? vercel.json                     # Vercel deployment configuration
??? package.json                    # Root workspace orchestration scripts
??? README.md                       # This document
```

---

## ?? Comprehensive Documentation Index

Explore the detailed architecture and educational guides in the `docs/` folder:

1. [**Project Guidelines**](file:///docs/PROJECT_GUIDELINES.md) ? Coding conventions, Git guidelines, and development rules.
2. [**System Architecture**](file:///docs/ARCHITECTURE.md) ? Architectural decisions, multi-tenant design, and security layers.
3. [**Angular Learning Guide**](file:///docs/ANGULAR_LEARNING_GUIDE.md) ? Step-by-step masterclass on modern Angular (Signals, RxJS, OnPush, Control Flow).
4. [**Functional Modules**](file:///docs/MODULES.md) ? Detailed breakdown of every feature module in the system.
5. [**State Management**](file:///docs/STATE_MANAGEMENT.md) ? In-depth guide to Signals, RxJS, optimistic updates, and rollbacks.
6. [**Database & Persistence**](file:///docs/DATABASE.md) ? Relational schema, ERD, indexing, and Vercel SQLite compatibility.
7. [**API Specification**](file:///docs/API.md) ? Exhaustive REST endpoints, schemas, authentication, and SSE contracts.
8. [**Real-World Use Cases**](file:///docs/USE_CASES.md) ? User personas, workflows, and role-based permissions matrix.
9. [**Setup & Deployment**](file:///docs/SETUP_AND_DEPLOYMENT.md) ? Step-by-step guide for local setup and production Vercel deployment.

---

## ?? About Kobkiat Global Integration

This project was built to address the real-world operational challenges of **Kobkiat Global Co., Ltd.** (Uttara, Dhaka):
- Managing distributed cargo logistics, vessel tracking initiatives, and telemetry streaming.
- Providing seamless real-time coordination between frontend web clients and backend telemetry APIs.
- Fostering an international team standard with strict TypeScript typing, responsive UI/UX, and comprehensive engineering documentation.

---

## ?? License
This project is open-source under the [MIT License](LICENSE).
