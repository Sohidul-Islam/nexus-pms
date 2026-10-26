import { getApiBaseUrl } from '../../core/config/api.config';
import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { StatCardComponent } from '../../shared/components/stat-card.component';
import { AuthService } from '../../core/services/auth.service';
import { AnalyticsOverview } from '../../core/models/analytics.model';
import { Activity } from '../../core/models/activity.model';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { RealtimeService } from '../../core/services/realtime.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatCardComponent, TimeAgoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-page">
      <!-- Welcome Header -->
      <div class="page-header">
        <div class="header-titles">
          <h1 class="page-title">Executive Dashboard</h1>
          <p class="page-subtitle">
            Welcome back, <strong>{{ authService.currentUser()?.name }}</strong>. Here is your enterprise pulse and project telemetry.
          </p>
        </div>
        <div class="header-actions">
          <a routerLink="/projects" class="btn btn-secondary">Explore Projects</a>
          <a routerLink="/tasks" class="btn btn-primary">+ Kanban Board</a>
        </div>
      </div>

      <!-- KPI Stat Cards Row -->
      @if (analytics(); as data) {
        <div class="kpi-grid">
          <app-stat-card
            title="Active Projects"
            [value]="data.metrics.activeProjects"
            icon="briefcase"
            [subtitle]="data.metrics.totalProjects + ' total registered'"
            trend="+12%"
            trendDirection="up"
          ></app-stat-card>

          <app-stat-card
            title="Total Tasks"
            [value]="data.metrics.totalTasks"
            icon="tasks"
            [subtitle]="data.metrics.completedTasks + ' marked done'"
          ></app-stat-card>

          <app-stat-card
            title="Sprint Completion Rate"
            [value]="data.metrics.completionRate + '%'"
            icon="analytics"
            subtitle="Current cycle velocity"
            trend="+5%"
            trendDirection="up"
          ></app-stat-card>

          <app-stat-card
            title="Overdue Attention"
            [value]="data.metrics.overdueTasks"
            icon="alert"
            subtitle="Tasks past target due date"
            [trendDirection]="data.metrics.overdueTasks > 0 ? 'down' : 'neutral'"
          ></app-stat-card>
        </div>

        <!-- Middle Section: Active Projects Progress & Status Distribution -->
        <div class="grid-two-column">
          <!-- Active Projects Progress Tracker -->
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Key Projects Velocity</h2>
              <a routerLink="/projects" class="card-link" style="display:inline-flex;align-items:center;gap:0.3rem;">View all &rarr;</a>
            </div>
            <div class="project-progress-list">
              @for (proj of data.projects.slice(0, 4); track proj.id) {
                <div class="project-progress-item">
                  <div class="proj-info">
                    <span class="proj-badge">{{ proj.key }}</span>
                    <span class="proj-name">{{ proj.name }}</span>
                    <span class="proj-percent">{{ proj.progress || 0 }}%</span>
                  </div>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" [style.width.%]="proj.progress || 0"></div>
                  </div>
                  <div class="proj-subinfo">
                    <span>{{ proj.done_tasks || 0 }}/{{ proj.total_tasks || 0 }} Tasks Done</span>
                    <span>Budget: \${{ (proj.budget || 0).toLocaleString() }}</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Status & Priority Breakdown -->
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Kanban Flow Distribution</h2>
              <span class="flow-total">{{ data.metrics.totalTasks }} Items</span>
            </div>

            <div class="status-bars-container">
              <div class="status-bar-row">
                <div class="status-label-group">
                  <span class="status-dot dot-todo"></span>
                  <span class="status-name">To Do</span>
                </div>
                <div class="status-count">{{ data.statusDistribution.TODO }}</div>
              </div>
              <div class="status-bar-row">
                <div class="status-label-group">
                  <span class="status-dot dot-progress"></span>
                  <span class="status-name">In Progress</span>
                </div>
                <div class="status-count">{{ data.statusDistribution.IN_PROGRESS }}</div>
              </div>
              <div class="status-bar-row">
                <div class="status-label-group">
                  <span class="status-dot dot-review"></span>
                  <span class="status-name">Under Review</span>
                </div>
                <div class="status-count">{{ data.statusDistribution.REVIEW }}</div>
              </div>
              <div class="status-bar-row">
                <div class="status-label-group">
                  <span class="status-dot dot-done"></span>
                  <span class="status-name">Completed</span>
                </div>
                <div class="status-count">{{ data.statusDistribution.DONE }}</div>
              </div>
            </div>

            <!-- Priority Meter -->
            <div class="priority-meter-section">
              <div class="meter-title">Priority Breakdown</div>
              <div class="multi-meter">
                <div class="meter-segment seg-urgent" [style.flex]="data.priorityDistribution.URGENT || 0.1" title="Urgent"></div>
                <div class="meter-segment seg-high" [style.flex]="data.priorityDistribution.HIGH || 0.1" title="High"></div>
                <div class="meter-segment seg-medium" [style.flex]="data.priorityDistribution.MEDIUM || 0.1" title="Medium"></div>
                <div class="meter-segment seg-low" [style.flex]="data.priorityDistribution.LOW || 0.1" title="Low"></div>
              </div>
              <div class="meter-legend">
                <span><i class="dot seg-urgent"></i> Urgent ({{ data.priorityDistribution.URGENT }})</span>
                <span><i class="dot seg-high"></i> High ({{ data.priorityDistribution.HIGH }})</span>
                <span><i class="dot seg-medium"></i> Med ({{ data.priorityDistribution.MEDIUM }})</span>
                <span><i class="dot seg-low"></i> Low ({{ data.priorityDistribution.LOW }})</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Live Activity History Timeline -->
        <div class="card timeline-card">
          <div class="card-header">
            <h2 class="card-title">Live Audit & Activity Feed</h2>
            <span class="live-tag">&#9679; Streaming Active</span>
          </div>

          <div class="activity-timeline">
            @for (act of activities(); track act.id) {
              <div class="activity-row">
                <div class="activity-avatar">
                  @if (act.user_avatar) {
                    <img [src]="act.user_avatar" [alt]="act.user_name" />
                  } @else {
                    <span>{{ act.user_name.substring(0, 2).toUpperCase() }}</span>
                  }
                </div>
                <div class="activity-details">
                  <div class="activity-msg">
                    <strong>{{ act.user_name }}</strong>
                    @switch (act.action) {
                      @case ('STATUS_UPDATED') {
                        <span> moved <strong>{{ act.details['taskTitle'] }}</strong> from <span class="tag-status">{{ act.details['from'] }}</span> to <span class="tag-status done">{{ act.details['to'] }}</span></span>
                      }
                      @case ('TASK_CREATED') {
                        <span> created task <strong>{{ act.details['taskTitle'] }}</strong></span>
                      }
                      @case ('PROJECT_CREATED') {
                        <span> initiated project <strong>{{ act.details['projectName'] }}</strong></span>
                      }
                      @default {
                        <span> performed <em>{{ act.action }}</em></span>
                      }
                    }
                  </div>
                  <div class="activity-meta">
                    @if (act.project_name) {
                      <span class="act-proj">{{ act.project_name }}</span> ?
                    }
                    <span>{{ act.created_at | timeAgo }}</span>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="empty-state">No recent activity detected.</div>
            }
          </div>
        </div>
      } @else {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Synthesizing workspace analytics and IoT telemetry...</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
      letter-spacing: -0.02em;
    }

    .page-subtitle {
      color: var(--text-secondary);
      margin: 0.35rem 0 0;
      font-size: 0.92rem;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn {
      padding: 0.65rem 1.15rem;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      transition: all 0.15s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
      color: #fff;
      border: none;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(59, 130, 246, 0.4);
    }

    .btn-secondary {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
    }

    .btn-secondary:hover {
      background: var(--bg-hover);
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 1.25rem;
    }

    .grid-two-column {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    @media (max-width: 900px) {
      .grid-two-column {
        grid-template-columns: 1fr;
      }
    }

    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 18px;
      padding: 1.5rem;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }

    .card-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .card-link {
      color: var(--brand-primary);
      font-size: 0.82rem;
      font-weight: 600;
      text-decoration: none;
    }

    .project-progress-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .project-progress-item {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .proj-info {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .proj-badge {
      font-size: 0.72rem;
      font-weight: 700;
      background: var(--bg-hover);
      border: 1px solid var(--border-color);
      padding: 0.15rem 0.4rem;
      border-radius: 6px;
      color: var(--brand-primary);
    }

    .proj-name {
      flex: 1;
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .proj-percent {
      font-weight: 700;
      font-size: 0.85rem;
      color: var(--text-primary);
    }

    .progress-bar-bg {
      height: 8px;
      background: var(--bg-surface);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--brand-primary), #10b981);
      border-radius: 4px;
      transition: width 0.4s ease;
    }

    .proj-subinfo {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .status-bars-container {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .status-bar-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.55rem 0.85rem;
      background: var(--bg-surface);
      border-radius: 10px;
    }

    .status-label-group {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .dot-todo { background: #94a3b8; }
    .dot-progress { background: #f59e0b; }
    .dot-review { background: #0ea5e9; }
    .dot-done { background: #10b981; }

    .status-name {
      font-size: 0.88rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .status-count {
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--text-primary);
    }

    .priority-meter-section {
      margin-top: 1.5rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-color);
    }

    .meter-title {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }

    .multi-meter {
      height: 10px;
      border-radius: 5px;
      overflow: hidden;
      display: flex;
      gap: 2px;
      background: var(--bg-surface);
    }

    .meter-segment {
      height: 100%;
      transition: flex 0.3s;
    }

    .seg-urgent { background: #f43f5e; }
    .seg-high { background: #f59e0b; }
    .seg-medium { background: #3b82f6; }
    .seg-low { background: #10b981; }

    .meter-legend {
      display: flex;
      justify-content: space-between;
      margin-top: 0.75rem;
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .meter-legend .dot {
      display: inline-block;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      margin-right: 3px;
    }

    .timeline-card {
      margin-top: 0.5rem;
    }

    .live-tag {
      font-size: 0.72rem;
      color: #10b981;
      font-weight: 600;
      background: rgba(16, 185, 129, 0.12);
      padding: 0.2rem 0.55rem;
      border-radius: 12px;
    }

    .activity-timeline {
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
    }

    .activity-row {
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
    }

    .activity-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      overflow: hidden;
      flex-shrink: 0;
    }

    .activity-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .activity-details {
      flex: 1;
      font-size: 0.88rem;
    }

    .activity-msg {
      color: var(--text-primary);
      line-height: 1.4;
    }

    .tag-status {
      background: var(--bg-hover);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .tag-status.done {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
    }

    .activity-meta {
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-top: 0.2rem;
    }

    .loading-state {
      padding: 5rem 1rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      color: var(--text-muted);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border-color);
      border-top-color: var(--brand-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class DashboardComponent implements OnInit {
  public readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly realtime = inject(RealtimeService);

  public readonly analytics = signal<AnalyticsOverview | null>(null);
  public readonly activities = signal<Activity[]>([]);
  public readonly loading = signal(true);

  ngOnInit(): void {
    this.loadDashboardData();

    this.realtime.stream$.subscribe(event => {
      if (['TASK_UPDATED', 'TASK_CREATED', 'ACTIVITY'].includes(event.type)) {
        this.loadDashboardData();
      }
    });
  }

  loadDashboardData(): void {
    this.http.get<{ success: boolean } & AnalyticsOverview>(`${getApiBaseUrl()}/analytics/overview`).subscribe({
      next: (res) => {
        if (res.success) {
          this.analytics.set(res);
        }
      }
    });

    this.http.get<{ success: boolean; activities: Activity[] }>(`${getApiBaseUrl()}/activities?limit=8`).subscribe({
      next: (res) => {
        if (res.success) {
          this.activities.set(res.activities);
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false)
    });
  }
}
