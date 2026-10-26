import { Router, Request, Response } from 'express';
import { executeQuery } from '../db/client';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/activities
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { projectId, limit = '25' } = req.query;

    let sql = `
      SELECT a.*,
             u.name as user_name, u.avatar_url as user_avatar, u.role as user_role,
             p.name as project_name, p.key as project_key
      FROM activities a
      JOIN users u ON u.id = a.user_id
      LEFT JOIN projects p ON p.id = a.project_id
      WHERE 1=1
    `;
    const args: any[] = [];

    if (projectId) {
      sql += ` AND a.project_id = ?`;
      args.push(projectId);
    }

    sql += ` ORDER BY a.created_at DESC LIMIT ?`;
    args.push(parseInt(limit as string, 10));

    const activities = await executeQuery(sql, args);

    const parsed = activities.map(act => ({
      ...act,
      details: act.details ? JSON.parse(act.details) : {}
    }));

    res.json({ success: true, activities: parsed });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
