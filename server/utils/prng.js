/**
 * Mulberry32 — a fast, seedable 32-bit PRNG.
 * Produces deterministic sequences suitable for simulation and testing.
 *
 * @see https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
 */

/**
 * Creates a seeded PRNG returning values in [0, 1).
 * @param {number} seed - The integer seed value.
 * @returns {() => number} A function that returns the next pseudo-random number.
 *
 * @example
 * const rng = mulberry32(42);
 * console.log(rng()); // always 0.6011037519201636
 * console.log(rng()); // always 0.30260880454443395
 */
export function mulberry32(seed) {
  let state = seed | 0;

  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns a random float in [min, max) using the provided PRNG.
 * @param {() => number} rng - A PRNG function returning [0, 1).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomFloat(rng, min, max) {
  return min + rng() * (max - min);
}

/**
 * Returns a random integer in [min, max] (inclusive) using the provided PRNG.
 * @param {() => number} rng - A PRNG function returning [0, 1).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomInt(rng, min, max) {
  return Math.floor(min + rng() * (max - min + 1));
}
