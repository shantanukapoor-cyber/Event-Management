/**
 * SPA Router — hash-based routing with page transitions.
 * Each page module exports { render(container), destroy() }.
 */

/**
 * @typedef {Object} Route
 * @property {string}           path   - Hash path (e.g., '#/' or '#/map').
 * @property {() => Promise<{render: Function, destroy?: Function}>} load - Dynamic import of the page module.
 */

/** @type {Route[]} */
const routes = [
  { path: '#/',          load: () => import('./pages/dashboard.js') },
  { path: '#/map',       load: () => import('./pages/venueMap.js') },
  { path: '#/waits',     load: () => import('./pages/waitTimes.js') },
  { path: '#/recommend', load: () => import('./pages/recommend.js') },
];

/** Currently active page module (for cleanup). */
let activePage = null;

/** The <main> element where pages render. */
let mainContainer = null;

/**
 * Initializes the router.
 * @param {HTMLElement} container - The <main> element.
 */
export function initRouter(container) {
  mainContainer = container;

  window.addEventListener('hashchange', handleRouteChange);

  // Initial route
  if (!window.location.hash) {
    window.location.hash = '#/';
  } else {
    handleRouteChange();
  }
}

/**
 * Navigates to a hash path.
 * @param {string} hash - Target hash (e.g., '#/map').
 */
export function navigateTo(hash) {
  window.location.hash = hash;
}

/**
 * Handles hash change events — loads and renders the matching page.
 */
async function handleRouteChange() {
  const hash = window.location.hash || '#/';
  const route = routes.find((r) => r.path === hash) || routes[0];

  // Destroy previous page
  if (activePage?.destroy) {
    activePage.destroy();
  }

  // Clear container
  mainContainer.innerHTML = '';

  // Add transition class
  mainContainer.classList.remove('page-enter-active');
  mainContainer.classList.add('page-enter');

  try {
    // Load page module
    const pageModule = await route.load();
    activePage = pageModule;

    // Render page
    pageModule.render(mainContainer);

    // Trigger transition
    requestAnimationFrame(() => {
      mainContainer.classList.remove('page-enter');
      mainContainer.classList.add('page-enter-active');
    });
  } catch (err) {
    console.error('Route load error:', err);
    mainContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <p>Failed to load page. Please try again.</p>
      </div>
    `;
  }

  // Update navbar active state
  updateNavState(hash);
}

/**
 * Updates the active nav item based on current hash.
 * @param {string} hash
 */
function updateNavState(hash) {
  document.querySelectorAll('.nav-item').forEach((item) => {
    const href = item.getAttribute('data-route');
    item.classList.toggle('active', href === hash);
    item.setAttribute('aria-current', href === hash ? 'page' : 'false');
  });
}

/**
 * Returns the current hash route.
 * @returns {string}
 */
export function getCurrentRoute() {
  return window.location.hash || '#/';
}
