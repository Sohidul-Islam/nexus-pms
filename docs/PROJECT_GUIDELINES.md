# Nexus PMS ? Engineering & Project Guidelines

This document outlines the coding standards, naming conventions, architectural boundaries, and code review criteria enforced across the Nexus Enterprise Project Management System.

---

## 1. Principles of Code Excellence

1. **Explicit Over Implicit**:
   - Types, return values, and parameters must be strictly typed. Avoid `any` at all costs.
   - All models reside in `core/models/` and are shared across services and components.

2. **Single Responsibility Principle**:
   - Presentational components focus solely on rendering UI and dispatching user events via `output()`.
   - Business orchestration, asynchronous communication, and data transformations belong in dedicated Angular Services (`core/services/`).

3. **Performance First**:
   - Enforce `ChangeDetectionStrategy.OnPush` across all feature components.
   - Use Angular 19 Control Flow (`@for (... track item.id)`) to ensure the DOM reconciler only updates changed elements.
   - Signal Computations (`computed()`) memoize expensive calculations and re-evaluate only when their dependent signals change.

---

## 2. Naming Conventions

### File & Directory Structure
- **Kebab-case** for all file names, directory names, and schematics:
  - Components: `kanban-board.component.ts`, `kanban-board.component.scss`
  - Services: `task.service.ts`, `auth.service.ts`
  - Models: `task.model.ts`, `user.model.ts`
  - Directives: `has-role.directive.ts`, `tooltip.directive.ts`
  - Pipes: `time-ago.pipe.ts`, `priority-badge.pipe.ts`
  - Route Guards: `auth.guard.ts`, `role.guard.ts`
  - Interceptors: `auth.interceptor.ts`, `error.interceptor.ts`

### TypeScript & Angular Symbols
| Symbol Type | Convention | Example |
| :--- | :--- | :--- |
| **Classes (Components/Services/Pipes)** | PascalCase | `KanbanBoardComponent`, `AuthService`, `TimeAgoPipe` |
| **Interfaces & Types** | PascalCase | `Task`, `UserRole`, `ProjectDetailResponse` |
| **Signals & Observables** | camelCase | `currentUser`, `tasks`, `events$` (suffix with `$` for Observables) |
| **Computed Signals** | camelCase | `todoTasks`, `progressPercentage`, `isAuthenticated` |
| **Functions & Methods** | camelCase | `updateStatus()`, `loadProjects()`, `hasRole()` |
| **Directives Selectors** | camelCase with prefix | `[appHasRole]`, `[appPriorityHighlight]` |
| **Constants & Enums** | UPPER_SNAKE_CASE | `API_URL`, `TOKEN_KEY`, `TODO`, `IN_PROGRESS` |

---

## 3. Modern Angular Standards

### Component Definition Rules
- Always declare `standalone: true`.
- Specify explicit inputs using the modern `input()` or `input.required()` API:
  ```typescript
  isOpen = input.required<boolean>();
  title = input<string>('Default Title');
  ```
- Specify custom event emitters using the `output()` API:
  ```typescript
  close = output<void>();
  saved = output<Task>();
  ```
- Use Dependency Injection via `inject()` rather than constructor injection:
  ```typescript
  // Recommended
  private readonly taskService = inject(TaskService);
  private readonly fb = inject(FormBuilder);
  ```

### RxJS & Signals Guidelines
- **Use Signals for**:
  - Synchronous reactive state (e.g., active task, filter state, theme preference, modal visibility).
  - Derived read-only state (e.g., computed counts, percentage completion).
- **Use RxJS for**:
  - Asynchronous event streaming (e.g., SSE live events, WebSocket connection state).
  - Debounced user typing (e.g., search bar with `debounceTime(300)` and `distinctUntilChanged()`).
  - Complex HTTP operator chains (`switchMap`, `catchError`, `combineLatest`).

---

## 4. Backend Conventions (Node.js & TypeScript)

1. **Route Modularity**:
   - Each domain resource has its own router file in `src/routes/` (`auth.routes.ts`, `project.routes.ts`, `task.routes.ts`).
2. **Centralized Error Handling**:
   - Endpoints do not crash the Node process; all errors are caught in `try / catch` blocks and forwarded to `errorHandler` or returned with structured JSON `{ success: false, error: message }`.
3. **Database Parameterization**:
   - Never concatenate raw user input into SQL queries. Always use parameterized queries (`db.execute({ sql: '...', args: [...] })`) to prevent SQL injection vulnerabilities.
4. **Security & Authorization**:
   - Sensitive endpoints require the `authenticate` middleware to verify Bearer JWT tokens.
   - Administrative endpoints enforce the `requireRole('ADMIN', 'PROJECT_MANAGER')` guard.

---

## 5. Git Commit & Review Workflow

- Follow Conventional Commits:
  - `feat(kanban): implement drag and drop status transitions`
  - `fix(interceptor): resolve race condition in token refresh`
  - `perf(grid): switch row rendering to OnPush and computed signals`
  - `test(api): add automated integration suite for RBAC enforcement`
