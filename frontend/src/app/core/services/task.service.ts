import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Task, TaskComment, TaskStatus } from '../models/task.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly API_URL = 'http://localhost:3001/api/tasks';

  // Signals State
  public readonly tasks = signal<Task[]>([]);
  public readonly loading = signal<boolean>(false);
  public readonly activeTask = signal<Task | null>(null);
  public readonly taskComments = signal<TaskComment[]>([]);

  // Computed Kanban Columns
  public readonly todoTasks = computed(() => this.tasks().filter(t => t.status === 'TODO'));
  public readonly inProgressTasks = computed(() => this.tasks().filter(t => t.status === 'IN_PROGRESS'));
  public readonly reviewTasks = computed(() => this.tasks().filter(t => t.status === 'REVIEW'));
  public readonly doneTasks = computed(() => this.tasks().filter(t => t.status === 'DONE'));

  // Metrics
  public readonly totalCount = computed(() => this.tasks().length);
  public readonly completedCount = computed(() => this.doneTasks().length);
  public readonly progressPercentage = computed(() => {
    const total = this.totalCount();
    return total > 0 ? Math.round((this.completedCount() / total) * 100) : 0;
  });

  public loadTasks(filters?: { projectId?: string; status?: string; priority?: string; assigneeId?: string; search?: string }): Observable<{ success: boolean; tasks: Task[] }> {
    this.loading.set(true);
    let params = new HttpParams();

    if (filters?.projectId) params = params.set('projectId', filters.projectId);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.priority) params = params.set('priority', filters.priority);
    if (filters?.assigneeId) params = params.set('assigneeId', filters.assigneeId);
    if (filters?.search) params = params.set('search', filters.search);

    return this.http.get<{ success: boolean; tasks: Task[] }>(this.API_URL, { params }).pipe(
      tap({
        next: (res) => {
          if (res.success) {
            this.tasks.set(res.tasks);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      })
    );
  }

  public getTask(id: string): Observable<{ success: boolean; task: Task; comments: TaskComment[] }> {
    return this.http.get<{ success: boolean; task: Task; comments: TaskComment[] }>(`${this.API_URL}/${id}`).pipe(
      tap(res => {
        if (res.success) {
          this.activeTask.set(res.task);
          this.taskComments.set(res.comments);
        }
      })
    );
  }

  public createTask(payload: Partial<Task>): Observable<{ success: boolean; task: Task }> {
    return this.http.post<{ success: boolean; task: Task }>(this.API_URL, payload).pipe(
      tap(res => {
        if (res.success && res.task) {
          this.tasks.update(list => [res.task, ...list]);
          this.toast.success(`Task #${res.task.task_number} created.`);
        }
      })
    );
  }

  // Optimistic UI updates for high-performance Kanban drag/drop
  public updateStatus(taskId: string, newStatus: TaskStatus, orderIndex: number = 0): Observable<any> {
    const previousTasks = this.tasks();
    const task = previousTasks.find(t => t.id === taskId);
    const previousStatus = task?.status;

    // 1. Optimistically update local signal state immediately
    this.tasks.update(list =>
      list.map(t => (t.id === taskId ? { ...t, status: newStatus, order_index: orderIndex } : t))
    );

    // 2. Perform backend HTTP patch
    return this.http.patch(`${this.API_URL}/${taskId}/status`, { status: newStatus, order_index: orderIndex }).pipe(
      tap(() => {
        this.toast.info(`Task status updated to ${newStatus}`);
      }),
      catchError(err => {
        // Rollback state if server returns error
        if (previousStatus) {
          this.tasks.update(list =>
            list.map(t => (t.id === taskId ? { ...t, status: previousStatus } : t))
          );
        }
        this.toast.error('Failed to update task status. Restored previous position.');
        return throwError(() => err);
      })
    );
  }

  public updateTask(id: string, payload: Partial<Task>): Observable<{ success: boolean; task: Task }> {
    return this.http.put<{ success: boolean; task: Task }>(`${this.API_URL}/${id}`, payload).pipe(
      tap(res => {
        if (res.success && res.task) {
          this.tasks.update(list => list.map(t => (t.id === id ? { ...t, ...res.task } : t)));
          if (this.activeTask()?.id === id) {
            this.activeTask.set(res.task);
          }
          this.toast.success('Task details updated.');
        }
      })
    );
  }

  public deleteTask(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`).pipe(
      tap(() => {
        this.tasks.update(list => list.filter(t => t.id !== id));
        this.toast.info('Task removed.');
      })
    );
  }

  public addComment(taskId: string, content: string): Observable<{ success: boolean; comment: TaskComment }> {
    return this.http.post<{ success: boolean; comment: TaskComment }>(`http://localhost:3001/api/tasks/${taskId}/comments`, { content }).pipe(
      tap(res => {
        if (res.success && res.comment) {
          this.taskComments.update(comments => [...comments, res.comment]);
          // Also bump comment count on the task item
          this.tasks.update(list =>
            list.map(t => (t.id === taskId ? { ...t, comment_count: (t.comment_count || 0) + 1 } : t))
          );
        }
      })
    );
  }
}
