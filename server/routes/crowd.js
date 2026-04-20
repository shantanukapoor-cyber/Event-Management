/**
 * GET /api/crowd — Returns current crowd state.
 * Deterministic: same match minute + seed = same response.
 */

import { Router } from 'express';
import { createSimulator } from '../services/simulator.js';

export const crowdRouter = Router();

const seed = parseInt(process.env.SIMULATOR_SEED || '42', 10);
const speed = parseInt(process.env.MATCH_SPEED || '9', 10);
const simulator = createSimulator({ seed, speedMultiplier: speed });

crowdRouter.get('/', (_req, res) => {
  const crowdState = simulator.getCrowdState();
  res.json(crowdState);
});

/** Exported for testing. */
export { simulator };
