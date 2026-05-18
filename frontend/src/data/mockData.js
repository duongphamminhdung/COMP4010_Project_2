// Mock data for "The Evolution of Human Chess Thought in the Age of AI"
// Realistic chess statistics based on Lichess data patterns

export const PERIOD_LABELS = {
  'pre-ai': 'Pre-AI\n(2015-16)',
  'early-post-ai': 'Early Post-AI\n(2018-19)',
  'nnue-era': 'NNUE Era\n(2021-22)',
  'modern': 'Modern\n(2024)',
};

export const PERIOD_ORDER = ['pre-ai', 'early-post-ai', 'nnue-era', 'modern'];

export const PERIOD_COLORS = {
  'pre-ai': '#4C8BF5',
  'early-post-ai': '#7B61FF',
  'nnue-era': '#F5A623',
  'modern': '#81B64C',
};

export const ELO_BRACKETS = ['0-1000', '1000-1400', '1400-1800', '1800-2200', '2200-2600', '2600+'];

// ============================================================
// 1. Opening Tree Data
// ============================================================
// Format: array of { ply, san, count, period }
// ply 0 = white's first move, ply 1 = black's reply, etc.

function generateOpeningTreeData() {
  const data = [];

  // Top moves at each ply, with realistic frequencies
  const movesByPly = {
    'pre-ai': [
      // ply 0: white's first move
      [
        { san: 'e4', count: 55000 },
        { san: 'd4', count: 30000 },
        { san: 'Nf3', count: 7000 },
        { san: 'c4', count: 5000 },
        { san: 'g3', count: 1500 },
        { san: 'other', count: 1500 },
      ],
      // ply 1: black's reply
      [
        { san: 'e5', count: 22000 }, { san: 'c5', count: 18000 }, { san: 'e6', count: 7000 },
        { san: 'c6', count: 4000 }, { san: 'd5', count: 3000 }, { san: 'other', count: 1000 },
        // d4 responses
        { san: 'd5', count: 14000 }, { san: 'Nf6', count: 10000 }, { san: 'e6', count: 4000 },
        { san: 'f5', count: 1000 }, { san: 'other', count: 1000 },
      ],
      // ply 2
      [
        { san: 'Nf3', count: 18000 }, { san: 'Bc4', count: 3000 }, { san: 'f4', count: 1000 },
        { san: 'Nc3', count: 7000 }, { san: 'd4', count: 12000 }, { san: 'Nf3', count: 8000 },
        { san: 'c4', count: 7000 }, { san: 'Nc3', count: 5000 }, { san: 'other', count: 3000 },
      ],
      // ply 3
      [
        { san: 'Nc6', count: 14000 }, { san: 'Nf6', count: 4000 },
        { san: 'd6', count: 10000 }, { san: 'e6', count: 5000 }, { san: 'a6', count: 3000 },
        { san: 'Nf6', count: 8000 }, { san: 'e6', count: 5000 }, { san: 'other', count: 4000 },
      ],
      // ply 4
      [
        { san: 'Bb5', count: 8000 }, { san: 'Bc4', count: 4000 }, { san: 'd4', count: 6000 },
        { san: 'Bg5', count: 5000 }, { san: 'Nc3', count: 4000 }, { san: 'other', count: 3000 },
      ],
    ],
    'modern': [
      // ply 0: e4 has dropped, d4/c4/Nf3 risen
      [
        { san: 'e4', count: 48000 },
        { san: 'd4', count: 32000 },
        { san: 'Nf3', count: 9000 },
        { san: 'c4', count: 7500 },
        { san: 'g3', count: 2500 },
        { san: 'other', count: 1000 },
      ],
      // ply 1
      [
        { san: 'e5', count: 15000 }, { san: 'c5', count: 20000 }, { san: 'e6', count: 8000 },
        { san: 'c6', count: 3000 }, { san: 'd5', count: 1500 }, { san: 'other', count: 500 },
        { san: 'd5', count: 15000 }, { san: 'Nf6', count: 11000 }, { san: 'e6', count: 4000 },
        { san: 'f5', count: 1200 }, { san: 'other', count: 800 },
      ],
      // ply 2
      [
        { san: 'Nf3', count: 12000 }, { san: 'Nc3', count: 3000 },
        { san: 'd4', count: 15000 }, { san: 'Nf3', count: 5000 },
        { san: 'c4', count: 8000 }, { san: 'Nc3', count: 6000 }, { san: 'Nf3', count: 9000 },
        { san: 'other', count: 3000 },
      ],
      // ply 3
      [
        { san: 'Nc6', count: 10000 }, { san: 'd6', count: 12000 }, { san: 'Nf6', count: 5000 },
        { san: 'e6', count: 6000 }, { san: 'a6', count: 4000 },
        { san: 'Nf6', count: 9000 }, { san: 'e6', count: 6000 }, { san: 'other', count: 5000 },
      ],
      // ply 4
      [
        { san: 'Bb5', count: 9000 }, { san: 'd4', count: 8000 }, { san: 'Bc4', count: 3000 },
        { san: 'Bg5', count: 6000 }, { san: 'Nc3', count: 5000 }, { san: 'other', count: 4000 },
      ],
    ],
  };

  for (const [period, plies] of Object.entries(movesByPly)) {
    plies.forEach((moves, ply) => {
      moves.forEach((m) => {
        data.push({ ply, san: m.san, count: m.count, period });
      });
    });
  }

  // Fill in the other two periods (interpolate)
  for (const period of ['early-post-ai', 'nnue-era']) {
    const preAi = data.filter((d) => d.period === 'pre-ai');
    const modern = data.filter((d) => d.period === 'modern');
    const factor = period === 'early-post-ai' ? 0.3 : 0.7;
    preAi.forEach((pre, i) => {
      const mod = modern[i] || pre;
      data.push({
        ply: pre.ply,
        san: pre.san,
        count: Math.round(pre.count + (mod.count - pre.count) * factor),
        period,
      });
    });
  }

  return data;
}

