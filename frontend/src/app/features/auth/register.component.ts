import { IconComponent } from '../../shared/components/icon.component';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-brand">
          <div class="auth-logo"><app-icon name="logo" [size]="28" /></div>
          <h1 class="auth-title">Create Account</h1>
          <p class="auth-subtitle">Join the engineering workspace and start collaborating</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label for="name" class="form-label">Full Name</label>
            <input
              id="name"
              type="text"
              formControlName="name"
              placeholder="e.g. Alex Mercer"
              class="form-input"
              [class.input-error]="isFieldInvalid('name')"
            />
          </div>

          <div class="form-group">
            <label for="email" class="form-label">Work Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="e.g. alex@company.com"
              class="form-input"
              [class.input-error]="isFieldInvalid('email')"
            />
          </div>

          <div class="form-group">
            <label for="department" class="form-label">Department / Discipline</label>
            <select id="department" formControlName="department" class="form-input">
              <option value="Frontend Architecture">Frontend Architecture</option>
              <option value="Backend Services">Backend Services</option>
              <option value="Cloud Infrastructure">Cloud Infrastructure</option>
              <option value="Product Design">Product Design</option>
              <option value="Quality Engineering">Quality Engineering</option>
            </select>
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="At least 6 characters"
              class="form-input"
              [class.input-error]="isFieldInvalid('password')"
            />
          </div>

          <button type="submit" class="submit-btn" [disabled]="registerForm.invalid || isLoading()">
            @if (isLoading()) {
              <span>Creating Account...</span>
            } @else {
              <span style="display:inline-flex;align-items:center;gap:0.45rem;">Complete Registration <app-icon name="arrow-right" [size]="16" /></span>
            }
          </button>
        </form>

        <div class="auth-footer">
          <span>Already registered? </span>
          <a routerLink="/auth/login" class="link-highlight">Sign in here</a>
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
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .form-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
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
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  public readonly isLoading = signal(false);

  public readonly registerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    department: ['Frontend Architecture'],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isFieldInvalid(name: string): boolean {
    const control = this.registerForm.get(name);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}
