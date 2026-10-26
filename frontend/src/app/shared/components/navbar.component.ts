import { IconComponent } from './icon.component';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationService } from '../../core/services/notification.service';
import { RealtimeService } from '../../core/services/realtime.service';
import { InitialsPipe } from '../pipes/initials.pipe';
import { TimeAgoPipe } from '../pipes/time-ago.pipe';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, InitialsPipe, TimeAgoPipe, IconComponent],
  template: `
    <header class="nexus-header">
      <div class="header-left">
        <a routerLink="/dashboard" class="brand-link">
          <div class="brand-logo">
            <span class="logo-symbol"><app-icon name="logo" [size]="20" /></span>
          </div>
          <div class="brand-text">
            <span class="brand-title">NEXUS</span>
            <span class="brand-subtitle">Enterprise PMS</span>
          </div>
        </a>

        <!-- Organization Selector Dropdown -->
        @if (authService.currentOrg(); as org) {
          <div class="org-selector">
            <span class="org-icon"><app-icon name="building" [size]="15" /></span>
            <span class="org-name">{{ org.name }}</span>
            <span class="org-tier">{{ org.plan || 'Enterprise' }}</span>
          </div>
        }
      </div>

      <div class="header-right">
        <!-- Live Real-Time Pulse Indicator -->
        <div class="realtime-pill" [class.connected]="realtimeService.isConnected()">
          <span class="pulse-dot"></span>
          <span class="pill-text">{{ realtimeService.isConnected() ? 'Live Sync Active' : 'Connecting...' }}</span>
        </div>

        <!-- Theme Toggle -->
        <button class="icon-btn" (click)="themeService.toggleTheme()" aria-label="Toggle Theme" [title]="'Switch to ' + (themeService.theme() === 'dark' ? 'Light' : 'Dark') + ' Mode'">
          <app-icon [name]="themeService.theme() === 'dark' ? 'sun' : 'moon'" [size]="18" />
        </button>

        <!-- Notifications Dropdown Trigger -->
        <div class="notif-wrapper">
          <button class="icon-btn notif-btn" (click)="toggleNotifDropdown()" aria-label="Notifications">
            <app-icon name="bell" [size]="18" />
            @if (notifService.unreadCount() > 0) {
              <span class="notif-badge">{{ notifService.unreadCount() }}</span>
            }
          </button>

          @if (showNotifDropdown()) {
            <div class="notif-dropdown">
              <div class="notif-header">
                <span class="notif-title">Notifications</span>
                @if (notifService.unreadCount() > 0) {
                  <button class="notif-action" (click)="notifService.markAllAsRead().subscribe()">Mark all as read</button>
                }
              </div>
              <div class="notif-list">
                @for (item of notifService.notifications(); track item.id) {
                  <div class="notif-item" [class.unread]="item.is_read === 0" (click)="markAsRead(item.id)">
                    <div class="notif-item-title">{{ item.title }}</div>
                    <div class="notif-item-msg">{{ item.message }}</div>
                    <div class="notif-item-time">{{ item.created_at | timeAgo }}</div>
                  </div>
                } @empty {
                  <div class="notif-empty">No notifications yet.</div>
                }
              </div>
            </div>
          }
        </div>

        <!-- User Profile Menu -->
        @if (authService.currentUser(); as user) {
          <div class="user-menu-wrapper">
            <button class="user-pill-btn" (click)="toggleUserDropdown()">
              <div class="user-avatar-small">
                @if (user.avatar_url) {
                  <img [src]="user.avatar_url" [alt]="user.name" />
                } @else {
                  <span>{{ user.name | initials }}</span>
                }
              </div>
              <div class="user-details-text">
                <span class="user-name-text">{{ user.name }}</span>
                <span class="user-role-text">{{ user.role }}</span>
              </div>
              <span class="chevron">?</span>
            </button>

            @if (showUserDropdown()) {
              <div class="user-dropdown">
                <div class="dropdown-header">
                  <div class="dropdown-user-name">{{ user.name }}</div>
                  <div class="dropdown-user-email">{{ user.email }}</div>
                  <div class="dropdown-user-dept">{{ user.department || 'Engineering' }}</div>
                </div>
                <div class="dropdown-divider"></div>
                <a routerLink="/settings" class="dropdown-item" (click)="closeDropdowns()">
                  <span style="display:flex;align-items:center;gap:0.5rem;"><app-icon name="settings" [size]="16" /> Account Settings</span>
                </a>
                <a routerLink="/organizations" class="dropdown-item" (click)="closeDropdowns()">
                  <span style="display:flex;align-items:center;gap:0.5rem;"><app-icon name="team" [size]="16" /> Organization & Teams</span>
                </a>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item logout-item" (click)="authService.logout()">
                  <span style="display:flex;align-items:center;gap:0.5rem;"><app-icon name="logout" [size]="16" /> Log Out</span>
                </button>
              </div>
            }
          </div>
        }
      </div>
    </header>
  `,
  styles: [`
    .nexus-header {
      height: 68px;
      background: var(--bg-card);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.75rem;
      position: sticky;
      top: 0;
      z-index: 999;
      backdrop-filter: blur(8px);
    }

    .header-left, .header-right {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .brand-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
    }

    .brand-logo {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
    }

    .logo-symbol {
      color: #ffffff;
      font-size: 1.35rem;
      font-weight: 800;
    }

    .brand-title {
      font-size: 1.15rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: var(--text-primary);
      display: block;
      line-height: 1;
    }

    .brand-subtitle {
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      display: block;
      margin-top: 0.2rem;
    }

    .org-selector {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      font-size: 0.82rem;
      margin-left: 0.5rem;
    }

    .org-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .org-tier {
      font-size: 0.72rem;
      background: rgba(99, 102, 241, 0.15);
      color: var(--brand-secondary);
      padding: 0.1rem 0.4rem;
      border-radius: 6px;
      font-weight: 600;
    }

    .realtime-pill {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      font-size: 0.78rem;
      color: var(--text-secondary);
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #94a3b8;
    }

    .realtime-pill.connected .pulse-dot {
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: pulse 1.8s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.95); opacity: 0.8; }
    }

    .icon-btn {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      color: var(--text-primary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      transition: all 0.15s ease;
      position: relative;
    }

    .icon-btn:hover {
      background: var(--bg-hover);
      border-color: var(--border-hover);
    }

    .notif-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #f43f5e;
      color: #fff;
      font-size: 0.68rem;
      font-weight: 700;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--bg-card);
    }

    .notif-wrapper, .user-menu-wrapper {
      position: relative;
    }

    .notif-dropdown, .user-dropdown {
      position: absolute;
      top: calc(100% + 12px);
      right: 0;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.25);
      z-index: 1000;
      overflow: hidden;
      animation: dropdownFade 0.15s ease;
    }

    @keyframes dropdownFade {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .notif-dropdown {
      width: 340px;
    }

    .notif-header {
      padding: 0.9rem 1.1rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .notif-title {
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--text-primary);
    }

    .notif-action {
      background: transparent;
      border: none;
      color: var(--brand-primary);
      font-size: 0.78rem;
      cursor: pointer;
    }

    .notif-list {
      max-height: 320px;
      overflow-y: auto;
    }

    .notif-item {
      padding: 0.8rem 1.1rem;
      border-bottom: 1px solid var(--border-color);
      cursor: pointer;
      transition: background 0.15s;
    }

    .notif-item:hover {
      background: var(--bg-hover);
    }

    .notif-item.unread {
      background: rgba(59, 130, 246, 0.06);
      border-left: 3px solid var(--brand-primary);
    }

    .notif-item-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .notif-item-msg {
      font-size: 0.78rem;
      color: var(--text-secondary);
      margin: 0.2rem 0;
      line-height: 1.35;
    }

    .notif-item-time {
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .notif-empty {
      padding: 2rem 1rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    .user-pill-btn {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      padding: 0.3rem 0.85rem 0.3rem 0.35rem;
      border-radius: 24px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .user-pill-btn:hover {
      border-color: var(--border-hover);
      background: var(--bg-hover);
    }

    .user-avatar-small {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 0.78rem;
      font-weight: 700;
      overflow: hidden;
    }

    .user-avatar-small img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .user-details-text {
      display: flex;
      flex-direction: column;
      text-align: left;
    }

    .user-name-text {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .user-role-text {
      font-size: 0.68rem;
      color: var(--text-muted);
      text-transform: capitalize;
    }

    .chevron {
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .user-dropdown {
      width: 230px;
    }

    .dropdown-header {
      padding: 1rem;
    }

    .dropdown-user-name {
      font-weight: 700;
      font-size: 0.92rem;
      color: var(--text-primary);
    }

    .dropdown-user-email {
      font-size: 0.78rem;
      color: var(--text-muted);
      margin: 0.15rem 0;
    }

    .dropdown-user-dept {
      font-size: 0.72rem;
      color: var(--brand-primary);
      font-weight: 600;
    }

    .dropdown-divider {
      height: 1px;
      background: var(--border-color);
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.75rem 1rem;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.85rem;
      width: 100%;
      background: transparent;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s, color 0.15s;
    }

    .dropdown-item:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }

    .logout-item:hover {
      color: #f43f5e;
      background: rgba(244, 63, 94, 0.08);
    }
  `]
})
export class NavbarComponent {
  public readonly authService = inject(AuthService);
  public readonly themeService = inject(ThemeService);
  public readonly notifService = inject(NotificationService);
  public readonly realtimeService = inject(RealtimeService);

  public readonly showNotifDropdown = signal(false);
  public readonly showUserDropdown = signal(false);

  toggleNotifDropdown(): void {
    this.showNotifDropdown.update(v => !v);
    this.showUserDropdown.set(false);
    if (this.showNotifDropdown()) {
      this.notifService.loadNotifications().subscribe();
    }
  }

  toggleUserDropdown(): void {
    this.showUserDropdown.update(v => !v);
    this.showNotifDropdown.set(false);
  }

  closeDropdowns(): void {
    this.showNotifDropdown.set(false);
    this.showUserDropdown.set(false);
  }

  markAsRead(id: string): void {
    this.notifService.markAsRead(id).subscribe();
  }
}
