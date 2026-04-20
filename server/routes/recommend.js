/**
 * POST /api/recommend — Returns the best amenity recommendation.
 * Body: { type: 'restroom'|'food'|'exit'|'medical', userZone: 'zone-*' }
 */

import { Router } from 'express';
import { validateRecommendRequest } from '../utils/validation.js';
import { getRecommendation } from '../services/recommendationEngine.js';
import { createSimulator } from '../services/simulator.js';

export const recommendRouter = Router();

const seed = parseInt(process.env.SIMULATOR_SEED || '42', 10);
const speed = parseInt(process.env.MATCH_SPEED || '9', 10);
const simulator = createSimulator({ seed, speedMultiplier: speed });

recommendRouter.post('/', (req, res) => {
  // ─── Validate input ──────────────────────────
  const validation = validateRecommendRequest(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const { type, userZone } = validation.data;

  // ─── Get current crowd state ─────────────────
  const crowdState = simulator.getCrowdState();

  // ─── Run recommendation engine ───────────────
  const result = getRecommendation({ type, userZone, crowdState });

  if (!result.recommendation) {
    return res.status(404).json({ error: `No ${type} amenities found.` });
  }

  res.json({
    recommendation: result.recommendation,
    alternatives: result.alternatives,
    matchMinute: crowdState.matchMinute,
    phaseLabel: crowdState.phaseLabel,
  });
});
