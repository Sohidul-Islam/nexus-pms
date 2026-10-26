import { db } from './client';

export async function runMigrations(): Promise<void> {
  console.log('[Database] Running schema migrations...');

  const schemaStatements = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'TEAM_MEMBER', -- ADMIN, PROJECT_MANAGER, TEAM_MEMBER, VIEWER
      avatar_url TEXT,
      department TEXT DEFAULT 'Engineering',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );`,

    `CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      plan TEXT DEFAULT 'Enterprise',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );`,

    `CREATE TABLE IF NOT EXISTS organization_members (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'TEAM_MEMBER',
      joined_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(organization_id, user_id)
    );`,

    `CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      key TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE', -- PLANNING, ACTIVE, COMPLETED, ON_HOLD
      priority TEXT NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
      lead_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      budget REAL DEFAULT 0,
      start_date TEXT,
      target_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );`,

    `CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      task_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'TODO', -- TODO, IN_PROGRESS, REVIEW, DONE
      priority TEXT NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
      type TEXT NOT NULL DEFAULT 'FEATURE', -- FEATURE, BUG, IMPROVEMENT, TASK
      assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      reporter_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      estimated_hours REAL DEFAULT 0,
      logged_hours REAL DEFAULT 0,
      due_date TEXT,
      order_index INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );`,

    `CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );`,

    `CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      details TEXT, -- JSON string
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );`,

    `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'INFO', -- TASK_ASSIGNED, STATUS_CHANGED, COMMENT_ADDED, DEADLINE_APPROACHING, INFO
      link TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );`,

    // Optimization Indexes
    `CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);`,
    `CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id);`,
    `CREATE INDEX IF NOT EXISTS idx_activities_project ON activities(project_id);`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);`
  ];

  for (const stmt of schemaStatements) {
    await db.execute(stmt);
  }

  console.log('[Database] Migrations applied successfully.');
}
