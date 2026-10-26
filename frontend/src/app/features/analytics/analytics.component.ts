import { getApiBaseUrl } from '../../core/config/api.config';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AnalyticsOverview } from '../../core/models/analytics.model';
import { InitialsPipe } from '../../shared/pipes/initials.pipe';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, InitialsPipe],
  template: `
    <div class="analytics-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Executive Analytics & Velocity</h1>
          <p class="page-subtitle">Real-time team workload distribution and performance indicators</p>
        </div>
        <button class="btn btn-secondary" (click)="loadAnalytics()">
          ?? Refresh Metrics
        </button>
      </div>

      @if (analytics(); as data) {
        <!-- Summary Cards -->
        <div class="metrics-grid">
          <div class="card metric-box">
            <span class="m-label">Backlog Throughput</span>
            <span class="m-val">{{ data.metrics.completedTasks }} / {{ data.metrics.totalTasks }}</span>
            <span class="m-sub">{{ data.metrics.completionRate }}% overall completion rate</span>
          </div>

          <div class="card metric-box">
            <span class="m-label">Active Initiatives</span>
            <span class="m-val">{{ data.metrics.activeProjects }}</span>
            <span class="m-sub">Across {{ data.metrics.totalProjects }} registered projects</span>
          </div>

          <div class="card metric-box">
            <span class="m-label">Critical / Urgent Queue</span>
            <span class="m-val urgent-text">{{ data.priorityDistribution.URGENT }}</span>
            <span class="m-sub">Immediate dispatch attention</span>
          </div>

          <div class="card metric-box">
            <span class="m-label">Milestone Overdue</span>
            <span class="m-val warning-text">{{ data.metrics.overdueTasks }}</span>
            <span class="m-sub">Target dates elapsed</span>
          </div>
        </div>

        <!-- SVG Priority Chart & Workload Table -->
        <div class="charts-grid">
          <!-- Custom SVG Bar Chart -->
          <div class="card chart-card">
            <h2 class="card-title">Priority Queue Distribution</h2>
            <p class="card-subtitle">Task allocation by severity and business urgency</p>

            <div class="svg-chart-container">
              <svg viewBox="0 0 400 180" class="chart-svg">
                <!-- Grid Lines -->
                <line x1="40" y1="20" x2="380" y2="20" stroke="var(--border-color)" stroke-dasharray="3" />
                <line x1="40" y1="65" x2="380" y2="65" stroke="var(--border-color)" stroke-dasharray="3" />
                <line x1="40" y1="110" x2="380" y2="110" stroke="var(--border-color)" stroke-dasharray="3" />
                <line x1="40" y1="150" x2="380" y2="150" stroke="var(--border-color)" />

                <!-- Bars -->
                <!-- Urgent -->
                <rect x="70" [attr.y]="150 - (data.priorityDistribution.URGENT * 20)" width="45" [attr.height]="data.priorityDistribution.URGENT * 20" rx="6" fill="#f43f5e" />
                <text x="92" [attr.y]="142 - (data.priorityDistribution.URGENT * 20)" text-anchor="middle" fill="var(--text-primary)" font-size="12" font-weight="700">{{ data.priorityDistribution.URGENT }}</text>
                <text x="92" y="168" text-anchor="middle" fill="var(--text-muted)" font-size="11">Urgent</text>

                <!-- High -->
                <rect x="150" [attr.y]="150 - (data.priorityDistribution.HIGH * 20)" width="45" [attr.height]="data.priorityDistribution.HIGH * 20" rx="6" fill="#f59e0b" />
                <text x="172" [attr.y]="142 - (data.priorityDistribution.HIGH * 20)" text-anchor="middle" fill="var(--text-primary)" font-size="12" font-weight="700">{{ data.priorityDistribution.HIGH }}</text>
                <text x="172" y="168" text-anchor="middle" fill="var(--text-muted)" font-size="11">High</text>

                <!-- Medium -->
                <rect x="230" [attr.y]="150 - (data.priorityDistribution.MEDIUM * 20)" width="45" [attr.height]="data.priorityDistribution.MEDIUM * 20" rx="6" fill="#3b82f6" />
                <text x="252" [attr.y]="142 - (data.priorityDistribution.MEDIUM * 20)" text-anchor="middle" fill="var(--text-primary)" font-size="12" font-weight="700">{{ data.priorityDistribution.MEDIUM }}</text>
                <text x="252" y="168" text-anchor="middle" fill="var(--text-muted)" font-size="11">Medium</text>

                <!-- Low -->
                <rect x="310" [attr.y]="150 - (data.priorityDistribution.LOW * 20)" width="45" [attr.height]="data.priorityDistribution.LOW * 20" rx="6" fill="#10b981" />
                <text x="332" [attr.y]="142 - (data.priorityDistribution.LOW * 20)" text-anchor="middle" fill="var(--text-primary)" font-size="12" font-weight="700">{{ data.priorityDistribution.LOW }}</text>
                <text x="332" y="168" text-anchor="middle" fill="var(--text-muted)" font-size="11">Low</text>
              </svg>
            </div>
          </div>

          <!-- Team Workload Distribution -->
          <div class="card workload-card">
            <h2 class="card-title">Engineer Workload Matrix</h2>
            <p class="card-subtitle">Active and completed tasks assigned per team member</p>

            <div class="workload-list">
              @for (w of data.workload; track w.id) {
                <div class="workload-item">
                  <div class="w-avatar">
                    @if (w.avatar_url) {
                      <img [src]="w.avatar_url" [alt]="w.name" />
                    } @else {
                      <span>{{ w.name | initials }}</span>
                    }
                  </div>
                  <div class="w-info">
                    <div class="w-name-row">
                      <span class="w-name">{{ w.name }}</span>
                      <span class="w-count">{{ w.total_tasks }} Total</span>
                    </div>
                    <div class="w-progress-track">
                      <div class="w-progress-fill" [style.width.%]="w.total_tasks > 0 ? (w.done_tasks / w.total_tasks) * 100 : 0"></div>
                    </div>
                    <div class="w-meta">
                      <span>{{ w.active_tasks }} in progress</span>
                      <span>{{ w.done_tasks }} done</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      } @else {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Compiling cross-project analytics...</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .analytics-page {
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

    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 18px;
      padding: 1.5rem;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }

    .metric-box {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .m-label {
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }

    .m-val {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .urgent-text { color: #f43f5e; }
    .warning-text { color: #f59e0b; }

    .m-sub {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .charts-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    @media (max-width: 900px) {
      .charts-grid { grid-template-columns: 1fr; }
    }

    .card-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .card-subtitle {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin: 0.2rem 0 1rem;
    }

    .svg-chart-container {
      width: 100%;
      display: flex;
      justify-content: center;
      padding: 0.5rem 0;
    }

    .chart-svg {
      width: 100%;
      max-height: 220px;
    }

    .workload-list {
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
    }

    .workload-item {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .w-avatar {
      width: 36px;
      height: 36px;
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

    .w-avatar img { width: 100%; height: 100%; object-fit: cover; }

    .w-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .w-name-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.88rem;
    }

    .w-name { font-weight: 600; color: var(--text-primary); }
    .w-count { font-size: 0.78rem; color: var(--text-muted); }

    .w-progress-track {
      height: 6px;
      background: var(--bg-surface);
      border-radius: 3px;
      overflow: hidden;
    }

    .w-progress-fill {
      height: 100%;
      background: #10b981;
      border-radius: 3px;
    }

    .w-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .btn {
      padding: 0.6rem 1.1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-secondary {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
    }
  `]
})
export class AnalyticsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  public readonly analytics = signal<AnalyticsOverview | null>(null);

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.http.get<{ success: boolean } & AnalyticsOverview>(`${getApiBaseUrl()}/analytics/overview`).subscribe({
      next: (res) => {
        if (res.success) {
          this.analytics.set(res);
        }
      }
    });
  }
}
