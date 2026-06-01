import { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const OPENING_COLORS = {
  'Sicilian Defense': '#DC143C',
  'French Defense': '#60a5fa',
  'Caro-Kann Defense': '#fbbf24',
  'Queen\'s Gambit': '#34d399',
  'Italian Game': '#e2e8f0',
};

const FALLBACK_COLORS = ['#c084fc', '#38bdf8', '#fb7185', '#a3e635'];

function colorForOpening(opening, index) {
  return OPENING_COLORS[opening] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function prepareLineData(rows) {
  if (!rows?.length) return { chartData: [], series: [], ranking: [] };

  const openingTotals = new Map();
  rows.forEach((row) => {
    const opening = String(row.opening || '').trim();
    if (!opening) return;
    openingTotals.set(opening, (openingTotals.get(opening) || 0) + (Number(row.count) || 0));
  });

  const openings = [...openingTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([opening]) => opening);

  const years = [...new Set(rows.map((row) => Number(row.year)))]
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const baselineYear = years.find((year) => year >= 2014) ?? years[0];
  const latestYear = years.at(-1);

  const series = openings.map((opening, index) => ({
    opening,
    dataKey: `opening_${index}`,
    color: colorForOpening(opening, index),
  }));

  const chartData = years.map((year) => {
    const yearRows = rows.filter((row) => Number(row.year) === year);
    const point = { year };

    series.forEach(({ opening, dataKey }) => {
      const match = yearRows.find((row) => row.opening === opening);
      point[dataKey] = match ? Number(match.pct) : null;
    });

    return point;
  });

  const ranking = series
    .map(({ opening, color }) => {
      const baseline = rows.find((row) => Number(row.year) === baselineYear && row.opening === opening);
      const latest = rows.find((row) => Number(row.year) === latestYear && row.opening === opening);
      const baselinePct = Number(baseline?.pct);
      const latestPct = Number(latest?.pct);
      return {
        opening,
        color,
        latestPct,
        change: Number.isFinite(baselinePct) && Number.isFinite(latestPct)
          ? latestPct - baselinePct
          : null,
      };
    })
    .filter((item) => Number.isFinite(item.latestPct))
    .sort((a, b) => b.latestPct - a.latestPct);

  return { chartData, series, ranking, baselineYear, latestYear };
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-lg px-4 py-3 shadow-xl border"
      style={{ background: 'rgba(49,46,43,0.96)', borderColor: '#3D3B38' }}
    >
      <p className="text-white font-semibold text-sm mb-2">{label}</p>
      <div className="space-y-1">
        {payload
          .filter((item) => typeof item.value === 'number')
          .sort((a, b) => b.value - a.value)
          .map((item) => (
            <p key={item.dataKey} className="text-sm" style={{ color: item.color }}>
              {item.name}: {item.value.toFixed(2)}%
            </p>
          ))}
      </div>
    </div>
  );
};

export default function OpeningRevolution({ data }) {
  const { chartData, series, ranking, baselineYear, latestYear } = useMemo(
    () => prepareLineData(data),
    [data]
  );

  if (!chartData.length || !series.length) return null;

  return (
    <div>
      <p className="mb-4 text-sm text-text-secondary">
        Raw opening popularity over time for ELO 1500+ games. The highest line shows what
        dominates; the slope shows which openings rise or fall around the AI milestones.
      </p>

      <div className="w-full min-w-[18rem] h-[360px] sm:h-[420px] lg:h-[470px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 18, right: 22, left: 0, bottom: 18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3D3B38" />
            <XAxis
              dataKey="year"
              type="number"
              domain={['dataMin', 'dataMax']}
              ticks={[2013, 2014, 2015, 2016, 2017, 2018, 2020, 2021, 2024]}
              allowDecimals={false}
              tick={{ fill: '#a8aab8', fontSize: 12 }}
              axisLine={{ stroke: '#3D3B38' }}
              tickLine={{ stroke: '#3D3B38' }}
              label={{ value: 'Year', position: 'insideBottom', offset: -5, fill: '#6b6d7b' }}
            />
            <YAxis
              domain={[0, (max) => Math.ceil(max + 2)]}
              tick={{ fill: '#a8aab8', fontSize: 12 }}
              axisLine={{ stroke: '#3D3B38' }}
              tickLine={{ stroke: '#3D3B38' }}
              tickFormatter={(value) => `${value}%`}
              label={{ value: 'Popularity (%)', angle: -90, position: 'insideLeft', fill: '#6b6d7b' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              x={2017}
              stroke="#e2e8f0"
              strokeOpacity={0.7}
              strokeDasharray="5 5"
              label={{ value: 'AlphaZero 2017', position: 'insideTop', fill: '#e2e8f0', fontSize: 11 }}
            />
            <ReferenceLine
              x={2020}
              stroke="#fbbf24"
              strokeOpacity={0.85}
              strokeDasharray="5 5"
              label={{ value: 'NNUE 2020', position: 'insideTop', fill: '#fbbf24', fontSize: 11 }}
            />
            <Legend
              verticalAlign="top"
              height={52}
              wrapperStyle={{ color: '#a8aab8', fontSize: 12, lineHeight: '18px' }}
            />
            {series.map(({ opening, dataKey, color }) => (
              <Line
                key={dataKey}
                name={opening}
                type="linear"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={opening === ranking[0]?.opening ? 3.5 : 3}
                connectNulls
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={{ r: 4.5, fill: color, stroke: '#1A1A1A', strokeWidth: 1.75 }}
                activeDot={{ r: 7, fill: color, stroke: '#1A1A1A', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2 mt-4">
        {ranking.map((item, index) => {
          const changeText = item.change == null
            ? 'n/a'
            : `${item.change >= 0 ? '+' : ''}${item.change.toFixed(2)} pts`;
          return (
            <div
              key={item.opening}
              className="card-hover border border-border bg-card/40 px-3 py-2"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 shrink-0" style={{ background: item.color }} />
                <span className="text-xs text-text-muted">#{index + 1} in {latestYear}</span>
              </div>
              <div className="text-sm font-semibold text-white leading-tight">{item.opening}</div>
              <div className="text-xs text-text-secondary mt-1 tabular-nums">
                {item.latestPct.toFixed(2)}% · {changeText} since {baselineYear}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
