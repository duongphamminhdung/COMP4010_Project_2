import { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { PERIOD_ORDER, PERIOD_COLORS, PERIOD_LABELS } from '../data/mockData';

export default function OpeningTree({ data }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 500 });
  const [selectedPeriod, setSelectedPeriod] = useState('modern');
  const [selectedPath, setSelectedPath] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Process data into tree structure
  const treeData = useMemo(() => {
    const periodData = data.filter((d) => d.period === selectedPeriod);
    const byPly = d3.group(periodData, (d) => d.ply);

    const maxPly = Math.max(...byPly.keys());
    const columns = [];

    for (let ply = 0; ply <= Math.min(maxPly, 4); ply++) {
      const moves = (byPly.get(ply) || [])
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      const total = d3.sum(moves, (d) => d.count);

      columns.push({
        ply,
        moves: moves.map((m) => ({
          ...m,
          pct: ((m.count / total) * 100).toFixed(1),
        })),
        total,
      });
    }

    return columns;
  }, [data, selectedPeriod]);

  // Responsive sizing
  useEffect(() => {
    const observe = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: Math.max(width, 600), height: Math.min(500, Math.max(350, width * 0.45)) });
      }
    };
    observe();
    const ro = new ResizeObserver(observe);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // D3 rendering
  useEffect(() => {
    if (!svgRef.current || treeData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const margin = { top: 40, right: 30, bottom: 20, left: 60 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const numColumns = treeData.length;
    const colWidth = innerW / numColumns;
    const gap = 2;

    // Color scale: green for white moves (even ply), darker for black moves (odd ply)
    const whiteMoveColor = '#81B64C';
    const blackMoveColor = '#4a6e2a';
    const highlightColor = '#BACA44';
    const dimColor = '#333333';

    // Compute positions for each move block
    const positionedMoves = [];

    treeData.forEach((col, colIdx) => {
      const total = col.total;
      let y = 0;

      col.moves.forEach((move) => {
        const blockH = (move.count / total) * innerH - gap;
        positionedMoves.push({
          ...move,
          ply: col.ply,
          colIdx,
          x: colIdx * colWidth,
          y,
          width: colWidth - 8,
          height: Math.max(blockH, 4),
          isWhite: col.ply % 2 === 0,
        });
        y += blockH + gap;
      });
    });

    // Draw ply labels
    g.selectAll('.ply-label')
      .data(treeData)
      .join('text')
      .attr('class', 'ply-label')
      .attr('x', (d, i) => i * colWidth + colWidth / 2)
      .attr('y', -15)
      .attr('text-anchor', 'middle')
      .attr('fill', '#A0A0A0')
      .attr('font-size', '13px')
      .attr('font-weight', '600')
      .text((d) => `Ply ${d.ply}`);

    // Draw move blocks
    const blocks = g
      .selectAll('.move-block')
      .data(positionedMoves)
      .join('rect')
      .attr('class', 'move-block')
      .attr('x', (d) => d.x + 4)
      .attr('y', (d) => d.y)
      .attr('width', (d) => d.width)
      .attr('height', (d) => d.height)
      .attr('rx', 3)
      .attr('fill', (d) => (d.isWhite ? whiteMoveColor : blackMoveColor))
      .attr('opacity', 0.85)
      .attr('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('opacity', 1).attr('fill', highlightColor);
        setHoveredNode(d);
      })
      .on('mouseleave', function (event, d) {
        d3.select(this)
          .attr('opacity', 0.85)
          .attr('fill', d.isWhite ? whiteMoveColor : blackMoveColor);
        setHoveredNode(null);
      });

    // Move name labels on blocks (only if block is tall enough)
    g.selectAll('.move-label')
      .data(positionedMoves.filter((d) => d.height > 18))
      .join('text')
      .attr('class', 'move-label')
      .attr('x', (d) => d.x + d.width / 2 + 4)
      .attr('y', (d) => d.y + d.height / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', d => d.height > 30 ? 'white' : '#ddd')
      .attr('font-size', d => d.height > 30 ? '13px' : '11px')
      .attr('font-weight', '600')
      .attr('pointer-events', 'none')
      .text((d) => `${d.san} ${d.pct}%`);

    // Draw connection curves between adjacent columns
    for (let colIdx = 0; colIdx < treeData.length - 1; colIdx++) {
      const currentCol = positionedMoves.filter((d) => d.colIdx === colIdx);
      const nextCol = positionedMoves.filter((d) => d.colIdx === colIdx + 1);

      currentCol.forEach((src) => {
        // Distribute flow proportionally to next column
        let nextY = src.y;
        const proportionalHeight = (src.count / treeData[colIdx].total) * innerH;

        nextCol.forEach((tgt) => {
          const tgtProportion = tgt.count / treeData[colIdx + 1].total;
          const flowH = proportionalHeight * tgtProportion * 0.3;

          if (flowH > 1) {
            const x1 = src.x + src.width + 4;
            const x2 = tgt.x + 4;
            const y1 = nextY + flowH / 2;
            const y2 = tgt.y + tgt.height / 2;

            g.append('path')
              .attr('d', `M${x1},${y1} C${x1 + (x2 - x1) * 0.5},${y1} ${x1 + (x2 - x1) * 0.5},${y2} ${x2},${y2}`)
              .attr('fill', 'none')
              .attr('stroke', src.isWhite ? whiteMoveColor : blackMoveColor)
              .attr('stroke-width', Math.min(flowH, 8))
              .attr('opacity', 0.12);
          }
          nextY += (tgt.count / treeData[colIdx + 1].total) * proportionalHeight;
        });
      });
    }
  }, [treeData, dimensions]);

  return (
    <div>
      {/* Period toggle */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-text-muted text-sm mr-2">Period:</span>
        {PERIOD_ORDER.map((p) => (
          <button
            key={p}
            onClick={() => setSelectedPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedPeriod === p
                ? 'bg-primary text-dark'
                : 'bg-card text-text-secondary hover:bg-border'
            }`}
          >
            {PERIOD_LABELS[p]?.split('\n')[0] || p}
          </button>
        ))}
      </div>

      {/* Breadcrumb path */}
      {selectedPath.length > 0 && (
        <div className="flex items-center gap-1 mb-4 text-sm text-text-secondary">
          {selectedPath.map((move, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-text-muted">&gt;</span>}
              <span className="bg-card px-2 py-0.5 rounded text-white">{move}</span>
            </span>
          ))}
          <button
            onClick={() => setSelectedPath([])}
            className="ml-2 text-primary hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* SVG container */}
      <div ref={containerRef} className="w-full overflow-x-auto">
        <svg ref={svgRef} className="w-full" />
      </div>

      {/* Hover tooltip */}
      {hoveredNode && (
        <div className="mt-3 text-sm text-text-secondary">
          <span className="text-white font-semibold">{hoveredNode.san}</span>
          {' '}— {hoveredNode.pct}% of games at this ply ({hoveredNode.count.toLocaleString()} games)
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 text-sm text-text-muted">
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded" style={{ backgroundColor: '#81B64C' }} />
          <span>White moves</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded" style={{ backgroundColor: '#4a6e2a' }} />
          <span>Black moves</span>
        </div>
      </div>
    </div>
  );
}
