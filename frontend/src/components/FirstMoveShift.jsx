import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const COLORS = {
  e4: '#e74c3c',
  d4: '#3498db',
  c4: '#81B64C',
  Nf3: '#f39c12',
  other: '#9b59b6',
};

const MOVE_LABELS = {
  e4: '1. e4',
  d4: '1. d4',
  c4: '1. c4',
  Nf3: '1. Nf3',
  other: 'Other',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-4 py-3 shadow-xl">
      <p className="text-white font-semibold text-sm mb-2">{label?.replace('\n', ' ')}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-sm" style={{ color: p.color }}>
          {MOVE_LABELS[p.dataKey] || p.dataKey}: {p.value}%
        </p>
      ))}
    </div>
  );
};

export default function FirstMoveShift({ data }) {
  const moveKeys = ['e4', 'd4', 'c4', 'Nf3', 'other'];

  return (
    <div>
      <div className="mb-4 text-sm text-text-muted">
        Click on legend items to toggle visibility. Hover over bars for details.
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3D3B38" />
          <XAxis
            dataKey="period"
            tick={{ fill: '#A0A0A0', fontSize: 12 }}
            axisLine={{ stroke: '#3D3B38' }}
            tickLine={{ stroke: '#3D3B38' }}
          />
          <YAxis
            tick={{ fill: '#A0A0A0', fontSize: 12 }}
            axisLine={{ stroke: '#3D3B38' }}
            tickLine={{ stroke: '#3D3B38' }}
            domain={[0, 60]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => MOVE_LABELS[value] || value}
            wrapperStyle={{ paddingTop: 20 }}
          />
          {moveKeys.map((key) => (
            <Bar
              key={key}
              dataKey={key}
              fill={COLORS[key]}
              radius={[3, 3, 0, 0]}
              opacity={0.9}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* AI milestone annotation */}
      <div className="flex items-center gap-3 mt-4 p-3 bg-card rounded-lg border border-border">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <p className="text-sm text-text-secondary">
          <span className="text-white font-semibold">AlphaZero (2017)</span> debuted
          with 1. e4 in its first games but also popularized less traditional first moves.
          Since then, e4 has declined from 55% to 48% of all games.
        </p>
      </div>
    </div>
  );
}
