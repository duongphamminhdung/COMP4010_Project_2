// Data loader: fetches aggregated CSV/JSON files from public/data/
// Falls back to mock data if files are missing

import {
  PERIOD_ORDER,
} from './mockData';

const DATA_BASE = `${import.meta.env.BASE_URL}data`;

async function fetchCSV(filename) {
  const resp = await fetch(`${DATA_BASE}/${filename}`);
  if (!resp.ok) throw new Error(`Failed to load ${filename}`);
  const text = await resp.text();
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row = {};
    headers.forEach((h, i) => {
      const v = values[i]?.trim() || '';
      row[h.trim()] = isNaN(v) || v === '' ? v : Number(v);
    });
    return row;
  });
}

async function fetchJSON(filename) {
  const resp = await fetch(`${DATA_BASE}/${filename}`);
  if (!resp.ok) throw new Error(`Failed to load ${filename}`);
  return resp.json();
}

// ============================================================
// 1. Opening Tree (hierarchical JSON)
// ============================================================
export async function loadOpeningTreeData() {
  const data = {};
  for (const period of PERIOD_ORDER) {
    try {
      data[period] = await fetchJSON(`opening_tree_${period}.json`);
    } catch {
      console.warn(`Missing opening_tree_${period}.json, using empty tree`);
      data[period] = { san: 'root', count: 0, children: [] };
    }
  }
  return data;
}

// ============================================================
// 2. Opening Revolution (year-based, ELO 1500+)
// ============================================================
export async function loadOpeningByYearData() {
  try {
    return await fetchCSV('opening_by_year_1500.csv');
  } catch {
    return [];
  }
}

// ============================================================
// 3. Material Curve (era-based, all ELO)
// ============================================================
export async function loadMaterialCurveData() {
  try {
    return await fetchCSV('material_total.csv');
  } catch {
    return [];
  }
}

export async function loadSacrificeData() {
  try {
    return await fetchCSV('sacrifice_rate_1500.csv');
  } catch {
    return [];
  }
}

// ============================================================
// 4. Blunder Rate
// ============================================================
export async function loadBlunderHeatmapData() {
  try {
    return await fetchCSV('blunder_rate.csv');
  } catch {
    return [];
  }
}

// ============================================================
// 5. Piece Squares
// ============================================================
export async function loadPieceSquareData() {
  try {
    const rows = await fetchCSV('piece_squares_agg.csv');
    // Convert is_white string to boolean
    return rows.map(r => ({
      ...r,
      is_white: r.is_white === 'True' || r.is_white === 'true',
    }));
  } catch {
    return [];
  }
}

// ============================================================
// 6. Game Length
// ============================================================
export async function loadGameLengthData() {
  try {
    return await fetchCSV('game_length.csv');
  } catch {
    try {
      return await fetchCSV('game_length_total.csv');
    } catch {
      const { getGameLengthData } = await import('./mockData');
      return getGameLengthData();
    }
  }
}

// ============================================================
// Load all data
// ============================================================
export async function loadAllData() {
  const [
    openingTree,
    openingByYear,
    materialCurve,
    sacrifice,
    blunderRate,
    pieceSquares,
    gameLength,
  ] = await Promise.all([
    loadOpeningTreeData(),
    loadOpeningByYearData(),
    loadMaterialCurveData(),
    loadSacrificeData(),
    loadBlunderHeatmapData(),
    loadPieceSquareData(),
    loadGameLengthData(),
  ]);

  return {
    openingTree,
    openingByYear,
    materialCurve,
    sacrifice,
    blunderRate,
    pieceSquares,
    gameLength,
  };
}
