import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { Chess } from 'chess.js';
import { PERIOD_ORDER, PERIOD_LABELS } from '../data/mockData';
import { BOARD_LIGHT, BOARD_DARK } from './ChessBoard';

// Color palette for root-level move families (ebemunk uses schemeCategory10)
const ROOT_COLORS = d3.scaleOrdinal(d3.schemeCategory10);

// Piece SVGs for the mini board (unicode)
const PIECE_UNICODE = {
  K: '\u2654', Q: '\u2655', R: '\u2656', B: '\u2657', N: '\u2658', P: '\u2659',
  k: '\u265A', q: '\u265B', r: '\u265C', b: '\u265D', n: '\u265E', p: '\u265F',
};

// Simple FEN parser -> piece positions
function fenToPieces(fen) {
  const board = [];
  const rows = fen.split(' ')[0].split('/');
  for (let r = 0; r < 8; r++) {
    let col = 0;
    for (const ch of rows[r]) {
      if (ch >= '1' && ch <= '8') {
        col += parseInt(ch);
      } else {
        board.push({ piece: ch, row: r, col });
        col++;
      }
    }
  }
  return board;
}

// Get the path of SAN moves from root to this node
function getMovePath(d) {
  const path = [];
  let node = d;
  while (node.parent && node.depth > 0) {
    path.unshift(node.data.san);
    node = node.parent;
  }
  return path;
}

// Get FEN from a sequence of SAN moves
function movesToFen(moves) {
  const chess = new Chess();
  for (const move of moves) {
    try {
      chess.move(move);
    } catch {
      break;
    }
  }
  return chess.fen();
}

function getArcFill(d) {
  if (d.depth === 0) return '#2a2a2a';
  if (d.data.san === 'Other') return '#555';
  // Find the root-level ancestor (depth 1) for the family color
  let rootParent = d;
  while (rootParent.depth > 1) {
    rootParent = rootParent.parent;
  }
  const base = d3.hsl(ROOT_COLORS(rootParent.data.san));
  let color;
  if (d.depth % 2 === 0) {
    color = base.darker(0.5);
  } else {
    color = base.brighter(0.5);
  }
  color = color.darker(d.depth * 0.15);
  return color.toString();
}

// Mini chess board SVG renderer inside the sunburst center
function drawMiniBoard(svgGroup, fen, boardSize) {
  const sqSize = boardSize / 8;
  svgGroup.selectAll('*').remove();

  // Board squares
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const isLight = (row + col) % 2 === 0;
      svgGroup.append('rect')
        .attr('x', col * sqSize)
        .attr('y', row * sqSize)
        .attr('width', sqSize)
        .attr('height', sqSize)
        .attr('fill', isLight ? BOARD_LIGHT : BOARD_DARK);
    }
  }

  // Pieces — larger and clearer
  const pieces = fenToPieces(fen);
  pieces.forEach(p => {
    svgGroup.append('text')
      .attr('x', p.col * sqSize + sqSize / 2)
      .attr('y', p.row * sqSize + sqSize * 0.82)
      .attr('text-anchor', 'middle')
      .attr('font-size', sqSize * 0.85)
      .attr('font-family', 'serif')
      .attr('fill', p.piece === p.piece.toUpperCase() ? '#fff' : '#000')
      .attr('stroke', p.piece === p.piece.toUpperCase() ? '#000' : '#fff')
      .attr('stroke-width', 1)
      .attr('paint-order', 'stroke')
      .attr('pointer-events', 'none')
      .text(PIECE_UNICODE[p.piece]);
  });
}

