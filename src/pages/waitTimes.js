/**
 * Wait Times page — filterable list of all amenities with live wait times.
 */

import { fetchCrowdState } from '../api.js';
import { createWaitTimeCard } from '../components/waitTimeCard.js';
import { createSkeletonList } from '../components/skeleton.js';

/** @type {number|null} */
let pollInterval = null;
let currentFilter = 'all';

/**
 * Renders the wait times page.
 * @param {HTMLElement} container
 */
export function render(container) {
  container.innerHTML = '';

  const page = document.createElement('div');
  page.className = 'page-waits';

  // Title
  const title = document.createElement('h1');
  title.className = 'section-title';
  title.textContent = 'Wait Times';
  page.appendChild(title);

  // Filter chips
  const filters = document.createElement('div');
  filters.className = 'filter-chips';
  filters.setAttribute('role', 'tablist');
  filters.setAttribute('aria-label', 'Filter amenities by type');

  const types = [
    { value: 'all',      label: 'All' },
    { value: 'food',     label: '🍔 Food' },
    { value: 'restroom', label: '🚻 Restroom' },
    { value: 'exit',     label: '🚪 Exit' },
    { value: 'medical',  label: '➕ Medical' },
  ];

  types.forEach((t) => {
    const chip = document.createElement('button');
    chip.className = `chip ${currentFilter === t.value ? 'active' : ''}`;
    chip.setAttribute('role', 'tab');
    chip.setAttribute('aria-selected', String(currentFilter === t.value));
    chip.setAttribute('aria-label', `Filter: ${t.label}`);
    chip.id = `filter-${t.value}`;
    chip.textContent = t.label;
    chip.addEventListener('click', () => {
      currentFilter = t.value;
      // Update chip states
      filters.querySelectorAll('.chip').forEach((c) => {
        c.classList.remove('active');
        c.setAttribute('aria-selected', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-selected', 'true');
      // Re-render list
      loadWaitTimes(listContainer);
    });
    filters.appendChild(chip);
  });
  page.appendChild(filters);

  // Sort selector
  const sortRow = document.createElement('div');
  sortRow.className = 'section-header';
  sortRow.innerHTML = `
    <span class="text-sm text-muted" id="wait-count" role="status">Loading...</span>
    <select class="zone-select" id="sort-select" aria-label="Sort by" style="max-width: 140px;">
      <option value="waitTime">Wait Time</option>
      <option value="name">Name</option>
      <option value="status">Status</option>
    </select>
  `;
  sortRow.querySelector('#sort-select').addEventListener('change', () => {
    loadWaitTimes(listContainer);
  });
  page.appendChild(sortRow);

  // List container
  const listContainer = document.createElement('div');
  listContainer.className = 'wait-list stagger-children';
  listContainer.setAttribute('role', 'list');
  listContainer.setAttribute('aria-label', 'Amenity wait times');
  listContainer.appendChild(createSkeletonList(6));
  page.appendChild(listContainer);

  container.appendChild(page);

  // Load initial data
  loadWaitTimes(listContainer);

  // Poll every 15s
  pollInterval = setInterval(() => loadWaitTimes(listContainer), 15_000);
}

/**
 * Fetches data and renders the wait time list.
 * @param {HTMLElement} listContainer
 */
async function loadWaitTimes(listContainer) {
  try {
    const data = await fetchCrowdState();
    let amenities = [...data.amenities];

    // Filter
    if (currentFilter !== 'all') {
      amenities = amenities.filter((a) => a.type === currentFilter);
    }

    // Sort
    const sortBy = document.getElementById('sort-select')?.value || 'waitTime';
    if (sortBy === 'waitTime') {
      amenities.sort((a, b) => a.waitTime - b.waitTime);
    } else if (sortBy === 'name') {
      amenities.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'status') {
      const order = { high: 0, medium: 1, low: 2 };
      amenities.sort((a, b) => order[a.status] - order[b.status]);
    }

    // Update count
    const countEl = document.getElementById('wait-count');
    if (countEl) countEl.textContent = `${amenities.length} amenities`;

    // Render
    listContainer.innerHTML = '';
    if (amenities.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🔍</div>
          <p>No amenities match this filter</p>
        </div>
      `;
      return;
    }

    amenities.forEach((amenity) => {
      const card = createWaitTimeCard(amenity);
      card.setAttribute('role', 'listitem');
      listContainer.appendChild(card);
    });
  } catch (err) {
    console.error('Wait times load error:', err);
  }
}

/**
 * Cleanup.
 */
export function destroy() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  currentFilter = 'all';
}
