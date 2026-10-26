# REST API & Real-Time Specification

This document provides complete documentation for the **Nexus PMS** RESTful backend API and real-time Server-Sent Events (SSE) streaming protocol.

---

## 1. Global Conventions

### Base URL
- **Local Development**: `http://localhost:3000/api`
- **Vercel Serverless Production**: `https://<your-deployment>.vercel.app/api`

### Authentication Header
Protected endpoints require a JSON Web Token (JWT) in the `Authorization` header:
```http
Authorization: Bearer <jwt_access_token>
```

### Standard Response Envelope
All responses return a predictable JSON payload:

**Success Response (200 / 201)**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response (400 / 401 / 403 / 404 / 500)**:
```json
{
  "success": false,
  "error": "Human-readable error explanation",
  "details": [ ... ]
}
```

---

## 2. Authentication & Identity (`/api/auth`)

### 1. `POST /api/auth/login`
Authenticates a user and returns a signed JWT token along with user profile metadata.

- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "admin@nexus.io",
    "password": "Password123!"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
      "user": {
        "id": "usr-admin-1",
        "email": "admin@nexus.io",
        "firstName": "Alex",
        "lastName": "Vance",
        "role": "ADMIN",
        "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
      }
    }
  }
  ```

### 2. `POST /api/auth/register`
Creates a new user account with default `DEVELOPER` role.

- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "jane.doe@kobkiat.com",
    "password": "SecurePassword123!",
    "firstName": "Jane",
    "lastName": "Doe"
  }
  ```
- **Response (201 Created)**: Returns `{ success: true, data: { token, user } }`.

### 3. `GET /api/auth/me`
Fetches the currently authenticated user's session profile.

- **Access**: Authenticated (`ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`, `VIEWER`)
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**: Returns the user object.

---

## 3. Organizations & Multi-Tenancy (`/api/organizations`)

### 1. `GET /api/organizations`
Returns the organizations to which the authenticated user belongs.

- **Access**: Authenticated

### 2. `GET /api/organizations/:id/members`
Fetches all members enrolled in the given organization.

- **Access**: Authenticated
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "mem-1",
        "userId": "usr-admin-1",
        "firstName": "Alex",
        "lastName": "Vance",
        "email": "admin@nexus.io",
        "orgRole": "OWNER",
        "joinedAt": "2026-10-01T08:00:00Z"
      }
    ]
  }
  ```

### 3. `POST /api/organizations/:id/members`
Invites or adds a user to an organization.

- **Access**: `ADMIN` or `PROJECT_MANAGER`
- **Request Body**:
  ```json
  {
    "email": "new.member@nexus.io",
    "role": "MEMBER"
  }
  ```

### 4. `PATCH /api/organizations/:id/members/:userId`
Modifies a member's organizational role.

- **Access**: `ADMIN`

---

## 4. Projects (`/api/projects`)

### 1. `GET /api/projects`
Retrieves projects for the current organization with task count summaries and completion percentages.

- **Access**: Authenticated
- **Query Parameters**:
  - `status`: Filter by status (`ACTIVE`, `PLANNING`, `COMPLETED`, `ARCHIVED`)
  - `priority`: Filter by priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "proj-1",
        "name": "Kobkiat Cargo Vessel Tracking System",
        "description": "Vessel telemetry pipeline and AIS dashboard.",
        "status": "ACTIVE",
        "priority": "HIGH",
        "totalTasks": 4,
        "completedTasks": 1,
        "completionRate": 25,
        "createdAt": "2026-10-15T10:00:00Z"
      }
    ]
  }
  ```

### 2. `GET /api/projects/:id`
Retrieves a single project with full metadata.

- **Access**: Authenticated

### 3. `POST /api/projects`
Creates a new project.

- **Access**: `ADMIN`, `PROJECT_MANAGER`
- **Request Body**:
  ```json
  {
    "name": "Fleet Dispatch Automation",
    "description": "Automated route optimization engine",
    "priority": "HIGH",
    "startDate": "2026-11-01",
    "targetEndDate": "2027-02-15"
  }
  ```
- **Response (201 Created)**: Returns created project object.

### 4. `PUT /api/projects/:id`
Updates project properties.

- **Access**: `ADMIN`, `PROJECT_MANAGER`

### 5. `DELETE /api/projects/:id`
Deletes a project and cascades deletion to tasks, comments, and activities.

- **Access**: `ADMIN` only

---