// ============================================================
// 2. First Move Shift Data
// ============================================================

export function getFirstMoveData() {
  return [
    { period: 'Pre-AI\n(2015-16)', e4: 55.0, d4: 30.0, c4: 5.0, Nf3: 7.0, other: 3.0 },
    { period: 'Early Post-AI\n(2018-19)', e4: 52.5, d4: 31.0, c4: 6.0, Nf3: 7.5, other: 3.0 },
    { period: 'NNUE Era\n(2021-22)', e4: 50.0, d4: 32.0, c4: 7.0, Nf3: 8.0, other: 3.0 },
    { period: 'Modern\n(2024)', e4: 48.0, d4: 32.0, c4: 7.5, Nf3: 9.0, other: 3.5 },
  ];
}

// ============================================================
// 3. Material Curve Data
// ============================================================

export function getMaterialCurveData() {
  const data = [];
  for (let ply = 0; ply <= 150; ply += 3) {
    const base = 78; // starting material (per side)
    const preAi = Math.max(0, base - (ply / 150) * 55 - Math.random() * 2);
    const modern = Math.max(0, base - (ply / 150) * 50 - Math.random() * 1.5);
    const earlyPostAi = Math.max(0, base - (ply / 150) * 53 - Math.random() * 1.8);
    const nnueEra = Math.max(0, base - (ply / 150) * 51 - Math.random() * 1.6);
    data.push({
      ply,
      'Pre-AI': Math.round(preAi * 10) / 10,
      'Early Post-AI': Math.round(earlyPostAi * 10) / 10,
      'NNUE Era': Math.round(nnueEra * 10) / 10,
      'Modern': Math.round(modern * 10) / 10,
    });
  }
  return data;
}

export function getSacrificeData() {
  return [
    { period: 'Pre-AI', avgSacrifices: 0.8 },
    { period: 'Early Post-AI', avgSacrifices: 0.95 },
    { period: 'NNUE Era', avgSacrifices: 1.1 },
    { period: 'Modern', avgSacrifices: 1.2 },
  ];
}

// ============================================================
// 4. Blunder Heatmap Data
// ============================================================

export function getBlunderHeatmapData() {
  // blunders per game: decreases with ELO, decreases slightly over time
  const baseRates = {
    '0-1000': 4.2,
    '1000-1400': 3.1,
    '1400-1800': 2.3,
    '1800-2200': 1.7,
    '2200-2600': 1.2,
    '2600+': 0.8,
  };

  const periodMultipliers = {
    'Pre-AI': 1.0,
    'Early Post-AI': 0.95,
    'NNUE Era': 0.88,
    'Modern': 0.82,
  };

  const data = [];
  for (const [elo, base] of Object.entries(baseRates)) {
    for (const [period, mult] of Object.entries(periodMultipliers)) {
      data.push({
        elo,
        period,
        value: Math.round(base * mult * 100) / 100,
      });
    }
  }
  return data;
}

// ============================================================
// 5. Piece-Square Data
// ============================================================

