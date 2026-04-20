/**
 * Recommendation result card component.
 */

import { icon } from '../data/icons.js';

/**
 * Renders a recommendation card into the container.
 * @param {HTMLElement} container
 * @param {Object}      rec - Recommendation object from the API.
 * @param {Object[]}    alternatives - Alternative recommendations array.
 */
export function renderRecommendCard(container, rec, alternatives) {
  const card = document.createElement('article');
  card.className = 'recommend-card animate-fade-in-up';
  card.setAttribute('aria-label', `Recommended: ${rec.name}, score ${Math.round(rec.score * 100)}%`);
  card.id = 'recommend-result';

  const scoreDisplay = Math.round(rec.score * 100);

  card.innerHTML = `
    <div class="recommend-card__header">
      <h3 class="recommend-card__title">${escapeHtml(rec.name)}</h3>
      <div class="recommend-card__score" aria-label="Score: ${scoreDisplay}%">${scoreDisplay}%</div>
    </div>
    <div class="recommend-card__meta">
      <span class="recommend-card__meta-item">
        ${icon('clock', 14)}
        <span>${rec.waitTime} min wait</span>
      </span>
      <span class="recommend-card__meta-item">
        ${icon('map', 14)}
        <span>${rec.zoneId.replace('zone-', '').toUpperCase()}</span>
      </span>
      <span class="badge badge-${getScoreBadge(rec.score)}">
        ${getScoreLabel(rec.score)}
      </span>
    </div>
    <ul class="recommend-card__reasons" aria-label="Reasoning">
      ${rec.reasoning.map((r) => `<li class="recommend-card__reason">${escapeHtml(r)}</li>`).join('')}
    </ul>
    <button class="btn btn-primary btn-block" id="btn-explain" aria-label="Get AI explanation for this recommendation">
      ${icon('sparkles', 16)}
      Explain why
    </button>
    <div id="explain-container"></div>
  `;

  container.appendChild(card);

  // Alternatives
  if (alternatives && alternatives.length > 0) {
    const altSection = document.createElement('div');
    altSection.className = 'alternatives-list animate-fade-in-up';
    altSection.style.animationDelay = '150ms';

    altSection.innerHTML = `
      <div class="alternatives-list__title">Other options</div>
      ${alternatives.map((alt) => `
        <div class="alternative-item">
          <div>
            <div class="alternative-item__name">${escapeHtml(alt.name)}</div>
          </div>
          <div class="alternative-item__details">
            <span>${alt.waitTime} min</span>
            <span>${Math.round(alt.score * 100)}%</span>
          </div>
        </div>
      `).join('')}
    `;

    container.appendChild(altSection);
  }
}

/** @param {number} score */
function getScoreBadge(score) {
  if (score > 0.7) return 'low';
  if (score > 0.4) return 'medium';
  return 'high';
}

/** @param {number} score */
function getScoreLabel(score) {
  if (score > 0.7) return 'Great';
  if (score > 0.4) return 'Good';
  return 'Fair';
}

/** @param {string} str */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
