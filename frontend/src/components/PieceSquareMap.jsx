import { useState, useMemo, useEffect, useRef } from 'react';
import ChessBoard from './ChessBoard';

const PIECE_BOARD_SIZE = 480;

const PIECE_OPTIONS = [
  { key: 'N', label: 'Knight', symbol: '♞' },
  { key: 'B', label: 'Bishop', symbol: '♝' },
  { key: 'R', label: 'Rook', symbol: '♜' },
  { key: 'Q', label: 'Queen', symbol: '♛' },
];

const PIECE_INSIGHT = {
  N: 'Best on central outposts — c3, f3, c6, f6. Needs 2–3 moves to reach the rim; players rarely waste that tempo.',
  B: 'Thrives on open diagonals. Fianchetto squares (g2, b2) and c4/f4 dominate. Closed positions bury it.',
  R: 'Belongs on open files and the 7th rank. Activation is slow — hot squares appear only in the middlegame.',
  Q: 'Prefers central and semi-central squares but avoids early exposure. Activity peaks in sharp, open positions.',
};

const PIECE_ERA_NOTE = {
  N: 'Stable across all eras — knight outposts are universal.',
  B: 'Fianchetto use grew post-AI as engine-approved setups spread.',
  R: 'Open-file patterns unchanged; AI reinforced rather than redefined them.',
  Q: 'Slightly more central activity in modern era — sharper play overall.',
};

function countsBySquare(rows) {
  const map = new Map();
  for (const row of rows) {
    const sq = String(row.square).toLowerCase();
    map.set(sq, (map.get(sq) || 0) + Number(row.count) || 0);
  }
  return map;
}

function isCenterSquare(square) {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square.slice(1), 10);
  return file >= 2 && file <= 5 && rank >= 3 && rank <= 6;
}

