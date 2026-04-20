/**
 * Match phase timeline — progress bar showing all match phases.
 */

const PHASES = [
  { id: 'pre-game',    label: 'Pre',      startMin: -60, endMin: 0 },
  { id: 'first-half',  label: '1st',      startMin: 0,   endMin: 45 },
  { id: 'halftime',    label: 'HT',       startMin: 45,  endMin: 60 },
  { id: 'second-half', label: '2nd',      startMin: 60,  endMin: 90 },
  { id: 'full-time',   label: 'FT',       startMin: 90,  endMin: 120 },
];

/**
 * Creates a phase timeline element.
 * @param {string} currentPhaseId - The active phase ID.
 * @returns {HTMLElement}
 */
export function createPhaseTimeline(currentPhaseId) {
  const el = document.createElement('div');
  el.className = 'phase-timeline';
  el.setAttribute('role', 'progressbar');
  el.setAttribute('aria-label', `Match phase: ${currentPhaseId}`);

  const currentIdx = PHASES.findIndex((p) => p.id === currentPhaseId);

  PHASES.forEach((phase, idx) => {
    const segment = document.createElement('div');
    segment.className = 'phase-segment';

    if (idx < currentIdx) segment.classList.add('phase-segment--completed');
    if (idx === currentIdx) segment.classList.add('phase-segment--active');

    const label = document.createElement('span');
    label.className = 'phase-segment__label';
    label.textContent = phase.label;

    segment.appendChild(label);
    el.appendChild(segment);
  });

  return el;
}
