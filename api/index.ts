import app, { bootstrap } from '../backend/src/index';

// Initialize schema on serverless cold start
let isReady = false;

export default async function handler(req: any, res: any) {
  if (!isReady) {
    await bootstrap();
    isReady = true;
  }
  return app(req, res);
}
