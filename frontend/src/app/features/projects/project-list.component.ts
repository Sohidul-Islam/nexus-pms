import { IconComponent } from '../../shared/components/icon.component';
import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ProjectService } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { Project } from '../../core/models/project.model';
import { HasRoleDirective } from '../../shared/directives/has-role.directive';
import { StatusBadgePipe } from '../../shared/pipes/status-badge.pipe';
import { PriorityBadgePipe } from '../../shared/pipes/priority-badge.pipe';
import { ProjectModalComponent } from './project-modal.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    HasRoleDirective,
    StatusBadgePipe,
    PriorityBadgePipe,
    ProjectModalComponent,
    IconComponent],
  template: `
    <div class="projects-page">
      <!-- Top Action Bar -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Projects Portfolio</h1>
          <p class="page-subtitle">Track, orchestrate, and deliver strategic initiatives</p>
        </div>

        <button *appHasRole="['ADMIN', 'PROJECT_MANAGER']" class="btn btn-primary" (click)="openCreateModal()">
          <span>+ New Project</span>
        </button>
      </div>

      <!-- Search, Filter & View Controls (Demonstrating RxJS & Signals) -->
      <div class="filter-bar">
        <div class="search-input-wrapper">
          <span class="search-icon"><app-icon name="search" [size]="16" /></span>
          <input
            type="text"
            [formControl]="searchControl"
            placeholder="Filter projects by title, key, or scope..."
            class="search-input"
          />
        </div>

        <div class="filter-controls">
          <select [formControl]="statusFilter" class="filter-select">
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PLANNING">Planning</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
          </select>
        </div>
      </div>

      <!-- Projects Grid -->
      @if (projectService.loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Querying project catalog...</p>
        </div>
      } @else {
        <div class="projects-grid">
          @for (proj of projectService.projects(); track proj.id) {
            <div class="project-card">
              <div class="card-top">
                <div class="key-status-group">
                  <span class="project-key">{{ proj.key }}</span>
                  <span class="badge" [ngClass]="(proj.status | statusBadge).cssClass">
                    {{ (proj.status | statusBadge).label }}
                  </span>
                </div>

                <div class="priority-pill" [ngClass]="(proj.priority | priorityBadge).cssClass">
                  {{ (proj.priority | priorityBadge).label }}
                </div>
              </div>

              <a [routerLink]="['/projects', proj.id]" class="project-title-link">
                <h3 class="project-title">{{ proj.name }}</h3>
              </a>

              <p class="project-desc">{{ proj.description || 'No description provided.' }}</p>

              <!-- Progress Bar -->
              <div class="progress-section">
                <div class="progress-labels">
                  <span>Sprint Velocity</span>
                  <strong>{{ proj.progress || 0 }}%</strong>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" [style.width.%]="proj.progress || 0"></div>
                </div>
              </div>

              <!-- Metadata & Footer -->
              <div class="card-meta">
                <div class="meta-item">
                  <span class="meta-label">Tasks:</span>
                  <span class="meta-value">{{ proj.done_tasks || 0 }}/{{ proj.total_tasks || 0 }}</span>
                </div>
                @if (proj.budget) {
                  <div class="meta-item">
                    <span class="meta-label">Budget:</span>
                    <span class="meta-value">\${{ proj.budget.toLocaleString() }}</span>
                  </div>
                }
              </div>

              <div class="card-footer">
                <div class="lead-info">
                  @if (proj.lead_avatar) {
                    <img [src]="proj.lead_avatar" [alt]="proj.lead_name" class="lead-avatar" />
                  }
                  <span class="lead-name">{{ proj.lead_name || 'Unassigned' }}</span>
                </div>

                <div class="card-actions">
                  <a [routerLink]="['/tasks']" [queryParams]="{ projectId: proj.id }" class="btn-icon" title="View Kanban Tasks">
                    <app-icon name="tasks" [size]="16" />
                  </a>
                  <button *appHasRole="['ADMIN']" class="btn-icon delete-btn" (click)="deleteProject(proj)" title="Delete Project">
                    <app-icon name="trash" [size]="16" />
                  </button>
                </div>
              </div>
            </div>
          } @empty {
            <div class="empty-card">
              <span class="empty-icon"><app-icon name="projects" [size]="48" /></span>
              <h3>No projects match your filter</h3>
              <p>Adjust your search query or create a new project above.</p>
            </div>
          }
        </div>
      }

      <!-- Create / Edit Project Modal -->
      @if (showModal()) {
        <app-project-modal
          [isOpen]="showModal()"
          [project]="selectedProject()"
          (close)="closeModal()"
          (saved)="onProjectSaved()"
        ></app-project-modal>
      }
    </div>
  `,
  styles: [`
    .projects-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
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

    .filter-bar {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .search-input-wrapper {
      flex: 1;
      min-width: 260px;
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.6rem;
      border-radius: 12px;
      border: 1px solid var(--border-color);
      background: var(--bg-card);
      color: var(--text-primary);
      font-size: 0.9rem;
      outline: none;
    }

    .search-input:focus {
      border-color: var(--brand-primary);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .filter-select {
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      border: 1px solid var(--border-color);
      background: var(--bg-card);
      color: var(--text-primary);
      font-size: 0.9rem;
      outline: none;
      cursor: pointer;
    }

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .project-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 18px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      transition: all 0.2s ease;
    }

    .project-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 15px 30px -10px rgba(0, 0, 0, 0.2);
      border-color: var(--border-hover);
    }

    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .key-status-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .project-key {
      font-size: 0.75rem;
      font-weight: 700;
      background: rgba(59, 130, 246, 0.15);
      color: var(--brand-primary);
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
    }

    .project-title-link {
      text-decoration: none;
    }

    .project-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
      line-height: 1.35;
      transition: color 0.15s;
    }

    .project-title:hover {
      color: var(--brand-primary);
    }

    .project-desc {
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.45;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      flex: 1;
    }

    .progress-section {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .progress-track {
      height: 7px;
      background: var(--bg-surface);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--brand-primary), #10b981);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .card-meta {
      display: flex;
      justify-content: space-between;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color);
      font-size: 0.82rem;
    }

    .meta-item {
      display: flex;
      gap: 0.3rem;
    }

    .meta-label { color: var(--text-muted); }
    .meta-value { font-weight: 600; color: var(--text-primary); }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color);
    }

    .lead-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .lead-avatar {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      object-fit: cover;
    }

    .lead-name {
      font-size: 0.8rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .card-actions {
      display: flex;
      gap: 0.35rem;
    }

    .btn-icon {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      text-decoration: none;
      font-size: 0.85rem;
      transition: all 0.15s;
    }

    .btn-icon:hover {
      background: var(--bg-hover);
    }

    .delete-btn:hover {
      background: rgba(244, 63, 94, 0.15);
      border-color: #f43f5e;
    }

    .empty-card {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 1rem;
      background: var(--bg-card);
      border: 1px dashed var(--border-color);
      border-radius: 20px;
    }

    .empty-icon { font-size: 2.5rem; display: block; margin-bottom: 0.5rem; }

    .btn {
      padding: 0.65rem 1.15rem;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
      color: #fff;
      border: none;
    }
  `]
})
export class ProjectListComponent implements OnInit, OnDestroy {
  public readonly projectService = inject(ProjectService);
  public readonly authService = inject(AuthService);

  private readonly destroy$ = new Subject<void>();

  // RxJS Reactive Form Controls
  public readonly searchControl = new FormControl('');
  public readonly statusFilter = new FormControl('');

  public readonly showModal = signal(false);
  public readonly selectedProject = signal<Project | null>(null);

  ngOnInit(): void {
    this.projectService.loadProjects().subscribe();

    // RxJS Stream Operators: debounceTime & distinctUntilChanged
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.projectService.loadProjects({
        search: term || '',
        status: this.statusFilter.value || ''
      }).subscribe();
    });

    this.statusFilter.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(status => {
      this.projectService.loadProjects({
        search: this.searchControl.value || '',
        status: status || ''
      }).subscribe();
    });
  }

  openCreateModal(): void {
    this.selectedProject.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedProject.set(null);
  }

  onProjectSaved(): void {
    this.projectService.loadProjects().subscribe();
  }

  deleteProject(proj: Project): void {
    if (confirm(`Are you sure you want to delete project "${proj.name}"? This action cannot be undone.`)) {
      this.projectService.deleteProject(proj.id).subscribe();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
