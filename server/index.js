/**
 * StadiumPulse — Express server entry point.
 * Serves static frontend (Vite build) and API routes.
 * Designed as a single Cloud Run service.
 */

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applySecurityMiddleware } from './middleware/security.js';
import { createRateLimiter } from './middleware/rateLimit.js';
import { healthRouter } from './routes/health.js';
import { crowdRouter } from './routes/crowd.js';
import { recommendRouter } from './routes/recommend.js';
import { explainRouter } from './routes/explain.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Creates and configures the Express application.
 * Exported for testing with supertest.
 * @returns {import('express').Express}
 */
export function createApp() {
  const app = express();

  // ─── Security ────────────────────────────────────
  applySecurityMiddleware(app);

  // ─── Body parsing ────────────────────────────────
  app.use(express.json({ limit: '16kb' }));

  // ─── Rate limiting ───────────────────────────────
  const apiLimiter = createRateLimiter({
    windowMs: 60_000,
    max: parseInt(process.env.RATE_LIMIT_API || '60', 10),
  });
  const explainLimiter = createRateLimiter({
    windowMs: 60_000,
    max: parseInt(process.env.RATE_LIMIT_EXPLAIN || '10', 10),
  });

  // ─── API routes ──────────────────────────────────
  app.use('/health', healthRouter);
  app.use('/api/crowd', apiLimiter, crowdRouter);
  app.use('/api/recommend', apiLimiter, recommendRouter);
  app.use('/api/explain', explainLimiter, explainRouter);

  // ─── Static files (Vite build output) ────────────
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));

  // SPA fallback: serve index.html for unmatched routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  return app;
}

// ─── Start server (not during tests) ───────────────
const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST;

if (!isTestEnv) {
  const port = parseInt(process.env.PORT || '8080', 10);
  const app = createApp();
  app.listen(port, () => {
    console.log(`⚡ StadiumPulse server running on port ${port}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Gemini API:  ${process.env.GEMINI_API_KEY ? 'enabled' : 'mock mode'}`);
  });
}
