import bcrypt from 'bcryptjs';
import { db } from './client';
import { runMigrations } from './schema';

export async function seedDatabase(): Promise<void> {
  await runMigrations();
  console.log('[Database] Checking existing seed data...');

  const userCount = await db.execute('SELECT COUNT(*) as count FROM users');
  if (Number(userCount.rows[0].count) > 0) {
    console.log('[Database] Database already contains data. Skipping seed.');
    return;
  }

  console.log('[Database] Seeding initial data...');
  const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);

  // 1. Users
  const users = [
    {
      id: 'usr-admin-01',
      name: 'Sarah Jenkins',
      email: 'admin@nexus.io',
      role: 'ADMIN',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      department: 'Executive Leadership'
    },
    {
      id: 'usr-pm-02',
      name: 'Marcus Vance',
      email: 'pm@nexus.io',
      role: 'PROJECT_MANAGER',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      department: 'Product Management'
    },
    {
      id: 'usr-dev-03',
      name: 'Sohidul Islam',
      email: 'dev@nexus.io',
      role: 'TEAM_MEMBER',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      department: 'Frontend Architecture'
    },
    {
      id: 'usr-viewer-04',
      name: 'Elena Rostova',
      email: 'viewer@nexus.io',
      role: 'VIEWER',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      department: 'Operations & Stakeholders'
    }
  ];

  for (const u of users) {
    await db.execute({
      sql: `INSERT INTO users (id, name, email, password_hash, role, avatar_url, department) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [u.id, u.name, u.email, defaultPasswordHash, u.role, u.avatar_url, u.department]
    });
  }

  // 2. Organizations
  const orgs = [
    {
      id: 'org-kobkiat-01',
      name: 'Fashion GLory company limited',
      slug: 'fashion-glory',
      description: 'International Maritime Logistics & Supply Chain Software Solutions',
      plan: 'Enterprise Tier'
    },
    {
      id: 'org-nexus-02',
      name: 'Nexus Cloud Technologies',
      slug: 'nexus-cloud',
      description: 'Distributed Cloud Workspaces and Project Acceleration',
      plan: 'Professional Tier'
    }
  ];

  for (const org of orgs) {
    await db.execute({
      sql: `INSERT INTO organizations (id, name, slug, description, plan) VALUES (?, ?, ?, ?, ?)`,
      args: [org.id, org.name, org.slug, org.description, org.plan]
    });

    // Add all users as members of Kobkiat Global
    if (org.id === 'org-kobkiat-01') {
      for (const u of users) {
        await db.execute({
          sql: `INSERT INTO organization_members (id, organization_id, user_id, role) VALUES (?, ?, ?, ?)`,
          args: [`mem-${org.id}-${u.id}`, org.id, u.id, u.role]
        });
      }
    }
  }

  // 3. Projects
  const projects = [
    {
      id: 'prj-telemetry-01',
      organization_id: 'org-kobkiat-01',
      name: 'Cargo & Freight Tracking Telemetry Hub',
      key: 'CFT',
      description: 'Real-time telemetry and IoT monitoring platform for international container shipments.',
      status: 'ACTIVE',
      priority: 'URGENT',
      lead_id: 'usr-pm-02',
      budget: 150000,
      start_date: '2026-09-01',
      target_date: '2026-12-15'
    },
    {
      id: 'prj-warehouse-02',
      organization_id: 'org-kobkiat-01',
      name: 'Smart Port Dispatch & Berth Scheduler',
      key: 'SPD',
      description: 'Automated ship docking, berth scheduling, and crane allocation management system.',
      status: 'ACTIVE',
      priority: 'HIGH',
      lead_id: 'usr-dev-03',
      budget: 95000,
      start_date: '2026-10-01',
      target_date: '2027-02-28'
    },
    {
      id: 'prj-analytics-03',
      organization_id: 'org-kobkiat-01',
      name: 'Maritime Carbon Footprint Analytics Engine',
      key: 'MCF',
      description: 'Environmental compliance and carbon emission tracking across global logistics routes.',
      status: 'PLANNING',
      priority: 'MEDIUM',
      lead_id: 'usr-admin-01',
      budget: 70000,
      start_date: '2026-11-01',
      target_date: '2027-04-30'
    }
  ];

  for (const p of projects) {
    await db.execute({
      sql: `INSERT INTO projects (id, organization_id, name, key, description, status, priority, lead_id, budget, start_date, target_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [p.id, p.organization_id, p.name, p.key, p.description, p.status, p.priority, p.lead_id, p.budget, p.start_date, p.target_date]
    });
  }

  // 4. Tasks (Kanban items)
  const tasks = [
    // CFT Project Tasks
    {
      id: 'tsk-001',
      project_id: 'prj-telemetry-01',
      task_number: 101,
      title: 'Architect Signal-based WebSocket Stream Client',
      description: 'Implement an Angular service using RxJS toSignal to ingest high-frequency IoT location updates for ships.',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      type: 'FEATURE',
      assignee_id: 'usr-dev-03',
      reporter_id: 'usr-pm-02',
      estimated_hours: 16,
      logged_hours: 10,
      due_date: '2026-10-30',
      order_index: 0
    },
    {
      id: 'tsk-002',
      project_id: 'prj-telemetry-01',
      task_number: 102,
      title: 'Implement Interactive Marine Vessel Telemetry Map',
      description: 'Render real-time container vessel coordinates, course vectors, and speed indicators with SVG overlays.',
      status: 'TODO',
      priority: 'HIGH',
      type: 'FEATURE',
      assignee_id: 'usr-dev-03',
      reporter_id: 'usr-pm-02',
      estimated_hours: 24,
      logged_hours: 0,
      due_date: '2026-11-05',
      order_index: 0
    },
    {
      id: 'tsk-003',
      project_id: 'prj-telemetry-01',
      task_number: 103,
      title: 'Fix Stale JWT Refresh Interceptor Race Condition',
      description: 'Ensure concurrent HTTP requests queue properly when 401 response triggers token refresh.',
      status: 'REVIEW',
      priority: 'URGENT',
      type: 'BUG',
      assignee_id: 'usr-dev-03',
      reporter_id: 'usr-admin-01',
      estimated_hours: 8,
      logged_hours: 7.5,
      due_date: '2026-10-27',
      order_index: 0
    },
    {
      id: 'tsk-004',
      project_id: 'prj-telemetry-01',
      task_number: 104,
      title: 'Define OpenTelemetry Tracing Pipeline with C# Backend',
      description: 'Align distributed trace headers between Node/Angular client and upstream C# Microservices.',
      status: 'DONE',
      priority: 'MEDIUM',
      type: 'TASK',
      assignee_id: 'usr-pm-02',
      reporter_id: 'usr-admin-01',
      estimated_hours: 12,
      logged_hours: 12,
      due_date: '2026-10-20',
      order_index: 0
    },
    {
      id: 'tsk-005',
      project_id: 'prj-telemetry-01',
      task_number: 105,
      title: 'Create Signal-driven Multi-column Filter Component',
      description: 'Build reusable Angular filter bar with computed signals for rapid search over 10,000 shipment items.',
      status: 'DONE',
      priority: 'HIGH',
      type: 'IMPROVEMENT',
      assignee_id: 'usr-dev-03',
      reporter_id: 'usr-pm-02',
      estimated_hours: 14,
      logged_hours: 14,
      due_date: '2026-10-22',
      order_index: 1
    },

    // SPD Project Tasks
    {
      id: 'tsk-006',
      project_id: 'prj-warehouse-02',
      task_number: 201,
      title: 'Design Berth Gantt Schedule Component with Standalone Directives',
      description: 'Develop interactive timeline showing ship mooring windows, crane assignments, and turnaround times.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      type: 'FEATURE',
      assignee_id: 'usr-dev-03',
      reporter_id: 'usr-pm-02',
      estimated_hours: 32,
      logged_hours: 18,
      due_date: '2026-11-12',
      order_index: 1
    },
    {
      id: 'tsk-007',
      project_id: 'prj-warehouse-02',
      task_number: 202,
      title: 'Implement Role-Based Access Control Directive for Dispatch Approvals',
      description: 'Create custom *appHasRole directive to conditionally show approval buttons only to Admins and PMs.',
      status: 'REVIEW',
      priority: 'MEDIUM',
      type: 'IMPROVEMENT',
      assignee_id: 'usr-pm-02',
      reporter_id: 'usr-admin-01',
      estimated_hours: 6,
      logged_hours: 5,
      due_date: '2026-10-28',
      order_index: 1
    },
    {
      id: 'tsk-008',
      project_id: 'prj-warehouse-02',
      task_number: 203,
      title: 'Port Clearance Custom Document Uploader with Drag & Drop',
      description: 'Reactive form for multi-file PDF validation with client-side mime type checking and upload progress bar.',
      status: 'TODO',
      priority: 'MEDIUM',
      type: 'FEATURE',
      assignee_id: 'usr-dev-03',
      reporter_id: 'usr-pm-02',
      estimated_hours: 18,
      logged_hours: 0,
      due_date: '2026-11-20',
      order_index: 1
    },
    {
      id: 'tsk-009',
      project_id: 'prj-warehouse-02',
      task_number: 204,
      title: 'Optimize ChangeDetectionStrategy to OnPush across Grid Components',
      description: 'Refactor dispatch table rows to utilize immutable signals and OnPush detection for zero UI lag.',
      status: 'DONE',
      priority: 'HIGH',
      type: 'IMPROVEMENT',
      assignee_id: 'usr-dev-03',
      reporter_id: 'usr-dev-03',
      estimated_hours: 10,
      logged_hours: 9,
      due_date: '2026-10-24',
      order_index: 2
    },

    // MCF Project Tasks
    {
      id: 'tsk-010',
      project_id: 'prj-analytics-03',
      task_number: 301,
      title: 'Design Fuel Consumption & Carbon Metric Visualization Cards',
      description: 'KPI summary dashboard cards displaying Metric Tons CO2e saved, compliance index, and fleet efficiency.',
      status: 'TODO',
      priority: 'LOW',
      type: 'FEATURE',
      assignee_id: 'usr-dev-03',
      reporter_id: 'usr-admin-01',
      estimated_hours: 16,
      logged_hours: 0,
      due_date: '2026-11-25',
      order_index: 2
    },
    {
      id: 'tsk-011',
      project_id: 'prj-analytics-03',
      task_number: 302,
      title: 'Draft IMO 2026 Environmental Audit Report Generator',
      description: 'Export quarterly compliance records to CSV and formatted PDF reports.',
      status: 'TODO',
      priority: 'LOW',
      type: 'TASK',
      assignee_id: 'usr-viewer-04',
      reporter_id: 'usr-admin-01',
      estimated_hours: 12,
      logged_hours: 0,
      due_date: '2026-12-05',
      order_index: 3
    }
  ];

  for (const t of tasks) {
    await db.execute({
      sql: `INSERT INTO tasks (id, project_id, task_number, title, description, status, priority, type, assignee_id, reporter_id, estimated_hours, logged_hours, due_date, order_index)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [t.id, t.project_id, t.task_number, t.title, t.description, t.status, t.priority, t.type, t.assignee_id, t.reporter_id, t.estimated_hours, t.logged_hours, t.due_date, t.order_index]
    });
  }

  // 5. Comments
  const comments = [
    {
      id: 'cmt-01',
      task_id: 'tsk-001',
      user_id: 'usr-pm-02',
      content: 'Marcus Vance: The C# backend team deployed the telemetry WebSocket endpoint to staging today. Ready for full integration!'
    },
    {
      id: 'cmt-02',
      task_id: 'tsk-001',
      user_id: 'usr-dev-03',
      content: 'Sohidul Islam: Implemented the auto-reconnect strategy with exponential backoff and hooked it up to an Angular Signal state store. Benchmarking shows rock-solid 60fps renders.'
    },
    {
      id: 'cmt-03',
      task_id: 'tsk-003',
      user_id: 'usr-admin-01',
      content: 'Sarah Jenkins: Excellent catch on the concurrent token refresh deadlock. The PR looks very clean.'
    }
  ];

  for (const c of comments) {
    await db.execute({
      sql: `INSERT INTO comments (id, task_id, user_id, content) VALUES (?, ?, ?, ?)`,
      args: [c.id, c.task_id, c.user_id, c.content]
    });
  }

  // 6. Activities
  const activities = [
    {
      id: 'act-01',
      organization_id: 'org-kobkiat-01',
      project_id: 'prj-telemetry-01',
      task_id: 'tsk-001',
      user_id: 'usr-dev-03',
      action: 'STATUS_UPDATED',
      details: JSON.stringify({ from: 'TODO', to: 'IN_PROGRESS', taskTitle: 'Architect Signal-based WebSocket Stream Client' })
    },
    {
      id: 'act-02',
      organization_id: 'org-kobkiat-01',
      project_id: 'prj-telemetry-01',
      task_id: 'tsk-003',
      user_id: 'usr-dev-03',
      action: 'STATUS_UPDATED',
      details: JSON.stringify({ from: 'IN_PROGRESS', to: 'REVIEW', taskTitle: 'Fix Stale JWT Refresh Interceptor Race Condition' })
    },
    {
      id: 'act-03',
      organization_id: 'org-kobkiat-01',
      project_id: 'prj-telemetry-01',
      task_id: 'tsk-004',
      user_id: 'usr-pm-02',
      action: 'TASK_COMPLETED',
      details: JSON.stringify({ status: 'DONE', taskTitle: 'Define OpenTelemetry Tracing Pipeline with C# Backend' })
    }
  ];

  for (const a of activities) {
    await db.execute({
      sql: `INSERT INTO activities (id, organization_id, project_id, task_id, user_id, action, details) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [a.id, a.organization_id, a.project_id, a.task_id, a.user_id, a.action, a.details]
    });
  }

  // 7. Notifications
  const notifications = [
    {
      id: 'notif-01',
      user_id: 'usr-dev-03',
      title: 'New High Priority Assignment',
      message: 'You were assigned to "Architect Signal-based WebSocket Stream Client" by Marcus Vance.',
      type: 'TASK_ASSIGNED',
      link: '/tasks/tsk-001',
      is_read: 0
    },
    {
      id: 'notif-02',
      user_id: 'usr-dev-03',
      title: 'PR Approved',
      message: 'Sarah Jenkins approved your code review for Task #103.',
      type: 'STATUS_CHANGED',
      link: '/tasks/tsk-003',
      is_read: 0
    },
    {
      id: 'notif-03',
      user_id: 'usr-pm-02',
      title: 'Milestone Completed',
      message: 'Sprint 42 telemetry pipeline milestone reached 100% completion.',
      type: 'INFO',
      link: '/projects/prj-telemetry-01',
      is_read: 1
    }
  ];

  for (const n of notifications) {
    await db.execute({
      sql: `INSERT INTO notifications (id, user_id, title, message, type, link, is_read) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [n.id, n.user_id, n.title, n.message, n.type, n.link, n.is_read]
    });
  }

  console.log('[Database] Seed data inserted successfully!');
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seed command completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed command failed:', err);
      process.exit(1);
    });
}
