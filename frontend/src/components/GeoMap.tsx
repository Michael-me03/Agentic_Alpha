import { useMemo } from 'react';
import type { EventRecord, AgentConfig } from '../types';
import { ASSET_COLORS } from '../types';

// ── City coordinate mapping for the world map SVG ─────────────────────────
const CITY_COORDS: Record<string, { x: number; y: number }> = {
  'New York':  { x: 250, y: 180 },
  'London':    { x: 460, y: 130 },
  'Zurich':    { x: 520, y: 210 },
  'Tokyo':     { x: 780, y: 185 },
  'Singapore': { x: 720, y: 280 },
  'Hong Kong': { x: 730, y: 230 },
};

const EXCHANGES = [
  { name: 'NYSE', x: 265, y: 200 },
  { name: 'LSE',  x: 462, y: 150 },
  { name: 'SIX',  x: 522, y: 228 },
  { name: 'TSE',  x: 775, y: 205 },
  { name: 'HKEX', x: 730, y: 240 },
];

interface Props {
  events: EventRecord[];
  currentTick: number;
  pnlHistory?: Record<string, number[]>;
  dataIndex?: number;
  agentConfigs: AgentConfig[];
}

function extractAsset(detail: string): string | null {
  const match = detail.match(/^(BTC|ETH|SOL)\s/);
  return match ? match[1] : null;
}

