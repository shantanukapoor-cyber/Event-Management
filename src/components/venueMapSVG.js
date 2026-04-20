/**
 * Interactive SVG venue map — MetroArena stadium layout.
 * Each zone is a clickable path colored by crowd density.
 */

/**
 * Renders the SVG stadium map with crowd density overlay.
 * @param {HTMLElement} container - The map container element.
 * @param {Object[]}    zones     - Zone states with { id, name, density, x, y }.
 * @param {Function}    onZoneClick - Callback when a zone is clicked.
 */
export function renderVenueMap(container, zones, onZoneClick) {
  const densityColor = (d) => {
    if (d > 0.7) return '#ef4444';
    if (d > 0.4) return '#f59e0b';
    return '#22c55e';
  };

  const densityOpacity = (d) => 0.3 + d * 0.5;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 400 340');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'MetroArena venue map showing crowd density across 8 zones');
  svg.style.width = '100%';
  svg.style.height = '100%';

  // ─── Background & field ──────────────────────
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <linearGradient id="fieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a472a"/>
      <stop offset="100%" stop-color="#15572a"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  `;
  svg.appendChild(defs);

  // Background
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width', '400');
  bg.setAttribute('height', '340');
  bg.setAttribute('fill', '#0a0e1a');
  bg.setAttribute('rx', '16');
  svg.appendChild(bg);

  // Pitch (center)
  const pitch = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  pitch.setAttribute('x', '100');
  pitch.setAttribute('y', '80');
  pitch.setAttribute('width', '200');
  pitch.setAttribute('height', '180');
  pitch.setAttribute('fill', 'url(#fieldGrad)');
  pitch.setAttribute('stroke', '#ffffff30');
  pitch.setAttribute('stroke-width', '1');
  pitch.setAttribute('rx', '4');
  svg.appendChild(pitch);

  // Center circle
  const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  centerCircle.setAttribute('cx', '200');
  centerCircle.setAttribute('cy', '170');
  centerCircle.setAttribute('r', '30');
  centerCircle.setAttribute('fill', 'none');
  centerCircle.setAttribute('stroke', '#ffffff25');
  centerCircle.setAttribute('stroke-width', '1');
  svg.appendChild(centerCircle);

  // Half line
  const halfLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  halfLine.setAttribute('x1', '100');
  halfLine.setAttribute('y1', '170');
  halfLine.setAttribute('x2', '300');
  halfLine.setAttribute('y2', '170');
  halfLine.setAttribute('stroke', '#ffffff25');
  halfLine.setAttribute('stroke-width', '1');
  svg.appendChild(halfLine);

  // ─── Zone definitions (stand areas around the pitch) ──
  const zonePaths = {
    'zone-north':  { d: 'M80,15 L320,15 L310,70 L90,70 Z',           cx: 200, cy: 42 },
    'zone-south':  { d: 'M90,270 L310,270 L320,325 L80,325 Z',       cx: 200, cy: 298 },
    'zone-east':   { d: 'M310,90 L385,60 L385,280 L310,250 Z',       cx: 348, cy: 170 },
    'zone-west':   { d: 'M90,90 L15,60 L15,280 L90,250 Z',           cx: 52,  cy: 170 },
    'zone-ne':     { d: 'M310,70 L320,15 L385,15 L385,60 L310,90 Z', cx: 350, cy: 52 },
    'zone-nw':     { d: 'M90,70 L80,15 L15,15 L15,60 L90,90 Z',      cx: 50,  cy: 52 },
    'zone-se':     { d: 'M310,250 L385,280 L385,325 L320,325 L310,270 Z', cx: 350, cy: 288 },
    'zone-sw':     { d: 'M90,250 L15,280 L15,325 L80,325 L90,270 Z', cx: 50,  cy: 288 },
  };

  // Create zone groups
  const zoneMap = new Map(zones.map(z => [z.id, z]));

  Object.entries(zonePaths).forEach(([zoneId, pathDef]) => {
    const zoneData = zoneMap.get(zoneId);
    if (!zoneData) return;

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('role', 'button');
    group.setAttribute('tabindex', '0');
    group.setAttribute('aria-label', `${zoneData.name}: ${Math.round(zoneData.density * 100)}% occupied`);
    group.style.cursor = 'pointer';

    // Zone shape
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathDef.d);
    path.setAttribute('fill', densityColor(zoneData.density));
    path.setAttribute('fill-opacity', String(densityOpacity(zoneData.density)));
    path.setAttribute('stroke', '#ffffff15');
    path.setAttribute('stroke-width', '1');
    path.style.transition = 'all 300ms ease';

    // Zone label
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', String(pathDef.cx));
    label.setAttribute('y', String(pathDef.cy));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dominant-baseline', 'middle');
    label.setAttribute('fill', '#f0f4ff');
    label.setAttribute('font-size', '11');
    label.setAttribute('font-family', 'Inter, sans-serif');
    label.setAttribute('font-weight', '600');
    label.textContent = zoneData.name.replace(' Stand', '').replace(' Corner', '');

    // Density label
    const densityLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    densityLabel.setAttribute('x', String(pathDef.cx));
    densityLabel.setAttribute('y', String(pathDef.cy + 14));
    densityLabel.setAttribute('text-anchor', 'middle');
    densityLabel.setAttribute('dominant-baseline', 'middle');
    densityLabel.setAttribute('fill', densityColor(zoneData.density));
    densityLabel.setAttribute('font-size', '10');
    densityLabel.setAttribute('font-family', 'Inter, sans-serif');
    densityLabel.setAttribute('font-weight', '700');
    densityLabel.textContent = `${Math.round(zoneData.density * 100)}%`;

    // Hover effect
    group.addEventListener('mouseenter', () => {
      path.setAttribute('fill-opacity', String(Math.min(1, densityOpacity(zoneData.density) + 0.15)));
      path.setAttribute('filter', 'url(#glow)');
    });
    group.addEventListener('mouseleave', () => {
      path.setAttribute('fill-opacity', String(densityOpacity(zoneData.density)));
      path.removeAttribute('filter');
    });

    // Click handler
    group.addEventListener('click', () => onZoneClick?.(zoneData));
    group.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onZoneClick?.(zoneData);
      }
    });

    group.appendChild(path);
    group.appendChild(label);
    group.appendChild(densityLabel);
    svg.appendChild(group);
  });

  // ─── Pitch label ─────────────────────────────
  const pitchLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  pitchLabel.setAttribute('x', '200');
  pitchLabel.setAttribute('y', '170');
  pitchLabel.setAttribute('text-anchor', 'middle');
  pitchLabel.setAttribute('dominant-baseline', 'middle');
  pitchLabel.setAttribute('fill', '#ffffff30');
  pitchLabel.setAttribute('font-size', '14');
  pitchLabel.setAttribute('font-family', 'Inter, sans-serif');
  pitchLabel.setAttribute('font-weight', '600');
  pitchLabel.setAttribute('letter-spacing', '3');
  pitchLabel.textContent = 'PITCH';
  svg.appendChild(pitchLabel);

  container.innerHTML = '';
  container.appendChild(svg);
}
