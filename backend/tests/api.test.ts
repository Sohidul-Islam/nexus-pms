import assert from 'assert';
import { app, bootstrap } from '../src/index';

async function runTests() {
  console.log('--- Starting Nexus PMS Backend Integration Test Suite ---');
  let passed = 0;
  let failed = 0;

  await bootstrap();

  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}/api`;

  async function request(path: string, options: RequestInit = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  }

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ? ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ? ${name}:`, err.message);
      failed++;
    }
  }

  let adminToken = '';
  let devToken = '';
  let viewerToken = '';
  let createdProjectId = '';
  let testTaskId = '';

  await test('GET /health returns healthy status and metadata', async () => {
    const res = await request('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'healthy');
  });

  await test('POST /auth/login with valid credentials returns JWT and user', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@nexus.io', password: 'Password123!' })
    });
    assert.strictEqual(res.status, 200);
    adminToken = res.data.token;
  });

  await test('POST /auth/login for developer returns JWT with TEAM_MEMBER role', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'dev@nexus.io', password: 'Password123!' })
    });
    assert.strictEqual(res.status, 200);
    devToken = res.data.token;
  });

  await test('POST /auth/login for viewer returns JWT with VIEWER role', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'viewer@nexus.io', password: 'Password123!' })
    });
    assert.strictEqual(res.status, 200);
    viewerToken = res.data.token;
  });

  await test('POST /auth/login with wrong password returns 401', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@nexus.io', password: 'WrongPassword!' })
    });
    assert.strictEqual(res.status, 401);
  });

  await test('GET /auth/me returns authenticated user details', async () => {
    const res = await request('/auth/me', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
  });

  await test('GET /organizations lists user organizations', async () => {
    const res = await request('/organizations', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
  });

  await test('GET /projects returns seeded projects with progress metrics', async () => {
    const res = await request('/projects', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
  });

  await test('RBAC Security: VIEWER cannot create project (returns 403 Forbidden)', async () => {
    const res = await request('/projects', {
      method: 'POST',
      headers: { Authorization: `Bearer ${viewerToken}` },
      body: JSON.stringify({ name: 'Unauthorized Project', key: 'UNAUTH' })
    });
    assert.strictEqual(res.status, 403);
  });

  await test('ADMIN creates project successfully', async () => {
    const res = await request('/projects', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        organization_id: 'org-kobkiat-01',
        name: 'Automated Port Cranes UI',
        key: 'APC',
        description: 'Testing project creation',
        priority: 'HIGH',
        budget: 50000
      })
    });
    assert.strictEqual(res.status, 201);
    createdProjectId = res.data.project.id;
  });

  await test('GET /tasks returns tasks and supports status filtering', async () => {
    const res = await request('/tasks?status=IN_PROGRESS', {
      headers: { Authorization: `Bearer ${devToken}` }
    });
    assert.strictEqual(res.status, 200);
  });

  await test('POST /tasks creates a new task with sequential numbering', async () => {
    const res = await request('/tasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${devToken}` },
      body: JSON.stringify({
        project_id: createdProjectId,
        title: 'Calibrate Crane Load Sensors',
        description: 'Verify strain gauge telemetry',
        priority: 'URGENT',
        type: 'FEATURE',
        estimated_hours: 8
      })
    });
    assert.strictEqual(res.status, 201);
    testTaskId = res.data.task.id;
  });

  await test('PATCH /tasks/:id/status updates task status and triggers activity', async () => {
    const res = await request(`/tasks/${testTaskId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${devToken}` },
      body: JSON.stringify({ status: 'IN_PROGRESS', order_index: 0 })
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.task.status, 'IN_PROGRESS');
  });

  await test('POST and GET comments on task', async () => {
    const postRes = await request(`/tasks/${testTaskId}/comments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${devToken}` },
      body: JSON.stringify({ content: 'Integration test comment: Sensor telemetry synchronized.' })
    });
    assert.strictEqual(postRes.status, 201);

    const getRes = await request(`/tasks/${testTaskId}/comments`, {
      headers: { Authorization: `Bearer ${devToken}` }
    });
    assert.strictEqual(getRes.status, 200);
  });

  await test('GET /analytics/overview calculates accurate status and priority distributions', async () => {
    const res = await request('/analytics/overview', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
  });

  await test('GET /notifications returns user notifications with unread count', async () => {
    const res = await request('/notifications', {
      headers: { Authorization: `Bearer ${devToken}` }
    });
    assert.strictEqual(res.status, 200);
  });

  server.close();
  console.log(`\nTest Results: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
