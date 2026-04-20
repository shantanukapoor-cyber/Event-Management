/**
 * Security middleware — HTTP headers, CORS, and request size limits.
 * Lightweight alternative to full helmet when we need fine-grained control.
 */

import helmet from 'helmet';

/**
 * Applies security middleware to the Express app.
 * @param {import('express').Express} app
 */
export function applySecurityMiddleware(app) {
  // ─── Helmet: secure HTTP headers ─────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // ─── CORS ────────────────────────────────────────
  app.use((req, res, next) => {
    const allowedOrigins =
      process.env.NODE_ENV === 'production'
        ? [process.env.ALLOWED_ORIGIN || '']
        : ['http://localhost:5173', 'http://localhost:8080'];

    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });
}
