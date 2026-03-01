import type { EventRecord } from '../types';

const ACTION_STYLES: Record<string, string> = {
  BUY: 'text-emerald-400 bg-emerald-400/10',
  SELL: 'text-red-400 bg-red-400/10',
  HOLD: 'text-gray-400 bg-gray-400/10',
  PRICE_UPDATE: 'text-blue-400 bg-blue-400/10',
};

const AGENT_COLORS: Record<string, string> = {
  Momentum: 'text-purple-400',
  MarketMaker: 'text-cyan-400',
  RiskController: 'text-amber-400',
  Retail: 'text-red-400',
  MARKET: 'text-blue-400',
};

interface Props {
  events: EventRecord[];
  currentTick: number;
}

export default function EventLog({ events, currentTick }: Props) {
  const filtered = events
    .filter((e) => e.tick <= currentTick && e.action !== 'PRICE_UPDATE')
    .slice(-30)
    .reverse();

  return (
    <div className="bg-[#111118] rounded-xl p-5 border border-[#1e1e2e]">
      <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
        Event Log
      </h2>
      <div className="h-[240px] overflow-y-auto space-y-1 pr-1 scrollbar-thin">
        {filtered.length === 0 ? (
          <p className="text-gray-600 text-xs text-center py-8">
            No events yet. Run a simulation.
          </p>
        ) : (
          filtered.map((event, i) => (
            <div
              key={`${event.tick}-${event.agent_name}-${i}`}
              className="flex items-center gap-2 text-xs font-mono py-1 px-2 rounded hover:bg-[#1a1a2e]"
            >
              <span className="text-gray-600 w-10 text-right shrink-0">
                t={event.tick}
              </span>
              <span
                className={`w-24 shrink-0 font-semibold ${AGENT_COLORS[event.agent_name] ?? 'text-gray-400'}`}
              >
                {event.agent_name}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ACTION_STYLES[event.action] ?? 'text-gray-400 bg-gray-400/10'}`}
              >
                {event.action}
              </span>
              <span className="text-gray-500 truncate">{event.detail}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
