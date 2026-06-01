import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

const PERIOD_COLORS = {
  'Pre-AI': '#4c8bf5',
  'Early Post-AI': '#a78bfa',
  'NNUE Era': '#fb923c',
  'Modern': '#4ade80',
};

const PERIOD_ORDER = ['Pre-AI', 'Early Post-AI', 'NNUE Era', 'Modern'];
const PLY_MIN = 7;
const PLY_MAX = 178;

function isWideFormat(rows) {
  return rows?.length > 0 && PERIOD_ORDER.some((p) => p in rows[0]);
}

function weightedMedian(rows, key) {
  const total = rows.reduce((sum, row) => sum + row[key], 0);
  let cumulative = 0;

  for (const row of rows) {
    cumulative += row[key];
    if (cumulative >= total / 2) return row.ply;
  }

  return 0;
}

function prepareGameLengthData(rows) {
  if (!rows?.length) return { chartData: [], summaries: [] };

  if (!isWideFormat(rows)) {
    const prepared = rows
      .map((row) => ({
        ply: Number(row.ply),
        count: Number(row.count) || 0,
      }))
      .filter((row) => Number.isFinite(row.ply))
      .sort((a, b) => a.ply - b.ply);
    const total = prepared.reduce((sum, row) => sum + row.count, 0);

    return {
      chartData: prepared
        .filter((row) => row.ply >= PLY_MIN && row.ply <= PLY_MAX)
        .map((row) => ({
          ...row,
          count: total > 0 ? (row.count / total) * 100 : 0,
        })),
      summaries: [],
    };
  }

  const prepared = rows
    .map((row) => {
      const out = { ply: Number(row.ply) };
      for (const p of PERIOD_ORDER) {
        const n = Number(row[p]);
        out[p] = Number.isFinite(n) ? n : 0;
      }
      return out;
    })
    .filter((row) => Number.isFinite(row.ply))
    .sort((a, b) => a.ply - b.ply);
  const totals = Object.fromEntries(
    PERIOD_ORDER.map((period) => [
      period,
      prepared.reduce((sum, row) => sum + row[period], 0),
    ])
  );

  return {
    chartData: prepared
      .filter((row) => row.ply >= PLY_MIN && row.ply <= PLY_MAX)
      .map((row) => {
        const normalized = { ply: row.ply };
        for (const period of PERIOD_ORDER) {
          normalized[period] = totals[period] > 0
            ? (row[period] / totals[period]) * 100
            : 0;
        }
        return normalized;
      }),
    summaries: PERIOD_ORDER.map((period) => ({
      period,
      medianPly: weightedMedian(prepared, period),
      total: totals[period],
    })),
  };
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg px-4 py-3 shadow-xl border"
      style={{ background: 'rgba(28,34,51,0.95)', borderColor: '#2a3040' }}>
      <p className="text-white font-semibold text-sm mb-2">Ply {label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-sm" style={{ color: p.color }}>
          {p.dataKey}: {typeof p.value === 'number' ? `${p.value.toFixed(2)}%` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function GameLength({ data }) {
  const { chartData, summaries, multiEra } = useMemo(() => {
    const prepared = prepareGameLengthData(data);
    return {
      ...prepared,
      multiEra: prepared.chartData.length > 0 && isWideFormat(data),
    };
  }, [data]);

  if (!chartData.length) return null;

  return (
    <div>
      <p className="text-sm text-text-secondary mb-4">
        Percentage of games ending at each length, normalized within each era. This makes
        distribution shifts comparable even when sample sizes differ.
      </p>

      {summaries.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-5">
          {summaries.map(({ period, medianPly, total }) => {
            const baseMedian = summaries[0]?.medianPly ?? medianPly;
            const deltaMoves = (medianPly - baseMedian) / 2;
            const isBaseline = period === PERIOD_ORDER[0];
            return (
              <div
                key={period}
                className="rounded-lg border border-border bg-card/40 px-3 py-2"
              >
                <div className="text-xs font-medium" style={{ color: PERIOD_COLORS[period] }}>
                  {period}
                </div>
                <div className="mt-1 text-lg font-bold text-white tabular-nums">
                  {(medianPly / 2).toFixed(1)} moves
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  {isBaseline ? (
                    <span className="text-[11px] text-text-muted">Baseline</span>
                  ) : (
                    <span
                      className="text-[11px] font-semibold tabular-nums"
                      style={{ color: deltaMoves <= 0 ? '#4ade80' : '#f87171' }}
                    >
                      {deltaMoves > 0 ? '+' : ''}{deltaMoves.toFixed(1)} moves vs Pre-AI
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">
                  {total.toLocaleString()} games
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a3040" />
          <XAxis
            dataKey="ply"
            type="number"
            domain={[PLY_MIN, PLY_MAX]}
            allowDataOverflow
            tick={{ fill: '#a8aab8', fontSize: 12 }}
            axisLine={{ stroke: '#2a3040' }}
            label={{ value: 'Ply (half-move)', position: 'insideBottom', offset: -5, fill: '#6b6d7b' }}
          />
          <YAxis
            tick={{ fill: '#a8aab8', fontSize: 12 }}
            axisLine={{ stroke: '#2a3040' }}
            tickFormatter={(v) => `${v}%`}
            label={{ value: 'Games ending (%)', angle: -90, position: 'insideLeft', fill: '#6b6d7b' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            x={80}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            label={{ value: 'Move 40', position: 'insideTopRight', fill: '#94a3b8', fontSize: 11 }}
          />
          <ReferenceLine
            x={120}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            label={{ value: 'Move 60', position: 'insideTopRight', fill: '#94a3b8', fontSize: 11 }}
          />
          {multiEra ? (
            <>
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              {PERIOD_ORDER.map((p) => (
                <Area
                  key={p}
                  type="monotone"
                  dataKey={p}
                  stroke={PERIOD_COLORS[p]}
                  fill={PERIOD_COLORS[p]}
                  fillOpacity={0.18}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </>
          ) : (
            <Area
              type="monotone"
              dataKey="count"
              stroke="#4ade80"
              fill="#4ade80"
              fillOpacity={0.18}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