function toPercentBoard(rows) {
  const map = countsBySquare(rows);
  const total = [...map.values()].reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  return [...map.entries()]
    .map(([square, count]) => ({
      square,
      count: (count / total) * 100,
    }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count);
}

function computeStats(rows) {
  const board = toPercentBoard(rows);
  if (!board.length) return null;

  const centerPct = board
    .filter((d) => isCenterSquare(d.square))
    .reduce((sum, d) => sum + d.count, 0);

  return {
    hottest: board[0],
    top3: board.slice(0, 3),
    centerPct,
    activeSquares: board.length,
  };
}

export default function PieceSquareMap({ data }) {
  const [selectedPiece, setSelectedPiece] = useState('N');
  const [boardOpacity, setBoardOpacity] = useState(1);
  const fadeTimer = useRef(null);

  const pieceLabel = PIECE_OPTIONS.find((p) => p.key === selectedPiece)?.label ?? selectedPiece;

  const { boardData, stats } = useMemo(() => {
    const pieceData = data.filter((d) => d.piece === selectedPiece);
    return {
      boardData: toPercentBoard(pieceData),
      stats: computeStats(pieceData),
    };
  }, [data, selectedPiece]);

  function handlePieceSelect(key) {
    if (key === selectedPiece) return;
    clearTimeout(fadeTimer.current);
    setBoardOpacity(0);
    fadeTimer.current = setTimeout(() => {
      setSelectedPiece(key);
      setBoardOpacity(1);
    }, 180);
  }

  useEffect(() => () => clearTimeout(fadeTimer.current), []);

  if (!data?.length) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {PIECE_OPTIONS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => handlePieceSelect(p.key)}
            className={`btn-press flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl gap-0.5 transition-all ${
              selectedPiece === p.key
                ? 'bg-primary text-dark shadow-lg shadow-primary/30 scale-110'
                : 'bg-card text-white hover:bg-border hover:scale-105'
            }`}
          >
            <span className="text-2xl sm:text-3xl leading-none">{p.symbol}</span>
            <span className="text-[10px] sm:text-xs font-semibold tracking-wide uppercase leading-none">
              {p.label}
            </span>
          </button>
        ))}
      </div>

      {boardData.length === 0 ? (
        <p className="text-center text-text-secondary text-sm py-8">
          No placement data for this piece.
        </p>
      ) : (
        <div
          className="w-full flex flex-col lg:flex-row gap-4 items-stretch"
          style={{ minHeight: 0 }}
        >
          {/* Column 1: heatmap (largest) */}
          <div
            className="flex-1 min-w-0 flex items-center justify-center rounded-lg border border-border p-2 lg:p-3"
            style={{ background: 'rgba(49,46,43,0.25)', transition: 'opacity 180ms ease', opacity: boardOpacity }}
          >
            <ChessBoard data={boardData} valueSuffix="%" fixedSize={PIECE_BOARD_SIZE} />
          </div>

          {/* Column 2: KPI */}
          <div
            className="w-full lg:w-52 shrink-0 flex flex-col rounded-lg border border-border p-4 gap-3"
            style={{ background: 'rgba(49,46,43,0.4)' }}
          >
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest leading-tight">
              {pieceLabel} stats
            </p>

            {stats?.hottest && (
              <div className="rounded-md px-3 py-3 border border-border"
                style={{ background: 'rgba(26,26,26,0.5)' }}>
                <div className="text-xs text-text-muted mb-1">Top square</div>
                <div className="text-2xl font-bold text-white leading-none">{stats.hottest.square}</div>
                <div className="text-lg font-bold text-primary mt-0.5">{stats.hottest.count.toFixed(1)}%</div>
                <div className="text-xs text-text-muted mt-1">of all placements</div>
              </div>
            )}

            {stats && (
              <div className="rounded-md px-3 py-3 border border-border"
                style={{ background: 'rgba(26,26,26,0.5)' }}>
                <div className="text-xs text-text-muted mb-1">Center control</div>
                <div className="text-2xl font-bold text-primary leading-none">{stats.centerPct.toFixed(1)}%</div>
                <div className="text-xs text-text-muted mt-1">of moves in c3–f6 zone</div>
              </div>
            )}

            {stats && (
              <div className="rounded-md px-3 py-3 border border-border"
                style={{ background: 'rgba(26,26,26,0.5)' }}>
                <div className="text-xs text-text-muted mb-1">Squares used</div>
                <div className="text-2xl font-bold text-white leading-none">
                  {stats.activeSquares}
                  <span className="text-base text-text-muted font-normal"> / 64</span>
                </div>
              </div>
            )}

            {stats?.top3.length > 0 && (
              <div className="rounded-md border border-border px-3 py-3 flex flex-col gap-2"
                style={{ background: 'rgba(26,26,26,0.5)' }}>
                <div className="text-xs text-text-muted">Top 3 squares</div>
                {stats.top3.map((row, i) => (
                  <div key={row.square} className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary font-mono">{i + 1}. {row.square}</span>
                    <span className="text-sm font-bold text-white tabular-nums">{row.count.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 3: explanation */}
          <div
            className="w-full lg:flex-1 lg:min-w-[11rem] min-h-0 rounded-lg border p-4 flex flex-col justify-between"
            style={{ background: 'rgba(129,182,76,0.03)', borderColor: 'rgba(129,182,76,0.1)' }}
          >
            <div className="flex flex-col gap-3 text-sm text-text-secondary leading-relaxed">
              <h3 className="text-sm font-semibold text-white font-serif">
                Reading the board
              </h3>

              <p>
                % of placements per square across ~200k games.{' '}
                <span className="text-white font-medium">Brighter orange</span> = more visits.
                Hover any square for the exact value.
              </p>

              <div className="border-t border-border pt-3">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">{pieceLabel}</p>
                <p>{PIECE_INSIGHT[selectedPiece]}</p>
              </div>

              <div className="border-t border-border pt-3">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">AI era shift</p>
                <p>{PIECE_ERA_NOTE[selectedPiece]}</p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <span
                className="text-6xl opacity-20 select-none leading-none"
                style={{ color: '#ffffff' }}
              >
                {PIECE_OPTIONS.find((p) => p.key === selectedPiece)?.symbol}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
