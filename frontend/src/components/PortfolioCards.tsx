// ============================================================================
// SECTION: Portfolio Cards — Fund Manager Dashboard
// ============================================================================

import { ASSET_COLORS, displaySymbol } from '../types';
import type { AgentMeta } from '../agentMeta';
import AgentIcon from './AgentIcon';

interface Props {
  pnlHistory: Record<string, number[]>;
  positionHistory: Record<string, Record<string, number[]>>;
  priceHistories: Record<string, number[]>;
  currentTick: number;
  agentMeta: Record<string, AgentMeta>;
  assets: string[];
}

const INITIAL_CASH = 100_000;

export default function PortfolioCards({
  pnlHistory,
  positionHistory,
  priceHistories,
  currentTick,
  agentMeta,
  assets,
}: Props) {
  const agents = Object.keys(pnlHistory);
  if (agents.length === 0) return null;

  // ── Compute portfolio data for each agent ──────────────────────────────
  const portfolios = agents.map((agent) => {
    const meta = agentMeta[agent] ?? { color: '#888', city: 'Unknown', icon: '🤖', abbr: '???', prompt: '' };
    const pnl = pnlHistory[agent]?.[currentTick] ?? 0;

    // Per-asset holdings & values
    const holdings = assets.map((symbol) => {
      const pos = positionHistory[agent]?.[symbol]?.[currentTick] ?? 0;
      const price = priceHistories[symbol]?.[currentTick] ?? 0;
      const value = pos * price;
      return { symbol, pos, price, value };
    });

    const totalHoldingsValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const totalPortfolioValue = INITIAL_CASH + pnl;
    const cashRemaining = totalPortfolioValue - totalHoldingsValue;
    const returnPct = (pnl / INITIAL_CASH) * 100;

    // PnL sparkline
    const pnlSlice = pnlHistory[agent]?.slice(0, currentTick + 1) ?? [];
    const maxPnl = Math.max(1, ...pnlSlice.map(Math.abs));
    const sparkPoints = pnlSlice
      .slice(-40)
      .map((v, i, arr) => {
        const x = (i / Math.max(1, arr.length - 1)) * 100;
        const y = 50 - (v / maxPnl) * 45;
        return `${x},${y}`;
      })
      .join(' ');

    // Allocation breakdown (absolute values for sizing)
    const totalAbsExposure = holdings.reduce((sum, h) => sum + Math.abs(h.value), 0) + Math.abs(cashRemaining);

    return {
      agent,
      meta,
      pnl,
      holdings,
      totalHoldingsValue,
      totalPortfolioValue,
      cashRemaining,
      returnPct,
      sparkPoints,
      pnlSlice,
      totalAbsExposure,
    };
  });

  // Rank by PnL
  const sorted = [...portfolios].sort((a, b) => b.pnl - a.pnl);
  const rankMap = new Map(sorted.map((p, i) => [p.agent, i + 1]));

  return (
    <div className={`grid gap-3 grid-cols-1 sm:grid-cols-2 ${agents.length === 3 ? 'lg:grid-cols-3' : agents.length >= 4 ? 'lg:grid-cols-4' : ''}`}>
      {portfolios.map((p) => {
        const rank = rankMap.get(p.agent) ?? 0;
        const isUp = p.pnl >= 0;
        const isLeader = rank === 1 && p.pnl !== 0;

        return (
          <div
            key={p.agent}
            className={`bg-[#0d0d14] rounded-xl border p-4 font-mono relative overflow-hidden transition-all ${
              isLeader
                ? 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.05)]'
                : 'border-[#1a1a2a]'
            }`}
          >
            {/* Rank badge */}
            <div
              className="absolute top-0 right-0 w-8 h-8 flex items-end justify-start pl-1.5 pb-0.5"
              style={{
                background: `linear-gradient(135deg, transparent 50%, ${
                  rank === 1 ? 'rgba(16,185,129,0.15)' : 'rgba(30,30,42,0.5)'
                } 50%)`,
              }}
            >
              <span className={`text-[9px] font-bold ${rank === 1 ? 'text-emerald-400' : 'text-gray-600'}`}>
                #{rank}
              </span>
            </div>

            {/* ── Agent Header ──────────────────────────────────────────── */}
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: p.meta.color + '18', border: `1px solid ${p.meta.color}30` }}
              >
                <AgentIcon icon={p.meta.icon} size={18} color={p.meta.color} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-white truncate">
                    {p.agent}
                  </span>
                </div>
                <span className="text-[9px] text-gray-600 block">{p.meta.city}</span>
              </div>
            </div>

            {/* ── Portfolio Value ───────────────────────────────────────── */}
            <div className="mb-3">
              <div className="text-[9px] text-gray-600 mb-0.5 uppercase">Portfolio Value</div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-white">
                  ${p.totalPortfolioValue >= 1000
                    ? `${(p.totalPortfolioValue / 1000).toFixed(1)}k`
                    : p.totalPortfolioValue.toFixed(0)}
                </span>
                <span className={`text-[11px] font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isUp ? '+' : ''}{p.returnPct.toFixed(2)}%
                </span>
              </div>
              <div className={`text-[10px] font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {isUp ? '+' : ''}${p.pnl.toFixed(0)} P&L
              </div>
            </div>

            {/* ── PnL Sparkline ─────────────────────────────────────────── */}
            <div className="mb-3">
              <svg viewBox="0 0 100 60" className="w-full h-8" preserveAspectRatio="none">
                {/* Zero line */}
                <line x1="0" y1="50" x2="100" y2="50" stroke="#1a1a2a" strokeWidth="0.5" />
                {/* Fill area */}
                {p.sparkPoints.length > 3 && (
                  <>
                    <defs>
                      <linearGradient id={`grad-${p.agent}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polygon
                      points={`0,50 ${p.sparkPoints} 100,50`}
                      fill={`url(#grad-${p.agent})`}
                    />
                    <polyline
                      points={p.sparkPoints}
                      fill="none"
                      stroke={isUp ? '#10b981' : '#ef4444'}
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </>
                )}
              </svg>
            </div>

            {/* ── Allocation Donut ──────────────────────────────────────── */}
            <div className="mb-3">
              <div className="text-[9px] text-gray-600 mb-1.5 uppercase">Allocation</div>
              <div className="flex items-center gap-3">
                {/* SVG Donut */}
                <svg viewBox="0 0 36 36" className="w-16 h-16 shrink-0">
                  {/* Background circle */}
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#1a1a2a" strokeWidth="5" />
                  {/* Asset segments */}
                  {(() => {
                    let offset = 0;
                    const segments: React.ReactNode[] = [];
                    const total = p.totalAbsExposure;
                    if (total > 0) {
                      p.holdings.forEach((h) => {
                        const pct = (Math.abs(h.value) / total) * 100;
                        if (pct < 0.5) return;
                        const dashArray = `${pct * 0.88} ${88 - pct * 0.88}`;
                        segments.push(
                          <circle
                            key={h.symbol}
                            cx="18" cy="18" r="14"
                            fill="none"
                            stroke={ASSET_COLORS[h.symbol] ?? '#666'}
                            strokeWidth="5"
                            strokeDasharray={dashArray}
                            strokeDashoffset={-offset * 0.88}
                            strokeLinecap="round"
                            opacity={h.pos < 0 ? 0.5 : 0.85}
                            transform="rotate(-90 18 18)"
                          />
                        );
                        offset += pct;
                      });
                      // Cash segment
                      const cashPct = (Math.abs(p.cashRemaining) / total) * 100;
                      if (cashPct > 0.5) {
                        segments.push(
                          <circle
                            key="cash"
                            cx="18" cy="18" r="14"
                            fill="none"
                            stroke="#4a4a5a"
                            strokeWidth="5"
                            strokeDasharray={`${cashPct * 0.88} ${88 - cashPct * 0.88}`}
                            strokeDashoffset={-offset * 0.88}
                            strokeLinecap="round"
                            opacity={0.4}
                            transform="rotate(-90 18 18)"
                          />
                        );
                      }
                    }
                    return segments;
                  })()}
                  {/* Center text — return % */}
                  <text x="18" y="17" textAnchor="middle" fontSize="5" fontWeight="bold" fontFamily="monospace"
                    fill={isUp ? '#10b981' : '#ef4444'}>
                    {isUp ? '+' : ''}{p.returnPct.toFixed(1)}%
                  </text>
                  <text x="18" y="22" textAnchor="middle" fontSize="3" fill="#666" fontFamily="monospace">
                    return
                  </text>
                </svg>
                {/* Legend */}
                <div className="flex-1 space-y-0.5">
                  {p.holdings.map((h) => {
                    const pct = p.totalAbsExposure > 0 ? (Math.abs(h.value) / p.totalAbsExposure) * 100 : 0;
                    if (pct < 0.5) return null;
                    return (
                      <div key={h.symbol} className="flex items-center justify-between text-[8px]">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ASSET_COLORS[h.symbol] }} />
                          <span style={{ color: ASSET_COLORS[h.symbol] }}>{displaySymbol(h.symbol)}</span>
                        </div>
                        <span className="text-gray-500">{pct.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between text-[8px]">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                      <span className="text-gray-500">Cash</span>
                    </div>
                    <span className="text-gray-500">
                      {p.totalAbsExposure > 0 ? ((Math.abs(p.cashRemaining) / p.totalAbsExposure) * 100).toFixed(0) : '100'}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Holdings Table ────────────────────────────────────────── */}
            <div className="space-y-1">
              {p.holdings.map((h) => {
                const pctOfPortfolio = p.totalPortfolioValue > 0
                  ? (h.value / p.totalPortfolioValue) * 100
                  : 0;

                return (
                  <div key={h.symbol} className="flex items-center justify-between text-[9px]">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: ASSET_COLORS[h.symbol] }}
                      />
                      <span style={{ color: ASSET_COLORS[h.symbol] }}>{displaySymbol(h.symbol)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`${h.pos > 0 ? 'text-emerald-400' : h.pos < 0 ? 'text-red-400' : 'text-gray-600'}`}>
                        {h.pos > 0 ? '+' : ''}{h.pos}
                      </span>
                      <span className="text-gray-500 w-14 text-right">
                        ${Math.abs(h.value) >= 1000 ? `${(h.value / 1000).toFixed(1)}k` : h.value.toFixed(0)}
                      </span>
                      <span className="text-gray-600 w-10 text-right">
                        {pctOfPortfolio.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
              {/* Cash row */}
              <div className="flex items-center justify-between text-[9px] pt-1 border-t border-[#1a1a2a]">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                  <span className="text-gray-500">CASH</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">
                    ${Math.abs(p.cashRemaining) >= 1000
                      ? `${(p.cashRemaining / 1000).toFixed(1)}k`
                      : p.cashRemaining.toFixed(0)}
                  </span>
                  <span className="text-gray-600 w-10 text-right">
                    {p.totalPortfolioValue > 0
                      ? ((p.cashRemaining / p.totalPortfolioValue) * 100).toFixed(1)
                      : '100.0'}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
