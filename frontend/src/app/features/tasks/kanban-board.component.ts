import { IconComponent } from '../../shared/components/icon.component';
import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { TaskService } from '../../core/services/task.service';
import { ProjectService } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { RealtimeService } from '../../core/services/realtime.service';
import { Task, TaskStatus } from '../../core/models/task.model';
import { PriorityHighlightDirective } from '../../shared/directives/priority-highlight.directive';
import { PriorityBadgePipe } from '../../shared/pipes/priority-badge.pipe';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { InitialsPipe } from '../../shared/pipes/initials.pipe';
import { TaskModalComponent } from './task-modal.component';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PriorityHighlightDirective,
    PriorityBadgePipe,
    TimeAgoPipe,
    InitialsPipe,
    TaskModalComponent,
    IconComponent],
  template: `
    <div class="kanban-page">
      <!-- Header & Filter Bar -->
      <div class="kanban-header">
        <div>
          <h1 class="page-title">Interactive Kanban Board</h1>
          <p class="page-subtitle">Drag and drop tasks between workflow columns with real-time sync</p>
        </div>

        <div class="header-controls">
          <!-- Project Filter -->
          <select [formControl]="projectFilter" class="filter-select">
            <option value="">All Projects</option>
            @for (p of projectService.projects(); track p.id) {
              <option [value]="p.id">{{ p.name }} ({{ p.key }})</option>
            }
          </select>

          <!-- Priority Filter -->
          <select [formControl]="priorityFilter" class="filter-select">
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <!-- Search Input -->
          <div class="search-wrap">
            <input
              type="text"
              [formControl]="searchControl"
              placeholder="Search tasks..."
              class="search-input"
            />
          </div>

          <button class="btn btn-primary" (click)="openCreateModal('TODO')" style="display:inline-flex;align-items:center;gap:0.4rem;">
            <app-icon name="plus" [size]="15" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      <!-- 4-Column Drag & Drop Board -->
      <div class="kanban-board">
        <!-- COLUMN 1: TO DO -->
        <div
          class="kanban-column"
          [class.drag-over]="dragOverColumn() === 'TODO'"
          (dragover)="onDragOver($event, 'TODO')"
          (dragleave)="onDragLeave('TODO')"
          (drop)="onDrop($event, 'TODO')"
        >
          <div class="column-header">
            <div class="column-title-group">
              <span class="column-dot dot-todo"></span>
              <h2 class="column-title">To Do</h2>
              <span class="column-count">{{ taskService.todoTasks().length }}</span>
            </div>
            <button class="add-task-btn" (click)="openCreateModal('TODO')" title="Add task to To Do"><app-icon name="plus" [size]="14" /></button>
          </div>

          <div class="column-cards">
            @for (task of taskService.todoTasks(); track task.id) {
              <div
                class="task-card"
                [appPriorityHighlight]="task.priority"
                draggable="true"
                (dragstart)="onDragStart($event, task)"
                (dragend)="onDragEnd()"
                (click)="openEditModal(task)"
              >
                <div class="task-card-top">
                  <span class="task-key">#{{ task.task_number }}</span>
                  <span class="priority-badge" [ngClass]="(task.priority | priorityBadge).cssClass">
                    {{ (task.priority | priorityBadge).label }}
                  </span>
                </div>

                <div class="task-title">{{ task.title }}</div>

                <div class="task-card-meta">
                  <span class="task-type-tag">{{ task.type }}</span>
                  @if (task.comment_count && task.comment_count > 0) {
                    <span class="comment-count-tag" style="display:inline-flex;align-items:center;gap:0.25rem;"><app-icon name="comment" [size]="12" /> {{ task.comment_count }}</span>
                  }
                </div>

                <div class="task-card-footer">
                  <div class="task-assignee">
                    @if (task.assignee_avatar) {
                      <img [src]="task.assignee_avatar" [alt]="task.assignee_name" class="assignee-avatar" />
                    } @else if (task.assignee_name) {
                      <span class="assignee-initials">{{ task.assignee_name | initials }}</span>
                    } @else {
                      <span class="assignee-none">Unassigned</span>
                    }
                  </div>
                  @if (task.due_date) {
                    <span class="task-due">{{ task.due_date | timeAgo }}</span>
                  }
                </div>
              </div>
            } @empty {
              <div class="column-empty">Drop tasks here</div>
            }
          </div>
        </div>

        <!-- COLUMN 2: IN PROGRESS -->
        <div
          class="kanban-column"
          [class.drag-over]="dragOverColumn() === 'IN_PROGRESS'"
          (dragover)="onDragOver($event, 'IN_PROGRESS')"
          (dragleave)="onDragLeave('IN_PROGRESS')"
          (drop)="onDrop($event, 'IN_PROGRESS')"
        >
          <div class="column-header">
            <div class="column-title-group">
              <span class="column-dot dot-progress"></span>
              <h2 class="column-title">In Progress</h2>
              <span class="column-count">{{ taskService.inProgressTasks().length }}</span>
            </div>
            <button class="add-task-btn" (click)="openCreateModal('IN_PROGRESS')" title="Add task to In Progress"><app-icon name="plus" [size]="14" /></button>
          </div>

          <div class="column-cards">
            @for (task of taskService.inProgressTasks(); track task.id) {
              <div
                class="task-card"
                [appPriorityHighlight]="task.priority"
                draggable="true"
                (dragstart)="onDragStart($event, task)"
                (dragend)="onDragEnd()"
                (click)="openEditModal(task)"
              >
                <div class="task-card-top">
                  <span class="task-key">#{{ task.task_number }}</span>
                  <span class="priority-badge" [ngClass]="(task.priority | priorityBadge).cssClass">
                    {{ (task.priority | priorityBadge).label }}
                  </span>
                </div>

                <div class="task-title">{{ task.title }}</div>

                <div class="task-card-meta">
                  <span class="task-type-tag">{{ task.type }}</span>
                  @if (task.comment_count && task.comment_count > 0) {
                    <span class="comment-count-tag" style="display:inline-flex;align-items:center;gap:0.25rem;"><app-icon name="comment" [size]="12" /> {{ task.comment_count }}</span>
                  }
                </div>

                <div class="task-card-footer">
                  <div class="task-assignee">
                    @if (task.assignee_avatar) {
                      <img [src]="task.assignee_avatar" [alt]="task.assignee_name" class="assignee-avatar" />
                    } @else if (task.assignee_name) {
                      <span class="assignee-initials">{{ task.assignee_name | initials }}</span>
                    } @else {
                      <span class="assignee-none">Unassigned</span>
                    }
                  </div>
                  @if (task.due_date) {
                    <span class="task-due">{{ task.due_date | timeAgo }}</span>
                  }
                </div>
              </div>
            } @empty {
              <div class="column-empty">Drop tasks here</div>
            }
          </div>
        </div>

        <!-- COLUMN 3: REVIEW -->
        <div
          class="kanban-column"
          [class.drag-over]="dragOverColumn() === 'REVIEW'"
          (dragover)="onDragOver($event, 'REVIEW')"
          (dragleave)="onDragLeave('REVIEW')"
          (drop)="onDrop($event, 'REVIEW')"
        >
          <div class="column-header">
            <div class="column-title-group">
              <span class="column-dot dot-review"></span>
              <h2 class="column-title">Review</h2>
              <span class="column-count">{{ taskService.reviewTasks().length }}</span>
            </div>
            <button class="add-task-btn" (click)="openCreateModal('REVIEW')" title="Add task to Review"><app-icon name="plus" [size]="14" /></button>
          </div>

          <div class="column-cards">
            @for (task of taskService.reviewTasks(); track task.id) {
              <div
                class="task-card"
                [appPriorityHighlight]="task.priority"
                draggable="true"
                (dragstart)="onDragStart($event, task)"
                (dragend)="onDragEnd()"
                (click)="openEditModal(task)"
              >
                <div class="task-card-top">
                  <span class="task-key">#{{ task.task_number }}</span>
                  <span class="priority-badge" [ngClass]="(task.priority | priorityBadge).cssClass">
                    {{ (task.priority | priorityBadge).label }}
                  </span>
                </div>

                <div class="task-title">{{ task.title }}</div>

                <div class="task-card-meta">
                  <span class="task-type-tag">{{ task.type }}</span>
                  @if (task.comment_count && task.comment_count > 0) {
                    <span class="comment-count-tag" style="display:inline-flex;align-items:center;gap:0.25rem;"><app-icon name="comment" [size]="12" /> {{ task.comment_count }}</span>
                  }
                </div>

                <div class="task-card-footer">
                  <div class="task-assignee">
                    @if (task.assignee_avatar) {
                      <img [src]="task.assignee_avatar" [alt]="task.assignee_name" class="assignee-avatar" />
                    } @else if (task.assignee_name) {
                      <span class="assignee-initials">{{ task.assignee_name | initials }}</span>
                    } @else {
                      <span class="assignee-none">Unassigned</span>
                    }
                  </div>
                  @if (task.due_date) {
                    <span class="task-due">{{ task.due_date | timeAgo }}</span>
                  }
                </div>
              </div>
            } @empty {
              <div class="column-empty">Drop tasks here</div>
            }
          </div>
        </div>

        <!-- COLUMN 4: DONE -->
        <div
          class="kanban-column"
          [class.drag-over]="dragOverColumn() === 'DONE'"
          (dragover)="onDragOver($event, 'DONE')"
          (dragleave)="onDragLeave('DONE')"
          (drop)="onDrop($event, 'DONE')"
        >
          <div class="column-header">
            <div class="column-title-group">
              <span class="column-dot dot-done"></span>
              <h2 class="column-title">Done</h2>
              <span class="column-count">{{ taskService.doneTasks().length }}</span>
            </div>
            <button class="add-task-btn" (click)="openCreateModal('DONE')" title="Add task to Done"><app-icon name="plus" [size]="14" /></button>
          </div>

          <div class="column-cards">
            @for (task of taskService.doneTasks(); track task.id) {
              <div
                class="task-card card-done"
                [appPriorityHighlight]="task.priority"
                draggable="true"
                (dragstart)="onDragStart($event, task)"
                (dragend)="onDragEnd()"
                (click)="openEditModal(task)"
              >
                <div class="task-card-top">
                  <span class="task-key">#{{ task.task_number }}</span>
                  <span class="priority-badge" [ngClass]="(task.priority | priorityBadge).cssClass">
                    {{ (task.priority | priorityBadge).label }}
                  </span>
                </div>

                <div class="task-title strike">{{ task.title }}</div>

                <div class="task-card-meta">
                  <span class="task-type-tag">{{ task.type }}</span>
                  @if (task.comment_count && task.comment_count > 0) {
                    <span class="comment-count-tag" style="display:inline-flex;align-items:center;gap:0.25rem;"><app-icon name="comment" [size]="12" /> {{ task.comment_count }}</span>
                  }
                </div>

                <div class="task-card-footer">
                  <div class="task-assignee">
                    @if (task.assignee_avatar) {
                      <img [src]="task.assignee_avatar" [alt]="task.assignee_name" class="assignee-avatar" />
                    } @else if (task.assignee_name) {
                      <span class="assignee-initials">{{ task.assignee_name | initials }}</span>
                    } @else {
                      <span class="assignee-none">Unassigned</span>
                    }
                  </div>
                  @if (task.due_date) {
                    <span class="task-due">{{ task.due_date | timeAgo }}</span>
                  }
                </div>
              </div>
            } @empty {
              <div class="column-empty">Drop tasks here</div>
            }
          </div>
        </div>
      </div>

      <!-- Task Modal -->
      @if (showModal()) {
        <app-task-modal
          [isOpen]="showModal()"
          [task]="selectedTask()"
          [defaultProjectId]="getDefaultProjectId()"
          (close)="closeModal()"
          (saved)="onTaskSaved()"
        ></app-task-modal>
      }
    </div>
  `,
  styles: [`
    .kanban-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      height: 100%;
    }

    .kanban-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
    }

    .page-subtitle {
      color: var(--text-secondary);
      font-size: 0.92rem;
      margin: 0.25rem 0 0;
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .filter-select, .search-input {
      padding: 0.65rem 1rem;
      border-radius: 10px;
      border: 1px solid var(--border-color);
      background: var(--bg-card);
      color: var(--text-primary);
      font-size: 0.85rem;
      outline: none;
    }

    .search-input {
      width: 170px;
    }

    .btn {
      padding: 0.65rem 1.15rem;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
      color: #fff;
      border: none;
    }

    .kanban-board {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
      align-items: flex-start;
      overflow-x: auto;
      padding-bottom: 1.5rem;
    }

    @media (max-width: 1100px) {
      .kanban-board {
        grid-template-columns: repeat(4, minmax(280px, 1fr));
      }
    }

    .kanban-column {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-height: 580px;
      transition: background 0.2s, border-color 0.2s;
    }

    .kanban-column.drag-over {
      background: rgba(59, 130, 246, 0.08);
      border-color: var(--brand-primary);
    }

    .column-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .column-title-group {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .column-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .dot-todo { background: #94a3b8; }
    .dot-progress { background: #f59e0b; }
    .dot-review { background: #0ea5e9; }
    .dot-done { background: #10b981; }

    .column-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .column-count {
      font-size: 0.75rem;
      font-weight: 700;
      background: var(--bg-surface);
      color: var(--text-muted);
      padding: 0.15rem 0.45rem;
      border-radius: 10px;
    }

    .add-task-btn {
      width: 26px;
      height: 26px;
      border-radius: 6px;
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      transition: all 0.15s;
    }

    .add-task-btn:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }

    .column-cards {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      min-height: 480px;
    }

    .task-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      cursor: grab;
      transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
      position: relative;
    }

    .task-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.15);
      border-color: var(--border-hover);
    }

    .task-card:active {
      cursor: grabbing;
    }

    .card-done {
      opacity: 0.8;
    }

    .strike {
      text-decoration: line-through;
      color: var(--text-muted);
    }

    .task-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .task-key {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    .priority-badge {
      font-size: 0.68rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }

    .badge-urgent { background: rgba(244, 63, 94, 0.15); color: #f43f5e; }
    .badge-high { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .badge-medium { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    .badge-low { background: rgba(16, 185, 129, 0.15); color: #10b981; }

    .task-title {
      font-size: 0.92rem;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.35;
    }

    .task-card-meta {
      display: flex;
      gap: 0.5rem;
      font-size: 0.7rem;
    }

    .task-type-tag {
      background: var(--bg-hover);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      color: var(--text-muted);
      font-weight: 600;
    }

    .comment-count-tag {
      color: var(--text-muted);
    }

    .task-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 0.25rem;
      padding-top: 0.5rem;
      border-top: 1px dashed var(--border-color);
    }

    .task-assignee {
      display: flex;
      align-items: center;
    }

    .assignee-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      object-fit: cover;
    }

    .assignee-initials {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--brand-primary);
      color: #fff;
      font-size: 0.65rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .assignee-none {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .task-due {
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .column-empty {
      border: 2px dashed var(--border-color);
      border-radius: 12px;
      padding: 2.5rem 1rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.8rem;
    }
  `]
})
export class KanbanBoardComponent implements OnInit, OnDestroy {
  public readonly taskService = inject(TaskService);
  public readonly projectService = inject(ProjectService);
  public readonly authService = inject(AuthService);
  private readonly realtime = inject(RealtimeService);
  private readonly route = inject(ActivatedRoute);

