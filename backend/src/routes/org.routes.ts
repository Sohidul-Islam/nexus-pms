import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, executeOne, db } from '../db/client';
import { authenticate, requireRole } from '../middleware/auth';
import { realtimeHub } from '../realtime/events';

const router = Router();

// GET /api/organizations
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const orgs = await executeQuery(
      `SELECT o.*, om.role as my_role
       FROM organizations o
       JOIN organization_members om ON om.organization_id = o.id
       WHERE om.user_id = ?
       ORDER BY o.name ASC`,
      [req.user!.id]
    );
    res.json({ success: true, organizations: orgs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/organizations/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const org = await executeOne('SELECT * FROM organizations WHERE id = ?', [req.params.id]);
    if (!org) {
      res.status(404).json({ success: false, error: 'Organization not found.' });
      return;
    }

    const members = await executeQuery(
      `SELECT om.id as membership_id, om.role, om.joined_at, u.id, u.name, u.email, u.avatar_url, u.department
       FROM organization_members om
       JOIN users u ON u.id = om.user_id
       WHERE om.organization_id = ?
       ORDER BY u.name ASC`,
      [req.params.id]
    );

    res.json({ success: true, organization: org, members });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/organizations
router.post('/', authenticate, requireRole('ADMIN', 'PROJECT_MANAGER'), async (req: Request, res: Response) => {
  try {
    const { name, slug, description, plan } = req.body;
    if (!name || !slug) {
      res.status(400).json({ success: false, error: 'Name and slug are required.' });
      return;
    }

    const orgId = `org-${uuidv4().substring(0, 8)}`;
    await db.execute({
      sql: `INSERT INTO organizations (id, name, slug, description, plan) VALUES (?, ?, ?, ?, ?)`,
      args: [orgId, name, slug.toLowerCase(), description || '', plan || 'Standard']
    });

    // Make creator an ADMIN member
    await db.execute({
      sql: `INSERT INTO organization_members (id, organization_id, user_id, role) VALUES (?, ?, ?, 'ADMIN')`,
      args: [`mem-${orgId}-${req.user!.id}`, orgId, req.user!.id]
    });

    res.status(201).json({ success: true, organization: { id: orgId, name, slug, description, plan } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/organizations/:id/members
router.post('/:id/members', authenticate, requireRole('ADMIN', 'PROJECT_MANAGER'), async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.body;
    const orgId = req.params.id;

    if (!userId) {
      res.status(400).json({ success: false, error: 'User ID is required.' });
      return;
    }

    const existing = await executeOne(
      'SELECT id FROM organization_members WHERE organization_id = ? AND user_id = ?',
      [orgId, userId]
    );

    if (existing) {
      res.status(409).json({ success: false, error: 'User is already a member of this organization.' });
      return;
    }

    const memberRole = role || 'TEAM_MEMBER';
    const memberId = `mem-${orgId}-${userId}`;

    await db.execute({
      sql: `INSERT INTO organization_members (id, organization_id, user_id, role) VALUES (?, ?, ?, ?)`,
      args: [memberId, orgId, userId, memberRole]
    });

    // Notify user
    const notifId = `notif-${uuidv4().substring(0, 8)}`;
    await db.execute({
      sql: `INSERT INTO notifications (id, user_id, title, message, type, link) VALUES (?, ?, ?, ?, 'INFO', ?)`,
      args: [notifId, userId, 'Organization Membership', `You have been added to an organization with role: ${memberRole}`, '/organizations']
    });

    realtimeHub.broadcast({
      type: 'NOTIFICATION',
      payload: { userId, title: 'Organization Membership', role: memberRole }
    });

    res.status(201).json({ success: true, message: 'Member added successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/organizations/:id/members/:userId
router.put('/:id/members/:userId', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (!role) {
      res.status(400).json({ success: false, error: 'Role is required.' });
      return;
    }

    await db.execute({
      sql: `UPDATE organization_members SET role = ? WHERE organization_id = ? AND user_id = ?`,
      args: [role, req.params.id, req.params.userId]
    });

    res.json({ success: true, message: 'Member role updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
