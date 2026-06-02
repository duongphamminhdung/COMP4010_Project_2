import { useState, useMemo } from 'react';
import ChessBoard from './ChessBoard';

const PIECE_BOARD_SIZE = 480;

const PIECE_OPTIONS = [
  { key: 'N', label: 'Knight', symbol: '♞' },
  { key: 'B', label: 'Bishop', symbol: '♝' },
  { key: 'R', label: 'Rook', symbol: '♜' },
  { key: 'Q', label: 'Queen', symbol: '♛' },
];

const PIECE_INSIGHT = {
  N: 'Peaks on c3, f3, c6, f6.',
  B: 'Peaks on c4, f4, and fianchetto squares.',
  R: 'Peaks on open files and the 7th rank.',
  Q: 'Peaks on central squares (d4, e5, …).',
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

  const pieceLabel = PIECE_OPTIONS.find((p) => p.key === selectedPiece)?.label ?? selectedPiece;

  const { boardData, stats } = useMemo(() => {
    const pieceData = data.filter((d) => d.piece === selectedPiece);
    return {
      boardData: toPercentBoard(pieceData),
      stats: computeStats(pieceData),
    };
  }, [data, selectedPiece]);

  if (!data?.length) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {PIECE_OPTIONS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setSelectedPiece(p.key)}
            title={p.label}
            className={`btn-press flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl text-2xl sm:text-3xl transition-all ${
              selectedPiece === p.key
                ? 'bg-primary text-dark shadow-lg shadow-primary/30 scale-110'
                : 'bg-card text-white hover:bg-border hover:scale-105'
            }`}
          >
            {p.symbol}
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
            style={{ background: 'rgba(49,46,43,0.25)' }}
          >
            <ChessBoard data={boardData} valueSuffix="%" fixedSize={PIECE_BOARD_SIZE} />
          </div>

          {/* Column 2: KPI (narrowest) */}
          <div
            className="w-full lg:w-[9.25rem] shrink-0 flex flex-col rounded-lg border border-border p-2.5"
            style={{ background: 'rgba(49,46,43,0.4)' }}
          >
            <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-2 shrink-0 leading-tight">
              {pieceLabel}
            </p>
            <div className="flex flex-col gap-1.5 flex-1 min-h-0">
              {stats?.hottest && (
                <div className="rounded-md px-2 py-2 border border-border shrink-0"
                  style={{ background: 'rgba(26,26,26,0.5)' }}>
                  <div className="text-[10px] text-text-muted mb-0.5 leading-tight">Top sq.</div>
                  <div className="text-sm font-bold text-white leading-tight">{stats.hottest.square}</div>
                  <div className="text-sm font-bold text-primary">{stats.hottest.count.toFixed(1)}%</div>
                </div>
              )}
              {stats && (
                <div className="rounded-md px-2 py-2 border border-border shrink-0"
                  style={{ background: 'rgba(26,26,26,0.5)' }}>
                  <div className="text-[10px] text-text-muted mb-0.5 leading-tight">Center</div>
                  <div className="text-sm font-bold text-primary">{stats.centerPct.toFixed(1)}%</div>
                </div>
              )}
              {stats && (
                <div className="rounded-md px-2 py-2 border border-border shrink-0"
                  style={{ background: 'rgba(26,26,26,0.5)' }}>
                  <div className="text-[10px] text-text-muted mb-0.5 leading-tight">Sq. used</div>
                  <div className="text-sm font-bold text-white">
                    {stats.activeSquares}<span className="text-text-muted font-normal">/64</span>
                  </div>
                </div>
              )}
              {stats?.top3.length > 0 && (
                <div
                  className="rounded-md border border-border px-2 py-2 flex-1 flex flex-col min-h-0"
                  style={{ background: 'rgba(26,26,26,0.5)' }}
                >
                  <div className="text-[10px] text-text-muted mb-1.5 shrink-0">Top 3</div>
                  <ul className="space-y-1.5 text-xs flex-1">
                    {stats.top3.map((row, i) => (
                      <li key={row.square}>
                        <span className="text-text-muted">{i + 1}. {row.square}</span>
                        <span className="block text-white font-semibold tabular-nums">
                          {row.count.toFixed(1)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: explanation */}
          <div
            className="w-full lg:flex-1 lg:min-w-[11rem] min-h-0 rounded-lg border border-border p-4 flex flex-col"
            style={{ background: 'rgba(49,46,43,0.5)' }}
          >
            <h3 className="text-sm font-semibold text-white font-serif mb-2 shrink-0">
              Reading the board
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-3 shrink-0">
              Share of placements by square (all eras, both colors).
            </p>
            <div className="flex-1 flex flex-col justify-center gap-3 text-xs text-text-secondary leading-relaxed">
              <p>
                Each square is the % of this piece&apos;s visits there across ~200k games.
                <span className="text-white font-medium"> Greener</span> = more frequent.
                Hover for exact values.
              </p>
              <p className="pt-3 border-t border-border">
                <span className="text-white font-medium">{pieceLabel}:</span>{' '}
                {PIECE_INSIGHT[selectedPiece]}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
