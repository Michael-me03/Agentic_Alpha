import { ASSET_COLORS, displaySymbol } from '../types';

interface Props {
  priceHistories: Record<string, number[]>;
  currentTick: number;
  assets: string[];
}

export default function MarketTicker({ priceHistories, currentTick, assets }: Props) {
  return (
    <div className="flex items-center gap-4">
      {assets.map((symbol, i) => {
        const prices = priceHistories[symbol] ?? [];
        const idx = Math.min(currentTick, prices.length - 1);
        const prevIdx = Math.max(0, idx - 1);
        const price = prices[idx] ?? 0;
        const prev = prices[prevIdx] ?? price;
        const change = prev !== 0 ? ((price - prev) / prev) * 100 : 0;
        const isUp = change >= 0;

        return (
          <div key={symbol} className="flex items-center gap-2">
            <div className="text-center">
              <span className="text-[9px] block font-mono" style={{ color: ASSET_COLORS[symbol] }}>
                {displaySymbol(symbol)}
              </span>
              <span className="text-[13px] font-bold text-white font-mono">
                ${price >= 1000 ? price.toFixed(0) : price.toFixed(2)}
              </span>
            </div>
            <span
              className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                isUp
                  ? 'text-emerald-400 bg-emerald-400/10'
                  : 'text-red-400 bg-red-400/10'
              }`}
            >
              {isUp ? '+' : ''}{change.toFixed(2)}%
            </span>
            {i < assets.length - 1 && (
              <div className="w-px h-5 bg-[#1e1e2e]" />
            )}
          </div>
        );
      })}
    </div>
  );
}
