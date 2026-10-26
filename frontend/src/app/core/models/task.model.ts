import { PriorityLevel } from './project.model';
import { UserRole } from './user.model';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type TaskType = 'FEATURE' | 'BUG' | 'IMPROVEMENT' | 'TASK';

export interface Task {
  id: string;
  project_id: string;
  task_number: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: PriorityLevel;
  type: TaskType;
  assignee_id?: string;
  assignee_name?: string;
  assignee_avatar?: string;
  assignee_email?: string;
  reporter_id?: string;
  reporter_name?: string;
  reporter_avatar?: string;
  project_name?: string;
  project_key?: string;
  estimated_hours?: number;
  logged_hours?: number;
  due_date?: string;
  order_index?: number;
  comment_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  user_role?: UserRole;
  content: string;
  created_at: string;
  updated_at?: string;
}
