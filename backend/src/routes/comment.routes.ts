import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, executeOne, db } from '../db/client';
import { authenticate } from '../middleware/auth';
import { realtimeHub } from '../realtime/events';

const router = Router();

// GET /api/tasks/:taskId/comments
router.get('/tasks/:taskId/comments', authenticate, async (req: Request, res: Response) => {
  try {
    const comments = await executeQuery(
      `SELECT c.*, u.name as user_name, u.avatar_url as user_avatar, u.role as user_role
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.task_id = ?
       ORDER BY c.created_at ASC`,
      [String(req.params.taskId)]
    );
    res.json({ success: true, comments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tasks/:taskId/comments
router.post('/tasks/:taskId/comments', authenticate, async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const taskId = String(req.params.taskId);

    if (!content || !content.trim()) {
      res.status(400).json({ success: false, error: 'Comment content cannot be empty.' });
      return;
    }

    const task: any = await executeOne(
      `SELECT t.*, p.organization_id FROM tasks t JOIN projects p ON p.id = t.project_id WHERE t.id = ?`,
      [taskId]
    );

    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found.' });
      return;
    }

    const commentId = `cmt-${uuidv4().substring(0, 8)}`;
    await db.execute({
      sql: `INSERT INTO comments (id, task_id, user_id, content) VALUES (?, ?, ?, ?)`,
      args: [commentId, taskId, req.user!.id, content.trim()]
    });

    if (task.assignee_id && task.assignee_id !== req.user!.id) {
      const notifId = `notif-${uuidv4().substring(0, 8)}`;
      await db.execute({
        sql: `INSERT INTO notifications (id, user_id, title, message, type, link) VALUES (?, ?, ?, ?, 'COMMENT_ADDED', ?)`,
        args: [
          notifId,
          task.assignee_id,
          'New Comment on Task',
          `${req.user!.name} commented on #${task.task_number}: "${content.substring(0, 40)}..."`,
          `/tasks/${taskId}`
        ]
      });

      realtimeHub.broadcast({
        type: 'NOTIFICATION',
        payload: { userId: task.assignee_id, title: 'New Comment on Task' }
      });
    }

    const created = await executeOne(
      `SELECT c.*, u.name as user_name, u.avatar_url as user_avatar, u.role as user_role
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.id = ?`,
      [commentId]
    );

    realtimeHub.broadcast({
      type: 'COMMENT_ADDED',
      payload: { taskId, comment: created }
    });

    res.status(201).json({ success: true, comment: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/comments/:id
router.delete('/comments/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const comment: any = await executeOne('SELECT * FROM comments WHERE id = ?', [String(req.params.id)]);
    if (!comment) {
      res.status(404).json({ success: false, error: 'Comment not found.' });
      return;
    }

    if (comment.user_id !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'You do not have permission to delete this comment.' });
      return;
    }

    await db.execute({ sql: 'DELETE FROM comments WHERE id = ?', args: [String(req.params.id)] });
    res.json({ success: true, message: 'Comment deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