function sqIdx(file, rank) {
  return (rank - 1) * 8 + (file.charCodeAt(0) - 97);
}

export function getPieceSquareData() {
  const pieces = ['N', 'B', 'R', 'Q'];
  const data = [];

  for (const piece of pieces) {
    for (let period of ['pre-ai', 'modern']) {
      for (let sq = 0; sq < 64; sq++) {
        let count = Math.floor(Math.random() * 50) + 5;
        data.push({ piece, period, square: sq, count });
      }
    }
  }

  // Override with realistic patterns for knights
  const knightHotspots = {
    'pre-ai': {
      // White knights
      [sqIdx('f', 3)]: 850, [sqIdx('c', 3)]: 750, [sqIdx('d', 4)]: 400, [sqIdx('e', 4)]: 350,
      [sqIdx('g', 5)]: 300, [sqIdx('f', 5)]: 280, [sqIdx('e', 5)]: 260, [sqIdx('d', 5)]: 240,
      // Black knights (mirrored)
      [sqIdx('f', 6)]: 820, [sqIdx('c', 6)]: 720, [sqIdx('d', 3)]: 380, [sqIdx('e', 3)]: 340,
    },
    'modern': {
      [sqIdx('f', 3)]: 900, [sqIdx('c', 3)]: 780, [sqIdx('d', 4)]: 500, [sqIdx('e', 4)]: 450,
      [sqIdx('g', 5)]: 400, [sqIdx('h', 4)]: 350, [sqIdx('f', 5)]: 350, [sqIdx('d', 5)]: 320,
      [sqIdx('f', 6)]: 870, [sqIdx('c', 6)]: 750, [sqIdx('d', 3)]: 470, [sqIdx('e', 3)]: 430,
    },
  };

  for (const [period, spots] of Object.entries(knightHotspots)) {
    for (const [sq, count] of Object.entries(spots)) {
      const existing = data.find((d) => d.piece === 'N' && d.period === period && d.square === Number(sq));
      if (existing) existing.count = count;
    }
  }

  // Override with realistic patterns for bishops
  const bishopHotspots = {
    'pre-ai': {
      [sqIdx('c', 4)]: 700, [sqIdx('f', 4)]: 300, [sqIdx('b', 5)]: 400, [sqIdx('g', 5)]: 200,
      [sqIdx('e', 2)]: 350, [sqIdx('d', 2)]: 300, [sqIdx('e', 3)]: 250,
      [sqIdx('c', 5)]: 650, [sqIdx('f', 5)]: 280,
    },
    'modern': {
      [sqIdx('c', 4)]: 750, [sqIdx('g', 2)]: 400, [sqIdx('f', 4)]: 350, [sqIdx('b', 5)]: 450,
      [sqIdx('g', 5)]: 300, [sqIdx('e', 2)]: 380, [sqIdx('b', 2)]: 300,
      [sqIdx('c', 5)]: 700, [sqIdx('f', 5)]: 320, [sqIdx('g', 2)]: 350,
    },
  };

  for (const [period, spots] of Object.entries(bishopHotspots)) {
    for (const [sq, count] of Object.entries(spots)) {
      const existing = data.find((d) => d.piece === 'B' && d.period === period && d.square === Number(sq));
      if (existing) existing.count = count;
    }
  }

  return data;
}

// ============================================================
// 6. Game Length Data
// ============================================================

export function getGameLengthData() {
  const data = [];

  for (let ply = 10; ply <= 200; ply += 2) {
    // Bimodal distribution with comb pattern at time controls
    const base1 = Math.exp(-0.5 * ((ply - 60) / 25) ** 2) * 1000; // main peak
    const base2 = Math.exp(-0.5 * ((ply - 120) / 35) ** 2) * 600; // secondary peak
    let combined = base1 + base2;

    // Comb spikes at time control boundaries (every 40 moves = 80 ply)
    for (const tc of [40, 60, 80, 100, 120]) {
      if (Math.abs(ply - tc * 2) < 4) {
        combined *= 1.3;
      }
    }

    data.push({
      ply,
      'Pre-AI': Math.round(combined * 1.0),
      'Early Post-AI': Math.round(combined * 1.05),
      'NNUE Era': Math.round(combined * 1.08),
      'Modern': Math.round(combined * 1.12),
    });
  }

  return data;
}

// ============================================================
// Aggregated opening tree for the D3 visualization
// ============================================================

export function getOpeningTreeData() {
  return generateOpeningTreeData();
}
