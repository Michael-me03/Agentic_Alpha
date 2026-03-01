import type { EventRecord, ReasoningEntry } from '../types';
import { ASSET_COLORS } from '../types';
import type { AgentMeta } from '../agentMeta';

const ACTION_DOT: Record<string, string> = {
  BUY: 'bg-emerald-400',
  SELL: 'bg-red-400',
  HOLD: 'bg-gray-500',
};

interface Props {
  events: EventRecord[];
  reasoning: Record<string, ReasoningEntry[]>;
  currentTick: number;
  agentMeta: Record<string, AgentMeta>;
}

function extractAsset(detail: string): string | null {
  const match = detail.match(/^(BTC|ETH|SOL)\s/);
  return match ? match[1] : null;
}

export default function ActivityFeed({ events, reasoning, currentTick, agentMeta }: Props) {
  const feed: {
    tick: number;
    agent: string;
    action: string;
    asset: string | null;
    text: string;
    isReasoning: boolean;
  }[] = [];

  // Add trade events
  for (const e of events) {
    if (e.tick <= currentTick && e.action !== 'PRICE_UPDATE') {
      const asset = extractAsset(e.detail);
      const cleanDetail = e.detail.split(' | ')[0];
      feed.push({
        tick: e.tick,
        agent: e.agent_name,
        action: e.action,
        asset,
        text: cleanDetail,
        isReasoning: false,
      });
    }
  }

  // Add reasoning
  for (const [agent, entries] of Object.entries(reasoning)) {
    for (const entry of entries) {
      if (entry.tick <= currentTick) {
        feed.push({
          tick: entry.tick,
          agent,
          action: entry.action,
          asset: entry.asset ?? null,
          text: entry.reason,
          isReasoning: true,
        });
      }
    }
  }

  feed.sort((a, b) => b.tick - a.tick);
  const recent = feed.slice(0, 50);

  return (
    <div className="bg-[#0d0d14] rounded-lg border border-[#1a1a2a] font-mono h-full flex flex-col">
      <div className="px-3 py-2 border-b border-[#1a1a2a] flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          Activity
        </span>
        <span className="text-[9px] text-gray-700">
          {feed.length} events
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {recent.length === 0 ? (
          <p className="text-gray-700 text-[10px] text-center py-8">
            Waiting for simulation...
          </p>
        ) : (
          recent.map((item, i) => {
            const meta = agentMeta[item.agent];
            return (
              <div
                key={`${item.tick}-${item.agent}-${i}`}
                className={`flex items-start gap-1.5 py-1 px-1 rounded hover:bg-[#111118] ${
                  item.isReasoning ? 'bg-[#0a0a12]' : ''
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${ACTION_DOT[item.action] ?? 'bg-gray-600'}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[9px] text-gray-600">{item.tick}</span>
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: meta?.color ?? '#888' }}
                    >
                      {item.agent}
                    </span>
                    <span className={`text-[9px] font-bold px-1 rounded ${
                      item.action === 'BUY' ? 'text-emerald-400 bg-emerald-400/10' :
                      item.action === 'SELL' ? 'text-red-400 bg-red-400/10' :
                      'text-gray-500 bg-gray-500/10'
                    }`}>
                      {item.action}
                    </span>
                    {item.asset && (
                      <span
                        className="text-[9px] font-bold px-1 rounded"
                        style={{
                          color: ASSET_COLORS[item.asset] ?? '#888',
                          backgroundColor: (ASSET_COLORS[item.asset] ?? '#888') + '15',
                        }}
                      >
                        {item.asset}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[9px] leading-tight mt-0.5 ${
                      item.isReasoning
                        ? 'text-gray-400 italic'
                        : 'text-gray-600'
                    }`}
                  >
                    {item.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
