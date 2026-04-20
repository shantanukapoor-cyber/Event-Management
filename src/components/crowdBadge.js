/**
 * Crowd density badge component.
 */

/**
 * Creates a crowd density badge element.
 * @param {number} density - Venue-wide density (0-1).
 * @returns {HTMLElement}
 */
export function createCrowdBadge(density) {
  const pct = Math.round(density * 100);
  let status = 'low';
  let label = 'Light';
  if (pct > 70) { status = 'high'; label = 'Busy'; }
  else if (pct > 40) { status = 'medium'; label = 'Moderate'; }

  const el = document.createElement('div');
  el.className = 'stat-card';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-label', `Venue occupancy: ${pct}%, ${label}`);

  const valueEl = document.createElement('div');
  valueEl.className = 'stat-card__value';
  valueEl.style.color = `var(--color-${status})`;
  valueEl.textContent = `${pct}%`;

  const labelEl = document.createElement('div');
  labelEl.className = 'stat-card__label';
  labelEl.textContent = `Crowd · ${label}`;

  el.appendChild(valueEl);
  el.appendChild(labelEl);
  return el;
}
