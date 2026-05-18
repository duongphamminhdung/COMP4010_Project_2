import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

const PIECE_SYMBOLS = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
};

export default function ChessBoard({ data, title, colorScheme = 'green', showLabels = true }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const size = Math.min(svgRef.current.parentElement.clientWidth, 320);
    const sqSize = size / 8;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', size).attr('height', size);

    // Draw board squares
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isLight = (row + col) % 2 === 0;
        svg.append('rect')
          .attr('x', col * sqSize)
          .attr('y', row * sqSize)
          .attr('width', sqSize)
          .attr('height', sqSize)
          .attr('fill', isLight ? '#EEEED2' : '#769656');

        // File/rank labels
        if (showLabels) {
          if (row === 7) {
            svg.append('text')
              .attr('x', (col + 1) * sqSize - 3)
              .attr('y', (row + 1) * sqSize - 3)
              .attr('text-anchor', 'end')
              .attr('font-size', '9px')
              .attr('fill', isLight ? '#769656' : '#EEEED2')
              .text(FILES[col]);
          }
          if (col === 0) {
            svg.append('text')
              .attr('x', 3)
              .attr('y', row * sqSize + 11)
              .attr('font-size', '9px')
              .attr('fill', isLight ? '#769656' : '#EEEED2')
              .text(RANKS[row]);
          }
        }
      }
    }

    if (!data || data.length === 0) return;

    // Overlay heatmap
    const maxCount = d3.max(data, (d) => d.count) || 1;

    data.forEach((d) => {
      const file = d.square % 8;
      const rank = 7 - Math.floor(d.square / 8);

      let fill;
      if (colorScheme === 'green') {
        fill = '#BACA44';
      } else if (colorScheme === 'diverging') {
        fill = d.count >= 0 ? '#81B64C' : '#e74c3c';
      } else {
        fill = '#BACA44';
      }

      const normalizedCount = colorScheme === 'diverging'
        ? Math.abs(d.count) / maxCount
        : d.count / maxCount;

      svg.append('rect')
        .attr('x', file * sqSize)
        .attr('y', rank * sqSize)
        .attr('width', sqSize)
        .attr('height', sqSize)
        .attr('fill', fill)
        .attr('opacity', normalizedCount * 0.7)
        .attr('pointer-events', 'none');
    });
  }, [data, colorScheme, showLabels]);

  return (
    <div className="flex flex-col items-center">
      {title && (
        <p className="text-sm font-semibold text-text-secondary mb-2">{title}</p>
      )}
      <svg ref={svgRef} className="rounded-sm shadow-lg" />
    </div>
  );
}
