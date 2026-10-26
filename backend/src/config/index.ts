import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'nexus-super-secret-jwt-key-2026-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  database: {
    // Supports local SQLite file (e.g. file:./data/nexus.db)
    // or cloud Turso LibSQL URL (e.g. libsql://nexus-db.turso.io) for Vercel
    url: process.env.DATABASE_URL || 'file:./data/nexus.db',
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  }
};
