/**
 * Gemini AI service — "Explain why" for recommendations.
 * Server-side only; API key never exposed to frontend.
 * Includes in-memory cache (60s) and template fallback when no key is set.
 */

import { TTLCache } from '../utils/cache.js';

/** @type {TTLCache} */
const explainCache = new TTLCache(60_000, 100);

/** @type {import('@google/genai').GoogleGenAI|null} */
let genAIClient = null;

/**
 * Lazily initializes the Gemini client.
 * @returns {import('@google/genai').GoogleGenAI|null}
 */
function getClient() {
  if (genAIClient) return genAIClient;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  // Dynamic import to avoid issues when the SDK isn't needed
  try {
    // Use require-like pattern for the already-installed package
    const { GoogleGenAI } = /** @type {any} */ (
      // @ts-ignore — dynamic import handled at runtime
      await import('@google/genai')
    );
    genAIClient = new GoogleGenAI({ apiKey });
    return genAIClient;
  } catch {
    return null;
  }
}

// Pre-initialize at module load (top-level await in ESM)
try {
  if (process.env.GEMINI_API_KEY) {
    const { GoogleGenAI } = await import('@google/genai');
    genAIClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
} catch {
  // SDK not available — template fallback will be used
  genAIClient = null;
}

/**
 * @typedef {Object} ExplainInput
 * @property {string}   recommendationId - The recommended amenity ID.
 * @property {string}   name             - Amenity name.
 * @property {string}   type             - Amenity type.
 * @property {number}   waitTime         - Current wait time.
 * @property {number}   score            - Recommendation score.
 * @property {Object}   breakdown        - Score breakdown.
 * @property {string[]} reasoning        - Engine reasoning points.
 * @property {string}   phaseLabel       - Current match phase.
 * @property {number}   matchMinute      - Current match minute.
 * @property {string}   userZone         - User's zone.
 */

/**
 * Generates a natural-language explanation for a recommendation.
 * Uses Gemini if available, otherwise returns a template-based fallback.
 *
 * @param {ExplainInput} input
 * @returns {Promise<{ explanation: string, source: 'gemini' | 'template' }>}
 */
export async function explainRecommendation(input) {
  // ─── Cache check ─────────────────────────────
  const cacheKey = `${input.recommendationId}-${input.matchMinute}-${input.userZone}`;
  const cached = explainCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  let result;

  // ─── Try Gemini ──────────────────────────────
  if (genAIClient) {
    try {
      result = await callGemini(input);
    } catch (err) {
      console.warn('Gemini API call failed, using template fallback:', err.message);
      result = templateExplanation(input);
    }
  } else {
    result = templateExplanation(input);
  }

  // ─── Cache result ────────────────────────────
  explainCache.set(cacheKey, result);
  return result;
}

/**
 * Calls Gemini API for an explanation.
 * @param {ExplainInput} input
 * @returns {Promise<{ explanation: string, source: 'gemini' }>}
 */
async function callGemini(input) {
  const prompt = buildPrompt(input);

  const response = await genAIClient.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      maxOutputTokens: 150,
      temperature: 0.3,
    },
  });

  const explanation = response.text?.trim() || templateExplanation(input).explanation;

  return { explanation, source: 'gemini' };
}

/**
 * Builds the prompt for Gemini.
 * @param {ExplainInput} input
 * @returns {string}
 */
function buildPrompt(input) {
  return `You are a helpful stadium assistant at MetroArena, a 60,000-seat soccer venue.

A fan in ${input.userZone.replace('zone-', '').toUpperCase()} zone asked for the best ${input.type} during ${input.phaseLabel} (minute ${input.matchMinute}).

The system recommended: "${input.name}"
- Wait time: ${input.waitTime} minutes
- Score: ${input.score}/1.0
- Key factors: ${input.reasoning.join('; ')}
- Score breakdown: wait=${input.breakdown.waitTime}, distance=${input.breakdown.distance}, crowd=${input.breakdown.crowdDensity}, timing=${input.breakdown.matchPhase}

In 2-3 concise sentences, explain WHY this is the best choice right now. Be friendly, specific, and mention the match phase context. Do not use markdown.`;
}

/**
 * Template-based fallback when Gemini is unavailable.
 * @param {ExplainInput} input
 * @returns {{ explanation: string, source: 'template' }}
 */
export function templateExplanation(input) {
  const phaseContext = {
    'Pre-Game': 'As fans are still arriving',
    '1st Half': 'During the first half with most fans in their seats',
    'Halftime': 'During the halftime rush',
    '2nd Half': 'During the second half',
    'Full Time': 'As the match wraps up',
  };

  const context = phaseContext[input.phaseLabel] || 'Right now';
  const topReason = input.reasoning[0] || 'It scored highest overall';

  const explanation = `${context}, ${input.name} is your best option for ${input.type}. ${topReason}, and it's located in a ${
    input.breakdown.crowdDensity > 0.6 ? 'relatively quiet' : 'moderately busy'
  } area. With a wait time of just ${input.waitTime} minutes, you can get there and back without missing much of the action.`;

  return { explanation, source: 'template' };
}
