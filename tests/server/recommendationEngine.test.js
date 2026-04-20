/**
 * Recommendation engine tests.
 * Verifies deterministic scoring, correct ranking, and weight application.
 */

import { describe, it, expect } from 'vitest';
import { getRecommendation, WEIGHTS } from '../../server/services/recommendationEngine.js';
import { createSimulator } from '../../server/services/simulator.js';

describe('Recommendation Engine', () => {
  const sim = createSimulator({ seed: 42, speedMultiplier: 1 });

  it('returns a recommendation for restroom type', () => {
    const crowdState = sim.getCrowdState(47); // halftime
    const result = getRecommendation({ type: 'restroom', userZone: 'zone-north', crowdState });

    expect(result.recommendation).toBeDefined();
    expect(result.recommendation.type).toBe('restroom');
    expect(result.recommendation.id).toBeTruthy();
    expect(result.recommendation.score).toBeGreaterThan(0);
    expect(result.recommendation.score).toBeLessThanOrEqual(1);
  });

  it('returns alternatives alongside the top recommendation', () => {
    const crowdState = sim.getCrowdState(30);
    const result = getRecommendation({ type: 'food', userZone: 'zone-south', crowdState });

    expect(result.recommendation).toBeDefined();
    expect(result.alternatives).toBeDefined();
    expect(result.alternatives.length).toBeGreaterThan(0);
    expect(result.alternatives.length).toBeLessThanOrEqual(3);
  });

  it('top recommendation has the highest score', () => {
    const crowdState = sim.getCrowdState(30);
    const result = getRecommendation({ type: 'food', userZone: 'zone-east', crowdState });

    const topScore = result.recommendation.score;
    result.alternatives.forEach((alt) => {
      expect(topScore).toBeGreaterThanOrEqual(alt.score);
    });
  });

  it('produces deterministic results (same input = same output)', () => {
    const crowdState = sim.getCrowdState(47);
    const result1 = getRecommendation({ type: 'restroom', userZone: 'zone-north', crowdState });
    const result2 = getRecommendation({ type: 'restroom', userZone: 'zone-north', crowdState });

    expect(result1.recommendation.id).toBe(result2.recommendation.id);
    expect(result1.recommendation.score).toBe(result2.recommendation.score);
  });

  it('includes score breakdown factors', () => {
    const crowdState = sim.getCrowdState(20);
    const result = getRecommendation({ type: 'food', userZone: 'zone-west', crowdState });

    const bd = result.recommendation.breakdown;
    expect(bd).toBeDefined();
    expect(bd.waitTime).toBeGreaterThanOrEqual(0);
    expect(bd.waitTime).toBeLessThanOrEqual(1);
    expect(bd.distance).toBeGreaterThanOrEqual(0);
    expect(bd.distance).toBeLessThanOrEqual(1);
    expect(bd.crowdDensity).toBeGreaterThanOrEqual(0);
    expect(bd.crowdDensity).toBeLessThanOrEqual(1);
    expect(bd.matchPhase).toBeGreaterThanOrEqual(0);
    expect(bd.matchPhase).toBeLessThanOrEqual(1);
  });

  it('includes human-readable reasoning', () => {
    const crowdState = sim.getCrowdState(20);
    const result = getRecommendation({ type: 'exit', userZone: 'zone-south', crowdState });

    expect(result.recommendation.reasoning).toBeDefined();
    expect(Array.isArray(result.recommendation.reasoning)).toBe(true);
  });

  it('scoring weights sum to 1.0', () => {
    const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it('returns null recommendation for unknown type', () => {
    const crowdState = sim.getCrowdState(20);
    const result = getRecommendation({ type: 'nonexistent', userZone: 'zone-north', crowdState });

    expect(result.recommendation).toBeNull();
  });

  it('prefers closer amenities when wait times are similar', () => {
    const crowdState = sim.getCrowdState(20);
    // User in zone-ne: NE restroom should rank higher than distant restrooms
    const result = getRecommendation({ type: 'restroom', userZone: 'zone-ne', crowdState });

    // The recommendation's zone should be close to zone-ne
    const topZone = result.recommendation.zoneId;
    const closeZones = ['zone-ne', 'zone-north', 'zone-east'];
    // In most scenarios with balanced wait times, nearby amenities should win
    expect(closeZones).toContain(topZone);
  });
});
