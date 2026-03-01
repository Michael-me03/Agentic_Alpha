import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
interface Props {
  pnlHistory: Record<string, number[]>;
  priceHistories?: Record<string, number[]>;
  currentTick: number;
  historyTicks?: number;
  agentColors: Record<string, string>;
  assets: string[];
}

export default function PnLChart({ pnlHistory, priceHistories, currentTick, historyTicks = 0, agentColors, assets }: Props) {
  const agents = Object.keys(pnlHistory);
  if (agents.length === 0) return null;

  const totalTicks = Math.max(...agents.map((a) => pnlHistory[a].length)) - 1;

  // Compute benchmark: equal-weight buy & hold from simulation start
  const benchmarkPnl: (number | null)[] = [];
  if (priceHistories && historyTicks > 0) {
    const startPrices: Record<string, number> = {};
    for (const s of assets) {
      startPrices[s] = priceHistories[s]?.[historyTicks] ?? priceHistories[s]?.[0] ?? 1;
    }
    const allocPerAsset = 100000 / assets.length;

    for (let i = 0; i <= totalTicks; i++) {
      if (i <= currentTick) {
        if (i <= historyTicks) {
          benchmarkPnl.push(0);
        } else {
          let totalReturn = 0;
          for (const s of assets) {
            const currentP = priceHistories[s]?.[i] ?? startPrices[s];
            const startP = startPrices[s];
            totalReturn += allocPerAsset * ((currentP - startP) / startP);
          }
          benchmarkPnl.push(Number(totalReturn.toFixed(2)));
        }
      } else {
        benchmarkPnl.push(null);
      }
    }
  }

  const data = Array.from({ length: totalTicks + 1 }, (_, i) => {
    const point: Record<string, number | null> = { tick: i };
    for (const agent of agents) {
      point[agent] = i <= currentTick ? (pnlHistory[agent]?.[i] ?? 0) : null;
    }
    if (benchmarkPnl.length > 0) {
      point['Benchmark'] = benchmarkPnl[i] ?? null;
    }
    return point;
  });

  const colors: Record<string, string> = { ...agentColors, Benchmark: '#3b82f6' };
  const allLines = benchmarkPnl.length > 0 ? [...agents, 'Benchmark'] : agents;

  return (
    <div className="bg-[#111118] rounded-xl p-5 border border-[#1e1e2e]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">
          Agent PnL vs Benchmark
        </h2>
        {benchmarkPnl.length > 0 && (
          <span className="text-[9px] text-blue-500 font-mono">
            Benchmark = Equal-Weight Buy & Hold
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
          <XAxis
            dataKey="tick"
            stroke="#4a4a5a"
            tick={{ fontSize: 9, fill: '#4a4a5a' }}
            tickLine={false}
            domain={[0, totalTicks]}
            type="number"
          />
          <YAxis
            stroke="#4a4a5a"
            tick={{ fontSize: 9, fill: '#4a4a5a' }}
            tickLine={false}
            tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a2e',
              border: '1px solid #2a2a3e',
              borderRadius: '6px',
              fontSize: '11px',
              fontFamily: 'monospace',
            }}
            labelFormatter={(label: number) => {
              if (label <= historyTicks) return `History t-${historyTicks - label}`;
              return `Sim t=${label - historyTicks}`;
            }}
            formatter={(value: number | null, name: string) => [
              value != null ? `$${value.toFixed(2)}` : '—',
              name,
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }}
          />
          <ReferenceLine y={0} stroke="#4a4a5a" strokeDasharray="3 3" />
          {allLines.map((name) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={colors[name] ?? '#888'}
              strokeWidth={name === 'Benchmark' ? 2.5 : 1.5}
              strokeDasharray={name === 'Benchmark' ? '6 3' : undefined}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
