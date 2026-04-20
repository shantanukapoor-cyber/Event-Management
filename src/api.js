/**
 * API client — fetch wrapper for server API calls.
 * Handles errors, loading states, and base URL configuration.
 */

const BASE = '';  // Same origin in production; Vite proxy in dev

/**
 * Fetches current crowd state from the server.
 * @returns {Promise<Object>} Crowd state data.
 */
export async function fetchCrowdState() {
  const res = await fetch(`${BASE}/api/crowd`);
  if (!res.ok) throw new Error(`Crowd API error: ${res.status}`);
  return res.json();
}

/**
 * Requests a recommendation from the server.
 * @param {string} type     - 'restroom' | 'food' | 'exit' | 'medical'
 * @param {string} userZone - User's current zone ID.
 * @returns {Promise<Object>} Recommendation with alternatives.
 */
export async function fetchRecommendation(type, userZone) {
  const res = await fetch(`${BASE}/api/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, userZone }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Recommend API error: ${res.status}`);
  }
  return res.json();
}

/**
 * Requests an AI explanation for a recommendation.
 * @param {Object} recommendation - The recommendation object to explain.
 * @returns {Promise<{ explanation: string, source: 'gemini'|'template' }>}
 */
export async function fetchExplanation(recommendation) {
  const res = await fetch(`${BASE}/api/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recommendationId: recommendation.id,
      type: recommendation.type,
      userZone: recommendation.zoneId,
      name: recommendation.name,
      waitTime: recommendation.waitTime,
      score: recommendation.score,
      breakdown: recommendation.breakdown,
      reasoning: recommendation.reasoning,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Explain API error: ${res.status}`);
  }
  return res.json();
}

/**
 * Checks server health.
 * @returns {Promise<Object>}
 */
export async function checkHealth() {
  const res = await fetch(`${BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}
