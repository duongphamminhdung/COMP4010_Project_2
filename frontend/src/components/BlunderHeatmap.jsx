import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { ELO_BRACKETS } from '../data/mockData';
import { HEATMAP_VIZ_HEIGHT } from './ChessBoard';

const PERIOD_LABELS = ['Pre-AI', 'Early Post-AI', 'NNUE Era', 'Modern'];
const PERIOD_COLORS = ['#60a5fa', '#c084fc', '#fbbf24', '#34d399'];

const MARGIN = { top: 35, right: 20, bottom: 10, left: 100 };
const IMPROVE = '#34d399';
const WORSE = '#f87171';
const NEUTRAL = '#94a3b8';

export default function BlunderHeatmap({ data }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data.length) return;

    const draw = () => {
      const container = containerRef.current;
      const width = container.clientWidth || 640;
      const cellH = (HEATMAP_VIZ_HEIGHT - MARGIN.top - MARGIN.bottom) / 6;
      const cellW = Math.max(72, (width - 120) / 4);
      const totalW = MARGIN.left + 4 * cellW + MARGIN.right;
      const totalH = HEATMAP_VIZ_HEIGHT;

      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();
      svg
        .attr('width', '100%')
        .attr('height', totalH)
        .attr('viewBox', `0 0 ${totalW} ${totalH}`)
        .attr('preserveAspectRatio', 'xMinYMid meet');

      const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

      const values = data.map((d) => d.value).filter(Number.isFinite);
      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);
      const meanVal = values.reduce((sum, v) => sum + v, 0) / (values.length || 1);

      const cellColor = (val) => {
        if (val <= meanVal) {
          const t = (val - minVal) / (meanVal - minVal || 1);
          return d3.interpolate('#10b981', '#334155')(t);
        }
        const t = (val - meanVal) / (maxVal - meanVal || 1);
        return d3.interpolate('#fbbf24', '#ef4444')(t);
      };

      const textColor = (val) => {
        if (val <= meanVal) return val < (minVal + meanVal) / 2 ? '#06281f' : '#f0f1f5';
        return val > (meanVal + maxVal) / 2 ? '#fff7ed' : '#1A1A1A';
      };

      data.forEach((d) => {
        const row = ELO_BRACKETS.indexOf(d.elo);
        const col = PERIOD_LABELS.indexOf(d.period);
        if (row < 0 || col < 0) return;

        g.append('rect')
          .attr('x', col * cellW)
          .attr('y', row * cellH)
          .attr('width', cellW - 4)
          .attr('height', cellH - 4)
          .attr('rx', 6)
          .attr('fill', cellColor(d.value))
          .attr('opacity', 0.85)
          .attr('cursor', 'pointer')
          .on('mouseenter', (event) => {
            setTooltip({ ...d, x: event.clientX, y: event.clientY });
            d3.select(event.target).attr('opacity', 1).attr('stroke', '#fff').attr('stroke-width', 2);
          })
          .on('mouseleave', (event) => {
            setTooltip(null);
            d3.select(event.target).attr('opacity', 0.85).attr('stroke', 'none');
          });

        g.append('text')
          .attr('x', col * cellW + (cellW - 4) / 2)
          .attr('y', row * cellH + (cellH - 4) / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', textColor(d.value))
          .attr('font-size', '14px')
          .attr('font-weight', '600')
          .attr('pointer-events', 'none')
          .text(d.value.toFixed(2));
      });

      ELO_BRACKETS.forEach((elo, i) => {
        g.append('text')
          .attr('x', -12)
          .attr('y', i * cellH + cellH / 2 - 1)
          .attr('text-anchor', 'end')
          .attr('dominant-baseline', 'middle')
          .attr('fill', '#a8aab8')
          .attr('font-size', '13px')
          .text(elo);
      });

      PERIOD_LABELS.forEach((p, i) => {
        g.append('circle')
          .attr('cx', i * cellW + cellW / 2 - 28)
          .attr('cy', -16)
          .attr('r', 4)
          .attr('fill', PERIOD_COLORS[i]);
        g.append('text')
          .attr('x', i * cellW + cellW / 2 - 20)
          .attr('y', -12)
          .attr('text-anchor', 'start')
          .attr('fill', '#a8aab8')
          .attr('font-size', '12px')
          .attr('font-weight', '500')
          .text(p);
      });
    };

    draw();

    const observer = new ResizeObserver(draw);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [data]);

  if (!data?.length) return null;

  return (
    <div>
      <p className="mb-4 text-sm text-text-secondary">
        Blunders per game by ELO and era. The heatmap is centered on the overall mean:
        teal cells are below average, amber-red cells are above average.
      </p>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-stretch">
        <div
          ref={containerRef}
          className="flex-1 min-w-0 overflow-x-auto"
          style={{ height: HEATMAP_VIZ_HEIGHT }}
        >
          <svg ref={svgRef} className="block w-full h-full" />
        </div>

        <aside className="md:w-44 lg:w-48 shrink-0">
          <p className="text-xs text-text-secondary uppercase tracking-wide mb-2">
            Pre-AI → Modern
          </p>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
            {ELO_BRACKETS.map((elo) => {
              const preAi = data.find((d) => d.elo === elo && d.period === 'Pre-AI');
              const modern = data.find((d) => d.elo === elo && d.period === 'Modern');
              if (!preAi || !modern) return null;
              const change = ((modern.value - preAi.value) / preAi.value * 100);
              const isImprove = change < -0.1;
              const isWorse = change > 0.1;
              const color = isImprove ? IMPROVE : isWorse ? WORSE : NEUTRAL;
              return (
                <div key={elo} className="card-hover rounded-lg px-3 py-2 border border-border"
                  style={{ background: 'rgba(49,46,43,0.4)' }}>
                  <div className="text-xs text-text-muted mb-0.5">{elo}</div>
                  <div className="text-base font-bold tabular-nums" style={{ color }}>
                    {change > 0 ? '+' : ''}{change.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 rounded-lg border p-3 w-full"
            style={{ background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.15)' }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PERIOD_COLORS[2] }} />
              <h3 className="text-sm font-semibold text-white font-serif">NNUE era</h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Teal cells are below-average blunder rates; amber-red cells are above average.
              Middle ELO brackets show the largest improvement from post-game engine analysis.
            </p>
          </div>
        </aside>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 rounded-lg px-3 py-2 shadow-xl text-sm pointer-events-none border"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 48,
            background: 'rgba(49,46,43,0.95)',
            borderColor: '#3D3B38',
          }}
        >
          <p className="text-white font-semibold">{tooltip.elo} &middot; {tooltip.period}</p>
          <p className="text-text-secondary">{tooltip.value.toFixed(2)} blunders/game</p>
        </div>
      )}
    </div>
  );
}
