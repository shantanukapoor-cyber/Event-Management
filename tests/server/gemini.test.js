/**
 * Gemini service tests.
 * Verifies template fallback works without any API key.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { templateExplanation } from '../../server/services/gemini.js';

// Ensure no API key is present
beforeEach(() => {
  delete process.env.GEMINI_API_KEY;
});

const sampleInput = {
  recommendationId: 'restroom-north-b',
  name: 'North Restroom B',
  type: 'restroom',
  waitTime: 2,
  score: 0.82,
  breakdown: {
    waitTime: 0.9,
    distance: 0.75,
    crowdDensity: 0.65,
    matchPhase: 0.5,
  },
  reasoning: ['Short wait time (2 min)', 'Very close to your current location'],
  phaseLabel: 'Halftime',
  matchMinute: 47,
  userZone: 'zone-north',
};

describe('Gemini Service — Template Fallback', () => {
  it('returns a template response when no API key is set', () => {
    const result = templateExplanation(sampleInput);

    expect(result.source).toBe('template');
    expect(result.explanation).toBeTruthy();
    expect(typeof result.explanation).toBe('string');
  });

  it('explanation includes the amenity name', () => {
    const result = templateExplanation(sampleInput);
    expect(result.explanation).toContain('North Restroom B');
  });

  it('explanation includes the amenity type', () => {
    const result = templateExplanation(sampleInput);
    expect(result.explanation).toContain('restroom');
  });

  it('explanation includes wait time', () => {
    const result = templateExplanation(sampleInput);
    expect(result.explanation).toContain('2 min');
  });

  it('explanation is a reasonable length (< 500 chars)', () => {
    const result = templateExplanation(sampleInput);
    expect(result.explanation.length).toBeLessThan(500);
    expect(result.explanation.length).toBeGreaterThan(50);
  });

  it('explanation references the match phase', () => {
    const result = templateExplanation(sampleInput);
    // Should contain halftime context
    expect(result.explanation.toLowerCase()).toContain('halftime');
  });

  it('works for different match phases', () => {
    const phases = ['Pre-Game', '1st Half', 'Halftime', '2nd Half', 'Full Time'];
    phases.forEach((phaseLabel) => {
      const result = templateExplanation({ ...sampleInput, phaseLabel });
      expect(result.source).toBe('template');
      expect(result.explanation.length).toBeGreaterThan(30);
    });
  });

  it('works for different amenity types', () => {
    const types = ['food', 'restroom', 'exit', 'medical'];
    types.forEach((type) => {
      const result = templateExplanation({ ...sampleInput, type });
      expect(result.source).toBe('template');
      expect(result.explanation).toContain(type);
    });
  });
});
