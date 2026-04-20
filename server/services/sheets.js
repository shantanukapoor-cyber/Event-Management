/**
 * Optional Google Sheets loader.
 * Reads venue configuration from a public Google Sheet (published as JSON).
 * No API key required, no OAuth — just a public HTTP fetch.
 * Falls back silently to bundled data if unavailable.
 */

/**
 * @typedef {Object} SheetVenueData
 * @property {Array<{name: string, type: string, zone: string, baseWait: number}>} amenities
 * @property {Array<{phase: string, minute: number, event: string}>} timeline
 */

/** @type {SheetVenueData|null} */
let cachedSheetData = null;

/**
 * Loads venue configuration from a public Google Sheet.
 * The sheet must be published to the web (File → Share → Publish to web).
 *
 * @param {string} [sheetId] - The Google Sheet ID. Falls back to GOOGLE_SHEET_ID env var.
 * @returns {Promise<SheetVenueData|null>} Parsed data, or null if unavailable.
 */
export async function loadFromGoogleSheet(sheetId) {
  const id = sheetId || process.env.GOOGLE_SHEET_ID;
  if (!id) {
    return null;
  }

  // Return cached data if available (once per process lifetime)
  if (cachedSheetData) {
    return cachedSheetData;
  }

  try {
    const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!response.ok) {
      console.warn(`Google Sheets fetch failed: HTTP ${response.status}`);
      return null;
    }

    const text = await response.text();

    // Google Sheets JSON response is wrapped in a callback: google.visualization.Query.setResponse({...})
    const jsonStr = text.replace(/^.*?google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');
    const data = JSON.parse(jsonStr);

    // Parse the table rows into structured data
    cachedSheetData = parseSheetData(data);
    console.log('✓ Loaded venue config from Google Sheets');
    return cachedSheetData;
  } catch (err) {
    console.warn('Google Sheets load failed (using bundled data):', err.message);
    return null;
  }
}

/**
 * Parses the Google Sheets visualization API response into structured data.
 * @param {Object} data - Raw Google Sheets JSON response.
 * @returns {SheetVenueData}
 */
function parseSheetData(data) {
  const cols = data.table?.cols || [];
  const rows = data.table?.rows || [];

  const result = {
    amenities: [],
    timeline: [],
  };

  // Map column labels to indices
  const colMap = {};
  cols.forEach((col, i) => {
    if (col.label) colMap[col.label.toLowerCase().trim()] = i;
  });

  for (const row of rows) {
    const cells = row.c || [];
    const getVal = (idx) => (cells[idx]?.v ?? null);

    // Try to parse as amenity row
    if (colMap['name'] !== undefined && colMap['type'] !== undefined) {
      const name = getVal(colMap['name']);
      const type = getVal(colMap['type']);
      if (name && type) {
        result.amenities.push({
          name: String(name),
          type: String(type).toLowerCase(),
          zone: String(getVal(colMap['zone']) || ''),
          baseWait: Number(getVal(colMap['basewait']) || 3),
        });
      }
    }

    // Try to parse as timeline row
    if (colMap['phase'] !== undefined && colMap['minute'] !== undefined) {
      const phase = getVal(colMap['phase']);
      const minute = getVal(colMap['minute']);
      if (phase !== null && minute !== null) {
        result.timeline.push({
          phase: String(phase),
          minute: Number(minute),
          event: String(getVal(colMap['event']) || ''),
        });
      }
    }
  }

  return result;
}