  private readonly destroy$ = new Subject<void>();

  public readonly searchControl = new FormControl('');
  public readonly projectFilter = new FormControl('');
  public readonly priorityFilter = new FormControl('');

  public readonly dragOverColumn = signal<TaskStatus | null>(null);
  public readonly draggedTask = signal<Task | null>(null);

  public readonly showModal = signal(false);
  public readonly selectedTask = signal<Task | null>(null);

  ngOnInit(): void {
    const initialProjectId = this.route.snapshot.queryParams['projectId'] || '';
    if (initialProjectId) {
      this.projectFilter.setValue(initialProjectId);
    }

    this.projectService.loadProjects().subscribe();
    this.refreshTasks();

    this.searchControl.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.refreshTasks());

    this.projectFilter.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.refreshTasks());
    this.priorityFilter.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.refreshTasks());

    this.realtime.stream$.pipe(takeUntil(this.destroy$)).subscribe(event => {
      if (['TASK_UPDATED', 'TASK_CREATED', 'TASK_DELETED'].includes(event.type)) {
        this.refreshTasks();
      }
    });
  }

  refreshTasks(): void {
    this.taskService.loadTasks({
      projectId: this.projectFilter.value || '',
      priority: this.priorityFilter.value || '',
      search: this.searchControl.value || ''
    }).subscribe();
  }

  getDefaultProjectId(): string {
    if (this.projectFilter.value) return this.projectFilter.value;
    const projects = this.projectService.projects();
    return projects.length > 0 ? projects[0].id : '';
  }

  onDragStart(event: DragEvent, task: Task): void {
    this.draggedTask.set(task);
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', task.id);
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent, status: TaskStatus): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dragOverColumn.set(status);
  }

  onDragLeave(status: TaskStatus): void {
    if (this.dragOverColumn() === status) {
      this.dragOverColumn.set(null);
    }
  }

  onDrop(event: DragEvent, newStatus: TaskStatus): void {
    event.preventDefault();
    this.dragOverColumn.set(null);
    const task = this.draggedTask();

    if (task && task.status !== newStatus) {
      this.taskService.updateStatus(task.id, newStatus).subscribe();
    }
    this.draggedTask.set(null);
  }

  onDragEnd(): void {
    this.dragOverColumn.set(null);
    this.draggedTask.set(null);
  }

  openCreateModal(columnStatus: TaskStatus): void {
    this.selectedTask.set(null);
    this.showModal.set(true);
  }

  openEditModal(task: Task): void {
    this.selectedTask.set(task);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedTask.set(null);
  }

  onTaskSaved(): void {
    this.refreshTasks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
