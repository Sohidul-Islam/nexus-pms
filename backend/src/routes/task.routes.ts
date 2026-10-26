import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, executeOne, db } from '../db/client';
import { authenticate, requireRole } from '../middleware/auth';
import { realtimeHub } from '../realtime/events';

const router = Router();

// GET /api/tasks
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { projectId, status, priority, assigneeId, search, limit = '100', offset = '0' } = req.query;

    let sql = `
      SELECT t.*,
             p.name as project_name, p.key as project_key,
             u.name as assignee_name, u.avatar_url as assignee_avatar, u.email as assignee_email,
             r.name as reporter_name, r.avatar_url as reporter_avatar,
             (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) as comment_count
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      LEFT JOIN users u ON u.id = t.assignee_id
      LEFT JOIN users r ON r.id = t.reporter_id
      WHERE 1=1
    `;
    const args: any[] = [];

    if (projectId) {
      sql += ` AND t.project_id = ?`;
      args.push(projectId);
    }

    if (status) {
      sql += ` AND t.status = ?`;
      args.push(status);
    }

    if (priority) {
      sql += ` AND t.priority = ?`;
      args.push(priority);
    }

    if (assigneeId) {
      sql += ` AND t.assignee_id = ?`;
      args.push(assigneeId);
    }

    if (search) {
      sql += ` AND (t.title LIKE ? OR t.description LIKE ? OR CAST(t.task_number AS TEXT) LIKE ?)`;
      const term = `%${search}%`;
      args.push(term, term, term);
    }

    sql += ` ORDER BY t.order_index ASC, t.created_at DESC LIMIT ? OFFSET ?`;
    args.push(parseInt(limit as string, 10), parseInt(offset as string, 10));

    const tasks = await executeQuery(sql, args);
    res.json({ success: true, tasks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const task = await executeOne(
      `SELECT t.*,
              p.name as project_name, p.key as project_key,
              u.name as assignee_name, u.avatar_url as assignee_avatar, u.email as assignee_email,
              r.name as reporter_name, r.avatar_url as reporter_avatar
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       LEFT JOIN users u ON u.id = t.assignee_id
       LEFT JOIN users r ON r.id = t.reporter_id
       WHERE t.id = ?`,
      [String(req.params.id)]
    );

    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found.' });
      return;
    }

    const comments = await executeQuery(
      `SELECT c.*, u.name as user_name, u.avatar_url as user_avatar, u.role as user_role
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.task_id = ?
       ORDER BY c.created_at ASC`,
      [String(req.params.id)]
    );

    res.json({ success: true, task, comments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tasks
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      project_id,
      title,
      description,
      status = 'TODO',
      priority = 'MEDIUM',
      type = 'FEATURE',
      assignee_id,
      estimated_hours = 0,
      due_date
    } = req.body;

    if (!project_id || !title) {
      res.status(400).json({ success: false, error: 'project_id and title are required.' });
      return;
    }

    const lastTask: any = await executeOne(
      'SELECT MAX(task_number) as max_num FROM tasks WHERE project_id = ?',
      [project_id]
    );
    const nextNumber = (Number(lastTask?.max_num) || 100) + 1;

    const taskId = `tsk-${uuidv4().substring(0, 8)}`;

    await db.execute({
      sql: `INSERT INTO tasks (id, project_id, task_number, title, description, status, priority, type, assignee_id, reporter_id, estimated_hours, logged_hours, due_date, order_index)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 0)`,
      args: [
        taskId,
        project_id,
        nextNumber,
        title,
        description || '',
        status,
        priority,
        type,
        assignee_id || null,
        req.user!.id,
        parseFloat(estimated_hours) || 0,
        due_date || null
      ]
    });

    if (assignee_id && assignee_id !== req.user!.id) {
      const notifId = `notif-${uuidv4().substring(0, 8)}`;
      await db.execute({
        sql: `INSERT INTO notifications (id, user_id, title, message, type, link) VALUES (?, ?, ?, ?, 'TASK_ASSIGNED', ?)`,
        args: [
          notifId,
          assignee_id,
          'New Task Assigned',
          `${req.user!.name} assigned you to #${nextNumber}: ${title}`,
          `/tasks/${taskId}`
        ]
      });

      realtimeHub.broadcast({
        type: 'NOTIFICATION',
        payload: { userId: assignee_id, title: 'New Task Assigned', taskTitle: title }
      });
    }

    const project: any = await executeOne('SELECT organization_id, name FROM projects WHERE id = ?', [project_id]);
    await db.execute({
      sql: `INSERT INTO activities (id, organization_id, project_id, task_id, user_id, action, details)
            VALUES (?, ?, ?, ?, ?, 'TASK_CREATED', ?)`,
      args: [
        `act-${uuidv4().substring(0, 8)}`,
        project?.organization_id || null,
        project_id,
        taskId,
        req.user!.id,
        JSON.stringify({ taskTitle: title, taskNumber: nextNumber })
      ]
    });

    const created = await executeOne(
      `SELECT t.*, p.name as project_name, p.key as project_key,
              u.name as assignee_name, u.avatar_url as assignee_avatar
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       LEFT JOIN users u ON u.id = t.assignee_id
       WHERE t.id = ?`,
      [taskId]
    );

    realtimeHub.broadcast({
      type: 'TASK_CREATED',
      payload: created
    });

    res.status(201).json({ success: true, task: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/tasks/:id/status (Kanban drag & drop transition)
router.patch('/:id/status', authenticate, async (req: Request, res: Response) => {
  try {
    const { status, order_index } = req.body;

    if (!status) {
      res.status(400).json({ success: false, error: 'Status is required.' });
      return;
    }

    const currentTask: any = await executeOne(
      `SELECT t.*, p.organization_id FROM tasks t JOIN projects p ON p.id = t.project_id WHERE t.id = ?`,
      [String(req.params.id)]
    );

    if (!currentTask) {
      res.status(404).json({ success: false, error: 'Task not found.' });
      return;
    }

    const previousStatus = currentTask.status;

    await db.execute({
      sql: `UPDATE tasks SET status = ?, order_index = COALESCE(?, order_index), updated_at = datetime('now') WHERE id = ?`,
      args: [status, order_index !== undefined ? order_index : null, String(req.params.id)]
    });

    await db.execute({
      sql: `INSERT INTO activities (id, organization_id, project_id, task_id, user_id, action, details)
            VALUES (?, ?, ?, ?, ?, 'STATUS_UPDATED', ?)`,
      args: [
        `act-${uuidv4().substring(0, 8)}`,
        currentTask.organization_id || null,
        currentTask.project_id,
        String(req.params.id),
        req.user!.id,
        JSON.stringify({
          from: previousStatus,
          to: status,
          taskTitle: currentTask.title,
          taskNumber: currentTask.task_number
        })
      ]
    });

    if (currentTask.assignee_id && currentTask.assignee_id !== req.user!.id) {
      const notifId = `notif-${uuidv4().substring(0, 8)}`;
      await db.execute({
        sql: `INSERT INTO notifications (id, user_id, title, message, type, link) VALUES (?, ?, ?, ?, 'STATUS_CHANGED', ?)`,
        args: [
          notifId,
          currentTask.assignee_id,
          'Task Status Changed',
          `Task #${currentTask.task_number} moved from ${previousStatus} to ${status} by ${req.user!.name}`,
          `/tasks/${req.params.id}`
        ]
      });

      realtimeHub.broadcast({
        type: 'NOTIFICATION',
        payload: { userId: currentTask.assignee_id, title: 'Task Status Changed' }
      });
    }

    const updated = await executeOne(
      `SELECT t.*, p.name as project_name, p.key as project_key,
              u.name as assignee_name, u.avatar_url as assignee_avatar
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       LEFT JOIN users u ON u.id = t.assignee_id
       WHERE t.id = ?`,
      [String(req.params.id)]
    );

    realtimeHub.broadcast({
      type: 'TASK_UPDATED',
      payload: updated
    });

    res.json({ success: true, task: updated, message: 'Status updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/tasks/:id
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      type,
      assignee_id,
      estimated_hours,
      logged_hours,
      due_date
    } = req.body;

    await db.execute({
      sql: `UPDATE tasks SET
            title = COALESCE(?, title),
            description = COALESCE(?, description),
            status = COALESCE(?, status),
            priority = COALESCE(?, priority),
            type = COALESCE(?, type),
            assignee_id = COALESCE(?, assignee_id),
            estimated_hours = COALESCE(?, estimated_hours),
            logged_hours = COALESCE(?, logged_hours),
            due_date = COALESCE(?, due_date),
            updated_at = datetime('now')
            WHERE id = ?`,
      args: [
        title,
        description,
        status,
        priority,
        type,
        assignee_id,
        estimated_hours,
        logged_hours,
        due_date,
        String(req.params.id)
      ]
    });

    const updated = await executeOne(
      `SELECT t.*, p.name as project_name, p.key as project_key,
              u.name as assignee_name, u.avatar_url as assignee_avatar
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       LEFT JOIN users u ON u.id = t.assignee_id
       WHERE t.id = ?`,
      [String(req.params.id)]
    );

    realtimeHub.broadcast({
      type: 'TASK_UPDATED',
      payload: updated
    });

    res.json({ success: true, task: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticate, requireRole('ADMIN', 'PROJECT_MANAGER'), async (req: Request, res: Response) => {
  try {
    await db.execute({ sql: 'DELETE FROM tasks WHERE id = ?', args: [String(req.params.id)] });

    realtimeHub.broadcast({
      type: 'TASK_DELETED',
      payload: { id: req.params.id }
    });

    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
