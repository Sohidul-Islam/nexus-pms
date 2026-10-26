import { Component, input, output, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ModalComponent } from '../../shared/components/modal.component';
import { TaskService } from '../../core/services/task.service';
import { Task } from '../../core/models/task.model';
import { User } from '../../core/models/user.model';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { InitialsPipe } from '../../shared/pipes/initials.pipe';

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    TimeAgoPipe,
    InitialsPipe
  ],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      [title]="task() ? ('#' + task()?.task_number + ': ' + task()?.title) : 'Create New Task'"
      maxWidth="780px"
      (close)="close.emit()"
    >
      <div body class="task-modal-body">
        <form [formGroup]="form" class="task-form">
          <div class="form-group">
            <label class="form-label">Task Title *</label>
            <input type="text" formControlName="title" class="form-input" placeholder="Summarize action item..." />
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label">Type</label>
              <select formControlName="type" class="form-input">
                <option value="FEATURE">Feature</option>
                <option value="BUG">Bug Fix</option>
                <option value="IMPROVEMENT">Improvement</option>
                <option value="TASK">Task</option>
              </select>
            </div>

            <div class="form-group flex-1">
              <label class="form-label">Status</label>
              <select formControlName="status" class="form-input">
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div class="form-group flex-1">
              <label class="form-label">Priority</label>
              <select formControlName="priority" class="form-input">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label">Assignee</label>
              <select formControlName="assignee_id" class="form-input">
                <option [ngValue]="null">Unassigned</option>
                @for (u of users(); track u.id) {
                  <option [value]="u.id">{{ u.name }} ({{ u.role }})</option>
                }
              </select>
            </div>

            <div class="form-group flex-1">
              <label class="form-label">Estimated Hours</label>
              <input type="number" formControlName="estimated_hours" class="form-input" placeholder="8" />
            </div>

            <div class="form-group flex-1">
              <label class="form-label">Logged Hours</label>
              <input type="number" formControlName="logged_hours" class="form-input" placeholder="0" />
            </div>

            <div class="form-group flex-1">
              <label class="form-label">Due Date</label>
              <input type="date" formControlName="due_date" class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Detailed Scope & Requirements</label>
            <textarea formControlName="description" class="form-textarea" rows="3" placeholder="Acceptance criteria, repro steps, or implementation notes..."></textarea>
          </div>
        </form>

        @if (task(); as t) {
          <div class="comments-section">
            <h3 class="comments-heading">Discussion & Activity Thread ({{ taskService.taskComments().length }})</h3>

            <div class="comments-list">
              @for (comment of taskService.taskComments(); track comment.id) {
                <div class="comment-item">
                  <div class="comment-avatar">
                    @if (comment.user_avatar) {
                      <img [src]="comment.user_avatar" [alt]="comment.user_name" />
                    } @else {
                      <span>{{ comment.user_name | initials }}</span>
                    }
                  </div>
                  <div class="comment-bubble">
                    <div class="comment-header">
                      <span class="comment-author">{{ comment.user_name }}</span>
                      <span class="comment-time">{{ comment.created_at | timeAgo }}</span>
                    </div>
                    <div class="comment-text">{{ comment.content }}</div>
                  </div>
                </div>
              } @empty {
                <div class="empty-comments">No comments yet. Start the conversation below.</div>
              }
            </div>

            <div class="add-comment-box">
              <input
                type="text"
                [formControl]="newCommentControl"
                placeholder="Post an update or reply..."
                class="comment-input"
                (keydown.enter)="postComment()"
              />
              <button class="btn btn-primary btn-sm" (click)="postComment()" [disabled]="!newCommentControl.value?.trim()">
                Send
              </button>
            </div>
          </div>
        }
      </div>

      <div footer>
        <button type="button" class="btn btn-secondary" (click)="close.emit()">Cancel</button>
        <button type="button" class="btn btn-primary" (click)="saveTask()" [disabled]="form.invalid || isSubmitting">
          {{ isSubmitting ? 'Saving...' : (task() ? 'Update Task' : 'Create Task') }}
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .task-modal-body {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .task-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-row {
      display: flex;
      gap: 0.85rem;
      flex-wrap: wrap;
    }

    .flex-1 { flex: 1; min-width: 130px; }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .form-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .form-input, .form-textarea {
      padding: 0.6rem 0.85rem;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      color: var(--text-primary);
      font-size: 0.88rem;
      outline: none;
    }

    .form-input:focus, .form-textarea:focus {
      border-color: var(--brand-primary);
    }

    .comments-section {
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .comments-heading {
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: 220px;
      overflow-y: auto;
      padding-right: 0.35rem;
    }

    .comment-item {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
    }

    .comment-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 0.72rem;
      font-weight: 700;
      overflow: hidden;
      flex-shrink: 0;
    }

    .comment-avatar img { width: 100%; height: 100%; object-fit: cover; }

    .comment-bubble {
      flex: 1;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 0.6rem 0.85rem;
    }

    .comment-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.25rem;
    }

    .comment-author {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .comment-time {
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .comment-text {
      font-size: 0.82rem;
      color: var(--text-secondary);
      line-height: 1.35;
    }

    .empty-comments {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-style: italic;
      padding: 0.5rem 0;
    }

    .add-comment-box {
      display: flex;
      gap: 0.5rem;
    }

    .comment-input {
      flex: 1;
      padding: 0.6rem 0.85rem;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      color: var(--text-primary);
      font-size: 0.85rem;
      outline: none;
    }

    .btn {
      padding: 0.6rem 1.1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-sm { padding: 0.5rem 0.85rem; font-size: 0.8rem; }
    .btn-primary { background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary)); color: #fff; border: none; }
    .btn-secondary { background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-secondary); }
  `]
})
export class TaskModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  public readonly taskService = inject(TaskService);
  private readonly http = inject(HttpClient);

  isOpen = input.required<boolean>();
  task = input<Task | null>(null);
  defaultProjectId = input<string>('');

  close = output<void>();
  saved = output<void>();

  public readonly users = signal<User[]>([]);
  public readonly newCommentControl = new FormControl('');
  public isSubmitting = false;

  public readonly form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    status: ['TODO'],
    priority: ['MEDIUM'],
    type: ['FEATURE'],
    assignee_id: [null],
    estimated_hours: [8],
    logged_hours: [0],
    due_date: ['']
  });

  ngOnInit(): void {
    this.http.get<{ success: boolean; users: User[] }>('http://localhost:3001/api/auth/users').subscribe({
      next: (res) => {
        if (res.success) this.users.set(res.users);
      }
    });

    const t = this.task();
    if (t) {
      this.form.patchValue({
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        type: t.type,
        assignee_id: t.assignee_id,
        estimated_hours: t.estimated_hours,
        logged_hours: t.logged_hours,
        due_date: t.due_date
      });
      this.taskService.getTask(t.id).subscribe();
    }
  }

  saveTask(): void {
    if (this.form.invalid) return;

    this.isSubmitting = true;
    const val = this.form.value;
    const t = this.task();

    if (t) {
      this.taskService.updateTask(t.id, val).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.saved.emit();
          this.close.emit();
        },
        error: () => (this.isSubmitting = false)
      });
    } else {
      const payload = {
        ...val,
        project_id: this.defaultProjectId()
      };
      this.taskService.createTask(payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.saved.emit();
          this.close.emit();
        },
        error: () => (this.isSubmitting = false)
      });
    }
  }

  postComment(): void {
    const text = this.newCommentControl.value?.trim();
    const t = this.task();
    if (!text || !t) return;

    this.taskService.addComment(t.id, text).subscribe({
      next: () => {
        this.newCommentControl.reset();
      }
    });
  }
}
