/**
 * API integration tests (supertest).
 * Tests full request/response cycle through the Express app.
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server/index.js';

const app = createApp();

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.version).toBe('1.0.0');
    expect(res.body.timestamp).toBeTruthy();
    expect(typeof res.body.uptime).toBe('number');
  });
});

describe('GET /api/crowd', () => {
  it('returns valid crowd state', async () => {
    const res = await request(app).get('/api/crowd');

    expect(res.status).toBe(200);
    expect(res.body.zones).toBeDefined();
    expect(Array.isArray(res.body.zones)).toBe(true);
    expect(res.body.zones.length).toBe(8);
    expect(res.body.amenities).toBeDefined();
    expect(Array.isArray(res.body.amenities)).toBe(true);
    expect(res.body.overallDensity).toBeDefined();
    expect(res.body.phaseId).toBeTruthy();
    expect(res.body.match).toBeDefined();
  });

  it('each zone has required fields', async () => {
    const res = await request(app).get('/api/crowd');

    res.body.zones.forEach((zone) => {
      expect(zone.id).toBeTruthy();
      expect(zone.name).toBeTruthy();
      expect(zone.density).toBeGreaterThanOrEqual(0);
      expect(zone.density).toBeLessThanOrEqual(1);
      expect(typeof zone.x).toBe('number');
      expect(typeof zone.y).toBe('number');
    });
  });
});

describe('POST /api/recommend', () => {
  it('returns recommendation for valid input', async () => {
    const res = await request(app)
      .post('/api/recommend')
      .send({ type: 'food', userZone: 'zone-north' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.recommendation).toBeDefined();
    expect(res.body.recommendation.id).toBeTruthy();
    expect(res.body.recommendation.name).toBeTruthy();
    expect(res.body.recommendation.type).toBe('food');
    expect(res.body.recommendation.score).toBeGreaterThan(0);
    expect(res.body.alternatives).toBeDefined();
  });

  it('returns 400 for invalid type', async () => {
    const res = await request(app)
      .post('/api/recommend')
      .send({ type: 'invalid', userZone: 'zone-north' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('returns 400 for missing body', async () => {
    const res = await request(app)
      .post('/api/recommend')
      .send({})
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(400);
  });

  it('returns 400 for XSS attempt in type', async () => {
    const res = await request(app)
      .post('/api/recommend')
      .send({ type: '<script>alert(1)</script>', userZone: 'zone-north' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(400);
  });
});

describe('POST /api/explain', () => {
  it('returns explanation in mock mode (no API key)', async () => {
    const res = await request(app)
      .post('/api/explain')
      .send({
        recommendationId: 'food-burger-hub',
        type: 'food',
        userZone: 'zone-north',
        name: 'Burger Hub',
        waitTime: 3,
        score: 0.75,
        breakdown: { waitTime: 0.8, distance: 0.7, crowdDensity: 0.6, matchPhase: 0.5 },
        reasoning: ['Short wait time'],
      })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.explanation).toBeTruthy();
    expect(typeof res.body.explanation).toBe('string');
    expect(res.body.source).toBe('template');
  });

  it('returns 400 for invalid recommendationId', async () => {
    const res = await request(app)
      .post('/api/explain')
      .send({
        recommendationId: 'foo; DROP TABLE',
        type: 'food',
        userZone: 'zone-north',
      })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(400);
  });
});

describe('Security Headers', () => {
  it('includes security headers in response', async () => {
    const res = await request(app).get('/health');

    // Helmet default headers
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });
});
