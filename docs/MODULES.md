# Nexus PMS ? Module Specification & Documentation

This document specifies the purpose, responsibilities, workflows, components, services, and API interactions for each domain module in Nexus PMS.

---

## 1. Authentication & Role-Based Authorization Module

- **Purpose**: Authenticate enterprise users, issue stateless JWT tokens, enforce Role-Based Access Control (RBAC), and manage session persistence.
- **Roles Enforced**:
  - `ADMIN`: Full authority over projects, organizations, user roles, and deletion operations.
  - `PROJECT_MANAGER`: Create/edit projects, allocate team members, and oversee sprints.
  - `TEAM_MEMBER`: Create, advance, and comment on assigned tasks.
  - `VIEWER`: Read-only observer on dashboards, projects, and analytics.
- **Components**:
  - [`LoginComponent`](../frontend/src/app/features/auth/login.component.ts): Reactive authentication form with quick demo role switchers.
  - [`RegisterComponent`](../frontend/src/app/features/auth/register.component.ts): Account creation with department selection.
- **Services & Guards**:
  - [`AuthService`](../frontend/src/app/core/services/auth.service.ts): Signal state for `currentUser`, `token`, `isAuthenticated`, and `userRole`.
  - [`authGuard`](../frontend/src/app/core/auth/auth.guard.ts): Protects private workspace routes.
  - [`roleGuard`](../frontend/src/app/core/auth/role.guard.ts): Evaluates `route.data['roles']`.
  - [`authInterceptor`](../frontend/src/app/core/auth/auth.interceptor.ts): Injects Bearer tokens.
  - [`errorInterceptor`](../frontend/src/app/core/auth/error.interceptor.ts): Intercepts 401s and triggers graceful session re-authentication.
- **Backend Endpoints**:
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `GET /api/auth/me`
  - `PUT /api/auth/profile`
  - `GET /api/auth/users`

---

## 2. Organization & Multi-Tenancy Module

- **Purpose**: Enable multi-tenant organization workspaces, manage team rosters, assign department tags, and update access permissions.
- **Components**:
  - [`OrganizationComponent`](../frontend/src/app/features/organizations/organization.component.ts): Roster table, role selector, and invitation modal.
- **Backend Endpoints**:
  - `GET /api/organizations`: List organizations for current user.
  - `GET /api/organizations/:id`: Roster details with member roles.
  - `POST /api/organizations/:id/members`: Add user with role.
  - `PUT /api/organizations/:id/members/:userId`: Promote or demote member (Admin only).

---

## 3. Projects Portfolio Module

- **Purpose**: High-level initiative tracking, project charters, progress tracking, CapEx budget monitoring, and milestone planning.
- **Components**:
  - [`ProjectListComponent`](../frontend/src/app/features/projects/project-list.component.ts): Portfolio grid with debounced search and status filter.
  - [`ProjectDetailComponent`](../frontend/src/app/features/projects/project-detail.component.ts): In-depth charter, hours tracked vs estimated, and assigned engineers.
  - [`ProjectModalComponent`](../frontend/src/app/features/projects/project-modal.component.ts): Reactive project creation/editing modal.
- **Backend Endpoints**:
  - `GET /api/projects`: Query projects with optional `search`, `status`, `orgId`.
  - `GET /api/projects/:id`: Detailed charter and task status counts.
  - `POST /api/projects`: Create project (Admin / PM).
  - `PUT /api/projects/:id`: Update project.
  - `DELETE /api/projects/:id`: Delete project (Admin only).

---

## 4. Kanban Tasks & Collaboration Module

- **Purpose**: Interactive task execution with 4 workflow stages (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`), HTML5 drag-and-drop status moves, real-time live sync, and threaded comments.
- **Components**:
  - [`KanbanBoardComponent`](../frontend/src/app/features/tasks/kanban-board.component.ts): Drag & drop board with optimistic status updates.
  - [`TaskModalComponent`](../frontend/src/app/features/tasks/task-modal.component.ts): Full task editing and live comment submission.
- **Directives & Pipes**:
  - `[appPriorityHighlight]`: Color-coded left border indicating priority.
  - `| timeAgo`: Relative timestamp on comments and cards.
  - `| priorityBadge`: Formatted priority tags.
- **Backend Endpoints**:
  - `GET /api/tasks`: Filter tasks by `projectId`, `status`, `priority`, `assigneeId`.
  - `POST /api/tasks`: Create task with auto-incrementing `#number`.
  - `PATCH /api/tasks/:id/status`: Drag & drop status update, activity log, and notification dispatch.
  - `POST /api/tasks/:id/comments`: Add comment.
  - `GET /api/tasks/:id/comments`: List comments for task.

---

## 5. Executive Dashboard Module

- **Purpose**: Overview of project velocity, KPI metrics, task distribution meters, and recent activity audit logs.
- **Components**:
  - [`DashboardComponent`](../frontend/src/app/features/dashboard/dashboard.component.ts): OnPush change detection dashboard.
- **Key Metrics Displayed**:
  - Active Projects count.
  - Total Backlog items vs Completed items.
  - Current cycle velocity percentage.
  - Overdue items requiring immediate attention.

---

## 6. Analytics & Workload Module

- **Purpose**: Resource allocation, workload balancing, and priority distribution analysis.
- **Components**:
  - [`AnalyticsComponent`](../frontend/src/app/features/analytics/analytics.component.ts): Engineer workload matrix and SVG bar charts.
- **Backend Endpoints**:
  - `GET /api/analytics/overview`: Aggregated status distribution, priority distribution, and team workload.

---

## 7. Real-Time Telemetry & Notification Subsystem

- **Purpose**: Server-Sent Events (SSE) broadcasting task movements, new assignments, and comments to all active browser windows.
- **Services**:
  - [`RealtimeService`](../frontend/src/app/core/services/realtime.service.ts): EventSource client stream with auto-reconnection.
  - [`NotificationService`](../frontend/src/app/core/services/notification.service.ts): Live unread badge count and notification center.
- **Backend Endpoints**:
  - `GET /api/realtime/stream`: SSE text/event-stream connection with heartbeat.
  - `GET /api/notifications`: List user notifications.
  - `PATCH /api/notifications/:id/read`: Mark notification as read.
  - `POST /api/notifications/read-all`: Mark all as read.
