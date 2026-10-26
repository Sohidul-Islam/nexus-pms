import { IconComponent } from './icon.component';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <aside class="nexus-sidebar">
      <div class="sidebar-nav">
        <div class="nav-section-title">Navigation</div>

        <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-item">
          <span class="nav-icon"><app-icon name="dashboard" [size]="18" /></span>
          <span class="nav-label">Dashboard</span>
        </a>

        <a routerLink="/projects" routerLinkActive="active" class="nav-item">
          <span class="nav-icon"><app-icon name="projects" [size]="18" /></span>
          <span class="nav-label">Projects</span>
        </a>

        <a routerLink="/tasks" routerLinkActive="active" class="nav-item">
          <span class="nav-icon"><app-icon name="tasks" [size]="18" /></span>
          <span class="nav-label">Kanban Tasks</span>
        </a>

        <a routerLink="/analytics" routerLinkActive="active" class="nav-item">
          <span class="nav-icon"><app-icon name="analytics" [size]="18" /></span>
          <span class="nav-label">Analytics & KPI</span>
        </a>

        <div class="nav-section-title" style="margin-top: 1.5rem;">Administration</div>

        <a routerLink="/organizations" routerLinkActive="active" class="nav-item">
          <span class="nav-icon"><app-icon name="team" [size]="18" /></span>
          <span class="nav-label">Team & Organization</span>
        </a>

        <a routerLink="/settings" routerLinkActive="active" class="nav-item">
          <span class="nav-icon"><app-icon name="settings" [size]="18" /></span>
          <span class="nav-label">Settings</span>
        </a>
      </div>

      <div class="sidebar-footer">
        <div class="role-card">
          <div class="role-badge" [ngClass]="'role-' + (authService.userRole()?.toLowerCase() || 'member')">
            {{ authService.userRole() }}
          </div>
          <div class="role-description">
            @switch (authService.userRole()) {
              @case ('ADMIN') { Full System & Workspace Admin }
              @case ('PROJECT_MANAGER') { Projects & Team Lead }
              @case ('TEAM_MEMBER') { Full Contributor Access }
              @case ('VIEWER') { Read-Only Stakeholder }
            }
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .nexus-sidebar {
      width: 250px;
      background: var(--bg-card);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: calc(100vh - 68px);
      position: sticky;
      top: 68px;
      padding: 1.5rem 1rem;
      flex-shrink: 0;
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .nav-section-title {
      font-size: 0.72rem;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      padding: 0 0.75rem 0.5rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.7rem 0.85rem;
      border-radius: 10px;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.15s ease;
    }

    .nav-item:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
      transform: translateX(2px);
    }

    .nav-item.active {
      background: linear-gradient(90deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.08));
      color: var(--brand-primary);
      font-weight: 600;
      border-left: 3px solid var(--brand-primary);
    }

    .nav-icon {
      font-size: 1.15rem;
      width: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sidebar-footer {
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .role-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 0.85rem;
      text-align: center;
    }

    .role-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      letter-spacing: 0.04em;
    }

    .role-admin { background: rgba(244, 63, 94, 0.15); color: #f43f5e; }
    .role-project_manager { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .role-team_member { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    .role-viewer { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }

    .role-description {
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-top: 0.4rem;
    }
  `]
})
export class SidebarComponent {
  public readonly authService = inject(AuthService);
}
