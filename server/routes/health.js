/**
 * Health check route.
 * GET /health → { status: 'ok', timestamp, uptime, geminiEnabled }
 */

import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    geminiEnabled: !!process.env.GEMINI_API_KEY,
    version: '1.0.0',
  });
});
