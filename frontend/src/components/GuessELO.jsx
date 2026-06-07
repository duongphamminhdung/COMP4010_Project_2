import { useState, useCallback, useRef, useMemo } from 'react';
import { Chess } from 'chess.js';
import { BOARD_LIGHT, BOARD_DARK } from './ChessBoard';

// Piece unicode
const PIECE_UNICODE = {
  K: '\u2654', Q: '\u2655', R: '\u2656', B: '\u2657', N: '\u2658', P: '\u2659',
  k: '\u265A', q: '\u265B', r: '\u265C', b: '\u265D', n: '\u265E', p: '\u265F',
};

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };

// Piece-square tables (White perspective, index 0 = a8)
const PST = {
  p: [0,0,0,0,0,0,0,0,50,50,50,50,50,50,50,50,10,10,20,30,30,20,10,10,5,5,10,25,25,10,5,5,0,0,0,20,20,0,0,0,5,-5,-10,0,0,-10,-5,5,5,10,10,-20,-20,10,10,5,0,0,0,0,0,0,0,0],
  n: [-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,0,0,0,-20,-40,-30,0,10,15,15,10,0,-30,-30,5,15,20,20,15,5,-30,-30,0,15,20,20,15,0,-30,-30,5,10,15,15,10,5,-30,-40,-20,0,5,5,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50],
  b: [-20,-10,-10,-10,-10,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,10,10,10,10,0,-10,-10,5,5,10,10,5,5,-10,-10,0,10,10,10,10,0,-10,-10,10,10,10,10,10,10,-10,-10,5,0,0,0,0,5,-10,-20,-10,-10,-10,-10,-10,-10,-20],
  r: [0,0,0,0,0,0,0,0,5,10,10,10,10,10,10,5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,0,0,0,5,5,0,0,0],
  q: [-20,-10,-10,-5,-5,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,5,5,5,0,-10,-5,0,5,5,5,5,0,-5,0,0,5,5,5,5,0,-5,-10,5,5,5,5,5,0,-10,-10,0,5,0,0,0,0,-10,-20,-10,-10,-5,-5,-10,-10,-20],
  k: [-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10,20,20,0,0,0,0,20,20,20,30,10,0,0,10,30,20],
};

const BOT_ELO = 1300;
const CENTER_SQUARES = new Set(['c3','c4','c5','c6','d3','d4','d5','d6','e3','e4','e5','e6','f3','f4','f5','f6']);
const SQ = 64;
const BOARD_PX = SQ * 8;
const MIN_MOVES = 20;

// ── Evaluation ──────────────────────────────────────────────
function evaluateBoard(chess) {
  const board = chess.board();
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const val = PIECE_VALUES[piece.type];
      const idx = piece.color === 'w' ? r * 8 + c : (7 - r) * 8 + c;
      const pst = (PST[piece.type]?.[idx] ?? 0) / 100;
      score += piece.color === 'w' ? val + pst : -(val + pst);
    }
  }
  return score;
}

