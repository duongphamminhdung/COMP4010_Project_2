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
  'Pre-AI': '#4C8BF5',
  'Early Post-AI': '#7B61FF',
  'NNUE Era': '#F5A623',
  'Modern': '#81B64C',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-4 py-3 shadow-xl">
      <p className="text-white font-semibold text-sm mb-2">Ply {label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-sm" style={{ color: p.color }}>
          {p.dataKey}: {p.value?.toLocaleString()} games
        </p>
      ))}
    </div>
  );
};

export default function GameLength({ data }) {
  const periods = ['Pre-AI', 'Early Post-AI', 'NNUE Era', 'Modern'];

  return (
    <div>
      <div className="mb-4 text-sm text-text-muted">
        Game length distribution across periods. The "comb pattern" shows spikes at time control
        boundaries where games end en masse due to time pressure.
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3D3B38" />
          <XAxis
            dataKey="ply"
            tick={{ fill: '#A0A0A0', fontSize: 12 }}
            axisLine={{ stroke: '#3D3B38' }}
            label={{ value: 'Game Length (ply)', position: 'insideBottom', offset: -5, fill: '#666' }}
          />
          <YAxis
            tick={{ fill: '#A0A0A0', fontSize: 12 }}
            axisLine={{ stroke: '#3D3B38' }}
            label={{ value: 'Games', angle: -90, position: 'insideLeft', fill: '#666' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 10 }} />
          {periods.map((p) => (
            <Area
              key={p}
              type="monotone"
              dataKey={p}
              stroke={PERIOD_COLORS[p]}
              fill={PERIOD_COLORS[p]}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
          {/* Time control boundary lines */}
          <ReferenceLine x={80} stroke="#666" strokeDasharray="5 5" label={{ value: 'Move 40', fill: '#666', fontSize: 11 }} />
          <ReferenceLine x={120} stroke="#666" strokeDasharray="5 5" label={{ value: 'Move 60', fill: '#666', fontSize: 11 }} />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-3 mt-4 p-3 bg-card rounded-lg border border-border">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <p className="text-sm text-text-secondary">
          The dashed lines mark time control boundaries. Games cluster around these points,
          creating the distinctive "comb pattern" in the distribution.
        </p>
      </div>
    </div>
  );
}
