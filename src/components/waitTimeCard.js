/**
 * Wait time card component — shows a single amenity with its wait time.
 */

import { icon } from '../data/icons.js';

/**
 * Creates a wait time card element.
 * @param {Object} amenity
 * @param {string} amenity.name
 * @param {string} amenity.type
 * @param {string} amenity.zoneId
 * @param {number} amenity.waitTime
 * @param {string} amenity.status - 'low' | 'medium' | 'high'
 * @returns {HTMLElement}
 */
export function createWaitTimeCard(amenity) {
  const el = document.createElement('article');
  el.className = 'wait-card';
  el.setAttribute('aria-label', `${amenity.name}: ${amenity.waitTime} minute wait, ${amenity.status} traffic`);

  const iconType = amenity.type === 'food' ? 'food'
    : amenity.type === 'restroom' ? 'restroom'
    : amenity.type === 'exit' ? 'exit'
    : 'medical';

  const zoneName = amenity.zoneId.replace('zone-', '').replace('-', ' ').toUpperCase();

  el.innerHTML = `
    <div class="wait-card__icon wait-card__icon--${iconType}">
      ${icon(iconType, 22)}
    </div>
    <div class="wait-card__info">
      <div class="wait-card__name">${escapeHtml(amenity.name)}</div>
      <div class="wait-card__zone">${zoneName}</div>
    </div>
    <div class="wait-card__time">
      <div class="wait-card__minutes" style="color: var(--color-${amenity.status})">
        ${amenity.waitTime}
      </div>
      <div class="wait-card__label">min</div>
    </div>
    <span class="badge badge-${amenity.status}" aria-hidden="true">
      <span class="status-dot status-dot-${amenity.status}"></span>
      ${amenity.status}
    </span>
  `;

  return el;
}

/** @param {string} str */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
