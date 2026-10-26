import { Router, Request, Response } from 'express';
import { executeQuery, executeOne, db } from '../db/client';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/notifications
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const notifications = await executeQuery(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [req.user!.id]
    );

    const unreadCountResult = await executeOne(
      `SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [req.user!.id]
    );

    res.json({
      success: true,
      notifications,
      unreadCount: Number(unreadCountResult?.unread_count) || 0
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    await db.execute({
      sql: `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      args: [String(req.params.id), req.user!.id]
    });
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/notifications/read-all
router.post('/read-all', authenticate, async (req: Request, res: Response) => {
  try {
    await db.execute({
      sql: `UPDATE notifications SET is_read = 1 WHERE user_id = ?`,
      args: [req.user!.id]
    });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
