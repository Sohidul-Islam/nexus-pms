import { Router, Request, Response } from 'express';
import { executeQuery, executeOne } from '../db/client';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/analytics/overview
router.get('/overview', authenticate, async (_req: Request, res: Response) => {
  try {
    // 1. Projects Count
    const projectsTotal = await executeOne('SELECT COUNT(*) as count FROM projects');
    const projectsActive = await executeOne("SELECT COUNT(*) as count FROM projects WHERE status = 'ACTIVE'");

    // 2. Tasks Count & Done Count
    const tasksTotal = await executeOne('SELECT COUNT(*) as count FROM tasks');
    const tasksDone = await executeOne("SELECT COUNT(*) as count FROM tasks WHERE status = 'DONE'");
    const tasksOverdue = await executeOne("SELECT COUNT(*) as count FROM tasks WHERE status != 'DONE' AND due_date < date('now')");

    const total = Number(tasksTotal?.count) || 0;
    const done = Number(tasksDone?.count) || 0;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    // 3. Status distribution
    const statusRows = await executeQuery('SELECT status, COUNT(*) as count FROM tasks GROUP BY status');
    const statusMap: Record<string, number> = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 };
    for (const r of statusRows) {
      statusMap[r.status] = Number(r.count);
    }

    // 4. Priority distribution
    const priorityRows = await executeQuery('SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority');
    const priorityMap: Record<string, number> = { URGENT: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    for (const r of priorityRows) {
      priorityMap[r.priority] = Number(r.count);
    }

    // 5. Workload by user
    const workloadRows = await executeQuery(
      `SELECT u.id, u.name, u.avatar_url, u.role,
              COUNT(t.id) as total_tasks,
              SUM(CASE WHEN t.status = 'DONE' THEN 1 ELSE 0 END) as done_tasks,
              SUM(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as active_tasks
       FROM users u
       LEFT JOIN tasks t ON t.assignee_id = u.id
       GROUP BY u.id, u.name, u.avatar_url, u.role
       ORDER BY total_tasks DESC`
    );

    // 6. Project progress list
    const projectProgress = await executeQuery(
      `SELECT p.id, p.name, p.key, p.status, p.priority, p.budget,
              COUNT(t.id) as total_tasks,
              SUM(CASE WHEN t.status = 'DONE' THEN 1 ELSE 0 END) as done_tasks
       FROM projects p
       LEFT JOIN tasks t ON t.project_id = p.id
       GROUP BY p.id, p.name, p.key, p.status, p.priority, p.budget
       ORDER BY p.created_at DESC`
    );

    const enrichedProjects = projectProgress.map(p => {
      const pTotal = Number(p.total_tasks) || 0;
      const pDone = Number(p.done_tasks) || 0;
      const progress = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;
      return { ...p, progress };
    });

    res.json({
      success: true,
      metrics: {
        totalProjects: Number(projectsTotal?.count) || 0,
        activeProjects: Number(projectsActive?.count) || 0,
        totalTasks: total,
        completedTasks: done,
        overdueTasks: Number(tasksOverdue?.count) || 0,
        completionRate
      },
      statusDistribution: statusMap,
      priorityDistribution: priorityMap,
      workload: workloadRows,
      projects: enrichedProjects
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
