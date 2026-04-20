/**
 * POST /api/explain — AI-powered explanation of a recommendation.
 * Uses Gemini if GEMINI_API_KEY is set, otherwise template fallback.
 * Body: { recommendationId, type, userZone, name, waitTime, score, breakdown, reasoning, phaseLabel, matchMinute }
 */

import { Router } from 'express';
import { validateExplainRequest } from '../utils/validation.js';
import { explainRecommendation } from '../services/gemini.js';
import { createSimulator } from '../services/simulator.js';

export const explainRouter = Router();

const seed = parseInt(process.env.SIMULATOR_SEED || '42', 10);
const speed = parseInt(process.env.MATCH_SPEED || '9', 10);
const simulator = createSimulator({ seed, speedMultiplier: speed });

explainRouter.post('/', async (req, res) => {
  // ─── Validate core fields ────────────────────
  const validation = validateExplainRequest(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  // ─── Extract all fields (validated + pass-through) ─
  const {
    recommendationId,
    type,
    userZone,
    name = 'Unknown',
    waitTime = 0,
    score = 0,
    breakdown = {},
    reasoning = [],
  } = req.body;

  const crowdState = simulator.getCrowdState();

  try {
    const result = await explainRecommendation({
      recommendationId,
      name,
      type,
      waitTime,
      score,
      breakdown,
      reasoning,
      phaseLabel: crowdState.phaseLabel,
      matchMinute: crowdState.matchMinute,
      userZone,
    });

    res.json(result);
  } catch (err) {
    console.error('Explain route error:', err);
    res.status(500).json({ error: 'Failed to generate explanation.' });
  }
});
