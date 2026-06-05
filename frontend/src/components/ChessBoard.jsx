import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export const BOARD_LIGHT = '#EEEED2';
export const BOARD_DARK = '#769656';
const HEAT_LOW = '#bbf7d0';
const HEAT_HIGH = '#15803d';

/** Shared viz height for Section 4 & 5 heatmaps */
export const HEATMAP_VIZ_HEIGHT = 400;

/** Screen coords: rank 8 at top, a-file on the left. */
export function parseSquare(square) {
  if (square == null || square === '') return null;

  if (typeof square === 'number' && Number.isFinite(square)) {
    const file = square % 8;
    const rank = 7 - Math.floor(square / 8);
    return { file, rank };
  }

  const sq = String(square).trim().toLowerCase();
  if (sq.length < 2) return null;

  const file = sq.charCodeAt(0) - 97;
  const rankNum = parseInt(sq.slice(1), 10);
  if (file < 0 || file > 7 || rankNum < 1 || rankNum > 8) return null;

  return { file, rank: 8 - rankNum };
}

export default function ChessBoard({
  data,
  title,
  showLabels = true,
  valueSuffix = '%',
  fixedSize = HEATMAP_VIZ_HEIGHT,
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const parentW = svgRef.current.parentElement?.clientWidth ?? fixedSize;
    const size = Math.min(parentW, fixedSize);
    const sqSize = size / 8;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', size).attr('height', size).attr('viewBox', `0 0 ${size} ${size}`);

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isLight = (row + col) % 2 === 0;
        svg.append('rect')
          .attr('x', col * sqSize)
          .attr('y', row * sqSize)
          .attr('width', sqSize)
          .attr('height', sqSize)
          .attr('fill', isLight ? BOARD_LIGHT : BOARD_DARK);

        if (showLabels) {
          if (row === 7) {
            svg.append('text')
              .attr('x', (col + 1) * sqSize - 4)
              .attr('y', (row + 1) * sqSize - 4)
              .attr('text-anchor', 'end')
              .attr('font-size', '10px')
              .attr('fill', isLight ? '#737373' : '#d4d4d4')
              .text(FILES[col]);
          }
          if (col === 0) {
            svg.append('text')
              .attr('x', 4)
              .attr('y', row * sqSize + 13)
              .attr('font-size', '10px')
              .attr('fill', isLight ? '#737373' : '#d4d4d4')
              .text(RANKS[row]);
          }
        }
      }
    }

    const visible = (data ?? []).filter((d) => d.count > 0);
    if (!visible.length) return;

    const maxVal = d3.max(visible, (d) => d.count) || 1;
    const parent = svgRef.current.parentElement;
    let tooltip = d3.select(parent).select('.board-tooltip');
    if (!tooltip.empty()) tooltip.remove();
    tooltip = d3.select(parent)
      .append('div')
      .attr('class', 'board-tooltip pointer-events-none absolute z-10 hidden rounded px-2 py-1 text-xs text-white shadow-lg')
      .style('background', 'rgba(49,46,43,0.95)')
      .style('border', '1px solid #3D3B38');

    visible.forEach((d) => {
      const coords = parseSquare(d.square);
      if (!coords) return;

      const { file, rank } = coords;
      const normalized = d.count / maxVal;
      const fill = d3.interpolate(HEAT_LOW, HEAT_HIGH)(normalized);
      const opacity = 0.35 + normalized * 0.6;

      svg.append('rect')
        .attr('x', file * sqSize)
        .attr('y', rank * sqSize)
        .attr('width', sqSize)
        .attr('height', sqSize)
        .attr('fill', fill)
        .attr('opacity', opacity)
        .attr('class', 'heatmap-cell')
        .on('mouseenter', function () {
          tooltip
            .style('display', 'block')
            .html(`<strong>${d.square}</strong><br/>${d.count.toFixed(2)}${valueSuffix}`);
          d3.select(this).attr('opacity', Math.min(opacity + 0.15, 1));
        })
        .on('mousemove', (event) => {
          const rect = parent.getBoundingClientRect();
          tooltip
            .style('left', `${event.clientX - rect.left + 12}px`)
            .style('top', `${event.clientY - rect.top - 28}px`);
        })
        .on('mouseleave', function () {
          tooltip.style('display', 'none');
          d3.select(this).attr('opacity', opacity);
        });
    });

    return () => {
      d3.select(svgRef.current?.parentElement).selectAll('.board-tooltip').remove();
    };
  }, [data, showLabels, valueSuffix, fixedSize]);

  return (
    <div
      className="relative flex items-center justify-center w-full"
      style={{
        height: `min(calc(100vw - 3rem), ${fixedSize}px)`,
        maxWidth: fixedSize,
        maxHeight: fixedSize,
      }}
    >
      {title && (
        <p className="absolute -top-6 left-0 right-0 text-sm font-semibold text-text-secondary text-center">
          {title}
        </p>
      )}
      <svg ref={svgRef} className="rounded-sm shadow-lg" />
    </div>
  );
}
