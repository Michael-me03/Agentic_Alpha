import { ASSET_COLORS, displaySymbol } from '../types';
import type { AgentMeta } from '../agentMeta';

interface Props {
  positionHistory: Record<string, Record<string, number[]>>;
  pnlHistory: Record<string, number[]>;
  currentTick: number;
  agentMeta: Record<string, AgentMeta>;
  assets: string[];
}

export default function AgentPositions({ positionHistory, pnlHistory, currentTick, agentMeta, assets }: Props) {
  const agents = Object.keys(positionHistory);

  return (
    <div className="bg-[#0d0d14] rounded-lg border border-[#1a1a2a] font-mono h-full flex flex-col">
      <div className="px-3 py-2 border-b border-[#1a1a2a]">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          Positions
        </span>
      </div>
      <div className="flex-1 px-2 py-1 space-y-2 overflow-y-auto">
        {agents.map((agent) => {
          const meta = agentMeta[agent] ?? { color: '#888', abbr: '???', icon: '🤖', city: 'Unknown', prompt: '' };
          const pnl = pnlHistory[agent]?.[currentTick] ?? 0;
          const isUp = pnl >= 0;

          return (
            <div
              key={agent}
              className="py-1.5 px-1 rounded hover:bg-[#111118]"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="text-[10px] font-bold text-gray-300">
                    {meta.abbr}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  {isUp ? '+' : ''}{pnl.toFixed(0)}
                </span>
              </div>
              {/* Per-asset position bars */}
              {assets.map((symbol) => {
                const pos = positionHistory[agent]?.[symbol]?.[currentTick] ?? 0;
                const maxPos = Math.max(
                  1,
                  ...agents.flatMap((a) =>
                    assets.map((s) =>
                      Math.abs(positionHistory[a]?.[s]?.[currentTick] ?? 0)
                    )
                  )
                );
                const barWidth = Math.abs(pos) / maxPos;
                const isLong = pos > 0;

                return (
                  <div key={symbol} className="flex items-center gap-1 mb-0.5">
                    <span className="text-[8px] w-6" style={{ color: ASSET_COLORS[symbol] }}>
                      {displaySymbol(symbol)}
                    </span>
                    <div className="flex-1 h-1 bg-[#1a1a2a] rounded-full overflow-hidden relative">
                      <div
                        className="absolute top-0 h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${barWidth * 50}%`,
                          backgroundColor: isLong ? '#10b981' : pos < 0 ? '#ef4444' : '#333',
                          left: isLong ? '50%' : `${50 - barWidth * 50}%`,
                        }}
                      />
                      <div className="absolute top-0 left-1/2 w-px h-full bg-[#2a2a3a]" />
                    </div>
                    <span className="text-[8px] text-gray-500 w-6 text-right">
                      {pos > 0 ? '+' : ''}{pos}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
