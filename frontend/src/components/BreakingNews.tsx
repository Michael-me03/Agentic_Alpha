// ============================================================================
// SECTION: Breaking News Banner — Dramatic news overlay during simulation
// ============================================================================

import { useState, useEffect } from 'react';
import { AlertTriangle, Zap, Globe, TrendingDown } from 'lucide-react';
import type { NewsEvent } from '../types';

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  GEOPOLITICAL: <Globe size={16} />,
  MONETARY: <TrendingDown size={16} />,
  MACRO: <AlertTriangle size={16} />,
  EARNINGS: <Zap size={16} />,
  CRYPTO: <Zap size={16} />,
  SHOCK: <AlertTriangle size={16} />,
  CUSTOM: <Zap size={16} />,
};

const SEVERITY_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  CRITICAL: { bg: 'bg-red-500/10', border: 'border-red-500/50', text: 'text-red-400', glow: 'shadow-[0_0_30px_rgba(239,68,68,0.15)]' },
  HIGH: { bg: 'bg-amber-500/10', border: 'border-amber-500/40', text: 'text-amber-400', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.1)]' },
  MEDIUM: { bg: 'bg-blue-500/8', border: 'border-blue-500/30', text: 'text-blue-400', glow: '' },
  LOW: { bg: 'bg-gray-500/8', border: 'border-gray-500/30', text: 'text-gray-400', glow: '' },
};

interface Props {
  newsEvents: NewsEvent[];
  currentTick: number;
}

export default function BreakingNews({ newsEvents, currentTick }: Props) {
  const [dismissedTicks, setDismissedTicks] = useState<Set<number>>(new Set());

  // Find active news (show for 8 ticks after they fire)
  const activeNews = newsEvents.filter(
    (e) => e.tick <= currentTick && e.tick > currentTick - 8 && !dismissedTicks.has(e.tick)
  );

  // Reset dismissed when a new simulation starts (tick goes back to 0)
  useEffect(() => {
    if (currentTick <= 1) {
      setDismissedTicks(new Set());
    }
  }, [currentTick]);

  if (activeNews.length === 0) return null;

  return (
    <div className="space-y-2">
      {activeNews.map((news) => {
        const age = currentTick - news.tick;
        const opacity = Math.max(0.4, 1 - age * 0.1);
        const colors = SEVERITY_COLORS[news.severity] ?? SEVERITY_COLORS.MEDIUM;
        const isNew = age <= 1;

        return (
          <div
            key={`${news.tick}-${news.headline}`}
            className={`relative rounded-lg border p-3 font-mono transition-all duration-500 ${colors.bg} ${colors.border} ${colors.glow}`}
            style={{ opacity }}
          >
            {/* Dismiss button */}
            <button
              onClick={() => setDismissedTicks((prev) => new Set([...prev, news.tick]))}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-400 text-xs"
            >
              ✕
            </button>

            <div className="flex items-start gap-2.5 pr-6">
              {/* Icon + severity indicator */}
              <div className={`shrink-0 mt-0.5 ${colors.text}`}>
                {CATEGORY_ICON[news.category] ?? <Zap size={16} />}
              </div>

              <div className="min-w-0 flex-1">
                {/* Label */}
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${colors.text} ${isNew ? 'animate-pulse' : ''}`}>
                    BREAKING NEWS
                  </span>
                  <span className="text-[9px] text-gray-600">
                    t={news.tick}
                  </span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${colors.text} ${colors.bg}`}>
                    {news.severity}
                  </span>
                </div>

                {/* Headline */}
                <p className={`text-xs leading-relaxed ${isNew ? 'text-white font-bold' : 'text-gray-300'}`}>
                  {news.headline}
                </p>
              </div>
            </div>

            {/* Animated scan line for new events */}
            {isNew && (
              <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                <div
                  className={`absolute top-0 left-0 h-full w-1 ${colors.text.replace('text-', 'bg-')} opacity-40`}
                  style={{ animation: 'scan 2s ease-in-out infinite' }}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Past news ticker */}
      {newsEvents.filter((e) => e.tick <= currentTick && currentTick - e.tick >= 8).length > 0 && (
        <div className="flex items-center gap-2 px-2">
          <div className="w-1 h-1 rounded-full bg-gray-700" />
          <span className="text-[9px] text-gray-700 font-mono">
            {newsEvents.filter((e) => e.tick <= currentTick).length} news events fired
          </span>
        </div>
      )}
    </div>
  );
}
