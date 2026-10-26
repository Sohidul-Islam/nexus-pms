import { createClient, Client } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

// Ensure data directory exists if using local file SQLite
if (config.database.url.startsWith('file:')) {
  const filePath = config.database.url.replace(/^file:/, '');
  if (filePath && !filePath.startsWith(':memory:')) {
    const dir = path.dirname(path.resolve(filePath));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

export const db: Client = createClient({
  url: config.database.url,
  authToken: config.database.authToken,
});

export async function executeQuery<T = any>(sql: string, args: any[] = []): Promise<T[]> {
  const result = await db.execute({ sql, args });
  return (result.rows as unknown) as T[];
}

export async function executeOne<T = any>(sql: string, args: any[] = []): Promise<T | null> {
  const rows = await executeQuery<T>(sql, args);
  return rows.length > 0 ? rows[0] : null;
}
