import { getApiBaseUrl } from '../config/api.config';
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { UserNotification } from '../models/activity.model';
import { RealtimeService } from './realtime.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly realtime = inject(RealtimeService);
  private readonly API_URL = `${getApiBaseUrl()}/notifications`;

  // Signals State
  public readonly notifications = signal<UserNotification[]>([]);
  public readonly unreadCount = signal<number>(0);

  constructor() {
    // Listen for realtime notifications
    this.realtime.stream$.subscribe(event => {
      if (event.type === 'NOTIFICATION') {
        this.unreadCount.update(c => c + 1);
        this.loadNotifications().subscribe();
      }
    });
  }

  public loadNotifications(): Observable<{ success: boolean; notifications: UserNotification[]; unreadCount: number }> {
    return this.http.get<{ success: boolean; notifications: UserNotification[]; unreadCount: number }>(this.API_URL).pipe(
      tap(res => {
        if (res.success) {
          this.notifications.set(res.notifications);
          this.unreadCount.set(res.unreadCount);
        }
      })
    );
  }

  public markAsRead(id: string): Observable<any> {
    return this.http.patch(`${this.API_URL}/${id}/read`, {}).pipe(
      tap(() => {
        this.notifications.update(list =>
          list.map(n => (n.id === id ? { ...n, is_read: 1 } : n))
        );
        this.unreadCount.update(c => Math.max(0, c - 1));
      })
    );
  }

  public markAllAsRead(): Observable<any> {
    return this.http.post(`${this.API_URL}/read-all`, {}).pipe(
      tap(() => {
        this.notifications.update(list => list.map(n => ({ ...n, is_read: 1 })));
        this.unreadCount.set(0);
      })
    );
  }
}
