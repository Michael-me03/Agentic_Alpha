import type { AgentSnapshot } from '../types';

const AGENT_META: Record<string, { color: string; icon: string; role: string }> = {
  Momentum: { color: '#8b5cf6', icon: '📈', role: 'Trend Follower' },
  MarketMaker: { color: '#06b6d4', icon: '🏦', role: 'Liquidity Provider' },
  RiskController: { color: '#f59e0b', icon: '🛡️', role: 'Volatility Guard' },
  Retail: { color: '#ef4444', icon: '🎰', role: 'Noise Trader' },
};

interface Props {
  agents: AgentSnapshot[];
  pnlHistory: Record<string, number[]>;
  currentTick: number;
}

export default function AgentCards({ agents, pnlHistory, currentTick }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {agents.map((agent) => {
        const meta = AGENT_META[agent.name] ?? {
          color: '#888',
          icon: '🤖',
          role: 'Agent',
        };
        const currentPnl = pnlHistory[agent.name]?.[currentTick] ?? agent.pnl;
        const isPositive = currentPnl >= 0;

        return (
          <div
            key={agent.name}
            className="bg-[#111118] rounded-xl p-4 border border-[#1e1e2e] hover:border-[#2e2e4e] transition-colors"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{meta.icon}</span>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {agent.name}
                </h3>
                <p className="text-xs text-gray-500">{meta.role}</p>
              </div>
              <div
                className="ml-auto w-2 h-2 rounded-full"
                style={{ backgroundColor: meta.color }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500 block">Position</span>
                <span
                  className={`font-mono font-semibold ${
                    agent.position > 0
                      ? 'text-emerald-400'
                      : agent.position < 0
                        ? 'text-red-400'
                        : 'text-gray-400'
                  }`}
                >
                  {agent.position > 0 ? '+' : ''}
                  {agent.position}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">PnL</span>
                <span
                  className={`font-mono font-semibold ${
                    isPositive ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {isPositive ? '+' : ''}${currentPnl.toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
