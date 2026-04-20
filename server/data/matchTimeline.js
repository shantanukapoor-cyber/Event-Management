/**
 * Soccer match timeline — phase definitions and crowd behavior modifiers.
 * A standard match: pre-game → first half (0-45) → halftime (45-60) → second half (60-90) → full-time.
 */

/**
 * @typedef {Object} MatchPhase
 * @property {string}  id            - Phase identifier.
 * @property {string}  label         - Display label.
 * @property {number}  startMin      - Start minute (inclusive).
 * @property {number}  endMin        - End minute (exclusive).
 * @property {Object}  crowdModifiers - Multipliers for crowd behavior.
 * @property {number}  crowdModifiers.concourse  - Concourse traffic multiplier.
 * @property {number}  crowdModifiers.restroom   - Restroom wait multiplier.
 * @property {number}  crowdModifiers.food       - Food wait multiplier.
 * @property {number}  crowdModifiers.exit       - Exit traffic multiplier.
 * @property {number}  crowdModifiers.seats      - Seat occupancy (0-1).
 */

/** @type {MatchPhase[]} */
export const matchPhases = [
  {
    id: 'pre-game',
    label: 'Pre-Game',
    startMin: -60,
    endMin: 0,
    crowdModifiers: {
      concourse: 0.7,
      restroom: 0.5,
      food: 0.8,
      exit: 0.1,
      seats: 0.3,
    },
  },
  {
    id: 'first-half',
    label: '1st Half',
    startMin: 0,
    endMin: 45,
    crowdModifiers: {
      concourse: 0.3,
      restroom: 0.4,
      food: 0.3,
      exit: 0.05,
      seats: 0.9,
    },
  },
  {
    id: 'halftime',
    label: 'Halftime',
    startMin: 45,
    endMin: 60,
    crowdModifiers: {
      concourse: 1.0,
      restroom: 1.0,
      food: 1.0,
      exit: 0.1,
      seats: 0.4,
    },
  },
  {
    id: 'second-half',
    label: '2nd Half',
    startMin: 60,
    endMin: 90,
    crowdModifiers: {
      concourse: 0.35,
      restroom: 0.45,
      food: 0.25,
      exit: 0.1,
      seats: 0.85,
    },
  },
  {
    id: 'full-time',
    label: 'Full Time',
    startMin: 90,
    endMin: 120,
    crowdModifiers: {
      concourse: 0.9,
      restroom: 0.6,
      food: 0.1,
      exit: 1.0,
      seats: 0.15,
    },
  },
];

/**
 * Returns the current match phase for a given match minute.
 * @param {number} minute - Current match minute (-60 to 120).
 * @returns {MatchPhase}
 */
export function getPhaseForMinute(minute) {
  const phase = matchPhases.find(
    (p) => minute >= p.startMin && minute < p.endMin
  );
  // Default to full-time if beyond match duration
  return phase || matchPhases[matchPhases.length - 1];
}

/**
 * Mock match state for the demo.
 * @type {{ homeTeam: string, awayTeam: string, homeScore: number, awayScore: number, venue: string }}
 */
export const matchInfo = {
  homeTeam: 'Metro City FC',
  awayTeam: 'Riverside United',
  homeScore: 2,
  awayScore: 1,
  venue: 'MetroArena',
  competition: 'Premier League',
  date: '2026-04-20',
};
