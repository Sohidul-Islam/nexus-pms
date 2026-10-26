import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  // Angular Signal managing active toast notifications
  public readonly toasts = signal<Toast[]>([]);
  private readonly maxToasts = 3;
  private readonly recentToastHistory = new Map<string, number>();

  public show(toast: Omit<Toast, 'id'>): void {
    const rawMsg = (toast.message || '').trim();
    if (!rawMsg) return;

    const normalizedKey = (toast.type + ':' + rawMsg).toLowerCase();
    const now = Date.now();

    // 1. Suppress identical messages fired within 2500ms (debounce & deduplicate)
    const lastSeen = this.recentToastHistory.get(normalizedKey);
    if (lastSeen && now - lastSeen < 2500) {
      return;
    }
    this.recentToastHistory.set(normalizedKey, now);

    // Garbage-collect old history entries
    if (this.recentToastHistory.size > 30) {
      for (const [k, timestamp] of this.recentToastHistory.entries()) {
        if (now - timestamp > 10000) {
          this.recentToastHistory.delete(k);
        }
      }
    }

    // 2. Prevent duplicate messages currently displayed
    if (this.toasts().some(t => t.message.trim().toLowerCase() === rawMsg.toLowerCase())) {
      return;
    }

    const id = 'toast-' + now + '-' + Math.random().toString(36).substring(2, 6);
    const duration = toast.duration ?? (toast.type === 'error' ? 5000 : 3500);
    const newToast: Toast = { ...toast, id, duration };

    this.toasts.update(current => {
      const next = [...current, newToast];
      return next.length > this.maxToasts ? next.slice(next.length - this.maxToasts) : next;
    });

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  public success(message: string, title?: string): void {
    this.show({ type: 'success', message, title: title || 'Success' });
  }

  public error(message: string, title?: string): void {
    this.show({ type: 'error', message, title: title || 'Error', duration: 5000 });
  }

  public info(message: string, title?: string): void {
    this.show({ type: 'info', message, title: title || 'Info' });
  }

  public warning(message: string, title?: string): void {
    this.show({ type: 'warning', message, title: title || 'Warning', duration: 4500 });
  }

  public dismiss(id: string): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
