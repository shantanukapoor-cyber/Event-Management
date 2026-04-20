/**
 * StadiumPulse — App entry point.
 * Initializes the SPA router and mounts the navbar.
 */

import './styles/index.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/animations.css';
import { initRouter } from './router.js';
import { createNavbar } from './components/navbar.js';

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  if (!app) return;

  // Create main content area
  const main = document.createElement('main');
  main.id = 'main-content';
  main.setAttribute('role', 'main');
  app.appendChild(main);

  // Mount bottom nav
  app.appendChild(createNavbar());

  // Initialize router
  initRouter(main);
});
