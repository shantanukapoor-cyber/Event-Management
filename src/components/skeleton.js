/**
 * Skeleton loading component — placeholder cards during data fetch.
 */

/**
 * Creates skeleton loading cards.
 * @param {number} count - Number of skeleton cards to render.
 * @returns {HTMLElement}
 */
export function createSkeletonList(count = 4) {
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.setAttribute('aria-label', 'Loading content');

  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'skeleton skeleton-card';
    card.style.animationDelay = `${i * 100}ms`;
    el.appendChild(card);
  }

  return el;
}
