/**
 * Deterministic recommendation engine.
 * Scores every amenity of the requested type and returns the best one.
 * Pure logic — no AI. The scoring formula is fully transparent.
 *
 * Score = w1·waitTime + w2·distance + w3·crowdDensity + w4·matchPhaseBonus
 */

import { zoneDistance, getAmenitiesByType } from '../data/venueLayout.js';

/** Scoring weights (must sum to 1.0). */
const WEIGHTS = {
  waitTime: 0.40,
  distance: 0.25,
  crowdDensity: 0.20,
  matchPhase: 0.15,
};

/** Match phases where food is best (lower crowds). */
const GOOD_FOOD_PHASES = ['first-half', 'second-half'];
/** Match phases where restrooms are best. */
const GOOD_RESTROOM_PHASES = ['first-half', 'second-half'];
/** Match phases where exits are best (early departure). */
const GOOD_EXIT_PHASES = ['second-half', 'full-time'];

/**
 * @typedef {Object} ScoredRecommendation
 * @property {string}  id          - Amenity ID.
 * @property {string}  name        - Amenity display name.
 * @property {string}  type        - Amenity type.
 * @property {string}  zoneId      - Zone where the amenity is.
 * @property {number}  waitTime    - Current wait time in minutes.
 * @property {number}  distance    - Distance from user's zone (SVG units).
 * @property {number}  score       - Final score [0, 1] (higher = better).
 * @property {Object}  breakdown   - Score breakdown per factor.
 * @property {string[]} reasoning  - Human-readable reasoning points.
 */

/**
 * Generates a recommendation for the best amenity of a given type.
 * @param {Object}  params
 * @param {string}  params.type       - Amenity type ('restroom', 'food', 'exit', 'medical').
 * @param {string}  params.userZone   - User's current zone ID.
 * @param {import('./simulator.js').CrowdState} params.crowdState - Current crowd state.
 * @returns {{ recommendation: ScoredRecommendation, alternatives: ScoredRecommendation[] }}
 */
export function getRecommendation({ type, userZone, crowdState }) {
  const candidateDefinitions = getAmenitiesByType(type);

  if (candidateDefinitions.length === 0) {
    return { recommendation: null, alternatives: [] };
  }

  // Find max values for normalization
  const amenityStates = crowdState.amenities.filter((a) => a.type === type);
  const maxWait = Math.max(1, ...amenityStates.map((a) => a.waitTime));
  const maxDistance = Math.max(1, ...candidateDefinitions.map((a) => zoneDistance(userZone, a.zoneId)));

  // Score each candidate
  const scored = amenityStates.map((amenityState) => {
    const dist = zoneDistance(userZone, amenityState.zoneId);
    const zoneDensity = crowdState.zones.find((z) => z.id === amenityState.zoneId)?.density ?? 0.5;

    // Normalized scores (0 = worst, 1 = best)
    const waitScore = 1 - amenityState.waitTime / maxWait;
    const distScore = 1 - dist / maxDistance;
    const densityScore = 1 - zoneDensity;

    // Match phase bonus
    let phaseBonus = 0.5; // neutral
    if (type === 'food' && GOOD_FOOD_PHASES.includes(crowdState.phaseId)) phaseBonus = 1.0;
    if (type === 'restroom' && GOOD_RESTROOM_PHASES.includes(crowdState.phaseId)) phaseBonus = 1.0;
    if (type === 'exit' && GOOD_EXIT_PHASES.includes(crowdState.phaseId)) phaseBonus = 1.0;
    if (crowdState.phaseId === 'halftime' && (type === 'food' || type === 'restroom')) phaseBonus = 0.2;

    // Weighted sum
    const score =
      WEIGHTS.waitTime * waitScore +
      WEIGHTS.distance * distScore +
      WEIGHTS.crowdDensity * densityScore +
      WEIGHTS.matchPhase * phaseBonus;

    // Build reasoning
    const reasoning = [];
    if (waitScore > 0.7) reasoning.push(`Short wait time (${amenityState.waitTime} min)`);
    else if (waitScore < 0.3) reasoning.push(`Long wait time (${amenityState.waitTime} min)`);
    if (distScore > 0.7) reasoning.push('Very close to your current location');
    else if (distScore < 0.3) reasoning.push('Far from your current location');
    if (densityScore > 0.7) reasoning.push('Located in a low-crowd zone');
    else if (densityScore < 0.3) reasoning.push('Zone is currently crowded');
    if (phaseBonus > 0.7) reasoning.push('Good timing for this match phase');
    else if (phaseBonus < 0.3) reasoning.push('Busy period — expect higher traffic');

    return {
      id: amenityState.id,
      name: amenityState.name,
      type: amenityState.type,
      zoneId: amenityState.zoneId,
      waitTime: amenityState.waitTime,
      distance: Math.round(dist),
      score: Math.round(score * 1000) / 1000,
      breakdown: {
        waitTime: Math.round(waitScore * 100) / 100,
        distance: Math.round(distScore * 100) / 100,
        crowdDensity: Math.round(densityScore * 100) / 100,
        matchPhase: Math.round(phaseBonus * 100) / 100,
      },
      reasoning,
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return {
    recommendation: scored[0],
    alternatives: scored.slice(1, 4), // Top 3 alternatives
  };
}

/** Exported for testing. */
export { WEIGHTS };
