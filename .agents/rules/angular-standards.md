---
title: Modern Angular 19+ Architecture Standards
trigger: always_on
---

# Modern Angular Coding Standards for Nexus PMS

1. **Standalone Components by Default**:
   - Every component, directive, and pipe must declare `standalone: true`. NgModules are deprecated in this architecture.

2. **Signals as Primary State Primitives**:
   - Use `signal()`, `computed()`, and `effect()` for local and shared state.
   - Use `input()`, `input.required()`, and `output()` instead of legacy `@Input()` and `@Output()` decorators where appropriate.
   - Use computed signals for derived state (e.g. filtered task lists, KPI calculations) to avoid unnecessary recalculations.

3. **RxJS Interoperability & Operator Hygiene**:
   - Use RxJS for asynchronous streams, event handling, debounced search inputs, and HTTP communication.
   - Always manage subscriptions using `takeUntil(destroy$)`, `takeUntilDestroyed()`, or convert streams to signals via `toSignal()`.

4. **Change Detection Strategy**:
   - All feature and presentational components must specify `changeDetection: ChangeDetectionStrategy.OnPush` to maximize rendering performance.

5. **Modern Control Flow**:
   - Use built-in control flow `@if`, `@else`, `@for (... track item.id)`, and `@switch`/`@case` instead of legacy structural directives `*ngIf`, `*ngFor`.

6. **Strict Typing & Error Handling**:
   - Strictly type all models and API responses. Avoid `any`.
   - Route HTTP errors through centralized `errorInterceptor` and functional route guards.
