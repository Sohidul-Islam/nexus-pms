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
  private readonly maxToasts = 4;
  private lastToastTime = 0;
  private lastToastKey = '';

  public show(toast: Omit<Toast, 'id'>): void {
    const key = toast.type + ':' + toast.message;
    const now = Date.now();

    // Deduplicate identical toasts fired in rapid succession (< 1500ms)
    if (key === this.lastToastKey && now - this.lastToastTime < 1500) {
      return;
    }
    this.lastToastKey = key;
    this.lastToastTime = now;

    // Check if an identical toast is already active in the list
    if (this.toasts().some(t => t.type === toast.type && t.message === toast.message)) {
      return;
    }

    const id = 'toast-' + now + '-' + Math.random().toString(36).substring(2, 6);
    const newToast: Toast = { ...toast, id, duration: toast.duration ?? 4000 };

    this.toasts.update(current => {
      const next = [...current, newToast];
      return next.length > this.maxToasts ? next.slice(next.length - this.maxToasts) : next;
    });

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, newToast.duration);
    }
  }

  public success(message: string, title?: string): void {
    this.show({ type: 'success', message, title: title || 'Success' });
  }

  public error(message: string, title?: string): void {
    this.show({ type: 'error', message, title: title || 'Error', duration: 5500 });
  }

  public info(message: string, title?: string): void {
    this.show({ type: 'info', message, title: title || 'Info' });
  }

  public warning(message: string, title?: string): void {
    this.show({ type: 'warning', message, title: title || 'Warning' });
  }

  public dismiss(id: string): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
