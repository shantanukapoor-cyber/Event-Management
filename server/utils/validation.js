/**
 * Request body validation utilities.
 * Manual validation — no external library dependency.
 */

/** Allowed amenity types for recommendation requests. */
const VALID_TYPES = ['restroom', 'food', 'exit', 'medical'];

/** Allowed zone IDs (must match venueLayout.js). */
const VALID_ZONES = [
  'zone-north', 'zone-south', 'zone-east', 'zone-west',
  'zone-ne', 'zone-nw', 'zone-se', 'zone-sw',
];

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid   - Whether the input passed validation.
 * @property {string} [error]  - Human-readable error message if invalid.
 * @property {Object} [data]   - Sanitized/typed data if valid.
 */

/**
 * Validates POST /api/recommend request body.
 * @param {*} body - The raw request body.
 * @returns {ValidationResult}
 */
export function validateRecommendRequest(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object.' };
  }

  const { type, userZone } = body;

  if (typeof type !== 'string' || !VALID_TYPES.includes(type)) {
    return {
      valid: false,
      error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}.`,
    };
  }

  if (typeof userZone !== 'string' || !VALID_ZONES.includes(userZone)) {
    return {
      valid: false,
      error: `Invalid userZone. Must be one of: ${VALID_ZONES.join(', ')}.`,
    };
  }

  return { valid: true, data: { type, userZone } };
}

/**
 * Validates POST /api/explain request body.
 * @param {*} body - The raw request body.
 * @returns {ValidationResult}
 */
export function validateExplainRequest(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object.' };
  }

  const { recommendationId, type, userZone } = body;

  if (typeof recommendationId !== 'string' || recommendationId.length === 0 || recommendationId.length > 100) {
    return { valid: false, error: 'recommendationId must be a non-empty string (max 100 chars).' };
  }

  // Sanitize: only allow alphanumeric, hyphens, underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(recommendationId)) {
    return { valid: false, error: 'recommendationId contains invalid characters.' };
  }

  if (typeof type !== 'string' || !VALID_TYPES.includes(type)) {
    return {
      valid: false,
      error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}.`,
    };
  }

  if (typeof userZone !== 'string' || !VALID_ZONES.includes(userZone)) {
    return {
      valid: false,
      error: `Invalid userZone. Must be one of: ${VALID_ZONES.join(', ')}.`,
    };
  }

  return { valid: true, data: { recommendationId, type, userZone } };
}

/**
 * Exported constants for testing.
 */
export { VALID_TYPES, VALID_ZONES };
