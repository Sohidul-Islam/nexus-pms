import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="toast-container" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-card" [ngClass]="'toast-' + toast.type">
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') {
                <app-icon name="check" [size]="15" />
              }
              @case ('error') {
                <app-icon name="error" [size]="16" />
              }
              @case ('warning') {
                <app-icon name="warning" [size]="15" />
              }
              @case ('info') {
                <app-icon name="info" [size]="16" />
              }
            }
          </div>
          <div class="toast-content">
            @if (toast.title) {
              <div class="toast-title">{{ toast.title }}</div>
            }
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button
            class="toast-close"
            (click)="toastService.dismiss(toast.id)"
            aria-label="Dismiss notification"
            title="Dismiss"
          >
            <app-icon name="close" [size]="13" />
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.25rem;
      right: 1.25rem;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      max-width: 420px;
      width: calc(100vw - 2.5rem);
      pointer-events: none;
    }

    .toast-card {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      padding: 0.85rem 1.1rem;
      border-radius: 12px;
      background: var(--bg-card);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.35), 0 8px 10px -6px rgba(0, 0, 0, 0.25);
      border: 1px solid var(--border-color);
      animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      transition: all 0.2s ease;
      backdrop-filter: blur(12px);
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .toast-success .toast-icon {
      background: rgba(16, 185, 129, 0.18);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .toast-error .toast-icon {
      background: rgba(244, 63, 94, 0.18);
      color: #f43f5e;
      border: 1px solid rgba(244, 63, 94, 0.3);
    }
    .toast-warning .toast-icon {
      background: rgba(245, 158, 11, 0.18);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .toast-info .toast-icon {
      background: rgba(59, 130, 246, 0.18);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .toast-content {
      flex: 1;
      font-size: 0.88rem;
      min-width: 0;
    }

    .toast-title {
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--text-primary);
      margin-bottom: 0.2rem;
      line-height: 1.25;
    }

    .toast-message {
      color: var(--text-secondary);
      line-height: 1.35;
      word-break: break-word;
    }

    .toast-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 6px;
      padding: 0;
      transition: all 0.15s ease;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .toast-close:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }
  `]
})
export class ToastContainerComponent {
  public readonly toastService = inject(ToastService);
}
