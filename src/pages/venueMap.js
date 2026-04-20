/**
 * Venue Map page — full-screen SVG stadium map with crowd density overlay.
 */

import { fetchCrowdState } from '../api.js';
import { renderVenueMap } from '../components/venueMapSVG.js';
import { createPhaseTimeline } from '../components/phaseTimeline.js';
import { createWaitTimeCard } from '../components/waitTimeCard.js';
import { createSkeletonList } from '../components/skeleton.js';

/** @type {number|null} */
let pollInterval = null;

/**
 * Renders the venue map page.
 * @param {HTMLElement} container
 */
export function render(container) {
  container.innerHTML = '';

  const page = document.createElement('div');
  page.className = 'page-map';

  const title = document.createElement('h1');
  title.className = 'section-title';
  title.textContent = 'Venue Map';
  page.appendChild(title);

  const mapBox = document.createElement('div');
  mapBox.className = 'map-container';
  mapBox.id = 'map-container';
  page.appendChild(mapBox);

  // Legend
  const legend = document.createElement('div');
  legend.className = 'map-legend';
  legend.setAttribute('aria-label', 'Map legend');
  legend.innerHTML = `
    <span class="map-legend__item"><span class="map-legend__swatch" style="background: #22c55e"></span> Low</span>
    <span class="map-legend__item"><span class="map-legend__swatch" style="background: #f59e0b"></span> Moderate</span>
    <span class="map-legend__item"><span class="map-legend__swatch" style="background: #ef4444"></span> High</span>
  `;
  page.appendChild(legend);

  // Zone info (shown when a zone is clicked)
  const zoneInfo = document.createElement('div');
  zoneInfo.id = 'zone-detail';
  page.appendChild(zoneInfo);

  container.appendChild(page);

  // Load initial data
  loadMap(mapBox, zoneInfo);

  // Poll every 15s
  pollInterval = setInterval(() => loadMap(mapBox, zoneInfo), 15_000);
}

/**
 * Loads map data and renders.
 * @param {HTMLElement} mapBox
 * @param {HTMLElement} zoneInfo
 */
async function loadMap(mapBox, zoneInfo) {
  try {
    const data = await fetchCrowdState();
    renderVenueMap(mapBox, data.zones, (zone) => showZoneDetail(zone, data, zoneInfo));
  } catch (err) {
    console.error('Map load error:', err);
  }
}

/**
 * Shows amenity details for a clicked zone.
 * @param {Object} zone
 * @param {Object} data - Full crowd state.
 * @param {HTMLElement} container
 */
function showZoneDetail(zone, data, container) {
  container.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'zone-info animate-fade-in-up';

  const titleEl = document.createElement('div');
  titleEl.className = 'zone-info__name';
  titleEl.textContent = `${zone.name} — ${Math.round(zone.density * 100)}% occupied`;
  card.appendChild(titleEl);

  // Amenities in this zone
  const zoneAmenities = data.amenities.filter((a) => a.zoneId === zone.id);

  if (zoneAmenities.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'text-sm text-muted';
    empty.textContent = 'No amenities in this zone';
    card.appendChild(empty);
  } else {
    const list = document.createElement('div');
    list.className = 'zone-info__amenities';
    zoneAmenities.forEach((amenity) => {
      list.appendChild(createWaitTimeCard(amenity));
    });
    card.appendChild(list);
  }

  container.appendChild(card);
}

/**
 * Cleanup.
 */
export function destroy() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}