export default function OpeningTree({ data }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
  const boardGroupRef = useRef(null);
  const [selectedPeriod, setSelectedPeriod] = useState('pre-ai');
  const [hoverInfo, setHoverInfo] = useState(null);

  const treeRoot = useMemo(() => {
    return data[selectedPeriod] || null;
  }, [data, selectedPeriod]);

  const totalGames = useMemo(() => {
    if (!treeRoot) return 1;
    // Sum all leaf counts to get total
    const root = d3.hierarchy(treeRoot)
      .sum(d => (d.children && d.children.length) ? 0 : (d.count || 0));
    return root.value || 1;
  }, [treeRoot]);

  const render = useCallback(() => {
    if (!svgRef.current || !treeRoot) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const size = Math.min(containerWidth, 1100);
    const radius = size / 2;
    const pad = 20;

    // Board fits in center: size it relative to the sunburst
    const boardSize = radius * 0.45;
    const innerR = boardSize / 2 + 6; // gap between board edge and first arc ring

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg
      .attr('width', size)
      .attr('height', size)
      .attr('viewBox', [-size / 2, -size / 2, size, size]);

    // Build hierarchy -- sum only leaf counts (matching ebemunk: children.length ? 0 : count)
    const root = d3.hierarchy(treeRoot)
      .sum(d => (d.children && d.children.length) ? 0 : (d.count || 0))
      .sort((a, b) => b.height - a.height || b.value - a.value);

    d3.partition().size([2 * Math.PI, radius - pad])(root);

    // Radius scale: offset so arcs start outside the board area
    const rScale = d3.scaleLinear()
      .domain([0, radius])
      .range([innerR, radius - pad]);

    // Arc generator (matching ebemunk exactly)
    const arcGen = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius / 4)
      .innerRadius(d => rScale(d.y0))
      .outerRadius(d => rScale(d.y1 - 1));

    // Draw arcs
    const arcs = svg.append('g')
      .selectAll('path')
      .data(root.descendants().filter(d => d.depth))
      .join('path')
      .attr('fill', d => getArcFill(d))
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0)
      .attr('d', arcGen);

    // Board size set above — reuse for center chessboard
    const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    // Mini chessboard in center (drawn first so arcs render on top if they overlap)
    const boardGroup = svg.append('g')
      .attr('transform', `translate(${-boardSize / 2}, ${-boardSize / 2})`)
      .attr('class', 'board')
      .attr('pointer-events', 'none');

    boardGroupRef.current = boardGroup;
    drawMiniBoard(boardGroup, startingFen, boardSize);

    // Tooltip div
    const tooltip = d3.select(tooltipRef.current);
    tooltip.style('display', 'none');

    // Hover interaction (matching ebemunk exactly)
    arcs.on('mouseenter', function (event, d) {
      // Highlight ancestor path
      const ancestors = d.ancestors();
      arcs.filter(node => ancestors.indexOf(node) > -1)
        .classed('highlighted', true);

      // Build the move sequence to get FEN
      const movePath = getMovePath(d);
      const fen = movesToFen(movePath);

      // Update center board
      drawMiniBoard(boardGroup, fen, boardSize);

      // Build tooltip content (matching ebemunk format)
      const moveNum = Math.ceil(d.depth / 2).toString() + (d.depth % 2 === 0 ? '...' : '.');
      const count = d.value;
      const pctOfTotal = d3.format('.2p')(count / totalGames);
      const countFormatted = d3.format(',')(count);
      const totalFormatted = d3.format(',')(totalGames);
      const pctOfParent = d.parent ? d3.format('.2p')(count / d.parent.value) : '100%';

      setHoverInfo({
        move: d.data.san,
        fullMove: `${moveNum} ${d.data.san}`,
        path: movePath.join(' '),
        count: countFormatted,
        total: totalFormatted,
        pctOfTotal,
        pctOfParent,
        fen,
      });

      // Show tooltip near mouse
      tooltip.style('display', 'flex')
        .style('left', (event.offsetX + 15) + 'px')
        .style('top', (event.offsetY - 10) + 'px')
        .html(`
          <span><strong>${moveNum} ${d.data.san}</strong></span>
          <span>${countFormatted} of ${totalFormatted} (${pctOfTotal})</span>
          <span>${pctOfParent} of parent</span>
        `);
    }).on('mousemove', function (event) {
      tooltip
        .style('left', (event.offsetX + 15) + 'px')
        .style('top', (event.offsetY - 10) + 'px');
    }).on('mouseleave', function (event, d) {
      const ancestors = d.ancestors();
      arcs.filter(node => ancestors.indexOf(node) > -1)
        .classed('highlighted', false);

      // Reset center board to starting position
      drawMiniBoard(boardGroup, startingFen, boardSize);

      tooltip.style('display', 'none');
      setHoverInfo(null);
    });

    // Text labels on arcs (matching ebemunk: x1-x0 > 0.1 threshold)
    svg.append('g')
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)
      .attr('font-family', "'DM Sans', system-ui, sans-serif")
      .attr('fill', 'white')
      .selectAll('text')
      .data(root.descendants().filter(d => d.depth && (d.x1 - d.x0) > 0.1))
      .join('text')
      .attr('transform', function (d) {
        const angle = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const r = rScale((d.y0 + d.y1) / 2);
        const rot = angle - 90;
        return `rotate(${rot}) translate(${r},0) rotate(${-rot})`;
      })
      .attr('dy', '0.35em')
      .text(d => d.data.san);

  }, [treeRoot, totalGames]);

  useEffect(() => {
    render();
    const ro = new ResizeObserver(() => render());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [render]);

  return (
    <div>
      {/* Period toggle */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        <span className="text-text-muted text-sm mr-2">Period:</span>
        {PERIOD_ORDER.map((p) => (
          <button
            key={p}
            onClick={() => { setSelectedPeriod(p); setHoverInfo(null); }}
            className={`btn-press px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedPeriod === p
                ? 'bg-primary text-dark'
                : 'bg-card text-text-secondary hover:bg-border'
            }`}
          >
            {PERIOD_LABELS[p]?.split('\n')[0] || p}
          </button>
        ))}
      </div>

      {/* Sunburst chart container */}
      <div ref={containerRef} className="opening-tree-chart flex justify-center relative">
        <svg ref={svgRef} />
        {/* Tooltip */}
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none z-10 bg-card border border-border rounded px-3 py-2 text-xs flex flex-col items-start gap-0.5 text-white"
          style={{ display: 'none' }}
        />
      </div>

      {/* Hover info panel below chart */}
      <div className="mt-4 min-h-[48px]">
        {hoverInfo ? (
          <div className="bg-card rounded-lg px-4 py-3 border border-border inline-block mx-auto">
            <p className="text-white font-semibold text-sm">
              {hoverInfo.fullMove}
            </p>
            <p className="text-text-secondary text-xs mt-1">
              Path: {hoverInfo.path}
            </p>
            <p className="text-text-secondary text-xs mt-0.5">
              {hoverInfo.count} of {hoverInfo.total} ({hoverInfo.pctOfTotal})
            </p>
            <p className="text-primary text-xs mt-0.5">
              {hoverInfo.pctOfParent} of parent
            </p>
          </div>
        ) : (
          <p className="text-text-muted text-sm text-center">
            Hover over the chart to explore opening lines
          </p>
        )}
      </div>

      {/* Legend: first move colors from actual data */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
        {(treeRoot?.children || []).slice(0, 10).map(child => (
          <div key={child.san} className="flex items-center gap-1.5 text-xs text-text-muted">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: ROOT_COLORS(child.san) }} />
            <span>1. {child.san}</span>
          </div>
        ))}
      </div>

      {/* Inline styles matching ebemunk */}
      <style>{`
        .opening-tree-chart path {
          stroke: white;
          stroke-width: 2;
          stroke-opacity: 0;
          transition: stroke-opacity 0.15s ease;
        }
        .opening-tree-chart path.highlighted {
          stroke-opacity: 1;
        }
        .opening-tree-chart .board {
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
