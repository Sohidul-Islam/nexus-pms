import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-card" [ngClass]="'toast-' + toast.type">
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') { <span>?</span> }
              @case ('error') { <span>?</span> }
              @case ('warning') { <span>?</span> }
              @case ('info') { <span>?</span> }
            }
          </div>
          <div class="toast-content">
            @if (toast.title) {
              <div class="toast-title">{{ toast.title }}</div>
            }
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" (click)="toastService.dismiss(toast.id)" aria-label="Close">?</button>
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
      gap: 0.75rem;
      max-width: 400px;
      width: calc(100vw - 2.5rem);
      pointer-events: none;
    }

    .toast-card {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      padding: 0.9rem 1.1rem;
      border-radius: 12px;
      background: var(--bg-card);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
      border: 1px solid var(--border-color);
      animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      transition: all 0.2s ease;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .toast-icon {
      font-size: 1.1rem;
      font-weight: 700;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .toast-success .toast-icon { background: rgba(16, 185, 129, 0.2); color: #10b981; }
    .toast-error .toast-icon { background: rgba(244, 63, 94, 0.2); color: #f43f5e; }
    .toast-warning .toast-icon { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
    .toast-info .toast-icon { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }

    .toast-content {
      flex: 1;
      font-size: 0.88rem;
    }

    .toast-title {
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.2rem;
    }

    .toast-message {
      color: var(--text-secondary);
      line-height: 1.35;
    }

    .toast-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.9rem;
      padding: 0 0.2rem;
      transition: color 0.15s;
    }

    .toast-close:hover {
      color: var(--text-primary);
    }
  `]
})
export class ToastContainerComponent {
  public readonly toastService = inject(ToastService);
}