// ── Minimax bot ─────────────────────────────────────────────
function minimax(chess, depth, maximizing, alpha, beta) {
  if (depth === 0 || chess.moves().length === 0) return evaluateBoard(chess);
  const moves = chess.moves();
  if (maximizing) {
    let best = -Infinity;
    for (const m of moves) {
      chess.move(m);
      best = Math.max(best, minimax(chess, depth - 1, false, alpha, beta));
      chess.undo();
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      chess.move(m);
      best = Math.min(best, minimax(chess, depth - 1, true, alpha, beta));
      chess.undo();
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

async function getBotMove(chess) {
  const moves = chess.moves({ verbose: true });
  if (!moves.length) return { move: null, evalCp: null };

  try {
    const fen = encodeURIComponent(chess.fen());
    const resp = await fetch(
      `https://lichess.org/api/cloud-eval?fen=${fen}&multiPv=${Math.min(moves.length, 4)}&depth=12`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!resp.ok) throw new Error('API error');
    const data = await resp.json();

    // Position eval in centipawns (from White's perspective)
    const evalCp = data.pvs?.[0]?.cp ?? null;

    if (data.pvs?.length) {
      const pvMoves = data.pvs
        .map(pv => {
          const san = pv.moves?.split(' ')[0];
          return moves.find(m => m.san === san);
        })
        .filter(Boolean);

      if (pvMoves.length >= 2) {
        const pool = pvMoves.slice(1, 4);
        return { move: pool[Math.floor(Math.random() * pool.length)], evalCp };
      }
    }

    if (evalCp !== null) return { move: moves[0], evalCp };
  } catch {
    // Fallback: local depth-2 search
  }

  return { move: getBotMoveLocal(chess, moves), evalCp: null };
}

function getBotMoveLocal(chess, moves) {
  const scored = moves.map(m => {
    chess.move(m.san);
    const s = minimax(chess, 2, true, -Infinity, Infinity);
    chess.undo();
    return { move: m, score: s };
  });

  scored.sort((a, b) => a.score - b.score);

  const topN = Math.min(scored.length, 3);
  const weights = Array.from({ length: topN }, (_, i) => Math.exp(-i * 1.2));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < topN; i++) {
    r -= weights[i];
    if (r <= 0) return scored[i].move;
  }
  return scored[0].move;
}

// ── Best-move eval (ACPL: compare user move vs best available) ──
function computeBestEval(chess) {
  const moves = chess.moves();
  let best = -Infinity;
  for (const m of moves) {
    chess.move(m);
    const ev = evaluateBoard(chess);
    chess.undo();
    if (ev > best) best = ev;
  }
  return best === -Infinity ? 0 : best;
}

// ── Material helper ─────────────────────────────────────────
function getMaterialBalance(chess) {
  const board = chess.board();
  let w = 0, b = 0;
  for (const row of board) {
    for (const p of row) {
      if (!p || p.type === 'k') continue;
      if (p.color === 'w') w += PIECE_VALUES[p.type];
      else b += PIECE_VALUES[p.type];
    }
  }
  return w - b;
}

// ── ELO prediction ──────────────────────────────────────────
function predictELO(stats, features, model, gameResult) {
  if (!model) return null;

  let elo;

  if (model.type === 'acpl_regression') {
    // ACPL-based: ELO = a - b * ln(ACPL_cp)
    const n = stats.moveCount;
    const acplEval = n > 0 ? stats.evalDrops.reduce((a, b) => a + b, 0) / n : 0;
    const acplCp = Math.max(acplEval * (model.eval_to_cp || 100), 1);
    elo = model.a - model.b * Math.log(acplCp);

    // Factor in game result against known-strength bot
    if (gameResult) {
      if (gameResult === 'You won!') elo = Math.max(elo, BOT_ELO + 100);
      else if (gameResult === 'You lost.') elo = Math.min(elo, BOT_ELO + 200);
    }
  } else if (model.type === 'gaussian_mock') {
    elo = model.base_elo;
    for (const [name, weight] of Object.entries(model.feature_weights)) {
      elo += (features[name] ?? 0) * weight;
    }

    if (gameResult) {
      if (gameResult === 'You won!') elo = Math.max(elo, BOT_ELO + 100);
      else if (gameResult === 'You lost.') elo = Math.min(elo, BOT_ELO + 200);
    }
  } else if (model.type === 'mlp') {
    const { feature_names, scaler, W1, b1, W2, b2 } = model;
    const normed = feature_names.map((name, i) => {
      const s = scaler[i];
      return ((features[name] ?? 0) - s.mean) / (s.std || 1);
    });
    const hidden = b1.map((bias, j) => {
      let sum = bias;
      for (let i = 0; i < normed.length; i++) sum += normed[i] * W1[i][j];
      return Math.max(0, sum);
    });
    const logits = b2.map((bias, j) => {
      let sum = bias;
      for (let i = 0; i < hidden.length; i++) sum += hidden[i] * W2[i][j];
      return sum;
    });
    const maxL = Math.max(...logits);
    const exps = logits.map(l => Math.exp(l - maxL));
    const s = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / s);
  }

  // Gaussian kernel over ELO bracket centers
  const sigma = model.sigma || 300;
  const probs = model.centers.map(c => Math.exp(-0.5 * ((elo - c) / sigma) ** 2));
  const sum = probs.reduce((a, b) => a + b, 0);
  return probs.map(p => p / sum);
}

// ── Component ───────────────────────────────────────────────
export default function GuessELO({ modelData }) {
  const [chess] = useState(() => new Chess());
  const [position, setPosition] = useState(chess.fen());
  const [selectedSq, setSelectedSq] = useState(null);
  const [legalTargets, setLegalTargets] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [status, setStatus] = useState('waiting');
  const [botThinking, setBotThinking] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [gameResult, setGameResult] = useState(null);

  const statsRef = useRef({
    evalDrops: [],
    captures: 0,
    checks: 0,
    moveCount: 0,
    pieceTypes: new Set(),
    centerMoves: 0,
    prevApiEvalCp: 0,
  });

  const features = useMemo(() => {
    const s = statsRef.current;
    const n = s.moveCount;
    if (n === 0) return null;
    return {
      accuracy: Math.max(0, 1 - s.evalDrops.reduce((a, b) => a + b, 0) / (n * 2)),
      blunder_rate: s.evalDrops.filter(d => d > 2).length / n,
      capture_pct: s.captures / n,
      check_pct: s.checks / n,
      piece_diversity: s.pieceTypes.size / 6,
      center_pct: s.centerMoves / n,
      material_balance: getMaterialBalance(chess) / 39,
    };
  }, [position, chess]);

  const startGame = useCallback(() => {
    chess.reset();
    statsRef.current = {
      evalDrops: [], captures: 0, checks: 0, moveCount: 0,
      pieceTypes: new Set(), centerMoves: 0, prevApiEvalCp: 0,
    };
    setPosition(chess.fen());
    setSelectedSq(null);
    setLegalTargets([]);
    setLastMove(null);
    setStatus('playing');
    setPrediction(null);
    setGameResult(null);
  }, [chess]);

  const handleSquareClick = useCallback((sq) => {
    if (status !== 'playing' || botThinking || chess.turn() !== 'w') return;
    const piece = chess.get(sq);

    if (selectedSq) {
      // Clicking a different white piece -> re-select
      if (piece && piece.color === 'w' && sq !== selectedSq) {
        setSelectedSq(sq);
        setLegalTargets(chess.moves({ square: sq, verbose: true }).map(m => m.to));
        return;
      }

      // Try the move
      let move;
      try { move = chess.move({ from: selectedSq, to: sq, promotion: 'q' }); } catch { move = null; }

      if (move) {
        const st = statsRef.current;
        if (move.captured) st.captures++;
        if (move.san.includes('+') || move.san.includes('#')) st.checks++;
        st.pieceTypes.add(move.piece);
        if (CENTER_SQUARES.has(move.to)) st.centerMoves++;

        setSelectedSq(null);
        setLegalTargets([]);
        setLastMove({ from: selectedSq, to: sq });
        setPosition(chess.fen());

        if (chess.isGameOver()) {
          if (chess.isCheckmate()) {
            setGameResult('You won!');
          } else if (chess.isStalemate()) {
            setGameResult('Stalemate — Draw');
          } else {
            setGameResult('Draw');
          }
          setStatus('done');
          return;
        }

        setBotThinking(true);
        setTimeout(async () => {
          const { move: botMove, evalCp } = await getBotMove(chess);

          // Compute eval drop for user's move using API centipawns
          const st = statsRef.current;
          if (evalCp !== null) {
            const drop = Math.max(0, st.prevApiEvalCp - evalCp);
            // Store as cp / eval_to_cp so model formula works
            st.evalDrops.push(drop / 100);
            st.prevApiEvalCp = evalCp;
          } else {
            // Fallback: use simple eval
            const evalAfter = evaluateBoard(chess);
            st.evalDrops.push(Math.max(0, (st.prevApiEvalCp / 100) - evalAfter));
            st.prevApiEvalCp = evalAfter * 100;
          }
          st.moveCount++;

          if (botMove) {
            chess.move(botMove.san);
            setLastMove({ from: botMove.from, to: botMove.to });
            setPosition(chess.fen());

            if (chess.isGameOver()) {
              if (chess.isCheckmate()) {
                setGameResult('You lost.');
              } else if (chess.isStalemate()) {
                setGameResult('Stalemate — Draw');
              } else {
                setGameResult('Draw');
              }
              setStatus('done');
            }
          }
          setBotThinking(false);
        }, 250);
        return;
      }

      // Invalid click, deselect
      setSelectedSq(null);
      setLegalTargets([]);
      return;
    }

    if (piece && piece.color === 'w') {
      setSelectedSq(sq);
      setLegalTargets(chess.moves({ square: sq, verbose: true }).map(m => m.to));
    }
  }, [chess, status, botThinking, selectedSq]);

  const handlePredict = useCallback(() => {
    if (!features || !modelData) return;
    setPrediction(predictELO(statsRef.current, features, modelData, gameResult));
  }, [features, modelData, gameResult]);

  const board = chess.board();
  const moveCount = statsRef.current.moveCount;

  return (
    <div>
      {status === 'waiting' && (
        <div className="text-center py-8">
          <p className="text-text-secondary mb-2 text-sm max-w-md mx-auto">
            Play as White against our ~{BOT_ELO} ELO bot. After {MIN_MOVES} moves, the model shows a rough rating signal.
          </p>
          <p className="text-text-muted text-xs mb-5">
            Click a piece to select, then click a highlighted square to move.
          </p>
          <button
            onClick={startGame}
            className="btn-press px-6 py-2.5 bg-primary text-dark rounded-lg font-semibold text-sm"
          >
            Start Game
          </button>
        </div>
      )}

      {status !== 'waiting' && (
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          {/* Board */}
          <div className="relative flex-shrink-0">
            <svg width={BOARD_PX} height={BOARD_PX} className="rounded overflow-hidden" role="img" aria-label="Chess board - play White against the bot">
              {board.map((row, r) =>
                row.map((piece, c) => {
                  const sq = String.fromCharCode(97 + c) + (8 - r);
                  const isLight = (r + c) % 2 === 0;
                  const isSelected = sq === selectedSq;
                  const isTarget = legalTargets.includes(sq);
                  const isLast = lastMove && (sq === lastMove.from || sq === lastMove.to);
                  let fill = isLight ? BOARD_LIGHT : BOARD_DARK;
                  if (isSelected) fill = '#f6f669';
                  else if (isLast) fill = '#ced26b';

                  return (
                    <g key={sq}>
                      <rect
                        x={c * SQ} y={r * SQ} width={SQ} height={SQ}
                        fill={fill}
                        onClick={() => handleSquareClick(sq)}
                        style={{ cursor: status === 'playing' && !botThinking ? 'pointer' : 'default' }}
                      />
                      {isTarget && !piece && (
                        <circle
                          cx={c * SQ + SQ / 2} cy={r * SQ + SQ / 2}
                          r={SQ * 0.15} fill="rgba(0,0,0,0.15)"
                          onClick={() => handleSquareClick(sq)}
                          style={{ cursor: 'pointer' }}
                        />
                      )}
                      {isTarget && piece && (
                        <circle
                          cx={c * SQ + SQ / 2} cy={r * SQ + SQ / 2}
                          r={SQ * 0.42} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth={3}
                          onClick={() => handleSquareClick(sq)}
                          style={{ cursor: 'pointer' }}
                        />
                      )}
                      {piece && (
                        <text
                          x={c * SQ + SQ / 2} y={r * SQ + SQ * 0.82}
                          textAnchor="middle" fontSize={SQ * 0.78} fontFamily="serif"
                          fill={piece.color === 'w' ? '#fff' : '#000'}
                          stroke={piece.color === 'w' ? '#000' : '#fff'}
                          strokeWidth={1} paintOrder="stroke"
                          pointerEvents="none"
                        >
                          {PIECE_UNICODE[piece.color === 'w' ? piece.type.toUpperCase() : piece.type]}
                        </text>
                      )}
                    </g>
                  );
                })
              )}
              {/* Coordinates */}
              {Array.from({ length: 8 }, (_, i) => (
                <g key={`coord-${i}`}>
                  <text x={i * SQ + 3} y={BOARD_PX - 3} fontSize={9} fill={i % 2 === 0 ? BOARD_DARK : BOARD_LIGHT} pointerEvents="none">
                    {String.fromCharCode(97 + i)}
                  </text>
                  <text x={3} y={(i + 1) * SQ - 3} fontSize={9} fill={i % 2 === 0 ? BOARD_LIGHT : BOARD_DARK} pointerEvents="none">
                    {8 - i}
                  </text>
                </g>
              ))}
            </svg>
            {botThinking && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded">
                <span className="bg-card/90 text-white text-xs font-medium px-3 py-1 rounded-full animate-pulse">
                  Bot thinking...
                </span>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-64 space-y-4">
            {/* Live stats */}
            <div className="glass-card rounded-lg p-4 space-y-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-primary">Live Stats</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Moves</span>
                  <span className="text-white font-medium tabular-nums">{moveCount}{moveCount >= MIN_MOVES ? '' : ` / ${MIN_MOVES}`}</span>
                </div>
                {features && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Accuracy</span>
                      <span className="text-white tabular-nums">{(features.accuracy * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Blunders</span>
                      <span className={`tabular-nums ${features.blunder_rate > 0.2 ? 'text-red-400' : 'text-white'}`}>
                        {(features.blunder_rate * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Development</span>
                      <span className="text-white tabular-nums">{(features.piece_diversity * 100).toFixed(0)}%</span>
                    </div>
                  </>
                )}
              </div>

              {moveCount >= MIN_MOVES && (
                <button
                  onClick={handlePredict}
                  className={`btn-press w-full py-2 rounded-lg font-semibold text-sm mt-2 ${
                    prediction ? 'bg-primary/60 text-dark' : 'bg-primary text-dark'
                  }`}
                >
                  {prediction ? `Update Signal (${moveCount} moves)` : 'Estimate Rating Signal'}
                </button>
              )}
            </div>

            {/* Rating signal result */}
            {prediction && modelData && (
              <div className="glass-card rounded-lg p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-primary">Single-Game Rating Signal</h3>
                <div className="space-y-1.5">
                  {modelData.classes.map((cls, i) => {
                    const prob = prediction[i];
                    const maxIdx = prediction.indexOf(Math.max(...prediction));
                    const isMax = i === maxIdx;
                    return (
                      <div key={cls} className="flex items-center gap-2">
                        <span className="w-20 text-[11px] text-right text-text-secondary tabular-nums">{cls}</span>
                        <div className="flex-1 h-4 bg-border/30 rounded overflow-hidden">
                          <div
                            className={`h-full rounded transition-all duration-500 ${isMax ? 'bg-primary' : 'bg-primary/30'}`}
                            style={{ width: `${Math.max(prob * 100, 2)}%` }}
                          />
                        </div>
                        <span className="w-10 text-[11px] text-text-muted tabular-nums">{(prob * 100).toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm text-primary font-semibold">
                  {modelData.classes[prediction.indexOf(Math.max(...prediction))]}
                  <span className="text-text-muted font-normal ml-1">
                    ({(Math.max(...prediction) * 100).toFixed(0)}% of the illustrative signal)
                  </span>
                </p>
                <p className="text-[11px] text-text-muted leading-relaxed border-t border-border pt-2">
                  This is a noisy visualization of ACPL from one short game, not your actual chess rating.
                </p>
              </div>
            )}

            {/* Game over / play again */}
            {(status === 'done' || gameResult) && (
              <div className="text-center space-y-3">
                {gameResult && (
                  <p className="text-white font-semibold">{gameResult}!</p>
                )}
                <button
                  onClick={startGame}
                  className="btn-press px-5 py-2 bg-card border border-border text-white rounded-lg text-sm"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
