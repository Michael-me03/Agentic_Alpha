import type { ReasoningEntry } from '../types';
import { ASSET_COLORS } from '../types';
import type { AgentMeta } from '../agentMeta';
import AgentIcon from './AgentIcon';

const ACTION_BADGE: Record<string, string> = {
  BUY: 'text-emerald-400 bg-emerald-400/10',
  SELL: 'text-red-400 bg-red-400/10',
  HOLD: 'text-gray-400 bg-gray-400/10',
};

interface Props {
  reasoning: Record<string, ReasoningEntry[]>;
  currentTick: number;
  agentMeta: Record<string, AgentMeta>;
}

export default function ReasoningPanel({ reasoning, currentTick, agentMeta }: Props) {
  // Collect all reasoning up to current tick, sorted by tick desc
  const allReasons: { agent: string; entry: ReasoningEntry }[] = [];
  for (const [agent, entries] of Object.entries(reasoning)) {
    for (const entry of entries) {
      if (entry.tick <= currentTick) {
        allReasons.push({ agent, entry });
      }
    }
  }
  allReasons.sort((a, b) => b.entry.tick - a.entry.tick);

  const recent = allReasons.slice(0, 20);

  return (
    <div className="bg-[#111118] rounded-xl p-5 border border-[#1e1e2e]">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          Agent Thoughts (Mistral AI)
        </h2>
      </div>

      <div className="h-[300px] overflow-y-auto space-y-2 pr-1">
        {recent.length === 0 ? (
          <p className="text-gray-600 text-xs text-center py-12">
            No LLM reasoning yet. Enable Mistral AI and run a simulation.
          </p>
        ) : (
          recent.map((item, i) => {
            const meta = agentMeta[item.agent] ?? { color: '#888', icon: '🤖', abbr: '???', city: 'Unknown', prompt: '' };

            return (
              <div
                key={`${item.entry.tick}-${item.agent}-${i}`}
                className="p-3 rounded-lg border bg-[#0d0d14]"
                style={{ borderColor: meta.color + '30' }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <AgentIcon icon={meta.icon} size={16} color={meta.color} />
                    <span
                      className="text-xs font-semibold"
                      style={{ color: meta.color }}
                    >
                      {item.agent}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${ACTION_BADGE[item.entry.action] ?? ''}`}
                    >
                      {item.entry.action}
                    </span>
                    {item.entry.asset && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                        style={{ color: ASSET_COLORS[item.entry.asset] ?? '#888', backgroundColor: (ASSET_COLORS[item.entry.asset] ?? '#888') + '15' }}
                      >
                        {item.entry.asset}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-600 font-mono">
                    t={item.entry.tick}
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed italic">
                  "{item.entry.reason}"
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
