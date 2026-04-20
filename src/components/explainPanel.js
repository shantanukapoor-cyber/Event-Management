/**
 * Explain panel — shows AI (or template) explanation for a recommendation.
 */

import { icon } from '../data/icons.js';

/**
 * Renders the explanation into the explain container.
 * @param {HTMLElement} container - The #explain-container element.
 * @param {Object} data
 * @param {string} data.explanation - The explanation text.
 * @param {string} data.source     - 'gemini' or 'template'.
 */
export function renderExplainPanel(container, { explanation, source }) {
  container.innerHTML = '';

  const panel = document.createElement('div');
  panel.className = 'explain-panel animate-fade-in-up';
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', 'AI explanation');
  panel.id = 'explain-panel';

  const sourceLabel = source === 'gemini'
    ? `${icon('sparkles', 12)} Powered by Gemini AI`
    : `${icon('info', 12)} Smart analysis`;

  const headerEl = document.createElement('div');
  headerEl.className = 'explain-panel__header';
  headerEl.innerHTML = `${icon('sparkles', 16)} AI Insight`;

  const textEl = document.createElement('p');
  textEl.className = 'explain-panel__text';
  textEl.textContent = explanation;

  const sourceEl = document.createElement('div');
  sourceEl.className = 'explain-panel__source';
  sourceEl.innerHTML = sourceLabel;

  panel.appendChild(headerEl);
  panel.appendChild(textEl);
  panel.appendChild(sourceEl);
  container.appendChild(panel);
}

/**
 * Shows a loading state in the explain container.
 * @param {HTMLElement} container
 */
export function renderExplainLoading(container) {
  container.innerHTML = `
    <div class="explain-panel animate-fade-in">
      <div class="explain-panel__header">
        <span class="animate-spin">${icon('loader', 16)}</span>
        Analyzing...
      </div>
      <div class="skeleton skeleton-text skeleton-text--long"></div>
      <div class="skeleton skeleton-text skeleton-text--medium"></div>
    </div>
  `;
}
