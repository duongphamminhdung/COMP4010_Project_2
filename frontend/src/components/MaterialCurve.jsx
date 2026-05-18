import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
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
          {p.dataKey}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function MaterialCurve({ curveData, sacrificeData }) {
  const periods = ['Pre-AI', 'Early Post-AI', 'NNUE Era', 'Modern'];

  return (
    <div className="space-y-8">
      {/* Material decay line chart */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Material Decay Over Time</h3>
        <p className="text-sm text-text-muted mb-4">
          Average total material remaining per side as the game progresses.
          Modern games retain material slightly longer, suggesting more positional play.
        </p>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={curveData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3D3B38" />
            <XAxis
              dataKey="ply"
              tick={{ fill: '#A0A0A0', fontSize: 12 }}
              axisLine={{ stroke: '#3D3B38' }}
              label={{ value: 'Ply (half-move)', position: 'insideBottom', offset: -5, fill: '#666' }}
            />
            <YAxis
              tick={{ fill: '#A0A0A0', fontSize: 12 }}
              axisLine={{ stroke: '#3D3B38' }}
              domain={[0, 80]}
              label={{ value: 'Material points', angle: -90, position: 'insideLeft', fill: '#666' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: 10 }} />
            {periods.map((p) => (
              <Line
                key={p}
                type="monotone"
                dataKey={p}
                stroke={PERIOD_COLORS[p]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sacrifice rate bar chart */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Sacrifice Rate by Period</h3>
        <p className="text-sm text-text-muted mb-4">
          Average intentional sacrifices per game. AI influence has encouraged more
          sacrificial play, especially positional sacrifices like exchange sacs.
        </p>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={sacrificeData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3D3B38" />
            <XAxis
              dataKey="period"
              tick={{ fill: '#A0A0A0', fontSize: 12 }}
              axisLine={{ stroke: '#3D3B38' }}
            />
            <YAxis
              tick={{ fill: '#A0A0A0', fontSize: 12 }}
              axisLine={{ stroke: '#3D3B38' }}
              domain={[0, 2]}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#312E2B', border: '1px solid #3D3B38', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar
              dataKey="avgSacrifices"
              fill="#81B64C"
              radius={[4, 4, 0, 0]}
              opacity={0.9}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
