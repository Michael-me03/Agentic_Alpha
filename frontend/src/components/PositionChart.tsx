import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';

const AGENT_COLORS: Record<string, string> = {
  Momentum: '#8b5cf6',
  MarketMaker: '#06b6d4',
  RiskController: '#f59e0b',
  Retail: '#ef4444',
};

interface Props {
  positionHistory: Record<string, number[]>;
  currentTick: number;
}

export default function PositionChart({ positionHistory, currentTick }: Props) {
  const agents = Object.keys(positionHistory);

  const data = agents.map((agent) => ({
    name: agent,
    position: positionHistory[agent]?.[currentTick] ?? 0,
  }));

  return (
    <div className="bg-[#111118] rounded-xl p-5 border border-[#1e1e2e]">
      <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
        Current Positions
      </h2>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
          <XAxis
            type="number"
            stroke="#4a4a5a"
            tick={{ fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            stroke="#4a4a5a"
            tick={{ fontSize: 12 }}
            tickLine={false}
            width={110}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a2e',
              border: '1px solid #2a2a3e',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number) => [`${value} units`, 'Position']}
          />
          <ReferenceLine x={0} stroke="#4a4a5a" />
          <Bar dataKey="position" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={AGENT_COLORS[entry.name] ?? '#888'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
