/**
 * Gemini AI service — "Explain why" for recommendations.
 * Server-side only; API key never exposed to frontend.
 * Includes in-memory cache (60s) and template fallback when no key is set.
 */

import { GoogleGenAI } from '@google/genai';
import { TTLCache } from '../utils/cache.js';

/** @type {TTLCache} */
const explainCache = new TTLCache(60_000, 100);

/** @type {import('@google/genai').GoogleGenAI|null} */
let genAIClient = null;

/**
 * Lazily initializes the Gemini client if an API key is present.
 * Safe to call multiple times.
 */
function ensureClient() {
  if (genAIClient) return;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;

  genAIClient = new GoogleGenAI({ apiKey });
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
  if (cached) return cached;

  // ─── Try to init Gemini (no-op if no key) ───
  ensureClient();

  let result;

  // ─── Try Gemini ──────────────────────────────
  if (genAIClient) {
    try {
      result = await callGemini(input);
    } catch (err) {
      console.warn('Gemini API call failed, using template fallback:', err?.message || err);
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
  // Safety: ensure client exists
  if (!genAIClient) {
    return { explanation: templateExplanation(input).explanation, source: 'gemini' };
  }

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

  // NOTE: If you want, we can flip the "quiet/busy" wording later.
  const crowdText = input.breakdown.crowdDensity > 0.6 ? 'moderately busy' : 'relatively quiet';

  const explanation = `${context}, ${input.name} is your best option for ${input.type}. ${topReason}, and it's located in a ${crowdText} area. With a wait time of just ${input.waitTime} minutes, you can get there and back without missing much of the action.`;

  return { explanation, source: 'template' };
}
