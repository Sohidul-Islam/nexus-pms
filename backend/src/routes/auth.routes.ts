import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { executeOne, executeQuery, db } from '../db/client';
import { config } from '../config';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required.' });
      return;
    }

    const user: any = await executeOne(
      'SELECT id, name, email, password_hash, role, avatar_url, department FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password credentials.' });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password credentials.' });
      return;
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      department: user.department,
      avatar_url: user.avatar_url,
    };

    const signOpts: SignOptions = { expiresIn: '7d' };
    const token = jwt.sign(payload, config.jwtSecret as Secret, signOpts);

    const orgMembership: any = await executeOne(
      `SELECT o.id, o.name, o.slug, om.role
       FROM organization_members om
       JOIN organizations o ON o.id = om.organization_id
       WHERE om.user_id = ?
       LIMIT 1`,
      [user.id]
    );

    const { password_hash, ...safeUser } = user;

    res.json({
      success: true,
      token,
      user: safeUser,
      organization: orgMembership || null,
      message: 'Authentication successful.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, department } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
      return;
    }

    const existing = await executeOne('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      res.status(409).json({ success: false, error: 'An account with this email address already exists.' });
      return;
    }

    const newId = `usr-${uuidv4().substring(0, 8)}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const role = 'TEAM_MEMBER';
    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

    await db.execute({
      sql: `INSERT INTO users (id, name, email, password_hash, role, avatar_url, department) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [newId, name, email.toLowerCase().trim(), passwordHash, role, avatar, department || 'Engineering']
    });

    const defaultOrg: any = await executeOne('SELECT id FROM organizations LIMIT 1');
    if (defaultOrg) {
      await db.execute({
        sql: `INSERT INTO organization_members (id, organization_id, user_id, role) VALUES (?, ?, ?, ?)`,
        args: [`mem-${defaultOrg.id}-${newId}`, defaultOrg.id, newId, role]
      });
    }

    const payload = { id: newId, email, role, name, department, avatar_url: avatar };
    const signOpts: SignOptions = { expiresIn: '7d' };
    const token = jwt.sign(payload, config.jwtSecret as Secret, signOpts);

    res.status(201).json({
      success: true,
      token,
      user: { id: newId, name, email, role, avatar_url: avatar, department },
      message: 'Account registered successfully.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await executeOne(
      'SELECT id, name, email, role, avatar_url, department, created_at FROM users WHERE id = ?',
      [req.user!.id]
    );

    if (!user) {
      res.status(404).json({ success: false, error: 'User record not found.' });
      return;
    }

    const orgs = await executeQuery(
      `SELECT o.id, o.name, o.slug, o.plan, om.role
       FROM organization_members om
       JOIN organizations o ON o.id = om.organization_id
       WHERE om.user_id = ?`,
      [req.user!.id]
    );

    res.json({
      success: true,
      user,
      organizations: orgs
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const { name, department, avatar_url, newPassword } = req.body;

    if (newPassword) {
      const hash = bcrypt.hashSync(newPassword, 10);
      await db.execute({
        sql: `UPDATE users SET name = COALESCE(?, name), department = COALESCE(?, department), avatar_url = COALESCE(?, avatar_url), password_hash = ?, updated_at = datetime('now') WHERE id = ?`,
        args: [name, department, avatar_url, hash, req.user!.id]
      });
    } else {
      await db.execute({
        sql: `UPDATE users SET name = COALESCE(?, name), department = COALESCE(?, department), avatar_url = COALESCE(?, avatar_url), updated_at = datetime('now') WHERE id = ?`,
        args: [name, department, avatar_url, req.user!.id]
      });
    }

    const updated = await executeOne(
      'SELECT id, name, email, role, avatar_url, department FROM users WHERE id = ?',
      [req.user!.id]
    );

    res.json({
      success: true,
      user: updated,
      message: 'Profile updated successfully.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/users
router.get('/users', authenticate, async (_req: Request, res: Response) => {
  try {
    const users = await executeQuery(
      'SELECT id, name, email, role, avatar_url, department FROM users ORDER BY name ASC'
    );
    res.json({ success: true, users });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