export default function GeoMap({ events, currentTick, pnlHistory, dataIndex, agentConfigs }: Props) {
  // Build agent lookup from dynamic configs
  const agentMap = useMemo(() => {
    const map: Record<string, { name: string; city: string; x: number; y: number; color: string; icon: string }> = {};
    for (const cfg of agentConfigs) {
      const coords = CITY_COORDS[cfg.city] ?? { x: 480, y: 200 };
      map[cfg.name] = {
        name: cfg.name,
        city: cfg.city,
        x: coords.x,
        y: coords.y,
        color: cfg.color,
        icon: cfg.icon,
      };
    }
    return map;
  }, [agentConfigs]);

  const agentNames = useMemo(() => new Set(agentConfigs.map((c) => c.name)), [agentConfigs]);

  const recentTrades = useMemo(() => {
    return events
      .filter(
        (e) =>
          e.tick <= currentTick &&
          e.tick > currentTick - 10 &&
          (e.action === 'BUY' || e.action === 'SELL') &&
          agentNames.has(e.agent_name)
      )
      .slice(-16);
  }, [events, currentTick, agentNames]);

  const getNearestExchange = (ax: number, ay: number) => {
    let nearest = EXCHANGES[0];
    let minDist = Infinity;
    for (const ex of EXCHANGES) {
      const d = Math.hypot(ex.x - ax, ex.y - ay);
      if (d < minDist) { minDist = d; nearest = ex; }
    }
    return nearest;
  };

  const getAgentWealth = (name: string): number => {
    if (!pnlHistory || dataIndex === undefined) return 100000;
    const pnl = pnlHistory[name]?.[dataIndex] ?? 0;
    return 100000 + pnl;
  };

  const allWealth = Object.keys(agentMap).map(getAgentWealth);
  const maxWealth = Math.max(...allWealth, 1);
  const minBubble = 14;
  const maxBubble = 28;

  return (
    <div className="bg-[#0d0d14] rounded-lg border border-[#1a1a2a]">
      <div className="px-3 py-2 border-b border-[#1a1a2a]">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">
          Global Agent Network
        </span>
      </div>
      <svg viewBox="0 0 960 380" className="w-full" style={{ minHeight: '280px' }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#12121e" strokeWidth="0.5" />
          </pattern>
        </defs>

        <rect width="960" height="380" fill="#08080d" />
        <rect width="960" height="380" fill="url(#mapGrid)" />

        {/* Continent outlines */}
        <ellipse cx="250" cy="190" rx="110" ry="75" fill="#0e0e18" stroke="#161628" strokeWidth="0.8" />
        <ellipse cx="270" cy="310" rx="50" ry="60" fill="#0e0e18" stroke="#161628" strokeWidth="0.8" />
        <ellipse cx="490" cy="165" rx="75" ry="60" fill="#0e0e18" stroke="#161628" strokeWidth="0.8" />
        <ellipse cx="510" cy="275" rx="60" ry="70" fill="#0e0e18" stroke="#161628" strokeWidth="0.8" />
        <ellipse cx="700" cy="175" rx="130" ry="70" fill="#0e0e18" stroke="#161628" strokeWidth="0.8" />
        <ellipse cx="770" cy="330" rx="55" ry="35" fill="#0e0e18" stroke="#161628" strokeWidth="0.8" />

        {/* Exchange backbone */}
        {EXCHANGES.map((ex, i) =>
          EXCHANGES.slice(i + 1).map((ex2) => (
            <line key={`${ex.name}-${ex2.name}`}
              x1={ex.x} y1={ex.y} x2={ex2.x} y2={ex2.y}
              stroke="#141428" strokeWidth="0.5" strokeDasharray="4 8" />
          ))
        )}

        {/* Trade connections — colored by asset */}
        {recentTrades.map((trade, i) => {
          const agent = agentMap[trade.agent_name];
          if (!agent) return null;
          const exchange = getNearestExchange(agent.x, agent.y);
          const asset = extractAsset(trade.detail);
          const connectionColor = asset ? (ASSET_COLORS[asset] ?? '#666') : (trade.action === 'BUY' ? '#10b981' : '#ef4444');
          const opacity = Math.max(0.15, 1 - (currentTick - trade.tick) * 0.12);
          const mx = (agent.x + exchange.x) / 2;
          const my = (agent.y + exchange.y) / 2 - 25;
          return (
            <g key={`t-${trade.tick}-${trade.agent_name}-${i}`}>
              <path
                d={`M${agent.x},${agent.y} Q${mx},${my} ${exchange.x},${exchange.y}`}
                fill="none" stroke={connectionColor}
                strokeWidth="2.5" opacity={opacity} filter="url(#glow)" strokeDasharray="6 14">
                <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite" />
              </path>
              {asset && (
                <text
                  x={mx} y={my - 5}
                  textAnchor="middle" fill={connectionColor} fontSize="8" fontFamily="monospace" fontWeight="bold"
                  opacity={opacity}
                >
                  {asset} {trade.action === 'BUY' ? '\u2191' : '\u2193'}
                </text>
              )}
            </g>
          );
        })}

        {/* Exchange nodes */}
        {EXCHANGES.map((ex) => (
          <g key={ex.name}>
            <circle cx={ex.x} cy={ex.y} r="5" fill="#0d0d18" stroke="#2a3a6a" strokeWidth="1.5" />
            <circle cx={ex.x} cy={ex.y} r="2" fill="#3b82f6" opacity="0.5" />
            <text x={ex.x} y={ex.y + 16} textAnchor="middle" fill="#2a3a5a" fontSize="8" fontFamily="monospace">{ex.name}</text>
          </g>
        ))}

        {/* Agent nodes — bubble size = wealth */}
        {Object.entries(agentMap).map(([name, agent]) => {
          const isActive = recentTrades.some((t) => t.agent_name === name);
          const wealth = getAgentWealth(name);
          const bubbleR = minBubble + ((wealth / maxWealth) * (maxBubble - minBubble));
          const pnl = pnlHistory?.[name]?.[dataIndex ?? 0] ?? 0;
          const isUp = pnl >= 0;

          return (
            <g key={name}>
              {isActive && (
                <circle cx={agent.x} cy={agent.y} r={bubbleR + 5} fill="none" stroke={agent.color} strokeWidth="1" opacity="0.3">
                  <animate attributeName="r" from={bubbleR} to={bubbleR + 18} dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={agent.x} cy={agent.y} r={bubbleR} fill="#0a0a14" stroke={agent.color} strokeWidth="2.5"
                filter={isActive ? 'url(#glow)' : undefined} />
              <text x={agent.x} y={agent.y + 4} textAnchor="middle" fill={agent.color} fontSize="12" fontWeight="bold" fontFamily="monospace">
                {name.charAt(0).toUpperCase()}
              </text>
              <text x={agent.x} y={agent.y - bubbleR - 8} textAnchor="middle" fill={agent.color} fontSize="10" fontWeight="bold" fontFamily="system-ui">
                {name}
              </text>
              <text x={agent.x} y={agent.y + bubbleR + 14} textAnchor="middle" fill="#3a3a5a" fontSize="8" fontFamily="monospace">
                {agent.city}
              </text>
              {/* PnL badge */}
              <text x={agent.x} y={agent.y + bubbleR + 24} textAnchor="middle"
                fill={isUp ? '#10b981' : '#ef4444'} fontSize="9" fontFamily="monospace" fontWeight="bold">
                {isUp ? '+' : ''}{pnl.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <g transform="translate(20, 350)">
          {agentConfigs.length > 0 && (() => {
            const legendAssets = Object.keys(ASSET_COLORS).filter((s) =>
              Object.keys(data?.price_histories ?? {}).includes(s) || agentConfigs.length > 0
            );
            let cx = 0;
            return legendAssets.map((s) => {
              const startX = cx;
              cx += 40;
              return (
                <g key={s}>
                  <circle cx={startX} cy="0" r="3" fill={ASSET_COLORS[s] ?? '#888'} />
                  <text x={startX + 8} y="3" fill="#4a4a6a" fontSize="8" fontFamily="monospace">{s}</text>
                </g>
              );
            });
          })()}
          {!agentConfigs.length && ['BTC', 'ETH', 'SOL'].map((s, i) => (
            <g key={s}>
              <circle cx={i * 38} cy="0" r="3" fill={ASSET_COLORS[s]} />
              <text x={i * 38 + 8} y="3" fill="#4a4a6a" fontSize="8" fontFamily="monospace">{s}</text>
            </g>
          ))}
          <circle cx="130" cy="0" r="3" fill="#3b82f6" />
          <text x="138" y="3" fill="#4a4a6a" fontSize="8" fontFamily="monospace">EXCHANGE</text>
          <text x="210" y="3" fill="#3a3a5a" fontSize="8" fontFamily="monospace">Bubble = wealth</text>
        </g>
      </svg>
    </div>
  );
}
