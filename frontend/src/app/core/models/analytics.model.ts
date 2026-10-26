import { Project } from './project.model';

export interface AnalyticsMetrics {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export interface WorkloadItem {
  id: string;
  name: string;
  avatar_url?: string;
  role: string;
  total_tasks: number;
  done_tasks: number;
  active_tasks: number;
}

export interface AnalyticsOverview {
  metrics: AnalyticsMetrics;
  statusDistribution: {
    TODO: number;
    IN_PROGRESS: number;
    REVIEW: number;
    DONE: number;
  };
  priorityDistribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    URGENT: number;
  };
  workload: WorkloadItem[];
  projects: Project[];
}
