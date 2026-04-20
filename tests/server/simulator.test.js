/**
 * Simulator determinism tests.
 * Verifies that the same seed + match minute always produces identical output.
 */

import { describe, it, expect } from 'vitest';
import { createSimulator } from '../../server/services/simulator.js';

describe('Simulator', () => {
  it('produces deterministic output for seed 42 at match minute 47 (halftime)', () => {
    const sim = createSimulator({ seed: 42, speedMultiplier: 1 });
    const state = sim.getCrowdState(47);

    // Phase should be halftime (45-60)
    expect(state.phaseId).toBe('halftime');
    expect(state.phaseLabel).toBe('Halftime');
    expect(state.matchMinute).toBe(47);

    // Zones should exist
    expect(state.zones).toHaveLength(8);

    // Overall density should be a number between 0 and 1
    expect(state.overallDensity).toBeGreaterThanOrEqual(0);
    expect(state.overallDensity).toBeLessThanOrEqual(1);
  });

  it('returns identical output for the same seed and minute across calls', () => {
    const sim1 = createSimulator({ seed: 42, speedMultiplier: 1 });
    const sim2 = createSimulator({ seed: 42, speedMultiplier: 1 });

    const state1 = sim1.getCrowdState(30);
    const state2 = sim2.getCrowdState(30);

    expect(state1.zones).toEqual(state2.zones);
    expect(state1.amenities).toEqual(state2.amenities);
    expect(state1.overallDensity).toBe(state2.overallDensity);
  });

  it('produces different output for different seeds', () => {
    const simA = createSimulator({ seed: 42, speedMultiplier: 1 });
    const simB = createSimulator({ seed: 99, speedMultiplier: 1 });

    const stateA = simA.getCrowdState(25);
    const stateB = simB.getCrowdState(25);

    // At least one zone density should differ
    const densitiesA = stateA.zones.map((z) => z.density);
    const densitiesB = stateB.zones.map((z) => z.density);
    expect(densitiesA).not.toEqual(densitiesB);
  });

  it('produces different output for different match minutes', () => {
    const sim = createSimulator({ seed: 42, speedMultiplier: 1 });

    const state10 = sim.getCrowdState(10);  // first half
    const state50 = sim.getCrowdState(50);  // halftime

    expect(state10.phaseId).toBe('first-half');
    expect(state50.phaseId).toBe('halftime');
    expect(state10.overallDensity).not.toBe(state50.overallDensity);
  });

  it('includes correct match info', () => {
    const sim = createSimulator({ seed: 42, speedMultiplier: 1 });
    const state = sim.getCrowdState(0);

    expect(state.match).toBeDefined();
    expect(state.match.homeTeam).toBe('Metro City FC');
    expect(state.match.awayTeam).toBe('Riverside United');
    expect(state.match.venue).toBe('MetroArena');
  });

  it('halftime has higher food wait times than first half', () => {
    const sim = createSimulator({ seed: 42, speedMultiplier: 1 });

    const firstHalf = sim.getCrowdState(20);
    const halftime = sim.getCrowdState(50);

    const avgFoodFirst = firstHalf.amenities
      .filter((a) => a.type === 'food')
      .reduce((sum, a) => sum + a.waitTime, 0) / firstHalf.amenities.filter((a) => a.type === 'food').length;

    const avgFoodHalf = halftime.amenities
      .filter((a) => a.type === 'food')
      .reduce((sum, a) => sum + a.waitTime, 0) / halftime.amenities.filter((a) => a.type === 'food').length;

    expect(avgFoodHalf).toBeGreaterThan(avgFoodFirst);
  });

  it('amenity status is correctly assigned based on wait time', () => {
    const sim = createSimulator({ seed: 42, speedMultiplier: 1 });
    const state = sim.getCrowdState(50);

    state.amenities.forEach((amenity) => {
      if (amenity.waitTime > 5) expect(amenity.status).toBe('high');
      else if (amenity.waitTime > 2) expect(amenity.status).toBe('medium');
      else expect(amenity.status).toBe('low');
    });
  });
});
