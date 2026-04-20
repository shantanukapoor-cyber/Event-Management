/**
 * Dashboard page — Home screen with score, stats, phase timeline, and action cards.
 */

import { fetchCrowdState } from '../api.js';
import { renderScoreTicker } from '../components/scoreTicker.js';
import { createCrowdBadge } from '../components/crowdBadge.js';
import { createPhaseTimeline } from '../components/phaseTimeline.js';
import { createAlertBanner } from '../components/alertBanner.js';
import { createSkeletonList } from '../components/skeleton.js';
import { icon } from '../data/icons.js';
import { navigateTo } from '../router.js';

/** @type {number|null} */
let pollInterval = null;

/**
 * Renders the dashboard page.
 * @param {HTMLElement} container
 */
export function render(container) {
  container.innerHTML = '';

  const page = document.createElement('div');
  page.className = 'page-dashboard stagger-children';

  // Header
  const header = document.createElement('div');
  header.className = 'dashboard-header';
  header.innerHTML = `
    <div class="dashboard-logo">
      <span class="dashboard-logo__icon">${icon('stadium', 28)}</span>
      <span class="dashboard-logo__text">StadiumPulse</span>
    </div>
    <div class="dashboard-venue-pill">
      <span class="live-dot"></span>
      MetroArena
    </div>
  `;
  page.appendChild(header);

  // Skeleton while loading
  const contentArea = document.createElement('div');
  contentArea.appendChild(createSkeletonList(3));
  page.appendChild(contentArea);

  container.appendChild(page);

  // Fetch data and render
  loadDashboard(contentArea);

  // Poll every 15s
  pollInterval = setInterval(() => loadDashboard(contentArea), 15_000);
}

/**
 * Loads and renders dashboard content.
 * @param {HTMLElement} contentArea
 */
async function loadDashboard(contentArea) {
  try {
    const data = await fetchCrowdState();
    renderDashboardContent(contentArea, data);
  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

/**
 * Renders the dashboard content with live data.
 * @param {HTMLElement} container
 * @param {Object} data - Crowd state from API.
 */
function renderDashboardContent(container, data) {
  container.innerHTML = '';

  // Alert banner (context-aware)
  if (data.phaseId === 'halftime') {
    container.appendChild(
      createAlertBanner('⚡ Halftime — expect longer queues at food and restrooms', 'warning')
    );
  } else if (data.phaseId === 'full-time') {
    container.appendChild(
      createAlertBanner('🚪 Match over — check exit wait times for fastest departure', 'info')
    );
  }

  // Score Ticker
  const tickerSection = document.createElement('section');
  tickerSection.setAttribute('aria-label', 'Match score');
  renderScoreTicker(tickerSection, data);
  container.appendChild(tickerSection);

  // Phase Timeline
  container.appendChild(createPhaseTimeline(data.phaseId));

  // Stats Row
  const statsGrid = document.createElement('div');
  statsGrid.className = 'dashboard-stats';

  // Crowd density stat
  statsGrid.appendChild(createCrowdBadge(data.overallDensity));

  // Fastest food
  const fastestFood = [...data.amenities]
    .filter((a) => a.type === 'food')
    .sort((a, b) => a.waitTime - b.waitTime)[0];

  const foodStat = document.createElement('div');
  foodStat.className = 'stat-card';
  const foodValue = document.createElement('div');
  foodValue.className = 'stat-card__value';
  foodValue.style.color = 'var(--color-medium)';
  foodValue.textContent = fastestFood ? `${fastestFood.waitTime}m` : '—';
  const foodLabel = document.createElement('div');
  foodLabel.className = 'stat-card__label';
  foodLabel.textContent = 'Best Food';
  foodStat.appendChild(foodValue);
  foodStat.appendChild(foodLabel);
  statsGrid.appendChild(foodStat);

  // Fastest restroom
  const fastestRestroom = [...data.amenities]
    .filter((a) => a.type === 'restroom')
    .sort((a, b) => a.waitTime - b.waitTime)[0];

  const rrStat = document.createElement('div');
  rrStat.className = 'stat-card';
  const rrValue = document.createElement('div');
  rrValue.className = 'stat-card__value';
  rrValue.style.color = 'var(--color-accent)';
  rrValue.textContent = fastestRestroom ? `${fastestRestroom.waitTime}m` : '—';
  const rrLabel = document.createElement('div');
  rrLabel.className = 'stat-card__label';
  rrLabel.textContent = 'Best Restroom';
  rrStat.appendChild(rrValue);
  rrStat.appendChild(rrLabel);
  statsGrid.appendChild(rrStat);

  container.appendChild(statsGrid);

  // Action Cards
  const sectionHeader = document.createElement('div');
  sectionHeader.className = 'section-header';
  sectionHeader.innerHTML = `<h2 class="section-title">Quick Actions</h2>`;
  container.appendChild(sectionHeader);

  const actionGrid = document.createElement('div');
  actionGrid.className = 'action-grid';

  const actions = [
    { label: 'Venue Map',       subtitle: 'Crowd density',   iconName: 'map',      route: '#/map' },
    { label: 'Wait Times',      subtitle: 'Food & restrooms', iconName: 'clock',    route: '#/waits' },
    { label: 'Best Food',       subtitle: 'Get recommendation', iconName: 'food',   route: '#/recommend' },
    { label: 'Best Restroom',   subtitle: 'Shortest queue',   iconName: 'restroom', route: '#/recommend' },
  ];

  actions.forEach((action) => {
    const btn = document.createElement('button');
    btn.className = 'action-card';
    btn.id = `action-${action.label.toLowerCase().replace(/\s/g, '-')}`;
    btn.setAttribute('aria-label', `${action.label}: ${action.subtitle}`);

    btn.innerHTML = `
      <div class="action-card__icon">${icon(action.iconName, 22)}</div>
      <div class="action-card__title">${action.label}</div>
      <div class="action-card__subtitle">${action.subtitle}</div>
    `;

    btn.addEventListener('click', () => navigateTo(action.route));
    actionGrid.appendChild(btn);
  });

  container.appendChild(actionGrid);
}

/**
 * Cleanup — stops polling.
 */
export function destroy() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}
