export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  key: string;
  description?: string;
  status: ProjectStatus;
  priority: PriorityLevel;
  lead_id?: string;
  lead_name?: string;
  lead_avatar?: string;
  lead_email?: string;
  organization_name?: string;
  budget?: number;
  start_date?: string;
  target_date?: string;
  total_tasks?: number;
  done_tasks?: number;
  progress?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectDetailResponse {
  success: boolean;
  project: Project;
  statusCounts: { status: string; count: number }[];
  hours: { estimated: number; logged: number };
  team: { id: string; name: string; email: string; avatar_url?: string; role: string }[];
}
