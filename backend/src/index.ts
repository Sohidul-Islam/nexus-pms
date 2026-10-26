import express from 'express';
import cors from 'cors';
import { config } from './config';
import { runMigrations } from './db/schema';
import { seedDatabase } from './db/seed';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import orgRoutes from './routes/org.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import commentRoutes from './routes/comment.routes';
import activityRoutes from './routes/activity.routes';
import notificationRoutes from './routes/notification.routes';
import analyticsRoutes from './routes/analytics.routes';
import realtimeRoutes from './routes/realtime.routes';

export const app = express();

// Middlewares
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());

// Request Logger
app.use((req, _res, next) => {
  if (config.nodeEnv !== 'test' && !process.env.VERCEL) {
    console.log(`[HTTP] ${req.method} ${req.url}`);
  }
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    name: 'Nexus PMS API',
    version: '1.0.0',
    environment: config.nodeEnv,
    database: config.database.url.startsWith('file:') ? 'SQLite Local Persistence' : 'LibSQL Cloud Cluster',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api', commentRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/realtime', realtimeRoutes);

// Centralized Error Handling
app.use(errorHandler);

// Server bootstrap
export async function bootstrap() {
  try {
    await runMigrations();
    await seedDatabase();

    if (config.nodeEnv !== 'test' && !process.env.VERCEL) {
      app.listen(config.port, () => {
        console.log(`=======================================================`);
        console.log(`  ?? Nexus Enterprise PMS API Server Running`);
        console.log(`  ?? Port: http://localhost:${config.port}`);
        console.log(`  ?? Database: ${config.database.url}`);
        console.log(`  ???  Auth: JWT with Role-Based Access Control (RBAC)`);
        console.log(`  ? Realtime: SSE Active at /api/realtime/stream`);
        console.log(`=======================================================`);
      });
    }
  } catch (err) {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  bootstrap();
}

export default app;
