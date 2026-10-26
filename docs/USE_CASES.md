# Real-World Use Cases & User Workflows

This document outlines the real-world operational scenarios, user stories, role-based access control (RBAC) permissions matrix, and step-by-step user workflows supported by **Nexus PMS**.

---

## 1. Role-Based Permissions Matrix (RBAC)

Nexus PMS enforces four distinct roles across both the backend Express middleware (`requireRole`) and the frontend Angular UI (`hasRole` directive and route guards).

| Feature / Action | ADMIN | PROJECT_MANAGER | DEVELOPER | VIEWER |
| :--- | :---: | :---: | :---: | :---: |
| **View Dashboard & KPI Analytics** | ? | ? | ? | ? |
| **View Projects & Kanban Boards** | ? | ? | ? | ? |
| **Create / Edit Projects** | ? | ? | ? | ? |
| **Delete Projects** | ? | ? | ? | ? |
| **Create / Edit Tasks** | ? | ? | ? | ? |
| **Update Task Status (Drag & Drop)** | ? | ? | ? | ? |
| **Delete Tasks** | ? | ? | ? | ? |
| **Post Comments on Tasks** | ? | ? | ? | ? |
| **View Real-Time Audit Activities** | ? | ? | ? | ? |
| **Manage Team Members & Assign Roles** | ? | ? | ? | ? |
| **Update Personal Profile & Theme** | ? | ? | ? | ? |

---

## 2. Core User Scenarios

### Scenario 1: Sprint Setup & Project Creation
- **Actor**: Project Manager (`pm@nexus.io`) / Admin (`admin@nexus.io`)
- **Business Need**: Kobkiat Global is kicking off a new initiative: "Chittagong Port Terminal AIS Integration".
- **Workflow**:
  1. User navigates to **Projects** (`/projects`) and clicks **"New Project"**.
  2. Fills out project title, target completion date, priority level (`HIGH`), and initial scope.
  3. Form validates asynchronously; on submit, the project is created via `POST /api/projects`.
  4. The project list updates reactively via Angular Signals without needing a full-page refresh.
  5. The system records an activity event and notifies the team roster.

---

### Scenario 2: Daily Engineering Kanban & Status Progression
- **Actor**: Senior Developer (`dev@nexus.io`)
- **Business Need**: Pick up assigned tasks, move cards across the Kanban board, and log status updates.
- **Workflow**:
  1. Developer logs in and navigates to the **Tasks** board (`/tasks`).
  2. Uses the real-time search filter to locate their high-priority issue: *"Implement WebSocket Reconnection Backoff"*.
  3. Drags the card from the **TODO** column into the **IN_PROGRESS** column using HTML5 Drag and Drop.
  4. The frontend performs an **optimistic UI update**, immediately rendering the card in the new column.
  5. An asynchronous `PATCH /api/tasks/:id/status` request is sent with the updated status.
  6. The backend records a timestamped `STATUS_CHANGED` activity entry and broadcasts the event over SSE to all open tabs.
  7. If network connectivity fails, the card automatically rolls back to **TODO** and displays an error toast.

---

### Scenario 3: Task Discussion & Audit Logging
- **Actor**: Developer (`dev@nexus.io`) & Project Manager (`pm@nexus.io`)
- **Business Need**: Coordinate code review links and verify task completion criteria.
- **Workflow**:
  1. Developer clicks a task card to open the **Task Detail Modal**.
  2. Scrolls to the **Discussion & Activity** section.
  3. Enters a comment: *"Branch pushed to origin. Reconnection backoff tested with simulated 5-second network drop."*
  4. Submits the form; the comment is persisted to SQLite and instantly appended to the modal's comment list.
  5. The task modal's timeline updates, recording user avatar, name, and relative timestamp (`Just now`).

---

### Scenario 4: Real-Time Cross-Team Telemetry Synchronization
- **Actors**: Multiple concurrent team members (e.g., PM in Uttara and CTO in Singapore).
- **Business Need**: Ensure the team maintains a synchronized view of project health without manual refreshing.
- **Workflow**:
  1. User A in Singapore moves a critical task to **DONE**.
  2. Backend dispatches an SSE packet:
     ```json
     event: TASK_STATUS_UPDATED
     data: {"id": "tsk-102", "status": "DONE", "updatedAt": "2026-10-26T12:00:00Z"}
     ```
  3. User B in Uttara has `KanbanBoardComponent` open. Angular's `RealtimeService` receives the SSE payload.
  4. `TaskService` updates its internal `_tasks` signal.
  5. The OnPush change detection cycle cleanly animates the card into the **DONE** column on User B's monitor in real time.
  6. An unread notification ping appears in the top navigation bar.

---

### Scenario 5: Executive Overview & Resource Allocation
- **Actor**: Stakeholder / Viewer (`viewer@nexus.io`)
- **Business Need**: Inspect team workload, project completion velocity, and bottleneck risks without having write access.
- **Workflow**:
  1. Viewer logs in; the system assigns the read-only `VIEWER` permission role.
  2. Navigates to **Analytics** (`/analytics`).
  3. Interactive SVG charts render status breakdown (pie/doughnut) and team workload bar distribution.
  4. Views average completion velocity (e.g., 27.3% complete, 11 total issues).
  5. Because of the `*hasRole="['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER']"` directive, destructive buttons ("Create Task", "Delete Project", "Change Role") are cleanly omitted from the DOM, guaranteeing a zero-clutter, read-only experience.

---

### Scenario 6: Team Administration & Role Elevation
- **Actor**: Admin (`admin@nexus.io`)
- **Business Need**: Add a new developer to Kobkiat Global and elevate a member to Project Manager.
- **Workflow**:
  1. Admin navigates to **Organization** (`/organizations`).
  2. Views the active member roster table with joined dates, email addresses, and roles.
  3. Selects a member and changes their role from `DEVELOPER` to `PROJECT_MANAGER` using the inline role dropdown.
  4. Backend verifies Admin credentials via `requireRole('ADMIN')` and executes `PATCH /api/organizations/:id/members/:userId`.
  5. Toast confirmation displays: *"Member role updated successfully."*
