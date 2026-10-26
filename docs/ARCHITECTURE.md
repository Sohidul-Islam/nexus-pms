# System Architecture & Technical Specifications

This document defines the high-level architecture, module boundaries, data flows, and design patterns implemented in **Nexus PMS**.

---

## 1. Architectural Philosophy

Nexus PMS follows a **Pragmatic Reactive Architecture** designed to balance development speed, type safety, testability, and extreme runtime performance.

### Architectural Principles
1. **Unidirectional Data Flow**: Data flows down via Signals and pure inputs; actions flow up via explicit service methods and events.
2. **Push-Based Reactivity**: 100% of presentation components run on `ChangeDetectionStrategy.OnPush`. Angular change detection executes only when an input reference changes, a template signal updates, or an event listener fires.
3. **Decoupled Business Logic**: Components remain lean view coordinators; all state, HTTP calls, caching, and domain logic reside inside injectable singleton services.
4. **Resilient Persistence**: Backend persistence uses `@libsql/client` with dual-mode operational capability: zero-network local file in development and distributed LibSQL cloud in serverless production.

---

## 2. High-Level System Architecture

```
+------------------------------------------------------------------------------------+
|                                BROWSER CLIENT                                      |
|                                                                                    |
|   +----------------------------------------------------------------------------+   |
|   |                      Angular 19 Standalone Client                          |   |
|   |                                                                            |   |
|   |  Features (Lazy Loaded)          Core Layer               Shared Layer     |   |
|   |  - Dashboard                     - AuthService            - IconComponent  |   |
|   |  - Projects                      - ProjectService         - ModalComponent |   |
|   |  - Tasks (Kanban)                - TaskService            - StatCard       |   |
|   |  - Analytics                     - RealtimeService (SSE)  - Custom Pipes   |   |
|   |  - Organizations                 - ThemeService           - Directives     |   |
|   +---------------------------------------+------------------------------------+   |
+-------------------------------------------|----------------------------------------+
                                            |
                         HTTPS (REST JSON)  |  Server-Sent Events (SSE)
                                            |
+-------------------------------------------|----------------------------------------+
|                                  BACKEND                                           |
|                                                                                    |
|   +---------------------------------------v------------------------------------+   |
|   |                         Node.js + Express API                              |   |
|   |                                                                            |   |
|   |  Middleware Layer:                                                         |   |
|   |  - JWT Authentication Guard (authenticate)                                 |   |
|   |  - Role-Based Access Control (requireRole: ADMIN, PM, DEV, VIEWER)         |   |
|   |  - Centralized Error Handler                                               |   |
|   |                                                                            |   |
|   |  Domain Routers:                                                           |   |
|   |  - /api/auth             - /api/projects        - /api/notifications       |   |
|   |  - /api/tasks            - /api/organizations   - /api/analytics           |   |
|   |  - /api/comments         - /api/activities      - /api/realtime/stream     |   |
|   +---------------------------------------+------------------------------------+   |
|                                           |                                        |
|                                           v                                        |
|   +----------------------------------------------------------------------------+   |
|   |                  Database Layer (@libsql/client)                           |   |
|   |  - Development: file:./data/nexus.db (Persistent local SQLite file)        |   |
|   |  - Production:  libsql://nexus.turso.io (Distributed cloud LibSQL)        |   |
|   +----------------------------------------------------------------------------+   |
+------------------------------------------------------------------------------------+
```

---

## 3. Directory Layout & Module Responsibilities

### Frontend (`frontend/src/app`)
- **`core/`**: Singleton domain services (`AuthService`, `ProjectService`, `TaskService`, `RealtimeService`, `ThemeService`, `ToastService`), HTTP interceptors, functional guards, and typed models.
- **`shared/`**: Reusable presentational components (`IconComponent`, `ModalComponent`, `StatCardComponent`, `NavbarComponent`, `SidebarComponent`), structural directives (`hasRole`), and pure pipes (`TimeAgoPipe`, `PriorityBadgePipe`, `StatusBadgePipe`).
- **`features/`**: Feature-oriented lazy-loaded standalone components (`dashboard`, `projects`, `tasks`, `analytics`, `organizations`, `settings`, `auth`).

### Backend (`backend/src`)
- **`config/`**: Environment variables, ports, secrets, DB connection URLs.
- **`db/`**: SQLite connection client, migration engine, comprehensive seed data.
- **`middleware/`**: Authentication, role-based authorization, centralized error handling.
- **`realtime/`**: EventBroadcaster hub managing SSE client streams.
- **`routes/`**: Domain routers (auth, org, project, task, comment, activity, analytics, realtime).
- **`index.ts`**: Server bootstrap and Express application configuration.

---

## 4. Key Architectural Decisions (ADR)

### ADR 1: Angular Signals for State Management
- **Decision**: Adopt native Angular Signals (`signal`, `computed`, `effect`) within singleton services instead of heavy external stores (like NgRx).
- **Rationale**: Built directly into Angular's change detection engine; avoids unnecessary boilerplate while providing fine-grained reactivity and glitch-free computed state.

### ADR 2: Hybrid SQLite & LibSQL Persistence
- **Decision**: Use `@libsql/client` instead of standard native `sqlite3`.
- **Rationale**: Enables zero-configuration local flat-file storage during development, while seamlessly scaling to Turso's serverless cloud SQLite for Vercel production deployments without code changes.

### ADR 3: Server-Sent Events (SSE) for Real-Time Telemetry
- **Decision**: Implement real-time synchronization using unidirectional HTTP Server-Sent Events (SSE) rather than bidirectional WebSockets.
- **Rationale**: Native browser auto-reconnect, zero custom handshake overhead, traverses corporate HTTP/2 proxies cleanly, and fits the publish-subscribe telemetry profile of project activity updates.
