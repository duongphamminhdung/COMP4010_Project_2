import { useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { BOARD_LIGHT, BOARD_DARK } from './ChessBoard';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];
const LABEL_LIGHT = '#737373';
const LABEL_DARK = '#d4d4d4';
const LAST_MOVE = '#34d399';

const PIECE_SYMBOLS = {
  wp: '♙',
  wn: '♘',
  wb: '♗',
  wr: '♖',
  wq: '♕',
  wk: '♔',
  bp: '♟',
  bn: '♞',
  bb: '♝',
  br: '♜',
  bq: '♛',
  bk: '♚',
};

const OPENINGS = [
  {
    name: 'Italian Game',
    family: 'Open Game',
    side: 'Classical development',
    color: '#34d399',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd4'],
    idea: 'White builds fast central pressure with Bc4, c3, and d4.',
  },
  {
    name: 'Queen\'s Gambit',
    family: 'Queen\'s Pawn',
    side: 'Central tension',
    color: '#60a5fa',
    moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3'],
    idea: 'White offers the c-pawn to pull Black away from the center.',
  },
  {
    name: 'London System',
    family: 'Queen\'s Pawn',
    side: 'System opening',
    color: '#a3e635',
    moves: ['d4', 'Nf6', 'Bf4', 'e6', 'e3', 'd5', 'Nf3', 'Be7', 'Bd3', 'O-O', 'Nbd2'],
    idea: 'White develops the dark-square bishop early and builds a compact, repeatable setup.',
  },
  {
    name: 'Sicilian Defense',
    family: 'Defense vs e4',
    side: 'Asymmetric counterplay',
    color: '#f87171',
    moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'],
    idea: 'Black avoids symmetry and fights for queenside counterplay.',
  },
  {
    name: 'French Defense',
    family: 'Defense vs e4',
    side: 'Pawn-chain battle',
    color: '#c084fc',
    moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6', 'e5', 'Nfd7', 'f4'],
    idea: 'Black challenges White\'s center and attacks the pawn chain later.',
  },
  {
    name: 'Caro-Kann Defense',
    family: 'Defense vs e4',
    side: 'Solid structure',
    color: '#fbbf24',
    moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6'],
    idea: 'Black gets a sturdy pawn structure and develops the light bishop early.',
  },
  {
    name: 'King\'s Indian Defense',
    family: 'Defense vs d4',
    side: 'Hypermodern attack',
    color: '#38bdf8',
    moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O'],
    idea: 'Black lets White occupy the center, then attacks it with pieces and pawns.',
  },
  {
    name: 'Nimzo-Indian Defense',
    family: 'Defense vs d4',
    side: 'Piece pressure',
    color: '#e2e8f0',
    moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4', 'e3', 'O-O', 'Bd3', 'd5'],
    idea: 'Black pins the knight and fights for control before the center clarifies.',
  },
];

function boardFromMoves(moves, step) {
  const chess = new Chess();
  const played = [];

  for (const move of moves.slice(0, step)) {
    try {
      const result = chess.move(move);
      if (!result) break;
      played.push(result);
    } catch {
      break;
    }
  }

  return {
    board: chess.board(),
    fen: chess.fen(),
    lastMove: played.at(-1) ?? null,
  };
}

function squareName(rowIndex, colIndex) {
  return `${FILES[colIndex]}${RANKS[rowIndex]}`;
}

function formatMoveNumber(index) {
  const moveNo = Math.floor(index / 2) + 1;
  return index % 2 === 0 ? `${moveNo}.` : `${moveNo}...`;
}

