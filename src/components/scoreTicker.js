/**
 * Score ticker — displays live match score and phase.
 */

/**
 * Renders the score ticker into a container.
 * @param {HTMLElement} container
 * @param {Object} data
 * @param {Object} data.match - { homeTeam, awayTeam, homeScore, awayScore }
 * @param {string} data.phaseLabel - Current phase label.
 * @param {number} data.matchMinute - Current match minute.
 */
export function renderScoreTicker(container, { match, phaseLabel, matchMinute }) {
  const el = document.createElement('div');
  el.className = 'score-ticker';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-label', `Match score: ${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}`);
  el.id = 'score-ticker';

  const minuteDisplay = matchMinute < 0
    ? `${Math.abs(matchMinute)} min to KO`
    : matchMinute > 90
      ? '90+ min'
      : `${matchMinute}'`;

  el.innerHTML = `
    <div class="score-ticker__team">
      <div class="score-ticker__team-name">${escapeHtml(match.homeTeam)}</div>
    </div>
    <div class="score-ticker__score-block">
      <span class="score-ticker__score">${match.homeScore}</span>
      <span class="score-ticker__separator">–</span>
      <span class="score-ticker__score">${match.awayScore}</span>
    </div>
    <div class="score-ticker__team">
      <div class="score-ticker__team-name">${escapeHtml(match.awayTeam)}</div>
    </div>
  `;

  const phaseRow = document.createElement('div');
  phaseRow.className = 'score-ticker__phase';
  phaseRow.innerHTML = `
    <span class="badge badge-accent">
      <span class="live-dot"></span>
      ${escapeHtml(phaseLabel)} · ${minuteDisplay}
    </span>
  `;

  container.appendChild(el);
  container.appendChild(phaseRow);
}

/**
 * Escapes HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
