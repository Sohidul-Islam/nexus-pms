import { Component, input, output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalComponent } from '../../shared/components/modal.component';
import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../core/models/project.model';

@Component({
  selector: 'app-project-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      [title]="project() ? 'Edit Project Details' : 'Create New Project'"
      (close)="close.emit()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" body class="modal-form">
        <div class="form-row">
          <div class="form-group flex-2">
            <label class="form-label">Project Name *</label>
            <input type="text" formControlName="name" class="form-input" placeholder="e.g. Telemetry Ingestion Hub" />
          </div>

          <div class="form-group flex-1">
            <label class="form-label">Key (2-5 letters) *</label>
            <input type="text" formControlName="key" class="form-input" placeholder="e.g. TIH" style="text-transform: uppercase;" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea formControlName="description" class="form-textarea" rows="3" placeholder="Define the business objective and deliverables..."></textarea>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">Status</label>
            <select formControlName="status" class="form-input">
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="ON_HOLD">On Hold</option>
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

          <div class="form-group flex-1">
            <label class="form-label">Budget ($ USD)</label>
            <input type="number" formControlName="budget" class="form-input" placeholder="50000" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">Target Completion Date</label>
            <input type="date" formControlName="target_date" class="form-input" />
          </div>
        </div>
      </form>

      <div footer>
        <button type="button" class="btn btn-secondary" (click)="close.emit()">Cancel</button>
        <button type="button" class="btn btn-primary" (click)="onSubmit()" [disabled]="form.invalid || isSubmitting">
          {{ isSubmitting ? 'Saving...' : (project() ? 'Save Changes' : 'Create Project') }}
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
    }

    .form-row {
      display: flex;
      gap: 1rem;
    }

    .flex-1 { flex: 1; }
    .flex-2 { flex: 2; }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .form-label {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .form-input, .form-textarea {
      padding: 0.65rem 0.85rem;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      color: var(--text-primary);
      font-size: 0.9rem;
      outline: none;
    }

    .form-input:focus, .form-textarea:focus {
      border-color: var(--brand-primary);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .form-textarea {
      resize: vertical;
    }

    .btn {
      padding: 0.6rem 1.1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
      color: #fff;
      border: none;
    }

    .btn-secondary {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
    }
  `]
})
export class ProjectModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);

  isOpen = input.required<boolean>();
  project = input<Project | null>(null);

  close = output<void>();
  saved = output<void>();

  isSubmitting = false;

  public readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    key: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2,6}$/)]],
    description: [''],
    status: ['ACTIVE'],
    priority: ['MEDIUM'],
    budget: [50000, [Validators.min(0)]],
    target_date: ['']
  });

  ngOnInit(): void {
    const p = this.project();
    if (p) {
      this.form.patchValue({
        name: p.name,
        key: p.key,
        description: p.description,
        status: p.status,
        priority: p.priority,
        budget: p.budget,
        target_date: p.target_date
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isSubmitting = true;
    const val = this.form.value;
    const existing = this.project();

    if (existing) {
      this.projectService.updateProject(existing.id, val).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.saved.emit();
          this.close.emit();
        },
        error: () => (this.isSubmitting = false)
      });
    } else {
      this.projectService.createProject(val).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.saved.emit();
          this.close.emit();
        },
        error: () => (this.isSubmitting = false)
      });
    }
  }
}
