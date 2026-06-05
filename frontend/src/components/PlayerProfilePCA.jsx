import { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';

const PERIOD_LABELS = ['Pre-AI', 'Early Post-AI', 'NNUE Era', 'Modern'];
const PERIOD_COLORS = ['#60a5fa', '#c084fc', '#fbbf24', '#34d399'];
const PERIOD_KEY_MAP = {
  'pre-ai': 'Pre-AI',
  'early-post-ai': 'Early Post-AI',
  'nnue-era': 'NNUE Era',
  'modern': 'Modern',
};
const MARGIN = { top: 20, right: 20, bottom: 50, left: 60 };
const POINT_RADIUS = 4;
const POINT_OPACITY = 0.55;

export default function PlayerProfilePCA({ data }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [hiddenEras, setHiddenEras] = useState(new Set());

  const normalized = useMemo(() => {
    if (!data?.length) return [];
    return data.map((d) => ({
      ...d,
      period: PERIOD_KEY_MAP[d.period] || d.period,
    }));
  }, [data]);

  const { varianceLd1, varianceLd2 } = useMemo(() => {
    if (!normalized.length) return { varianceLd1: 0, varianceLd2: 0 };
    const ld1Var = d3.variance(normalized.map(d => d.ld1));
    const ld2Var = d3.variance(normalized.map(d => d.ld2));
    const total = ld1Var + ld2Var;
    return {
      varianceLd1: total > 0 ? ld1Var / total : 0,
      varianceLd2: total > 0 ? ld2Var / total : 0,
    };
  }, [normalized]);

  const toggleEra = (era) => {
    setHiddenEras((prev) => {
      const next = new Set(prev);
      if (next.has(era)) next.delete(era);
      else next.add(era);
      return next;
    });
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !normalized.length) return;

    const visibleData = normalized.filter((d) => !hiddenEras.has(d.period));
    if (!visibleData.length) {
      d3.select(svgRef.current).selectAll('*').remove();
      return;
    }

    const draw = () => {
      const container = containerRef.current;
      const width = container.clientWidth || 640;
      const height = Math.max(400, Math.min(520, width * 0.65));
      const innerW = width - MARGIN.left - MARGIN.right;
      const innerH = height - MARGIN.top - MARGIN.bottom;

      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();
      svg
        .attr('width', '100%')
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMinYMid meet');

      const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

      const xExtent = d3.extent(visibleData, (d) => d.ld1);
      const yExtent = d3.extent(visibleData, (d) => d.ld2);
      const xPad = (xExtent[1] - xExtent[0]) * 0.05 || 1;
      const yPad = (yExtent[1] - yExtent[0]) * 0.05 || 1;

      const xScale = d3.scaleLinear()
        .domain([xExtent[0] - xPad, xExtent[1] + xPad])
        .range([0, innerW]);
      const yScale = d3.scaleLinear()
        .domain([yExtent[0] - yPad, yExtent[1] + yPad])
        .range([innerH, 0]);

      // Axes
      g.append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(xScale).ticks(8).tickSize(-innerH).tickFormat(d3.format('.1f')))
        .call((g) => g.select('.domain').remove())
        .call((g) => g.selectAll('.tick line').attr('stroke', '#2a2a2a'))
        .call((g) => g.selectAll('.tick text').attr('fill', '#a8aab8').attr('font-size', '11px'));

      g.append('g')
        .call(d3.axisLeft(yScale).ticks(6).tickSize(-innerW).tickFormat(d3.format('.1f')))
        .call((g) => g.select('.domain').remove())
        .call((g) => g.selectAll('.tick line').attr('stroke', '#2a2a2a'))
        .call((g) => g.selectAll('.tick text').attr('fill', '#a8aab8').attr('font-size', '11px'));

      // Axis labels
      g.append('text')
        .attr('x', innerW / 2)
        .attr('y', innerH + 38)
        .attr('text-anchor', 'middle')
        .attr('fill', '#a8aab8')
        .attr('font-size', '12px')
        .text('LD1');

      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerH / 2)
        .attr('y', -42)
        .attr('text-anchor', 'middle')
        .attr('fill', '#a8aab8')
        .attr('font-size', '12px')
        .text('LD2');

      // Points
      g.selectAll('circle')
        .data(visibleData)
        .join('circle')
        .attr('cx', (d) => xScale(d.ld1))
        .attr('cy', (d) => yScale(d.ld2))
        .attr('r', POINT_RADIUS)
        .attr('fill', (d) => PERIOD_COLORS[PERIOD_LABELS.indexOf(d.period)] || '#888')
        .attr('opacity', POINT_OPACITY)
        .attr('cursor', 'pointer')
        .on('mouseenter', (event, d) => {
          d3.select(event.target).attr('r', POINT_RADIUS * 2).attr('opacity', 1).attr('stroke', '#fff').attr('stroke-width', 2);
          setTooltip({ ...d, x: event.clientX, y: event.clientY });
        })
        .on('mouseleave', (event) => {
          d3.select(event.target).attr('r', POINT_RADIUS).attr('opacity', POINT_OPACITY).attr('stroke', 'none');
          setTooltip(null);
        });
    };

    draw();

    const observer = new ResizeObserver(draw);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [normalized, hiddenEras]);

  if (!normalized.length) return null;

  const totalCount = normalized.length;

  return (
    <div>
      {/* Era toggle buttons */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {PERIOD_LABELS.map((era, i) => {
          const active = !hiddenEras.has(era);
          const count = normalized.filter((d) => d.period === era).length;
          return (
            <button
              key={era}
              type="button"
              onClick={() => toggleEra(era)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                active
                  ? 'border'
                  : 'bg-card text-text-muted opacity-50 border border-border'
              }`}
              style={active ? {
                background: `${PERIOD_COLORS[i]}15`,
                borderColor: `${PERIOD_COLORS[i]}40`,
                color: PERIOD_COLORS[i],
              } : {}}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: active ? PERIOD_COLORS[i] : '#555' }}
              />
              {era}
              <span className="text-text-muted ml-1">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        {/* Scatter plot */}
        <div
          ref={containerRef}
          className="flex-1 min-w-0 rounded-lg border border-border overflow-hidden"
          style={{ background: 'rgba(49,46,43,0.25)' }}
        >
          <svg ref={svgRef} className="block w-full" />
        </div>

        {/* Sidebar KPIs */}
        <div
          className="w-full lg:w-[10rem] shrink-0 flex flex-col rounded-lg border border-border p-3"
          style={{ background: 'rgba(49,46,43,0.4)' }}
        >
          <p className="text-[10px] text-text-secondary uppercase tracking-wide mb-2 shrink-0 leading-tight">
            LDA Summary
          </p>
          <div className="flex flex-col gap-1.5 flex-1 min-h-0">
            <div
              className="rounded-md px-2 py-2 border border-border shrink-0"
              style={{ background: 'rgba(26,26,26,0.5)' }}
            >
              <div className="text-[10px] text-text-muted mb-0.5 leading-tight">LD1 variance</div>
              <div className="text-sm font-bold text-primary">{(varianceLd1 * 100).toFixed(1)}%</div>
            </div>
            <div
              className="rounded-md px-2 py-2 border border-border shrink-0"
              style={{ background: 'rgba(26,26,26,0.5)' }}
            >
              <div className="text-[10px] text-text-muted mb-0.5 leading-tight">LD2 variance</div>
              <div className="text-sm font-bold text-primary">{(varianceLd2 * 100).toFixed(1)}%</div>
            </div>
            <div
              className="rounded-md px-2 py-2 border border-border shrink-0"
              style={{ background: 'rgba(26,26,26,0.5)' }}
            >
              <div className="text-[10px] text-text-muted mb-0.5 leading-tight">Total captured</div>
              <div className="text-sm font-bold text-white">
                {((varianceLd1 + varianceLd2) * 100).toFixed(1)}%
              </div>
            </div>
            <div
              className="rounded-md px-2 py-2 border border-border shrink-0"
              style={{ background: 'rgba(26,26,26,0.5)' }}
            >
              <div className="text-[10px] text-text-muted mb-0.5 leading-tight">Points shown</div>
              <div className="text-sm font-bold text-white">
                {totalCount - normalized.filter((d) => hiddenEras.has(d.period)).length}
                <span className="text-text-muted font-normal">/{totalCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
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
          <p className="text-white font-semibold">
            {tooltip.period} &middot; ELO {tooltip.elo}
          </p>
          <p className="text-text-secondary">
            ACPL {tooltip.acpl?.toFixed?.(1)} &middot; Blunder {((tooltip.blunder_rate || 0) * 100).toFixed(1)}%
          </p>
          <p className="text-text-muted text-xs">
            Captures {((tooltip.capture_pct || 0) * 100).toFixed(1)}% &middot; Checks {((tooltip.check_pct || 0) * 100).toFixed(1)}% &middot; {tooltip.n_moves} moves
          </p>
        </div>
      )}
    </div>
  );
}
