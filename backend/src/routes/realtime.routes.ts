import { Router, Request, Response } from 'express';
import { realtimeHub } from '../realtime/events';

const router = Router();

// GET /api/realtime/stream
router.get('/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Send initial connected event
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Nexus Realtime Hub Online', timestamp: new Date().toISOString() })}\n\n`);

  // Register client
  realtimeHub.addClient(res);

  // Keep-alive heartbeat every 20 seconds
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

export default router;
