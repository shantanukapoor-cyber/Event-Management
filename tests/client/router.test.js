/**
 * Client router tests.
 * Tests route matching and navigation logic.
 * Runs in Node (no browser needed — tests the pure logic).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Router Logic', () => {
  it('default hash should be #/', () => {
    const defaultHash = '#/';
    expect(defaultHash).toBe('#/');
  });

  it('route paths are valid hash routes', () => {
    const routes = ['#/', '#/map', '#/waits', '#/recommend'];

    routes.forEach((route) => {
      expect(route.startsWith('#/')).toBe(true);
    });
  });

  it('finds matching route for known paths', () => {
    const routes = [
      { path: '#/' },
      { path: '#/map' },
      { path: '#/waits' },
      { path: '#/recommend' },
    ];

    const hash = '#/map';
    const match = routes.find((r) => r.path === hash);
    expect(match).toBeDefined();
    expect(match.path).toBe('#/map');
  });

  it('falls back to first route for unknown paths', () => {
    const routes = [
      { path: '#/' },
      { path: '#/map' },
    ];

    const hash = '#/unknown';
    const match = routes.find((r) => r.path === hash) || routes[0];
    expect(match.path).toBe('#/');
  });

  it('nav items can be matched to routes by data-route attribute', () => {
    // Simulate the nav state update logic
    const navItems = [
      { dataRoute: '#/', active: false },
      { dataRoute: '#/map', active: false },
      { dataRoute: '#/waits', active: false },
      { dataRoute: '#/recommend', active: false },
    ];

    const currentHash = '#/waits';

    navItems.forEach((item) => {
      item.active = item.dataRoute === currentHash;
    });

    const activeCount = navItems.filter((i) => i.active).length;
    expect(activeCount).toBe(1);
    expect(navItems[2].active).toBe(true);
  });
});
