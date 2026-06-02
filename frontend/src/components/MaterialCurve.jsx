import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const ERA_COLORS = {
  'Pre-AI': '#60a5fa',
  'Early Post-AI': '#c084fc',
  'NNUE Era': '#fbbf24',
  Modern: '#34d399',
};

const PERIOD_ORDER = ['Pre-AI', 'Early Post-AI', 'NNUE Era', 'Modern'];
const POSITIVE = '#34d399';

function prepareSacrificeData(sacrificeData) {
  if (!sacrificeData?.length) return [];

  return PERIOD_ORDER.map((period) => {
    const row = sacrificeData.find((d) => d.period === period);
    return {
      period,
      avgSacrifices: Number(row?.avgSacrifices) || 0,
      color: ERA_COLORS[period],
    };
  });
}

const SacrificeTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;

  return (
    <div
      className="rounded-lg px-4 py-3 shadow-xl border"
      style={{ background: 'rgba(49,46,43,0.95)', borderColor: '#3D3B38' }}
    >
      <p className="text-white font-semibold text-sm mb-1">{label}</p>
      <p className="text-sm text-primary">{Number(value).toFixed(2)} sacrifices/game</p>
    </div>
  );
};

function SacrificeDot({ cx, cy, payload }) {
  if (cx == null || cy == null) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill={payload?.color || POSITIVE}
      stroke="#1A1A1A"
      strokeWidth={2}
    />
  );
}

export default function MaterialCurve({ sacrificeData }) {
  const sacrificeSeries = useMemo(() => prepareSacrificeData(sacrificeData), [sacrificeData]);

  if (!sacrificeSeries.length) return null;

  return (
    <div>
      <div>
        <h3 className="text-lg font-semibold text-white mb-2 font-serif">
          Sacrifice Rate Across Eras
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          Average sacrifices per game for ELO 1500+ players. The connected dots emphasize
          how sacrificial play changes from one era to the next.
        </p>
        <div className="w-full min-w-[18rem] h-[280px] sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sacrificeSeries} margin={{ top: 10, right: 14, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3D3B38" />
              <XAxis
                dataKey="period"
                tick={{ fill: '#a8aab8', fontSize: 12 }}
                axisLine={{ stroke: '#3D3B38' }}
                interval={0}
              />
              <YAxis
                tick={{ fill: '#a8aab8', fontSize: 12 }}
                axisLine={{ stroke: '#3D3B38' }}
                domain={['dataMin - 0.4', 'dataMax + 0.4']}
                label={{ value: 'Sacrifices/game', angle: -90, position: 'insideLeft', fill: '#6b6d7b' }}
              />
              <Tooltip content={<SacrificeTooltip />} />
              <Line
                type="monotone"
                dataKey="avgSacrifices"
                stroke={POSITIVE}
                strokeWidth={3}
                dot={<SacrificeDot />}
                activeDot={{ r: 8, stroke: '#1A1A1A', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
