import { Response } from 'express';

export interface RealtimeEvent {
  type: 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_DELETED' | 'COMMENT_ADDED' | 'NOTIFICATION' | 'ACTIVITY';
  payload: any;
  timestamp: string;
}

class EventBroadcaster {
  private clients: Set<Response> = new Set();

  public addClient(res: Response): void {
    this.clients.add(res);
    console.log(`[Realtime] Client connected. Active streams: ${this.clients.size}`);

    res.on('close', () => {
      this.clients.delete(res);
      console.log(`[Realtime] Client disconnected. Active streams: ${this.clients.size}`);
    });
  }

  public broadcast(event: Omit<RealtimeEvent, 'timestamp'>): void {
    const fullEvent: RealtimeEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    const data = `data: ${JSON.stringify(fullEvent)}\n\n`;
    for (const client of this.clients) {
      try {
        client.write(data);
      } catch (err) {
        console.error('[Realtime] Failed to write to client:', err);
        this.clients.delete(client);
      }
    }
  }
}

export const realtimeHub = new EventBroadcaster();