function OpeningBoard({ board, lastMove }) {
  const highlighted = new Set([lastMove?.from, lastMove?.to].filter(Boolean));

  return (
    <div
      className="w-full aspect-square shrink-0 bg-card rounded-sm shadow-lg overflow-hidden"
      style={{ maxWidth: 'min(30rem, calc(100vw - 3rem))' }}
    >
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {board.map((rank, rowIndex) =>
          rank.map((piece, colIndex) => {
            const square = squareName(rowIndex, colIndex);
            const light = (rowIndex + colIndex) % 2 === 0;
            const key = `${rowIndex}-${colIndex}`;
            const symbol = piece ? PIECE_SYMBOLS[`${piece.color}${piece.type}`] : '';
            const isWhite = piece?.color === 'w';
            const isMarked = highlighted.has(square);

            return (
              <div
                key={key}
                className="relative flex items-center justify-center select-none"
                style={{
                  background: light ? BOARD_LIGHT : BOARD_DARK,
                }}
              >
                {isMarked && (
                  <span
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: LAST_MOVE,
                      opacity: 0.38,
                      boxShadow: `inset 0 0 0 2px ${LAST_MOVE}`,
                    }}
                  />
                )}
                {colIndex === 0 && (
                  <span
                    className="absolute left-1 top-0.5 z-10 text-[10px] font-semibold"
                    style={{ color: light ? LABEL_LIGHT : LABEL_DARK }}
                  >
                    {RANKS[rowIndex]}
                  </span>
                )}
                {rowIndex === 7 && (
                  <span
                    className="absolute bottom-0.5 right-1 z-10 text-[10px] font-semibold"
                    style={{ color: light ? LABEL_LIGHT : LABEL_DARK }}
                  >
                    {FILES[colIndex]}
                  </span>
                )}
                {symbol && (
                  <span
                    className="relative z-10 text-[clamp(1.65rem,6vw,3.15rem)] leading-none font-serif"
                    style={{
                      color: isWhite ? '#f8fafc' : '#111827',
                      textShadow: isWhite
                        ? '0 1px 2px rgba(0,0,0,0.9)'
                        : '0 1px 1px rgba(255,255,255,0.55)',
                    }}
                  >
                    {symbol}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function OpeningSimulator() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const selected = OPENINGS[selectedIndex];
  const position = useMemo(
    () => boardFromMoves(selected.moves, step),
    [selected.moves, step]
  );

  useEffect(() => {
    setStep(0);
    setPlaying(false);
  }, [selectedIndex]);

  useEffect(() => {
    if (!playing) return undefined;

    const timer = window.setInterval(() => {
      setStep((current) => {
        if (current >= selected.moves.length) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 850);

    return () => window.clearInterval(timer);
  }, [playing, selected.moves.length]);

  const currentMove = step > 0 ? selected.moves[step - 1] : 'Starting position';
  const progress = selected.moves.length === 0 ? 0 : (step / selected.moves.length) * 100;

  return (
    <div className="grid lg:grid-cols-[minmax(17rem,30rem)_1fr] gap-6 lg:gap-8 items-start">
      <div
        className="w-full flex justify-center lg:justify-start rounded-lg border border-border p-2 sm:p-3"
        style={{ background: 'rgba(49,46,43,0.25)' }}
      >
        <OpeningBoard board={position.board} lastMove={position.lastMove} />
      </div>

      <div className="min-w-0 space-y-5">
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
          {OPENINGS.map((opening, index) => (
            <button
              key={opening.name}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`btn-press text-left border px-3 py-2 min-w-0 transition-all ${
                selectedIndex === index
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card/50 hover:border-text-muted'
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-white">
                <span className="w-2.5 h-2.5 shrink-0 bg-primary" />
                <span className="min-w-0 break-words">{opening.name}</span>
              </span>
              <span className="block text-xs text-text-muted mt-0.5">{opening.family}</span>
            </button>
          ))}
        </div>

        <div className="border border-border bg-card/40 p-3 sm:p-4">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-text-muted mb-1">{selected.side}</p>
              <h3 className="text-2xl font-bold text-white font-serif">{selected.name}</h3>
            </div>
            <div className="px-2.5 py-1 text-sm font-semibold text-dark bg-primary">
              {step}/{selected.moves.length}
            </div>
          </div>

          <p className="text-sm text-text-secondary leading-relaxed mb-4">{selected.idea}</p>

          <div className="h-2 bg-dark border border-border mb-4">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="grid grid-cols-5 sm:flex sm:flex-wrap items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="btn-press px-2 sm:px-3 py-2 text-sm border border-border bg-card text-text-secondary hover:text-white hover:border-text-muted"
              title="Reset line"
            >
              |&lt;
            </button>
            <button
              type="button"
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              className="btn-press px-2 sm:px-3 py-2 text-sm border border-border bg-card text-text-secondary hover:text-white hover:border-text-muted"
              title="Previous move"
            >
              &lt;
            </button>
            <button
              type="button"
              onClick={() => setPlaying((value) => !value)}
              className="btn-press px-2 sm:px-4 py-2 text-sm font-semibold text-dark bg-primary hover:bg-primary-hover"
              title={playing ? 'Pause line' : 'Play line'}
            >
              {playing ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              onClick={() => setStep((current) => Math.min(selected.moves.length, current + 1))}
              className="btn-press px-2 sm:px-3 py-2 text-sm border border-border bg-card text-text-secondary hover:text-white hover:border-text-muted"
              title="Next move"
            >
              &gt;
            </button>
            <button
              type="button"
              onClick={() => setStep(selected.moves.length)}
              className="btn-press px-2 sm:px-3 py-2 text-sm border border-border bg-card text-text-secondary hover:text-white hover:border-text-muted"
              title="Finish line"
            >
              &gt;|
            </button>
          </div>

          <div className="text-sm text-text-secondary mb-4">
            Current move:{' '}
            <span className="font-semibold text-white">
              {step > 0 ? `${formatMoveNumber(step - 1)} ${currentMove}` : currentMove}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {selected.moves.map((move, index) => (
              <button
                key={`${move}-${index}`}
                type="button"
                onClick={() => setStep(index + 1)}
                className={`btn-press px-2 py-1 text-xs border transition-colors ${
                  index < step
                    ? 'border-primary/50 bg-primary/10 text-white'
                    : 'border-border bg-dark/40 text-text-muted hover:text-white'
                }`}
              >
                <span className="text-text-muted mr-1">{formatMoveNumber(index)}</span>
                {move}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
