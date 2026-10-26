# Nexus PMS ? Modern Angular Learning Guide (Beginner to Advanced)

This guide walks candidates and engineering leads through core to advanced modern Angular concepts using working implementations directly from the Nexus PMS codebase.

---

## Part 1: Beginner Fundamentals

### 1. Standalone Components
In modern Angular (19+), components no longer require `NgModule` declarations. A component imports its dependencies directly.
- **Reference File**: [`login.component.ts`](../frontend/src/app/features/auth/login.component.ts)
```typescript
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent { ... }
```

### 2. Built-in Control Flow (`@if`, `@for`, `@switch`)
Replaces legacy `*ngIf`, `*ngFor`, and `*ngSwitch` with syntax directly supported by the template compiler.
- **Reference File**: [`dashboard.component.ts`](../frontend/src/app/features/dashboard/dashboard.component.ts)
```html
@if (analytics(); as data) {
  <div class="kpi-grid">...</div>
} @else {
  <div class="loading-state">...</div>
}

@for (task of taskService.todoTasks(); track task.id) {
  <div class="task-card">...</div>
} @empty {
  <div class="empty-state">No items found</div>
}
```
*Key Takeaway*: `@for` enforces the `track` expression (`track task.id`), which ensures optimal DOM node recycling and prevents unnecessary re-rendering.

---

## Part 2: Intermediate Architecture

### 3. Dependency Injection via `inject()`
Modern Angular replaces constructor parameter injection with the functional `inject()` API.
- **Reference File**: [`auth.service.ts`](../frontend/src/app/core/services/auth.service.ts)
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
}
```

### 4. Custom Pure Pipes
Pure pipes memoize their return values and only recalculate when their input reference changes.
- **Reference File**: [`time-ago.pipe.ts`](../frontend/src/app/shared/pipes/time-ago.pipe.ts)
```typescript
@Pipe({
  name: 'timeAgo',
  pure: true,
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value?: string | Date | null): string {
    // Computes relative time: "2h ago", "Yesterday", etc.
  }
}
```

### 5. Structural & Attribute Directives
- **Structural Directive Reference**: [`has-role.directive.ts`](../frontend/src/app/shared/directives/has-role.directive.ts)
  Demonstrates manipulating the DOM tree via `ViewContainerRef` and `TemplateRef` combined with a reactive Signal effect.
  ```html
  <button *appHasRole="['ADMIN', 'PROJECT_MANAGER']" (click)="deleteProject()">
    Delete Project
  </button>
  ```
- **Attribute Directive Reference**: [`priority-highlight.directive.ts`](../frontend/src/app/shared/directives/priority-highlight.directive.ts)
  Demonstrates `Renderer2` dynamic class manipulation reacting to `@Input()` changes.

### 6. Typed Reactive Forms with Custom Validators
- **Reference File**: [`project-modal.component.ts`](../frontend/src/app/features/projects/project-modal.component.ts)
```typescript
public readonly form: FormGroup = this.fb.group({
  name: ['', [Validators.required, Validators.minLength(3)]],
  key: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2,6}$/)]],
  budget: [50000, [Validators.min(0)]]
});
```

---

## Part 3: Advanced Concepts & State Management

### 7. Angular Signals (`signal`, `computed`, `effect`)
Signals represent a value that can change over time and notify interested consumers.
- **Writable Signals (`signal`)**:
  - **Reference File**: [`task.service.ts`](../frontend/src/app/core/services/task.service.ts)
  ```typescript
  public readonly tasks = signal<Task[]>([]);
  public readonly loading = signal<boolean>(false);
  ```
- **Computed Signals (`computed`)**:
  - Automatically re-evaluate whenever any dependent signal changes.
  ```typescript
  public readonly todoTasks = computed(() => this.tasks().filter(t => t.status === 'TODO'));
  public readonly inProgressTasks = computed(() => this.tasks().filter(t => t.status === 'IN_PROGRESS'));
  public readonly progressPercentage = computed(() => {
    const total = this.tasks().length;
    return total > 0 ? Math.round((this.doneTasks().length / total) * 100) : 0;
  });
  ```
- **Signals Signal Inputs (`input`, `input.required`)**:
  - **Reference File**: [`stat-card.component.ts`](../frontend/src/app/shared/components/stat-card.component.ts)
  ```typescript
  title = input.required<string>();
  value = input.required<string | number>();
  trendDirection = input<'up' | 'down' | 'neutral'>('neutral');
  ```
- **Signals Effects (`effect`)**:
  - **Reference File**: [`theme.service.ts`](../frontend/src/app/core/services/theme.service.ts)
  ```typescript
  effect(() => {
    const current = this.theme();
    localStorage.setItem(this.STORAGE_KEY, current);
    document.documentElement.setAttribute('data-theme', current);
  });
  ```

### 8. RxJS & Signals Interoperability
- **Debounced User Typing**:
  - **Reference File**: [`project-list.component.ts`](../frontend/src/app/features/projects/project-list.component.ts)
  ```typescript
  this.searchControl.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    takeUntil(this.destroy$)
  ).subscribe(term => {
    this.projectService.loadProjects({ search: term }).subscribe();
  });
  ```
- **Real-Time Stream Processing**:
  - **Reference File**: [`realtime.service.ts`](../frontend/src/app/core/services/realtime.service.ts)
  Uses an RxJS `Subject<RealtimePayload>` to bridge browser `EventSource` events into the Angular reactive ecosystem.

### 9. Functional Guards and Interceptors
Modern Angular replaces class-based guards with concise functional implementations:
- **Functional CanActivate Guard**:
  - **Reference File**: [`auth.guard.ts`](../frontend/src/app/core/auth/auth.guard.ts)
  ```typescript
  export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    return authService.isAuthenticated() || router.createUrlTree(['/auth/login']);
  };
  ```
- **Functional HttpInterceptor**:
  - **Reference File**: [`auth.interceptor.ts`](../frontend/src/app/core/auth/auth.interceptor.ts)
  ```typescript
  export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = inject(AuthService).token();
    return token ? next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })) : next(req);
  };
  ```

### 10. High-Performance Optimistic UI Updates
When dragging a Kanban task to another column, waiting for network latency ruins the user experience.
- **Reference File**: [`task.service.ts:updateStatus`](../frontend/src/app/core/services/task.service.ts)
  1. Updates the `tasks` Signal instantly.
  2. Issues the asynchronous `PATCH /api/tasks/:id/status` request in the background.
  3. Automatically rolls back to previous state if the request fails with a network error.
