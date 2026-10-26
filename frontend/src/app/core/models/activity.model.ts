export interface Activity {
  id: string;
  organization_id?: string;
  project_id?: string;
  task_id?: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  user_role?: string;
  project_name?: string;
  project_key?: string;
  action: string;
  details: Record<string, any>;
  created_at: string;
}

export interface UserNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'TASK_ASSIGNED' | 'STATUS_CHANGED' | 'COMMENT_ADDED' | 'DEADLINE_APPROACHING' | 'INFO';
  link?: string;
  is_read: number;
  created_at: string;
}
