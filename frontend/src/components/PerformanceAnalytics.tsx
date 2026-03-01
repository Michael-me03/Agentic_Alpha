import type { AgentSnapshot, EventRecord } from '../types';
import { ASSET_COLORS, displaySymbol } from '../types';
import type { AgentMeta } from '../agentMeta';
import AgentIcon from './AgentIcon';

interface Props {
  agents: AgentSnapshot[];
  events: EventRecord[];
  pnlHistory: Record<string, number[]>;
  priceHistories: Record<string, number[]>;
  currentTick: number;
  historyTicks: number;
  agentMeta: Record<string, AgentMeta>;
  assets: string[];
}

export default function PerformanceAnalytics({
  agents,
  events,
  pnlHistory,
  priceHistories,
  currentTick,
  historyTicks,
  agentMeta,
  assets,
}: Props) {
  if (agents.length === 0 || currentTick <= historyTicks) return null;

  // Compute benchmark return
  let benchmarkReturn = 0;
  for (const s of assets) {
    const startP = priceHistories[s]?.[historyTicks] ?? 1;
    const curP = priceHistories[s]?.[currentTick] ?? startP;
    benchmarkReturn += ((curP - startP) / startP) * 100;
  }
  benchmarkReturn /= assets.length;

  // Per-agent stats
  const agentStats = agents.map((agent) => {
    const meta = agentMeta[agent.name] ?? { color: '#888', icon: '🤖', abbr: '???', city: 'Unknown', prompt: '' };
    const pnlArr = pnlHistory[agent.name]?.slice(historyTicks, currentTick + 1) ?? [];

    // Trade count
    const agentEvents = events.filter(
      (e) => e.agent_name === agent.name && (e.action === 'BUY' || e.action === 'SELL')
    );
    const buys = agentEvents.filter((e) => e.action === 'BUY').length;
    const sells = agentEvents.filter((e) => e.action === 'SELL').length;
    const totalTrades = buys + sells;

    // Max drawdown
    let peak = 0;
    let maxDrawdown = 0;
    for (const pnl of pnlArr) {
      if (pnl > peak) peak = pnl;
      const dd = peak - pnl;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    // Win rate (ticks where PnL improved)
    let wins = 0;
    for (let i = 1; i < pnlArr.length; i++) {
      if (pnlArr[i] > pnlArr[i - 1]) wins++;
    }
    const winRate = pnlArr.length > 1 ? (wins / (pnlArr.length - 1)) * 100 : 0;

    // Sharpe approximation (annualized using daily returns)
    const returns: number[] = [];
    for (let i = 1; i < pnlArr.length; i++) {
      returns.push(pnlArr[i] - pnlArr[i - 1]);
    }
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const stdReturn = returns.length > 1
      ? Math.sqrt(returns.map((r) => (r - avgReturn) ** 2).reduce((a, b) => a + b, 0) / returns.length)
      : 1;
    const sharpe = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0;

    // Portfolio return %
    const portfolioReturn = (agent.pnl / 100000) * 100;

    // Alpha vs benchmark
    const alpha = portfolioReturn - benchmarkReturn;

    return {
      ...agent,
      meta,
      buys,
      sells,
      totalTrades,
      maxDrawdown,
      winRate,
      sharpe,
      portfolioReturn,
      alpha,
    };
  });

  // Sort by PnL descending
  agentStats.sort((a, b) => b.pnl - a.pnl);

  return (
    <div className="bg-[#111118] rounded-xl p-5 border border-[#1e1e2e]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">
          Performance Analytics
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-blue-400 font-mono">
            Benchmark: {benchmarkReturn >= 0 ? '+' : ''}{benchmarkReturn.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {agentStats.map((agent, rank) => {
          const isWinner = rank === 0;
          const beatsMarket = agent.alpha > 0;

          return (
            <div
              key={agent.name}
              className={`rounded-lg border p-3 font-mono ${
                isWinner
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-[#1e1e2e] bg-[#0d0d14]'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <AgentIcon icon={agent.meta.icon} size={18} color={agent.meta.color} />
                  <div>
                    <span className="text-[11px] font-bold text-white block">
                      {agent.name}
                    </span>
                    <span className="text-[8px] text-gray-600">
                      {agent.meta.city}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  {isWinner && (
                    <span className="text-[8px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded font-bold">
                      #1
                    </span>
                  )}
                </div>
              </div>

              {/* PnL & Return */}
              <div className="mb-3">
                <div className={`text-lg font-bold ${agent.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {agent.pnl >= 0 ? '+' : ''}${agent.pnl.toFixed(0)}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-bold ${agent.portfolioReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {agent.portfolioReturn >= 0 ? '+' : ''}{agent.portfolioReturn.toFixed(2)}%
                  </span>
                  <span className={`text-[9px] px-1 rounded ${beatsMarket ? 'text-blue-400 bg-blue-400/10' : 'text-gray-600 bg-gray-600/10'}`}>
                    {beatsMarket ? 'a +' : 'a '}{agent.alpha.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="space-y-1.5 text-[9px]">
                <div className="flex justify-between">
                  <span className="text-gray-600">Trades</span>
                  <span className="text-gray-300">
                    {agent.totalTrades} ({agent.buys}B/{agent.sells}S)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Win Rate</span>
                  <span className={agent.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}>
                    {agent.winRate.toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sharpe</span>
                  <span className={agent.sharpe >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {agent.sharpe.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max DD</span>
                  <span className="text-red-400">
                    -${agent.maxDrawdown.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cash</span>
                  <span className="text-gray-300">
                    ${agent.cash >= 0 ? '+' : ''}{(agent.cash / 1000).toFixed(1)}k
                  </span>
                </div>
              </div>

              {/* Holdings */}
              <div className="mt-2 pt-2 border-t border-[#1a1a2a]">
                <span className="text-[8px] text-gray-600 uppercase">Holdings</span>
                <div className="flex gap-2 mt-1">
                  {assets.map((s) => {
                    const pos = agent.positions[s] ?? 0;
                    return (
                      <div key={s} className="flex items-center gap-0.5">
                        <span className="text-[8px]" style={{ color: ASSET_COLORS[s] }}>{displaySymbol(s)}</span>
                        <span className={`text-[9px] font-bold ${pos > 0 ? 'text-emerald-400' : pos < 0 ? 'text-red-400' : 'text-gray-600'}`}>
                          {pos > 0 ? '+' : ''}{pos}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
