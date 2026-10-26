import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { ProjectDetailResponse } from '../../core/models/project.model';
import { StatusBadgePipe } from '../../shared/pipes/status-badge.pipe';
import { PriorityBadgePipe } from '../../shared/pipes/priority-badge.pipe';
import { InitialsPipe } from '../../shared/pipes/initials.pipe';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgePipe, PriorityBadgePipe, InitialsPipe],
  template: `
    @if (detail(); as data) {
      <div class="project-detail-page">
        <!-- Breadcrumbs & Back -->
        <div class="breadcrumb-row">
          <a routerLink="/projects" class="back-link">&larr; Back to Projects</a>
          <span class="sep">/</span>
          <span class="curr-proj">{{ data.project.key }}</span>
        </div>

        <!-- Detail Header -->
        <div class="detail-header card">
          <div class="header-main">
            <div class="key-pill">{{ data.project.key }}</div>
            <div>
              <h1 class="project-title">{{ data.project.name }}</h1>
              <p class="project-org">{{ data.project.organization_name }}</p>
            </div>
          </div>

          <div class="header-badges">
            <span class="badge" [ngClass]="(data.project.status | statusBadge).cssClass">
              {{ (data.project.status | statusBadge).label }}
            </span>
            <span class="badge" [ngClass]="(data.project.priority | priorityBadge).cssClass">
              {{ (data.project.priority | priorityBadge).label }}
            </span>
            <a [routerLink]="['/tasks']" [queryParams]="{ projectId: data.project.id }" class="btn btn-primary">
              Open Kanban Board ?
            </a>
          </div>
        </div>

        <!-- Metrics Overview Grid -->
        <div class="overview-grid">
          <div class="metric-card card">
            <div class="metric-label">Budget Allocated</div>
            <div class="metric-value">\${{ (data.project.budget || 0).toLocaleString() }}</div>
            <div class="metric-sub">Enterprise CapEx</div>
          </div>

          <div class="metric-card card">
            <div class="metric-label">Estimated Hours</div>
            <div class="metric-value">{{ data.hours.estimated }}h</div>
            <div class="metric-sub">Total backlog estimates</div>
          </div>

          <div class="metric-card card">
            <div class="metric-label">Logged Hours</div>
            <div class="metric-value">{{ data.hours.logged }}h</div>
            <div class="metric-sub">
              {{ data.hours.estimated > 0 ? Math.round((data.hours.logged / data.hours.estimated) * 100) : 0 }}% of allocation
            </div>
          </div>

          <div class="metric-card card">
            <div class="metric-label">Target Completion</div>
            <div class="metric-value date-val">{{ data.project.target_date || 'Ongoing' }}</div>
            <div class="metric-sub">Milestone Target</div>
          </div>
        </div>

        <!-- Details & Team Members Two Column -->
        <div class="grid-split">
          <div class="card detail-content">
            <h2 class="section-title">Project Scope & Charter</h2>
            <p class="description-text">{{ data.project.description || 'No detailed scope description provided.' }}</p>

            <h2 class="section-title" style="margin-top: 2rem;">Status Breakdown</h2>
            <div class="status-summary-list">
              @for (st of data.statusCounts; track st.status) {
                <div class="status-count-row">
                  <span class="badge" [ngClass]="(st.status | statusBadge).cssClass">
                    {{ (st.status | statusBadge).label }}
                  </span>
                  <strong class="count-num">{{ st.count }} tasks</strong>
                </div>
              }
            </div>
          </div>

          <!-- Team Members -->
          <div class="card team-card">
            <h2 class="section-title">Assigned Engineering Team</h2>
            <div class="team-list">
              @for (member of data.team; track member.id) {
                <div class="team-member-item">
                  <div class="member-avatar">
                    @if (member.avatar_url) {
                      <img [src]="member.avatar_url" [alt]="member.name" />
                    } @else {
                      <span>{{ member.name | initials }}</span>
                    }
                  </div>
                  <div class="member-info">
                    <div class="member-name">{{ member.name }}</div>
                    <div class="member-email">{{ member.email }}</div>
                  </div>
                  <span class="member-role">{{ member.role }}</span>
                </div>
              } @empty {
                <div class="empty-team">No members currently assigned to tasks in this project.</div>
              }
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading project charter and telemetry...</p>
      </div>
    }
  `,
  styles: [`
    .project-detail-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .breadcrumb-row {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.88rem;
    }

    .back-link {
      color: var(--brand-primary);
      text-decoration: none;
      font-weight: 600;
    }

    .sep { color: var(--text-muted); }
    .curr-proj { color: var(--text-primary); font-weight: 700; }

    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 18px;
      padding: 1.5rem;
    }

    .detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .header-main {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .key-pill {
      font-size: 1.1rem;
      font-weight: 800;
      background: rgba(59, 130, 246, 0.15);
      color: var(--brand-primary);
      padding: 0.5rem 1rem;
      border-radius: 12px;
    }

    .project-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
    }

    .project-org {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin: 0.2rem 0 0;
    }

    .header-badges {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .btn {
      padding: 0.65rem 1.25rem;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
      color: #fff;
      border: none;
    }

    .overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 1.25rem;
    }

    .metric-card {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .metric-label {
      font-size: 0.78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }

    .metric-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .date-val {
      font-size: 1.35rem;
    }

    .metric-sub {
      font-size: 0.78rem;
      color: var(--text-secondary);
    }

    .grid-split {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 1.5rem;
    }

    @media (max-width: 900px) {
      .grid-split { grid-template-columns: 1fr; }
    }

    .section-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 1rem;
    }

    .description-text {
      color: var(--text-secondary);
      line-height: 1.6;
      font-size: 0.92rem;
    }

    .status-summary-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .status-count-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.75rem;
      background: var(--bg-surface);
      border-radius: 8px;
    }

    .count-num {
      font-size: 0.9rem;
      color: var(--text-primary);
    }

    .team-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .team-member-item {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.65rem 0.85rem;
      background: var(--bg-surface);
      border-radius: 10px;
    }

    .member-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 0.8rem;
      font-weight: 700;
      overflow: hidden;
      flex-shrink: 0;
    }

    .member-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .member-info { flex: 1; }
    .member-name { font-size: 0.88rem; font-weight: 600; color: var(--text-primary); }
    .member-email { font-size: 0.75rem; color: var(--text-muted); }
    .member-role { font-size: 0.72rem; color: var(--text-muted); background: var(--bg-hover); padding: 0.2rem 0.45rem; border-radius: 6px; }

    .empty-team {
      color: var(--text-muted);
      font-size: 0.85rem;
      padding: 1.5rem;
      text-align: center;
    }
  `]
})
export class ProjectDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectService);

  public readonly detail = signal<ProjectDetailResponse | null>(null);
  public readonly Math = Math;

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.projectService.getProject(id).subscribe({
        next: (res) => {
          this.detail.set(res);
        }
      });
    }
  }
}
