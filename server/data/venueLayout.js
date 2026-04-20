/**
 * MetroArena — Fictional 60,000-seat soccer stadium.
 * Defines zones, amenities, and spatial relationships used by the simulator
 * and recommendation engine.
 */

/**
 * @typedef {Object} Amenity
 * @property {string}  id       - Unique identifier.
 * @property {string}  name     - Display name.
 * @property {string}  type     - 'restroom' | 'food' | 'exit' | 'medical'.
 * @property {string}  zoneId   - Zone where this amenity is located.
 * @property {number}  baseWait - Base wait time in minutes (scales with match phase).
 * @property {number}  capacity - Max throughput per minute.
 */

/**
 * @typedef {Object} Zone
 * @property {string}  id         - Unique identifier.
 * @property {string}  name       - Display name.
 * @property {number}  capacity   - Seating/standing capacity.
 * @property {number}  x          - SVG center x coordinate (0-100 scale).
 * @property {number}  y          - SVG center y coordinate (0-100 scale).
 * @property {string[]} adjacentZones - IDs of neighboring zones.
 */

/** @type {Zone[]} */
export const zones = [
  {
    id: 'zone-north',
    name: 'North Stand',
    capacity: 12000,
    x: 50, y: 10,
    adjacentZones: ['zone-ne', 'zone-nw'],
  },
  {
    id: 'zone-south',
    name: 'South Stand',
    capacity: 12000,
    x: 50, y: 90,
    adjacentZones: ['zone-se', 'zone-sw'],
  },
  {
    id: 'zone-east',
    name: 'East Stand',
    capacity: 9000,
    x: 90, y: 50,
    adjacentZones: ['zone-ne', 'zone-se'],
  },
  {
    id: 'zone-west',
    name: 'West Stand',
    capacity: 9000,
    x: 10, y: 50,
    adjacentZones: ['zone-nw', 'zone-sw'],
  },
  {
    id: 'zone-ne',
    name: 'NE Corner',
    capacity: 4500,
    x: 80, y: 20,
    adjacentZones: ['zone-north', 'zone-east'],
  },
  {
    id: 'zone-nw',
    name: 'NW Corner',
    capacity: 4500,
    x: 20, y: 20,
    adjacentZones: ['zone-north', 'zone-west'],
  },
  {
    id: 'zone-se',
    name: 'SE Corner',
    capacity: 4500,
    x: 80, y: 80,
    adjacentZones: ['zone-south', 'zone-east'],
  },
  {
    id: 'zone-sw',
    name: 'SW Corner',
    capacity: 4500,
    x: 20, y: 80,
    adjacentZones: ['zone-south', 'zone-west'],
  },
];

/** @type {Amenity[]} */
export const amenities = [
  // ─── Restrooms ─────────────────────────────────
  { id: 'restroom-north-a', name: 'North Restroom A', type: 'restroom', zoneId: 'zone-north', baseWait: 3, capacity: 40 },
  { id: 'restroom-north-b', name: 'North Restroom B', type: 'restroom', zoneId: 'zone-nw', baseWait: 2, capacity: 30 },
  { id: 'restroom-south-a', name: 'South Restroom A', type: 'restroom', zoneId: 'zone-south', baseWait: 3, capacity: 40 },
  { id: 'restroom-south-b', name: 'South Restroom B', type: 'restroom', zoneId: 'zone-se', baseWait: 2, capacity: 30 },
  { id: 'restroom-east', name: 'East Restroom', type: 'restroom', zoneId: 'zone-east', baseWait: 2, capacity: 25 },
  { id: 'restroom-west', name: 'West Restroom', type: 'restroom', zoneId: 'zone-west', baseWait: 2, capacity: 25 },
  { id: 'restroom-ne', name: 'NE Restroom', type: 'restroom', zoneId: 'zone-ne', baseWait: 1, capacity: 20 },
  { id: 'restroom-sw', name: 'SW Restroom', type: 'restroom', zoneId: 'zone-sw', baseWait: 1, capacity: 20 },

  // ─── Food & Beverage ───────────────────────────
  { id: 'food-burger-hub', name: 'Burger Hub', type: 'food', zoneId: 'zone-north', baseWait: 5, capacity: 15 },
  { id: 'food-pizza-corner', name: 'Pizza Corner', type: 'food', zoneId: 'zone-south', baseWait: 6, capacity: 12 },
  { id: 'food-taco-stand', name: 'Taco Stand', type: 'food', zoneId: 'zone-east', baseWait: 4, capacity: 18 },
  { id: 'food-noodle-bar', name: 'Noodle Bar', type: 'food', zoneId: 'zone-west', baseWait: 5, capacity: 14 },
  { id: 'food-drinks-ne', name: 'Drinks Express NE', type: 'food', zoneId: 'zone-ne', baseWait: 3, capacity: 20 },
  { id: 'food-snacks-sw', name: 'Snack Shack SW', type: 'food', zoneId: 'zone-sw', baseWait: 3, capacity: 22 },

  // ─── Exits ─────────────────────────────────────
  { id: 'exit-north', name: 'North Gate', type: 'exit', zoneId: 'zone-north', baseWait: 1, capacity: 200 },
  { id: 'exit-south', name: 'South Gate', type: 'exit', zoneId: 'zone-south', baseWait: 1, capacity: 200 },
  { id: 'exit-east', name: 'East Gate', type: 'exit', zoneId: 'zone-east', baseWait: 1, capacity: 150 },
  { id: 'exit-west', name: 'West Gate', type: 'exit', zoneId: 'zone-west', baseWait: 1, capacity: 150 },

  // ─── Medical ───────────────────────────────────
  { id: 'medical-north', name: 'First Aid North', type: 'medical', zoneId: 'zone-nw', baseWait: 0, capacity: 10 },
  { id: 'medical-south', name: 'First Aid South', type: 'medical', zoneId: 'zone-se', baseWait: 0, capacity: 10 },
];

/**
 * Computes Euclidean distance between two zones on the SVG coordinate plane.
 * @param {string} zoneIdA
 * @param {string} zoneIdB
 * @returns {number} Distance in SVG units (0-141 range).
 */
export function zoneDistance(zoneIdA, zoneIdB) {
  const a = zones.find((z) => z.id === zoneIdA);
  const b = zones.find((z) => z.id === zoneIdB);
  if (!a || !b) return 100; // max distance fallback
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Returns the amenity object by ID.
 * @param {string} id
 * @returns {Amenity|undefined}
 */
export function getAmenityById(id) {
  return amenities.find((a) => a.id === id);
}

/**
 * Returns all amenities of a given type.
 * @param {string} type
 * @returns {Amenity[]}
 */
export function getAmenitiesByType(type) {
  return amenities.filter((a) => a.type === type);
}
