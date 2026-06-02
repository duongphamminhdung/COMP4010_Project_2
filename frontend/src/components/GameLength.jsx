import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const PERIOD_ORDER = ['Pre-AI', 'Early Post-AI', 'NNUE Era', 'Modern'];
const PLY_MIN = 7;
const PLY_MAX = 178;
const ZOOM_MIN = 70;
const ZOOM_MAX = 130;
const MAIN_LINE = '#34d399';
const ZOOM_LINE = '#fbbf24';
const BOUNDARY = '#e2e8f0';

function isWideFormat(rows) {
  return rows?.length > 0 && PERIOD_ORDER.some((p) => p in rows[0]);
}

function prepareGameLengthData(rows) {
  if (!rows?.length) return [];

  return rows
    .map((row) => {
      const ply = Number(row.ply);
      const count = isWideFormat(rows)
        ? PERIOD_ORDER.reduce((sum, p) => sum + (Number(row[p]) || 0), 0)
        : Number(row.count) || 0;

      return { ply, count };
    })
    .filter((row) => Number.isFinite(row.ply) && row.ply >= PLY_MIN && row.ply <= PLY_MAX)
    .sort((a, b) => a.ply - b.ply);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;

  return (
    <div
      className="rounded-lg px-4 py-3 shadow-xl border"
      style={{ background: 'rgba(49,46,43,0.95)', borderColor: '#3D3B38' }}
    >
      <p className="text-white font-semibold text-sm mb-1">Ply {label}</p>
      <p className="text-sm text-primary">{Number(value).toLocaleString()} games</p>
    </div>
  );
};

function TimeControlLine({ x }) {
  return (
    <ReferenceLine
      x={x}
      stroke={BOUNDARY}
      strokeOpacity={0.72}
      strokeDasharray="5 5"
      label={{
        value: `Ply ${x}`,
        position: 'top',
        fill: '#a8aab8',
        fontSize: 11,
      }}
    />
  );
}

export default function GameLength({ data }) {
  const { chartData, zoomData } = useMemo(() => {
    const prepared = prepareGameLengthData(data);
    return {
      chartData: prepared,
      zoomData: prepared.filter((row) => row.ply >= ZOOM_MIN && row.ply <= ZOOM_MAX),
    };
  }, [data]);

  if (!chartData.length) return null;

  return (
    <div className="space-y-7">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2 font-serif">
          Game Length Distribution
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          A single bright line keeps attention on the distribution shape. The vertical markers
          highlight common time-control boundaries at ply 80 and 120.
        </p>
        <div className="w-full min-w-[18rem] h-[280px] sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 18, right: 14, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3D3B38" />
            <XAxis
              dataKey="ply"
              type="number"
              domain={[PLY_MIN, PLY_MAX]}
              allowDataOverflow
              tick={{ fill: '#a8aab8', fontSize: 12 }}
              axisLine={{ stroke: '#3D3B38' }}
              label={{ value: 'Ply (half-move)', position: 'insideBottom', offset: -5, fill: '#6b6d7b' }}
            />
            <YAxis
              tick={{ fill: '#a8aab8', fontSize: 12 }}
              axisLine={{ stroke: '#3D3B38' }}
              allowDecimals={false}
              tickFormatter={(v) => v.toLocaleString()}
              label={{ value: 'Games', angle: -90, position: 'insideLeft', fill: '#6b6d7b' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <TimeControlLine x={80} />
            <TimeControlLine x={120} />
            <Line
              type="linear"
              dataKey="count"
              stroke={MAIN_LINE}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: MAIN_LINE, stroke: '#1A1A1A', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
        </div>
      </div>

      <div
        className="rounded-lg border border-border p-4"
        style={{ background: 'rgba(26,26,26,0.35)' }}
      >
        <h3 className="text-sm font-semibold text-white mb-1 font-serif">
          Zoom: Comb Pattern Region
        </h3>
        <p className="text-xs text-text-secondary mb-3">
          Ply 70-130 magnifies the spikes around move 40 and move 60.
        </p>
        <div className="w-full min-w-[18rem] h-[200px] sm:h-[210px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={zoomData} margin={{ top: 18, right: 14, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3D3B38" />
            <XAxis
              dataKey="ply"
              type="number"
              domain={[ZOOM_MIN, ZOOM_MAX]}
              allowDataOverflow
              tick={{ fill: '#a8aab8', fontSize: 11 }}
              axisLine={{ stroke: '#3D3B38' }}
            />
            <YAxis
              tick={{ fill: '#a8aab8', fontSize: 11 }}
              axisLine={{ stroke: '#3D3B38' }}
              allowDecimals={false}
              width={46}
              tickFormatter={(v) => v.toLocaleString()}
            />
            <Tooltip content={<CustomTooltip />} />
            <TimeControlLine x={80} />
            <TimeControlLine x={120} />
            <Line
              type="linear"
              dataKey="count"
              stroke={ZOOM_LINE}
              strokeWidth={2.75}
              dot={false}
              activeDot={{ r: 5, fill: ZOOM_LINE, stroke: '#1A1A1A', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
