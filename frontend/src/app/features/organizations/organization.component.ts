import { getApiBaseUrl } from '../../core/config/api.config';
import { IconComponent } from '../../shared/components/icon.component';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Organization, OrganizationMember } from '../../core/models/organization.model';
import { User, UserRole } from '../../core/models/user.model';
import { ModalComponent } from '../../shared/components/modal.component';
import { HasRoleDirective } from '../../shared/directives/has-role.directive';
import { InitialsPipe } from '../../shared/pipes/initials.pipe';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-organization',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, HasRoleDirective, InitialsPipe, TimeAgoPipe,
    IconComponent],
  template: `
    <div class="org-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Organization & Teams</h1>
          <p class="page-subtitle">Manage multi-tenant workspaces, team access, and role-based permissions</p>
        </div>

        <button *appHasRole="['ADMIN', 'PROJECT_MANAGER']" class="btn btn-primary" (click)="openInviteModal()">
          + Add Team Member
        </button>
      </div>

      <!-- Current Org Info Card -->
      @if (currentOrg(); as org) {
        <div class="card org-banner">
          <div class="org-brand-box">
            <div class="org-logo-sq"><app-icon name="building" [size]="28" /></div>
            <div>
              <div class="org-title-row">
                <h2 class="org-title">{{ org.name }}</h2>
                <span class="plan-badge">{{ org.plan || 'Enterprise Tier' }}</span>
              </div>
              <p class="org-desc">{{ org.description || 'Global logistics operations & maritime IoT cloud.' }}</p>
            </div>
          </div>

          <div class="org-meta-stats">
            <div class="stat-pill">
              <span class="stat-num">{{ members().length }}</span>
              <span class="stat-label">Active Members</span>
            </div>
          </div>
        </div>

        <!-- Members Table -->
        <div class="card members-card">
          <div class="card-header">
            <h3 class="card-title">Team Roster & Access Controls</h3>
            <span class="table-subtitle">Role-Based Access Control (RBAC) configured</span>
          </div>

          <div class="table-container">
            <table class="nexus-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th *appHasRole="['ADMIN']">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (m of members(); track m.id) {
                  <tr>
                    <td>
                      <div class="member-cell">
                        <div class="avatar-cell">
                          @if (m.avatar_url) {
                            <img [src]="m.avatar_url" [alt]="m.name" />
                          } @else {
                            <span>{{ m.name | initials }}</span>
                          }
                        </div>
                        <div>
                          <div class="name-text">{{ m.name }}</div>
                          <div class="email-text">{{ m.email }}</div>
                        </div>
                      </div>
                    </td>
                    <td>{{ m.department || 'Engineering' }}</td>
                    <td>
                      <span class="role-pill" [ngClass]="'role-' + m.role.toLowerCase()">
                        {{ m.role }}
                      </span>
                    </td>
                    <td>{{ m.joined_at | timeAgo }}</td>
                    <td *appHasRole="['ADMIN']">
                      @if (m.id !== authService.currentUser()?.id) {
                        <select
                          [value]="m.role"
                          (change)="updateRole(m.id, $event)"
                          class="role-select"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
                          <option value="TEAM_MEMBER">TEAM_MEMBER</option>
                          <option value="VIEWER">VIEWER</option>
                        </select>
                      } @else {
                        <span class="self-tag">(Current You)</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Invite Member Modal -->
      @if (showInviteModal()) {
        <app-modal
          [isOpen]="showInviteModal()"
          title="Add Member to Organization"
          (close)="closeInviteModal()"
        >
          <form [formGroup]="inviteForm" (ngSubmit)="submitInvite()" body class="modal-form">
            <div class="form-group">
              <label class="form-label">Select User *</label>
              <select formControlName="userId" class="form-input">
                <option value="">-- Choose User to Add --</option>
                @for (u of allUsers(); track u.id) {
                  <option [value]="u.id">{{ u.name }} ({{ u.email }}) - {{ u.department }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Assign Role *</label>
              <select formControlName="role" class="form-input">
                <option value="TEAM_MEMBER">TEAM_MEMBER (Full Task & Comment Access)</option>
                <option value="PROJECT_MANAGER">PROJECT_MANAGER (Project & Sprint Control)</option>
                <option value="ADMIN">ADMIN (Full System Access)</option>
                <option value="VIEWER">VIEWER (Read-Only Observer)</option>
              </select>
            </div>
          </form>

          <div footer>
            <button class="btn btn-secondary" (click)="closeInviteModal()">Cancel</button>
            <button class="btn btn-primary" (click)="submitInvite()" [disabled]="inviteForm.invalid">
              Add Member
            </button>
          </div>
        </app-modal>
      }
    </div>
  `,
  styles: [`
    .org-page {
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

    .org-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .org-brand-box {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .org-logo-sq {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
    }

    .org-title-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .org-title {
      font-size: 1.45rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
    }

    .plan-badge {
      background: rgba(99, 102, 241, 0.15);
      color: var(--brand-secondary);
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
    }

    .org-desc {
      color: var(--text-secondary);
      font-size: 0.88rem;
      margin: 0.35rem 0 0;
    }

    .stat-pill {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 0.65rem 1.25rem;
      text-align: center;
      display: flex;
      flex-direction: column;
    }

    .stat-num {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: 0.72rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
    }

    .card-header {
      margin-bottom: 1rem;
    }

    .card-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .table-subtitle {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .table-container {
      overflow-x: auto;
    }

    .nexus-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.88rem;
    }

    .nexus-table th {
      padding: 0.85rem 1rem;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border-color);
    }

    .nexus-table td {
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-secondary);
    }

    .member-cell {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .avatar-cell {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
      overflow: hidden;
      flex-shrink: 0;
    }

    .avatar-cell img { width: 100%; height: 100%; object-fit: cover; }
    .name-text { font-weight: 600; color: var(--text-primary); }
    .email-text { font-size: 0.75rem; color: var(--text-muted); }

    .role-pill {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
    }

    .role-admin { background: rgba(244, 63, 94, 0.15); color: #f43f5e; }
    .role-project_manager { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .role-team_member { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    .role-viewer { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }

    .role-select {
      padding: 0.4rem 0.65rem;
      border-radius: 6px;
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      color: var(--text-primary);
      font-size: 0.78rem;
    }

    .self-tag {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-style: italic;
    }

    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
    }

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

    .form-input {
      padding: 0.65rem 0.85rem;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      color: var(--text-primary);
      font-size: 0.9rem;
      outline: none;
    }

    .btn {
      padding: 0.65rem 1.15rem;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-primary { background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary)); color: #fff; border: none; }
    .btn-secondary { background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-secondary); }
  `]
})
export class OrganizationComponent implements OnInit {
  public readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  public readonly currentOrg = signal<Organization | null>(null);
  public readonly members = signal<OrganizationMember[]>([]);
  public readonly allUsers = signal<User[]>([]);
  public readonly showInviteModal = signal(false);

