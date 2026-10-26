import { IconComponent } from '../../shared/components/icon.component';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService, Theme } from '../../core/services/theme.service';
import { ToastService } from '../../core/services/toast.service';
import { InitialsPipe } from '../../shared/pipes/initials.pipe';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InitialsPipe,
    IconComponent],
  template: `
    <div class="settings-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Workspace Settings & Preferences</h1>
          <p class="page-subtitle">Configure your personal profile, security credentials, and application appearance</p>
        </div>
      </div>

      <div class="settings-grid">
        <!-- Profile Card -->
        <div class="card">
          <h2 class="card-title">User Profile Details</h2>
          <p class="card-subtitle">Manage your public information within the team workspace</p>

          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="settings-form">
            <div class="avatar-preview-row">
              <div class="large-avatar">
                @if (profileForm.get('avatar_url')?.value) {
                  <img [src]="profileForm.get('avatar_url')?.value" alt="Avatar Preview" />
                } @else {
                  <span>{{ profileForm.get('name')?.value | initials }}</span>
                }
              </div>
              <div class="avatar-inputs">
                <label class="form-label">Avatar Image URL</label>
                <input type="text" formControlName="avatar_url" class="form-input" placeholder="https://..." />
                <span class="field-hint">Supports Unsplash, DiceBear, or HTTPS image links</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input type="text" formControlName="name" class="form-input" />
            </div>

            <div class="form-group">
              <label class="form-label">Email Address (Read-only)</label>
              <input type="email" [value]="authService.currentUser()?.email" disabled class="form-input disabled-input" />
            </div>

            <div class="form-group">
              <label class="form-label">Department / Title</label>
              <input type="text" formControlName="department" class="form-input" />
            </div>

            <button type="submit" class="btn btn-primary" [disabled]="profileForm.invalid || isSavingProfile()">
              {{ isSavingProfile() ? 'Saving...' : 'Save Profile Changes' }}
            </button>
          </form>
        </div>

        <!-- Security & Appearance Column -->
        <div class="side-settings-col">
          <!-- Appearance Card -->
          <div class="card">
            <h2 class="card-title">Theme & Appearance</h2>
            <p class="card-subtitle">Select visual design preference</p>

            <div class="theme-picker">
              <button
                class="theme-btn"
                [class.active]="themeService.theme() === 'dark'"
                (click)="themeService.setTheme('dark')"
              >
                <span class="theme-icon"><app-icon name="moon" [size]="22" /></span>
                <span class="theme-name">Dark Mode</span>
                <span class="theme-desc">High-contrast, eye-friendly</span>
              </button>

              <button
                class="theme-btn"
                [class.active]="themeService.theme() === 'light'"
                (click)="themeService.setTheme('light')"
              >
                <span class="theme-icon"><app-icon name="sun" [size]="22" /></span>
                <span class="theme-name">Light Mode</span>
                <span class="theme-desc">Clean, crisp daytime view</span>
              </button>
            </div>
          </div>

          <!-- Password / Security Card -->
          <div class="card" style="margin-top: 1.5rem;">
            <h2 class="card-title">Security & Password</h2>
            <p class="card-subtitle">Update your account login password</p>

            <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="settings-form">
              <div class="form-group">
                <label class="form-label">New Password</label>
                <input type="password" formControlName="newPassword" placeholder="Enter password" class="form-input" />
              </div>

              <div class="form-group">
                <label class="form-label">Confirm New Password</label>
                <input type="password" formControlName="confirmPassword" placeholder="Enter password" class="form-input" />
              </div>

              <button type="submit" class="btn btn-secondary" [disabled]="passwordForm.invalid || isChangingPassword()">
                {{ isChangingPassword() ? 'Updating...' : 'Update Password' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
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

    .settings-grid {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 1.5rem;
    }

    @media (max-width: 900px) {
      .settings-grid { grid-template-columns: 1fr; }
    }

    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 18px;
      padding: 1.75rem;
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
      margin: 0.2rem 0 1.25rem;
    }

    .settings-form {
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
    }

    .avatar-preview-row {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 0.5rem;
    }

    .large-avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 1.35rem;
      font-weight: 800;
      overflow: hidden;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .large-avatar img { width: 100%; height: 100%; object-fit: cover; }

    .avatar-inputs {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .field-hint {
      font-size: 0.72rem;
      color: var(--text-muted);
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
      padding: 0.7rem 0.95rem;
      border-radius: 10px;
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      color: var(--text-primary);
      font-size: 0.9rem;
      outline: none;
    }

    .form-input:focus {
      border-color: var(--brand-primary);
    }

    .disabled-input {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .theme-picker {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.85rem;
    }

    .theme-btn {
      background: var(--bg-surface);
      border: 2px solid var(--border-color);
      border-radius: 12px;
      padding: 1.1rem;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.35rem;
      transition: all 0.15s;
    }

    .theme-btn:hover {
      background: var(--bg-hover);
      border-color: var(--border-hover);
    }

    .theme-btn.active {
      border-color: var(--brand-primary);
      background: rgba(59, 130, 246, 0.08);
    }

    .theme-icon { font-size: 1.5rem; }
    .theme-name { font-weight: 700; font-size: 0.88rem; color: var(--text-primary); }
    .theme-desc { font-size: 0.72rem; color: var(--text-muted); }

    .btn {
      padding: 0.75rem 1.25rem;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-primary { background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary)); color: #fff; border: none; }
    .btn-secondary { background: var(--bg-surface); border: 1px solid var(--border-color); color: var(--text-primary); }
  `]
})
export class SettingsComponent implements OnInit {
  public readonly authService = inject(AuthService);
  public readonly themeService = inject(ThemeService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  public readonly isSavingProfile = signal(false);
  public readonly isChangingPassword = signal(false);

  public readonly profileForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    department: [''],
    avatar_url: ['']
  });

  public readonly passwordForm: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  });

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.profileForm.patchValue({
        name: user.name,
        department: user.department || '',
        avatar_url: user.avatar_url || ''
      });
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;

    this.isSavingProfile.set(true);
    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: () => this.isSavingProfile.set(false),
      error: () => this.isSavingProfile.set(false)
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;

    const { newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      this.toast.error('Passwords do not match.', 'Validation Error');
      return;
    }

    this.isChangingPassword.set(true);
    this.authService.updateProfile({ newPassword }).subscribe({
      next: () => {
        this.isChangingPassword.set(false);
        this.passwordForm.reset();
        this.toast.success('Password changed successfully.');
      },
      error: () => this.isChangingPassword.set(false)
    });
  }
}
