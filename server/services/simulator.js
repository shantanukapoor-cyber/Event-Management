/**
 * Crowd & wait-time simulator.
 * Uses a seeded PRNG to produce deterministic, match-phase-aware data.
 * Same seed + same match minute = identical output (ideal for testing).
 */

import { mulberry32, randomFloat } from '../utils/prng.js';
import { zones, amenities } from '../data/venueLayout.js';
import { getPhaseForMinute, matchInfo } from '../data/matchTimeline.js';

/**
 * @typedef {Object} ZoneState
 * @property {string}  id       - Zone ID.
 * @property {string}  name     - Display name.
 * @property {number}  density  - Crowd density [0.0, 1.0].
 * @property {number}  x        - SVG x coordinate.
 * @property {number}  y        - SVG y coordinate.
 */

/**
 * @typedef {Object} AmenityState
 * @property {string}  id       - Amenity ID.
 * @property {string}  name     - Display name.
 * @property {string}  type     - Amenity type.
 * @property {string}  zoneId   - Containing zone ID.
 * @property {number}  waitTime - Current estimated wait time in minutes.
 * @property {string}  status   - 'low' | 'medium' | 'high'.
 */

/**
 * @typedef {Object} CrowdState
 * @property {number}          matchMinute  - Current match minute.
 * @property {string}          phaseId      - Current phase ID.
 * @property {string}          phaseLabel   - Current phase display label.
 * @property {ZoneState[]}     zones        - Zone crowd states.
 * @property {AmenityState[]}  amenities    - Amenity wait states.
 * @property {number}          overallDensity - Venue-wide density [0.0, 1.0].
 * @property {Object}          match        - Match info (teams, score).
 */

/**
 * Creates a simulator instance.
 * @param {Object}  options
 * @param {number}  [options.seed=42]     - PRNG seed.
 * @param {number}  [options.speedMultiplier=9] - Match speed (1=real-time, 9=~10min demo).
 * @returns {{ getCrowdState: (overrideMinute?: number) => CrowdState, getMatchMinute: () => number }}
 */
export function createSimulator({ seed = 42, speedMultiplier = 9 } = {}) {
  const startTime = Date.now();

  /**
   * Returns the current simulated match minute.
   * @returns {number}
   */
  function getMatchMinute() {
    const elapsedMs = Date.now() - startTime;
    const elapsedMinutes = (elapsedMs / 1000 / 60) * speedMultiplier;
    // Match runs from -10 (pre-game) to 110 (post-full-time)
    return Math.min(110, Math.floor(-10 + elapsedMinutes));
  }

  /**
   * Generates the full crowd state for a given match minute.
   * Uses a fresh PRNG seeded with (baseSeed + minute) for determinism.
   * @param {number} [overrideMinute] - Override the current match minute (for testing).
   * @returns {CrowdState}
   */
  function getCrowdState(overrideMinute) {
    const minute = overrideMinute ?? getMatchMinute();
    const phase = getPhaseForMinute(minute);

    // Seed per-minute so output is deterministic for a given minute
    const rng = mulberry32(seed + minute + 1000);

    // ─── Zone densities ──────────────────────────
    const zoneStates = zones.map((zone) => {
      // Base density from seat occupancy, modified by concourse activity
      const baseDensity = phase.crowdModifiers.seats * 0.6 + phase.crowdModifiers.concourse * 0.4;
      // Add per-zone random variation (±15%)
      const variation = randomFloat(rng, -0.15, 0.15);
      const density = Math.max(0, Math.min(1, baseDensity + variation));

      return {
        id: zone.id,
        name: zone.name,
        density: Math.round(density * 100) / 100,
        x: zone.x,
        y: zone.y,
      };
    });

    // ─── Amenity wait times ──────────────────────
    const amenityStates = amenities.map((amenity) => {
      const modifier = phase.crowdModifiers[amenity.type] ?? phase.crowdModifiers.concourse;
      // Wait = baseWait * phaseModifier + random variation
      const variation = randomFloat(rng, -1, 2);
      const waitTime = Math.max(0, Math.round((amenity.baseWait * modifier + variation) * 10) / 10);

      let status = 'low';
      if (waitTime > 5) status = 'high';
      else if (waitTime > 2) status = 'medium';

      return {
        id: amenity.id,
        name: amenity.name,
        type: amenity.type,
        zoneId: amenity.zoneId,
        waitTime,
        status,
      };
    });

    // ─── Overall venue density ───────────────────
    const overallDensity =
      Math.round(
        (zoneStates.reduce((sum, z) => sum + z.density, 0) / zoneStates.length) * 100
      ) / 100;

    return {
      matchMinute: minute,
      phaseId: phase.id,
      phaseLabel: phase.label,
      zones: zoneStates,
      amenities: amenityStates,
      overallDensity,
      match: { ...matchInfo },
    };
  }

  return { getCrowdState, getMatchMinute };
}
