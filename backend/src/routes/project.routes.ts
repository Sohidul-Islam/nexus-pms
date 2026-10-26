import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, executeOne, db } from '../db/client';
import { authenticate, requireRole } from '../middleware/auth';
import { realtimeHub } from '../realtime/events';

const router = Router();

// GET /api/projects
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { search, status, orgId } = req.query;

    let sql = `
      SELECT p.*,
             u.name as lead_name, u.avatar_url as lead_avatar,
             o.name as organization_name,
             (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as total_tasks,
             (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'DONE') as done_tasks
      FROM projects p
      LEFT JOIN users u ON u.id = p.lead_id
      LEFT JOIN organizations o ON o.id = p.organization_id
      WHERE 1=1
    `;
    const args: any[] = [];

    if (orgId) {
      sql += ` AND p.organization_id = ?`;
      args.push(orgId);
    }

    if (status) {
      sql += ` AND p.status = ?`;
      args.push(status);
    }

    if (search) {
      sql += ` AND (p.name LIKE ? OR p.key LIKE ? OR p.description LIKE ?)`;
      const term = `%${search}%`;
      args.push(term, term, term);
    }

    sql += ` ORDER BY p.created_at DESC`;

    const projects = await executeQuery(sql, args);

    const enriched = projects.map(p => {
      const total = Number(p.total_tasks) || 0;
      const done = Number(p.done_tasks) || 0;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;
      return { ...p, progress };
    });

    res.json({ success: true, projects: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const project = await executeOne(
      `SELECT p.*, u.name as lead_name, u.avatar_url as lead_avatar, u.email as lead_email,
              o.name as organization_name
       FROM projects p
       LEFT JOIN users u ON u.id = p.lead_id
       LEFT JOIN organizations o ON o.id = p.organization_id
       WHERE p.id = ?`,
      [String(req.params.id)]
    );

    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found.' });
      return;
    }

    const statusCounts = await executeQuery(
      `SELECT status, COUNT(*) as count FROM tasks WHERE project_id = ? GROUP BY status`,
      [String(req.params.id)]
    );

    const hoursSummary: any = await executeOne(
      `SELECT SUM(estimated_hours) as total_estimated, SUM(logged_hours) as total_logged FROM tasks WHERE project_id = ?`,
      [String(req.params.id)]
    );

    const assignees = await executeQuery(
      `SELECT DISTINCT u.id, u.name, u.email, u.avatar_url, u.role
       FROM tasks t
       JOIN users u ON u.id = t.assignee_id
       WHERE t.project_id = ?`,
      [String(req.params.id)]
    );

    res.json({
      success: true,
      project,
      statusCounts: statusCounts || [],
      hours: {
        estimated: Number(hoursSummary?.total_estimated) || 0,
        logged: Number(hoursSummary?.total_logged) || 0,
      },
      team: assignees || []
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/projects
router.post('/', authenticate, requireRole('ADMIN', 'PROJECT_MANAGER'), async (req: Request, res: Response) => {
  try {
    const { name, key, description, status, priority, lead_id, budget, start_date, target_date, organization_id } = req.body;

    if (!name || !key) {
      res.status(400).json({ success: false, error: 'Project name and key are required.' });
      return;
    }

    let orgId = organization_id;
    if (!orgId) {
      const firstOrg: any = await executeOne('SELECT id FROM organizations LIMIT 1');
      orgId = firstOrg ? (firstOrg.id ?? firstOrg[0]) : 'org-kobkiat-01';
    }

    const projectId = `prj-${uuidv4().substring(0, 8)}`;
    await db.execute({
      sql: `INSERT INTO projects (id, organization_id, name, key, description, status, priority, lead_id, budget, start_date, target_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        projectId,
        orgId,
        name,
        key.toUpperCase(),
        description || '',
        status || 'ACTIVE',
        priority || 'MEDIUM',
        lead_id || req.user!.id,
        budget ? parseFloat(budget) : 0,
        start_date || null,
        target_date || null
      ]
    });

    const actId = `act-${uuidv4().substring(0, 8)}`;
    await db.execute({
      sql: `INSERT INTO activities (id, organization_id, project_id, user_id, action, details) VALUES (?, ?, ?, ?, 'PROJECT_CREATED', ?)`,
      args: [actId, orgId, projectId, req.user!.id, JSON.stringify({ projectName: name, key: key.toUpperCase() })]
    });

    realtimeHub.broadcast({
      type: 'ACTIVITY',
      payload: { projectId, projectName: name, action: 'PROJECT_CREATED', user: req.user!.name }
    });

    const created = await executeOne('SELECT * FROM projects WHERE id = ?', [projectId]);
    res.status(201).json({ success: true, project: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/projects/:id
router.put('/:id', authenticate, requireRole('ADMIN', 'PROJECT_MANAGER'), async (req: Request, res: Response) => {
  try {
    const { name, description, status, priority, lead_id, budget, start_date, target_date } = req.body;

    await db.execute({
      sql: `UPDATE projects SET
            name = COALESCE(?, name),
            description = COALESCE(?, description),
            status = COALESCE(?, status),
            priority = COALESCE(?, priority),
            lead_id = COALESCE(?, lead_id),
            budget = COALESCE(?, budget),
            start_date = COALESCE(?, start_date),
            target_date = COALESCE(?, target_date),
            updated_at = datetime('now')
            WHERE id = ?`,
      args: [name, description, status, priority, lead_id, budget, start_date, target_date, String(req.params.id)]
    });

    const updated = await executeOne('SELECT * FROM projects WHERE id = ?', [String(req.params.id)]);
    res.json({ success: true, project: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    await db.execute({ sql: 'DELETE FROM projects WHERE id = ?', args: [String(req.params.id)] });
    res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
