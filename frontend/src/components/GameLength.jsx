import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { PERIOD_COLORS_BY_LABEL } from '../data/constants';

const PERIOD_COLORS = PERIOD_COLORS_BY_LABEL;

const PERIOD_ORDER = ['Pre-AI', 'Early Post-AI', 'NNUE Era', 'Modern'];
const PLY_MIN = 7;
const PLY_MAX = 178;

function nicePercentCeiling(value) {
  return Math.max(1, Math.ceil(value * 4) / 4);
}

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

    const chartData = prepared
      .filter((row) => row.ply >= PLY_MIN && row.ply <= PLY_MAX)
      .map((row) => ({
        ...row,
        count: total > 0 ? (row.count / total) * 100 : 0,
      }));

    return {
      chartData,
      summaries: [],
      yMax: nicePercentCeiling(Math.max(...chartData.map((row) => row.count), 0)),
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

  const chartData = prepared
    .filter((row) => row.ply >= PLY_MIN && row.ply <= PLY_MAX)
    .map((row) => {
      const normalized = { ply: row.ply };
      for (const period of PERIOD_ORDER) {
        normalized[period] = totals[period] > 0
          ? (row[period] / totals[period]) * 100
          : 0;
      }
      return normalized;
    });
  const yMax = nicePercentCeiling(
    Math.max(
      ...chartData.flatMap((row) => PERIOD_ORDER.map((period) => row[period] ?? 0)),
      0
    )
  );

  return {
    chartData,
    summaries: PERIOD_ORDER.map((period) => ({
      period,
      medianPly: weightedMedian(prepared, period),
      total: totals[period],
    })),
    yMax,
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
  const [selectedPeriods, setSelectedPeriods] = useState(() => [...PERIOD_ORDER]);
  const { chartData, summaries, multiEra, yMax } = useMemo(() => {
    const prepared = prepareGameLengthData(data);
    return {
      ...prepared,
      multiEra: prepared.chartData.length > 0 && isWideFormat(data),
    };
  }, [data]);

  if (!chartData.length) return null;

  const handleCardClick = (period) => {
    setSelectedPeriods((previous) => {
      if (previous.includes(period)) {
        return previous.length === 1
          ? previous
          : previous.filter((selected) => selected !== period);
      }
      return PERIOD_ORDER.filter(
        (candidate) => previous.includes(candidate) || candidate === period
      );
    });
  };

  const visiblePeriods = selectedPeriods;

  return (
    <div>
      <p className="text-sm text-text-secondary mb-4">
        Percentage of games ending at each length, normalized within each era. This makes
        distribution shifts comparable even when sample sizes differ. Select one or more
        era cards to control the visible lines.
      </p>

      {summaries.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-5">
          {summaries.map(({ period, medianPly, total }) => {
            const baseMedian = summaries[0]?.medianPly ?? medianPly;
            const deltaMoves = (medianPly - baseMedian) / 2;
            const isBaseline = period === PERIOD_ORDER[0];
            const isSelected = selectedPeriods.includes(period);
            return (
              <button
                key={period}
                type="button"
                onClick={() => handleCardClick(period)}
                aria-pressed={isSelected}
                className="rounded-lg border border-l-4 px-3 py-2 text-left transition-all duration-200"
                style={{
                  borderColor: isSelected ? PERIOD_COLORS[period] : '#2a3040',
                  borderLeftColor: PERIOD_COLORS[period],
                  background: isSelected
                    ? `${PERIOD_COLORS[period]}18`
                    : 'rgba(49,46,43,0.25)',
                  opacity: isSelected ? 1 : 0.38,
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-2 h-2 rounded-full shrink-0"
                    style={{ background: PERIOD_COLORS[period] }}
                  />
                  <div className="text-xs font-medium" style={{ color: PERIOD_COLORS[period] }}>
                    {period}
                  </div>
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
                      {deltaMoves > 0 ? '+' : ''}{deltaMoves.toFixed(1)} vs Pre-AI
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">
                  {total.toLocaleString()} games
                </div>
              </button>
            );
          })}
        </div>
      )}

      <ResponsiveContainer width="100%" height={420}>
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
            domain={[0, yMax]}
            tick={{ fill: '#a8aab8', fontSize: 12 }}
            axisLine={{ stroke: '#2a3040' }}
            tickFormatter={(v) => `${v}%`}
            label={{ value: 'Games ending (%)', angle: -90, position: 'insideLeft', fill: '#6b6d7b' }}
          />
          <Tooltip content={<CustomTooltip />} />
          {multiEra ? (
            <>
              {visiblePeriods.map((p) => (
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
