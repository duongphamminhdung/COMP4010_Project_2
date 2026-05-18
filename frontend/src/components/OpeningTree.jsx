import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { PERIOD_ORDER, PERIOD_LABELS } from '../data/mockData';

// Color palette for root-level move families (ebemunk style)
const ROOT_COLORS = {
  'e4': '#e74c3c',
  'd4': '#3498db',
  'Nf3': '#f39c12',
  'c4': '#2ecc71',
  'g3': '#9b59b6',
  'b3': '#1abc9c',
  'f4': '#e67e22',
  'd3': '#16a085',
  'c3': '#2980b9',
  'Nc3': '#d35400',
};

function getRootColor(san) {
  return ROOT_COLORS[san] || '#7f8c8d';
}

function getArcFill(d, colors) {
  if (d.depth === 0) return '#2a2a2a';
  // Find the root-level ancestor to get the family color
  let rootParent = d;
  while (rootParent.parent && rootParent.parent.depth > 0) {
    rootParent = rootParent.parent;
  }
  const base = d3.hsl(getRootColor(rootParent.data.san));
  if (d.depth % 2 === 0) {
    base.l = Math.max(0.2, base.l - 0.08);
  } else {
    base.l = Math.min(0.7, base.l + 0.08);
  }
  base.s = Math.max(0.3, base.s - d.depth * 0.04);
  return base.toString();
}

function getParents(node) {
  const path = [];
  let current = node;
  while (current.parent) {
    path.unshift(current);
    current = current.parent;
  }
  return path;
}

export default function OpeningTree({ data }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedPeriod, setSelectedPeriod] = useState('modern');
  const [hoverInfo, setHoverInfo] = useState(null);

  const treeRoot = useMemo(() => {
    return data[selectedPeriod];
  }, [data, selectedPeriod]);

  // Compute total game count for percentage display
  const totalGames = useMemo(() => {
    if (!treeRoot) return 1;
    return treeRoot.children ? d3.sum(treeRoot.children, c => c.count || c.value) : 1;
  }, [treeRoot]);

  const render = useCallback(() => {
    if (!svgRef.current || !treeRoot) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const size = Math.min(containerWidth, 600);
    const radius = size / 2;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', size).attr('height', size);

    const g = svg.append('g')
      .attr('transform', `translate(${radius},${radius})`);

    // d3.partition layout
    const partition = d3.partition()
      .size([2 * Math.PI, radius]);

    const root = d3.hierarchy(treeRoot)
      .sum(d => d.count || 0)
      .sort((a, b) => b.value - a.value);

    partition(root);

    const arcThreshold = 0.008;
    const textThreshold = 0.04;

    const visibleNodes = root.descendants().filter(d => d.depth > 0 && (d.x1 - d.x0) > arcThreshold);

    // Arc generator
    const xScale = d3.scaleLinear().range([0, 2 * Math.PI]);
    const yScale = d3.scaleSqrt().range([0, radius]);

    const arcGen = d3.arc()
      .startAngle(d => Math.max(0, Math.min(2 * Math.PI, xScale(d.x0))))
      .endAngle(d => Math.max(0, Math.min(2 * Math.PI, xScale(d.x1))))
      .innerRadius(d => Math.max(0, yScale(d.y0)))
      .outerRadius(d => Math.max(0, yScale(d.y1)))
      .padAngle(0.005)
      .padRadius(radius / 2);

    // Draw arcs
    const arcs = g.selectAll('.arc')
      .data(visibleNodes)
      .join('path')
      .attr('class', 'arc')
      .attr('d', arcGen)
      .attr('fill', d => getArcFill(d))
      .attr('stroke', '#1A1A1A')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.9)
      .attr('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        const parents = getParents(d);

        arcs.transition().duration(150)
          .style('opacity', node => parents.indexOf(node) > -1 ? 1 : 0.2);

        d3.select(this).attr('stroke', 'white').attr('stroke-width', 2);

        const movePath = parents.map(p => p.data.san).join(' > ');
        const pct = ((d.value / totalGames) * 100).toFixed(1);
        const moveNum = Math.floor((d.depth - 1) / 2) + 1;
        const prefix = d.depth % 2 === 1 ? `${moveNum}. ` : `${moveNum}... `;
        setHoverInfo({
          move: d.data.san,
          fullMove: prefix + d.data.san,
          path: movePath,
          count: d.value,
          pct,
        });
      })
      .on('mouseleave', function () {
        arcs.transition().duration(300).style('opacity', 0.9);
        d3.select(this).attr('stroke', '#1A1A1A').attr('stroke-width', 0.5);
        setHoverInfo(null);
      });

    // Text labels on arcs (only for large enough arcs)
    g.selectAll('.arc-label')
      .data(visibleNodes.filter(d => (d.x1 - d.x0) > textThreshold && (d.y1 - d.y0) > 12))
      .join('text')
      .attr('class', 'arc-label')
      .attr('transform', d => {
        const angle = (d.x0 + d.x1) / 2;
        const r = (yScale(d.y0) + yScale(d.y1)) / 2;
        const x = Math.sin(angle) * r;
        const y = -Math.cos(angle) * r;
        const rot = (angle * 180 / Math.PI) - 90 + (angle > Math.PI ? 180 : 0);
        return `translate(${x},${y}) rotate(${rot})`;
      })
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', 'white')
      .attr('font-size', d => Math.min(11, (d.y1 - d.y0) * 0.35) + 'px')
      .attr('font-weight', '600')
      .attr('pointer-events', 'none')
      .text(d => d.data.san);

    // Center circle
    g.append('circle')
      .attr('r', yScale(root.y1) * 0.15)
      .attr('fill', '#1A1A1A')
      .attr('stroke', '#3D3B38')
      .attr('stroke-width', 1);

    // Center text
    const centerR = yScale(root.y1) * 0.15;
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.3em')
      .attr('fill', '#A0A0A0')
      .attr('font-size', `${Math.max(9, centerR * 0.35)}px`)
      .text('Opening');
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1em')
      .attr('fill', '#81B64C')
      .attr('font-size', `${Math.max(10, centerR * 0.4)}px`)
      .attr('font-weight', '700')
      .text('Tree');

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
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-text-muted text-sm mr-2">Period:</span>
        {PERIOD_ORDER.map((p) => (
          <button
            key={p}
            onClick={() => { setSelectedPeriod(p); setHoverInfo(null); }}
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

      {/* Sunburst chart */}
      <div ref={containerRef} className="flex justify-center">
        <svg ref={svgRef} />
      </div>

      {/* Hover info panel */}
      <div className="mt-4 min-h-[48px]">
        {hoverInfo ? (
          <div className="bg-card rounded-lg px-4 py-3 border border-border inline-block">
            <p className="text-white font-semibold text-sm">
              {hoverInfo.fullMove}
            </p>
            <p className="text-text-secondary text-xs mt-1">
              Path: {hoverInfo.path}
            </p>
            <p className="text-primary text-xs mt-0.5">
              {hoverInfo.pct}% of all games ({hoverInfo.count.toLocaleString()} games)
            </p>
          </div>
        ) : (
          <p className="text-text-muted text-sm text-center">
            Hover over the chart to explore opening lines
          </p>
        )}
      </div>

      {/* Legend: first move colors */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
        {['e4', 'd4', 'Nf3', 'c4', 'g3'].map(move => (
          <div key={move} className="flex items-center gap-1.5 text-xs text-text-muted">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getRootColor(move) }} />
            <span>1. {move}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