## 5. Tasks & Kanban Operations (`/api/tasks`)

### 1. `GET /api/tasks`
Fetches tasks matching query filters.

- **Access**: Authenticated
- **Query Parameters**:
  - `projectId`: (string) Filter by project
  - `status`: (`TODO` | `IN_PROGRESS` | `IN_REVIEW` | `DONE`)
  - `priority`: (`LOW` | `MEDIUM` | `HIGH` | `CRITICAL`)
  - `assigneeId`: (string) Filter by assigned user
  - `search`: (string) Full-text search in title & description

### 2. `POST /api/tasks`
Creates a task, generates an audit activity log, and broadcasts an SSE event.

- **Access**: `ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`
- **Request Body**:
  ```json
  {
    "projectId": "proj-1",
    "title": "Implement WebSocket Reconnection Backoff",
    "description": "Add exponential backoff with jitter for maritime telemetry feed.",
    "status": "TODO",
    "priority": "HIGH",
    "assigneeId": "usr-dev-1",
    "estimatedHours": 8,
    "dueDate": "2026-10-31"
  }
  ```

### 3. `PATCH /api/tasks/:id/status`
Optimized status transition endpoint designed for drag-and-drop Kanban boards.

- **Access**: `ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`
- **Request Body**:
  ```json
  {
    "status": "IN_PROGRESS"
  }
  ```
- **Side Effects**:
  - Automatically records an activity entry in `activities`.
  - Dispatches `TASK_STATUS_UPDATED` event to all connected SSE clients.

### 4. `PUT /api/tasks/:id`
Full update of task details.

- **Access**: `ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`

### 5. `DELETE /api/tasks/:id`
Deletes a task and its comments.

- **Access**: `ADMIN`, `PROJECT_MANAGER`

---

## 6. Comments (`/api/tasks/:taskId/comments`)

### 1. `GET /api/tasks/:taskId/comments`
Retrieves threaded comments for a task ordered chronologically.

- **Access**: Authenticated

### 2. `POST /api/tasks/:taskId/comments`
Posts a comment to a task.

- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "content": "PR is ready for review at https://github.com/kobkiat/fleet-telemetry/pull/42"
  }
  ```

---

## 7. Audit Activities (`/api/activities`)

### 1. `GET /api/activities`
Retrieves the real-time activity stream for a project or user.

- **Access**: Authenticated
- **Query Parameters**:
  - `projectId`: Optional filter by project
  - `limit`: Default `20`, max `100`

---

## 8. In-App Notifications (`/api/notifications`)

### 1. `GET /api/notifications`
Fetches notifications for the logged-in user.

- **Access**: Authenticated

### 2. `PATCH /api/notifications/:id/read`
Marks a specific notification as read.

- **Access**: Authenticated

### 3. `POST /api/notifications/mark-all-read`
Marks all notifications as read for the logged-in user.

- **Access**: Authenticated

---

## 9. Analytics (`/api/analytics/overview`)

### 1. `GET /api/analytics/overview`
Aggregates key performance indicators (KPIs), velocity, task status breakdown, priority distribution, and team member workload.

- **Access**: Authenticated
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "totalProjects": 3,
      "activeProjects": 2,
      "totalTasks": 11,
      "completedTasks": 3,
      "completionRate": 27.27,
      "statusBreakdown": {
        "TODO": 3,
        "IN_PROGRESS": 3,
        "IN_REVIEW": 2,
        "DONE": 3
      },
      "priorityBreakdown": {
        "LOW": 2,
        "MEDIUM": 3,
        "HIGH": 4,
        "CRITICAL": 2
      },
      "teamWorkload": [
        { "name": "Elena Rostova", "assignedCount": 4 },
        { "name": "Marcus Chen", "assignedCount": 3 }
      ]
    }
  }
  ```

---

## 10. Real-Time Telemetry Stream (`/api/realtime/stream`)

### `GET /api/realtime/stream`
Establishes a persistent Server-Sent Events (SSE) connection.

- **Headers**:
  - `Accept: text/event-stream`
- **Connection Keep-Alive**: Sends an SSE ping heartbeat every 20 seconds.
- **Event Types**:
  - `TASK_CREATED`: Fired when any user adds a new task.
  - `TASK_STATUS_UPDATED`: Fired when a task moves across Kanban columns.
  - `COMMENT_ADDED`: Fired when a new comment is posted.
  - `ACTIVITY_RECORDED`: Broadcasts activity audit log entries.
