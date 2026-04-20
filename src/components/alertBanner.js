/**
 * Alert banner component — top-of-page notifications.
 */

import { icon } from '../data/icons.js';

/**
 * Creates an alert banner element.
 * @param {string} message   - Alert text.
 * @param {'info'|'warning'} [type='info'] - Alert type.
 * @returns {HTMLElement}
 */
export function createAlertBanner(message, type = 'info') {
  const el = document.createElement('div');
  el.className = 'alert-banner animate-fade-in-up';
  el.setAttribute('role', 'alert');
  el.id = 'alert-banner';

  const iconName = type === 'warning' ? 'alertTriangle' : 'info';

  const iconEl = document.createElement('span');
  iconEl.className = 'alert-banner__icon';
  iconEl.innerHTML = icon(iconName, 18);
  iconEl.setAttribute('aria-hidden', 'true');

  const textEl = document.createElement('span');
  textEl.textContent = message;

  el.appendChild(iconEl);
  el.appendChild(textEl);

  return el;
}