  public readonly inviteForm: FormGroup = this.fb.group({
    userId: ['', Validators.required],
    role: ['TEAM_MEMBER', Validators.required]
  });

  ngOnInit(): void {
    this.loadOrgData();
    this.http.get<{ success: boolean; users: User[] }>(`${getApiBaseUrl()}/auth/users`).subscribe({
      next: (res) => {
        if (res.success) this.allUsers.set(res.users);
      }
    });
  }

  loadOrgData(): void {
    const org = this.authService.currentOrg();
    if (!org) return;

    this.http.get<{ success: boolean; organization: Organization; members: OrganizationMember[] }>(
      `${getApiBaseUrl()}/organizations/${org.id}`
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.currentOrg.set(res.organization);
          this.members.set(res.members);
        }
      }
    });
  }

  updateRole(userId: string, event: Event): void {
    const role = (event.target as HTMLSelectElement).value;
    const org = this.currentOrg();
    if (!org) return;

    this.http.put(`${getApiBaseUrl()}/organizations/${org.id}/members/${userId}`, { role }).subscribe({
      next: () => {
        this.toast.success('Role updated successfully.');
        this.loadOrgData();
      }
    });
  }

  openInviteModal(): void {
    this.inviteForm.reset({ userId: '', role: 'TEAM_MEMBER' });
    this.showInviteModal.set(true);
  }

  closeInviteModal(): void {
    this.showInviteModal.set(false);
  }

  submitInvite(): void {
    if (this.inviteForm.invalid) return;

    const org = this.currentOrg();
    if (!org) return;

    this.http.post(`${getApiBaseUrl()}/organizations/${org.id}/members`, this.inviteForm.value).subscribe({
      next: () => {
        this.toast.success('Member added to organization.');
        this.closeInviteModal();
        this.loadOrgData();
      }
    });
  }
}
