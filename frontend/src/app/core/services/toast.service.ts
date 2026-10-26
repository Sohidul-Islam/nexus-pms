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

  public show(toast: Omit<Toast, 'id'>): void {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: Toast = { ...toast, id, duration: toast.duration ?? 4000 };

    this.toasts.update(current => [...current, newToast]);

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
