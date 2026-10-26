import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { ToastService } from './toast.service';

export interface RealtimePayload {
  type: 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_DELETED' | 'COMMENT_ADDED' | 'NOTIFICATION' | 'ACTIVITY' | 'CONNECTED';
  payload?: any;
  message?: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class RealtimeService implements OnDestroy {
  private readonly toast = inject(ToastService);
  private eventSource: EventSource | null = null;
  private readonly STREAM_URL = 'http://localhost:3001/api/realtime/stream';

  // Signals State
  public readonly isConnected = signal<boolean>(false);
  public readonly lastEvent = signal<RealtimePayload | null>(null);

  // RxJS Stream
  private readonly events$ = new Subject<RealtimePayload>();

  constructor() {
    this.connect();
  }

  public get stream$(): Observable<RealtimePayload> {
    return this.events$.asObservable();
  }

  public connect(): void {
    if (typeof window === 'undefined') return;

    try {
      this.eventSource = new EventSource(this.STREAM_URL);

      this.eventSource.onopen = () => {
        this.isConnected.set(true);
        console.log('[Realtime] SSE Connection established with backend.');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data: RealtimePayload = JSON.parse(event.data);
          this.lastEvent.set(data);
          this.events$.next(data);

          if (data.type === 'NOTIFICATION' && data.payload?.title) {
            this.toast.info(data.payload.title, 'Real-time Event');
          }
        } catch (e) {
          console.error('[Realtime] Failed to parse SSE event data', e);
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected.set(false);
        this.eventSource?.close();
        // Exponential backoff / retry after 5 seconds
        setTimeout(() => this.connect(), 5000);
      };
    } catch (err) {
      console.warn('[Realtime] SSE could not be started, offline mode active:', err);
    }
  }

  public disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected.set(false);
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
