import { IconComponent } from '../../shared/components/icon.component';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-brand">
          <div class="auth-logo"><app-icon name="logo" [size]="28" /></div>
          <h1 class="auth-title">Welcome to Nexus</h1>
          <p class="auth-subtitle">Sign in to your enterprise project management workspace</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label for="email" class="form-label">Email Address</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="e.g. dev@nexus.io"
              class="form-input"
              [class.input-error]="isFieldInvalid('email')"
            />
            @if (isFieldInvalid('email')) {
              <div class="error-text">Please enter a valid work email.</div>
            }
          </div>

          <div class="form-group">
            <div class="label-row">
              <label for="password" class="form-label">Password</label>
              <span class="forgot-link">Default: Password123!</span>
            </div>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="Password (e.g. Password123!)"
              class="form-input"
              [class.input-error]="isFieldInvalid('password')"
            />
            @if (isFieldInvalid('password')) {
              <div class="error-text">Password is required.</div>
            }
          </div>

          <button type="submit" class="submit-btn" [disabled]="loginForm.invalid || isLoading()">
            @if (isLoading()) {
              <span>Signing In...</span>
            } @else {
              <span style="display:inline-flex;align-items:center;gap:0.45rem;">Sign In to Workspace <app-icon name="arrow-right" [size]="16" /></span>
            }
          </button>
        </form>

        <!-- Demo Accounts Quick Switcher for Testing & Reviewers -->
        <div class="demo-section">
          <div class="demo-title">Fast Portfolio Demo Access:</div>
          <div class="demo-buttons">
            <button class="demo-btn" (click)="quickLogin('admin@nexus.io')">
              <span class="demo-role">Admin</span>
              <span class="demo-email">Sarah (CTO)</span>
            </button>
            <button class="demo-btn" (click)="quickLogin('pm@nexus.io')">
              <span class="demo-role">Lead PM</span>
              <span class="demo-email">Marcus</span>
            </button>
            <button class="demo-btn" (click)="quickLogin('dev@nexus.io')">
              <span class="demo-role">Sr. Angular Dev</span>
              <span class="demo-email">Sohidul</span>
            </button>
            <button class="demo-btn" (click)="quickLogin('viewer@nexus.io')">
              <span class="demo-role">Viewer</span>
              <span class="demo-email">Elena (VP)</span>
            </button>
          </div>
        </div>

        <div class="auth-footer">
          <span>Need an account? </span>
          <a routerLink="/auth/register" class="link-highlight">Register Team Member</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.12), transparent 50%),
                  radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.1), transparent 50%),
                  var(--bg-base);
    }

    .auth-card {
      width: 100%;
      max-width: 480px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 24px;
      padding: 2.75rem 2.5rem;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.25);
    }

    .auth-brand {
      text-align: center;
      margin-bottom: 2rem;
    }

    .auth-logo {
      width: 52px;
      height: 52px;
      margin: 0 auto 1rem;
      border-radius: 14px;
      background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
      color: #fff;
      font-size: 1.8rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 20px rgba(59, 130, 246, 0.35);
    }

    .auth-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0 0 0.4rem;
      letter-spacing: -0.02em;
    }

    .auth-subtitle {
      font-size: 0.88rem;
      color: var(--text-muted);
      margin: 0;
      line-height: 1.4;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .form-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .forgot-link {
      font-size: 0.75rem;
      color: var(--brand-primary);
    }

    .form-input {
      padding: 0.75rem 1rem;
      border-radius: 10px;
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      color: var(--text-primary);
      font-size: 0.92rem;
      outline: none;
      transition: all 0.15s;
    }

    .form-input:focus {
      border-color: var(--brand-primary);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }

    .input-error {
      border-color: #f43f5e;
    }

    .error-text {
      font-size: 0.75rem;
      color: #f43f5e;
    }

    .submit-btn {
      margin-top: 0.5rem;
      padding: 0.85rem 1.25rem;
      background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
      color: #fff;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .demo-section {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px dashed var(--border-color);
    }

    .demo-title {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
    }

    .demo-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }

    .demo-btn {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 0.5rem 0.6rem;
      text-align: left;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      transition: all 0.15s;
    }

    .demo-btn:hover {
      background: var(--bg-hover);
      border-color: var(--brand-primary);
    }

    .demo-role {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--brand-primary);
    }

    .demo-email {
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .link-highlight {
      color: var(--brand-primary);
      text-decoration: none;
      font-weight: 600;
    }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  public readonly isLoading = signal(false);

  // Strongly-typed Angular Reactive Form
  public readonly loginForm: FormGroup = this.fb.group({
    email: ['dev@nexus.io', [Validators.required, Validators.email]],
    password: ['Password123!', [Validators.required, Validators.minLength(6)]]
  });

  isFieldInvalid(name: string): boolean {
    const control = this.loginForm.get(name);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  quickLogin(email: string): void {
    this.loginForm.patchValue({
      email,
      password: 'Password123!'
    });
    this.onSubmit();
  }
}
