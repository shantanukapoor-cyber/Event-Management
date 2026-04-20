/**
 * Bottom navigation bar component.
 * Renders a fixed nav with 4 tabs: Dashboard, Map, Wait Times, Recommend.
 */

import { icon } from '../data/icons.js';
import { navigateTo } from '../router.js';

/**
 * Creates and returns the bottom navigation bar element.
 * @returns {HTMLElement}
 */
export function createNavbar() {
  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Main navigation');

  const tabs = [
    { route: '#/',          label: 'Home',      iconName: 'home' },
    { route: '#/map',       label: 'Map',       iconName: 'map' },
    { route: '#/waits',     label: 'Queues',    iconName: 'clock' },
    { route: '#/recommend', label: 'Recommend', iconName: 'star' },
  ];

  tabs.forEach((tab) => {
    const btn = document.createElement('button');
    btn.className = 'nav-item';
    btn.setAttribute('data-route', tab.route);
    btn.setAttribute('aria-label', `Navigate to ${tab.label}`);
    btn.setAttribute('aria-current', 'false');
    btn.id = `nav-${tab.label.toLowerCase()}`;

    btn.innerHTML = `
      <span class="nav-icon">${icon(tab.iconName, 22)}</span>
      <span>${tab.label}</span>
    `;

    btn.addEventListener('click', () => {
      navigateTo(tab.route);
    });

    nav.appendChild(btn);
  });

  return nav;
}
