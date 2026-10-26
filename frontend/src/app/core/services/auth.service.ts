import { getApiBaseUrl } from '../config/api.config';
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { User, AuthResponse, LoginCredentials, RegisterPayload } from '../models/user.model';
import { Organization } from '../models/organization.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  private readonly API_URL = getApiBaseUrl();
  private readonly TOKEN_KEY = 'nexus_auth_token';
  private readonly USER_KEY = 'nexus_user_profile';
  private readonly ORG_KEY = 'nexus_active_org';

  // Signals State
  public readonly currentUser = signal<User | null>(this.getStoredUser());
  public readonly currentOrg = signal<Organization | null>(this.getStoredOrg());
  public readonly token = signal<string | null>(this.getStoredToken());

  // Computed Signals
  public readonly isAuthenticated = computed(() => !!this.token() && !!this.currentUser());
  public readonly userRole = computed(() => this.currentUser()?.role || null);
  public readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');
  public readonly isPM = computed(() => this.currentUser()?.role === 'PROJECT_MANAGER' || this.isAdmin());
  public readonly canEdit = computed(() => this.currentUser()?.role !== 'VIEWER');

  public login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.token) {
          this.setSession(response.token, response.user, response.organization);
          this.toast.success(`Welcome back, ${response.user.name}!`);
        }
      }),
      catchError(err => {
        const msg = err.error?.error || 'Invalid credentials or connection error.';
        this.toast.error(msg, 'Authentication Failed');
        return throwError(() => err);
      })
    );
  }

  public register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/register`, payload).pipe(
      tap(response => {
        if (response.success && response.token) {
          this.setSession(response.token, response.user, response.organization);
          this.toast.success('Registration completed. Account activated!');
        }
      }),
      catchError(err => {
        const msg = err.error?.error || 'Registration failed.';
        this.toast.error(msg, 'Registration Error');
        return throwError(() => err);
      })
    );
  }

  public fetchProfile(): Observable<{ success: boolean; user: User; organizations: Organization[] }> {
    return this.http.get<{ success: boolean; user: User; organizations: Organization[] }>(`${this.API_URL}/auth/me`).pipe(
      tap(res => {
        if (res.success && res.user) {
          this.currentUser.set(res.user);
          localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
          if (res.organizations?.length && !this.currentOrg()) {
            this.currentOrg.set(res.organizations[0]);
            localStorage.setItem(this.ORG_KEY, JSON.stringify(res.organizations[0]));
          }
        }
      })
    );
  }

  public updateProfile(data: Partial<User> & { newPassword?: string }): Observable<any> {
    return this.http.put(`${this.API_URL}/auth/profile`, data).pipe(
      tap((res: any) => {
        if (res.success && res.user) {
          this.currentUser.set(res.user);
          localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
          this.toast.success('Profile updated successfully.');
        }
      })
    );
  }

  public switchOrganization(org: Organization): void {
    this.currentOrg.set(org);
    localStorage.setItem(this.ORG_KEY, JSON.stringify(org));
    this.toast.info(`Switched workspace to ${org.name}`);
  }

  public logout(): void {
    this.token.set(null);
    this.currentUser.set(null);
    this.currentOrg.set(null);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ORG_KEY);
    this.toast.info('You have been logged out.');
    this.router.navigate(['/auth/login']);
  }

  public hasRole(roles: string[]): boolean {
    const current = this.currentUser()?.role;
    return !!current && roles.includes(current);
  }

  private setSession(token: string, user: User, org?: Organization): void {
    this.token.set(token);
    this.currentUser.set(user);
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));

    if (org) {
      this.currentOrg.set(org);
      localStorage.setItem(this.ORG_KEY, JSON.stringify(org));
    }
  }

  private getStoredToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): User | null {
    if (typeof localStorage === 'undefined') return null;
    const data = localStorage.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  }

  private getStoredOrg(): Organization | null {
    if (typeof localStorage === 'undefined') return null;
    const data = localStorage.getItem(this.ORG_KEY);
    return data ? JSON.parse(data) : null;
  }
}
