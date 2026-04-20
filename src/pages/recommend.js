/**
 * Recommend page — type selector → zone selector → recommendation card → explain.
 */

import { fetchRecommendation, fetchExplanation } from '../api.js';
import { renderRecommendCard } from '../components/recommendCard.js';
import { renderExplainPanel, renderExplainLoading } from '../components/explainPanel.js';
import { createSkeletonList } from '../components/skeleton.js';
import { icon } from '../data/icons.js';

const ZONES = [
  { id: 'zone-north', label: 'North Stand' },
  { id: 'zone-south', label: 'South Stand' },
  { id: 'zone-east',  label: 'East Stand' },
  { id: 'zone-west',  label: 'West Stand' },
  { id: 'zone-ne',    label: 'NE Corner' },
  { id: 'zone-nw',    label: 'NW Corner' },
  { id: 'zone-se',    label: 'SE Corner' },
  { id: 'zone-sw',    label: 'SW Corner' },
];

let selectedType = null;
let selectedZone = 'zone-north';

/**
 * Renders the recommend page.
 * @param {HTMLElement} container
 */
export function render(container) {
  container.innerHTML = '';

  const page = document.createElement('div');
  page.className = 'page-recommend';

  // Title
  const title = document.createElement('h1');
  title.className = 'section-title';
  title.textContent = 'Get Recommendation';
  page.appendChild(title);

  // Subtitle
  const subtitle = document.createElement('p');
  subtitle.className = 'text-sm text-muted';
  subtitle.textContent = 'What are you looking for?';
  subtitle.style.marginBottom = '0';
  page.appendChild(subtitle);

  // Type selector grid
  const typeGrid = document.createElement('div');
  typeGrid.className = 'recommend-type-grid';

  const types = [
    { type: 'food',     label: 'Food',      emoji: '🍔' },
    { type: 'restroom', label: 'Restroom',   emoji: '🚻' },
    { type: 'exit',     label: 'Exit',       emoji: '🚪' },
    { type: 'medical',  label: 'Medical',    emoji: '🏥' },
  ];

  types.forEach((t) => {
    const card = document.createElement('button');
    card.className = 'type-card';
    card.id = `type-${t.type}`;
    card.setAttribute('aria-label', `Find best ${t.label}`);

    card.innerHTML = `
      <span class="type-card__icon">${t.emoji}</span>
      <span class="type-card__label">${t.label}</span>
    `;

    card.addEventListener('click', () => {
      selectedType = t.type;
      // Highlight selected
      typeGrid.querySelectorAll('.type-card').forEach((c) => {
        c.style.borderColor = '';
        c.style.boxShadow = '';
      });
      card.style.borderColor = 'rgba(0, 212, 255, 0.5)';
      card.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.25)';

      // Show zone selector if not visible
      if (!document.getElementById('zone-section')) {
        renderZoneSelector(page);
      }
    });

    typeGrid.appendChild(card);
  });

  page.appendChild(typeGrid);

  container.appendChild(page);
}

/**
 * Renders the zone selector and "Get Recommendation" button.
 * @param {HTMLElement} page
 */
function renderZoneSelector(page) {
  const section = document.createElement('div');
  section.className = 'recommend-zone-select animate-fade-in-up';
  section.id = 'zone-section';

  const label = document.createElement('label');
  label.className = 'zone-select-label';
  label.setAttribute('for', 'zone-picker');
  label.textContent = 'Where are you?';

  const select = document.createElement('select');
  select.className = 'zone-select';
  select.id = 'zone-picker';
  select.setAttribute('aria-label', 'Select your current zone');

  ZONES.forEach((z) => {
    const opt = document.createElement('option');
    opt.value = z.id;
    opt.textContent = z.label;
    if (z.id === selectedZone) opt.selected = true;
    select.appendChild(opt);
  });

  select.addEventListener('change', () => {
    selectedZone = select.value;
  });

  const btn = document.createElement('button');
  btn.className = 'btn btn-primary btn-block';
  btn.id = 'btn-get-recommendation';
  btn.innerHTML = `${icon('star', 16)} Find Best Option`;
  btn.style.marginTop = 'var(--space-4)';

  btn.addEventListener('click', () => {
    selectedZone = select.value;
    getRecommendation(page);
  });

  section.appendChild(label);
  section.appendChild(select);
  section.appendChild(btn);
  page.appendChild(section);
}

/**
 * Fetches and renders a recommendation.
 * @param {HTMLElement} page
 */
async function getRecommendation(page) {
  // Remove previous result
  const oldResult = document.getElementById('result-section');
  if (oldResult) oldResult.remove();

  const resultSection = document.createElement('section');
  resultSection.id = 'result-section';
  resultSection.setAttribute('aria-label', 'Recommendation result');

  // Loading state
  resultSection.appendChild(createSkeletonList(2));
  page.appendChild(resultSection);

  try {
    const data = await fetchRecommendation(selectedType, selectedZone);
    resultSection.innerHTML = '';

    // Render recommendation card
    renderRecommendCard(resultSection, data.recommendation, data.alternatives);

    // Attach explain button handler
    const explainBtn = document.getElementById('btn-explain');
    if (explainBtn) {
      explainBtn.addEventListener('click', async () => {
        explainBtn.disabled = true;
        const explainContainer = document.getElementById('explain-container');
        renderExplainLoading(explainContainer);

        try {
          const explanation = await fetchExplanation(data.recommendation);
          renderExplainPanel(explainContainer, explanation);
        } catch (err) {
          explainContainer.innerHTML = `
            <div class="explain-panel">
              <p class="text-sm text-muted">Unable to generate explanation. Please try again.</p>
            </div>
          `;
        }
      });
    }
  } catch (err) {
    resultSection.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">⚠️</div>
        <p>${err.message || 'Failed to get recommendation'}</p>
      </div>
    `;
  }
}

/**
 * Cleanup.
 */
export function destroy() {
  selectedType = null;
}
