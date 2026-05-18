import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { ELO_BRACKETS } from '../data/mockData';

const PERIOD_LABELS = ['Pre-AI', 'Early Post-AI', 'NNUE Era', 'Modern'];

export default function BlunderHeatmap({ data }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const cellW = Math.min(100, (width - 120) / 4);
    const cellH = 50;
    const margin = { top: 30, right: 20, bottom: 10, left: 90 };
    const totalW = margin.left + 4 * cellW + margin.right;
    const totalH = margin.top + 6 * cellH + margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', totalW).attr('height', totalH);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Color scale: green (low) -> yellow -> red (high)
    const values = data.map((d) => d.value);
    const colorScale = d3.scaleSequential()
      .domain([Math.min(...values), Math.max(...values)])
      .interpolator(d3.interpolateRdYlGn)
      .unknown('#333');

    // Invert so green = low blunders, red = high
    const invertedColor = (val) => colorScale(Math.max(...values) + Math.min(...values) - val);

    // Draw cells
    data.forEach((d) => {
      const row = ELO_BRACKETS.indexOf(d.elo);
      const col = PERIOD_LABELS.indexOf(d.period);
      if (row < 0 || col < 0) return;

      g.append('rect')
        .attr('x', col * cellW)
        .attr('y', row * cellH)
        .attr('width', cellW - 3)
        .attr('height', cellH - 3)
        .attr('rx', 4)
        .attr('fill', invertedColor(d.value))
        .attr('opacity', 0.85)
        .attr('cursor', 'pointer')
        .on('mouseenter', (event) => {
          setTooltip({ ...d, x: event.offsetX, y: event.offsetY });
          d3.select(event.target).attr('opacity', 1).attr('stroke', 'white').attr('stroke-width', 2);
        })
        .on('mouseleave', (event) => {
          setTooltip(null);
          d3.select(event.target).attr('opacity', 0.85).attr('stroke', 'none');
        });

      // Value label
      g.append('text')
        .attr('x', col * cellW + (cellW - 3) / 2)
        .attr('y', row * cellH + (cellH - 3) / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', d.value > (Math.max(...values) + Math.min(...values)) / 2 ? '#1a1a1a' : 'white')
        .attr('font-size', '13px')
        .attr('font-weight', '600')
        .attr('pointer-events', 'none')
        .text(d.value.toFixed(2));
    });

    // Y-axis labels (ELO brackets)
    ELO_BRACKETS.forEach((elo, i) => {
      g.append('text')
        .attr('x', -10)
        .attr('y', i * cellH + cellH / 2 - 1)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#A0A0A0')
        .attr('font-size', '12px')
        .text(elo);
    });

    // X-axis labels (periods)
    PERIOD_LABELS.forEach((p, i) => {
      g.append('text')
        .attr('x', i * cellW + cellW / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#A0A0A0')
        .attr('font-size', '12px')
        .attr('font-weight', '500')
        .text(p);
    });
  }, [data]);

  return (
    <div>
      <div className="mb-4 text-sm text-text-muted">
        Blunders per game across ELO brackets and time periods. Green = fewer blunders, red = more.
        Hover over cells for details.
      </div>

      <div ref={containerRef} className="w-full overflow-x-auto">
        <svg ref={svgRef} />
      </div>

      {/* Change badges */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {ELO_BRACKETS.map((elo) => {
          const preAi = data.find((d) => d.elo === elo && d.period === 'Pre-AI');
          const modern = data.find((d) => d.elo === elo && d.period === 'Modern');
          if (!preAi || !modern) return null;
          const change = ((modern.value - preAi.value) / preAi.value * 100).toFixed(1);
          const isImprove = change < 0;
          return (
            <div key={elo} className="bg-card rounded-lg p-2 text-center border border-border">
              <div className="text-xs text-text-muted mb-1">{elo}</div>
              <div className={`text-sm font-bold ${isImprove ? 'text-primary' : 'text-red-400'}`}>
                {isImprove ? '' : '+'}{change}%
              </div>
            </div>
          );
        })}
      </div>

      {tooltip && (
        <div
          className="fixed z-50 bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-sm pointer-events-none"
          style={{ left: tooltip.x + 10, top: tooltip.y - 40 }}
        >
          <p className="text-white font-semibold">{tooltip.elo} &middot; {tooltip.period}</p>
          <p className="text-text-secondary">{tooltip.value.toFixed(2)} blunders/game</p>
        </div>
      )}
    </div>
  );
}
