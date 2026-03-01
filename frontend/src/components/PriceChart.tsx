import { useState, useMemo } from 'react';
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { ASSET_COLORS, displaySymbol } from '../types';

interface Props {
  priceHistories: Record<string, number[]>;
  currentTick: number;
  historyTicks?: number;
  assets: string[];
}

export default function PriceChart({ priceHistories, currentTick, historyTicks = 250, assets }: Props) {
  const [chartType, setChartType] = useState<'line' | 'candle'>('line');
  const [selectedAsset, setSelectedAsset] = useState<string>(assets[0] ?? 'BTC');

  const priceHistory = priceHistories[selectedAsset] ?? [];
  const color = ASSET_COLORS[selectedAsset] ?? '#8b5cf6';

  const visibleEnd = historyTicks + currentTick + 1;
  const totalLen = priceHistory.length;

  const startPrice = priceHistory[historyTicks] ?? priceHistory[0] ?? 0;
  const currentPrice = priceHistory[Math.min(visibleEnd - 1, totalLen - 1)] ?? startPrice;
  const change = startPrice !== 0 ? ((currentPrice - startPrice) / startPrice) * 100 : 0;
  const isUp = change >= 0;

  const data = useMemo(() => {
    if (chartType === 'line') {
      return Array.from({ length: totalLen }, (_, i) => ({
        tick: i,
        price: i < visibleEnd ? Number(priceHistory[i]?.toFixed(2)) : null,
        isHistory: i <= historyTicks,
      }));
    }

    const candleSize = 5;
    const candles: {
      tick: number;
      open: number;
      close: number;
      high: number;
      low: number;
      body: [number, number];
      isUp: boolean;
    }[] = [];

    for (let i = 0; i < totalLen; i += candleSize) {
      if (i >= visibleEnd) break;
      const end = Math.min(i + candleSize, visibleEnd, totalLen);
      const slice = priceHistory.slice(i, end);
      if (slice.length === 0) continue;

      const open = slice[0];
      const close = slice[slice.length - 1];
      const high = Math.max(...slice);
      const low = Math.min(...slice);

      candles.push({
        tick: i,
        open,
        close,
        high,
        low,
        body: [Math.min(open, close), Math.max(open, close)],
        isUp: close >= open,
      });
    }
    return candles;
  }, [priceHistory, totalLen, visibleEnd, chartType, historyTicks]);

  const visiblePrices = priceHistory.slice(0, visibleEnd);
  const minPrice = visiblePrices.length > 0 ? Math.floor(Math.min(...visiblePrices) * 0.99) : 0;
  const maxPrice = visiblePrices.length > 0 ? Math.ceil(Math.max(...visiblePrices) * 1.01) : 100;

  const formatPrice = (v: number) => {
    if (v >= 10000) return `$${(v / 1000).toFixed(0)}k`;
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
    return `$${v.toFixed(0)}`;
  };

  return (
    <div className="bg-[#111118] rounded-xl p-4 border border-[#1e1e2e]">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            {/* Asset tabs */}
            {assets.map((symbol) => (
              <button
                key={symbol}
                onClick={() => setSelectedAsset(symbol)}
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-all ${
                  selectedAsset === symbol
                    ? 'text-white'
                    : 'text-gray-600 hover:text-gray-400'
                }`}
                style={
                  selectedAsset === symbol
                    ? { backgroundColor: ASSET_COLORS[symbol] + '30', color: ASSET_COLORS[symbol] }
                    : undefined
                }
              >
                {displaySymbol(symbol)}
              </button>
            ))}
            {historyTicks > 0 && currentTick === 0 && (
              <span className="text-[9px] text-gray-600 font-mono ml-2">
                {historyTicks} ticks history
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-2xl font-bold text-white font-mono">
              ${currentPrice >= 1000 ? currentPrice.toFixed(0) : currentPrice.toFixed(2)}
            </span>
            <span
              className={`text-xs font-bold font-mono ${isUp ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {isUp ? '+' : ''}{change.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setChartType('line')}
            className={`px-2 py-1 text-[10px] font-mono font-bold rounded transition-all ${
              chartType === 'line'
                ? 'bg-[#1e1e2e] text-white'
                : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            LINE
          </button>
          <button
            onClick={() => setChartType('candle')}
            className={`px-2 py-1 text-[10px] font-mono font-bold rounded transition-all ${
              chartType === 'candle'
                ? 'bg-[#1e1e2e] text-white'
                : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            CANDLE
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        {chartType === 'line' ? (
          <ComposedChart data={data}>
            <defs>
              <linearGradient id={`grad-${selectedAsset}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#141420" />
            <XAxis
              dataKey="tick"
              stroke="#2a2a3a"
              tick={{ fontSize: 9, fill: '#4a4a5a' }}
              tickLine={false}
              domain={[0, totalLen - 1]}
              type="number"
            />
            <YAxis
              stroke="#2a2a3a"
              tick={{ fontSize: 9, fill: '#4a4a5a' }}
              tickLine={false}
              domain={[minPrice, maxPrice]}
              tickFormatter={formatPrice}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #2a2a3e',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}
              labelFormatter={(label: number) => {
                if (label <= historyTicks) return `History t-${historyTicks - label}`;
                return `Sim t=${label - historyTicks}`;
              }}
              formatter={(value: number | null) => [
                value != null ? `$${value >= 1000 ? value.toFixed(0) : value.toFixed(2)}` : '—',
                selectedAsset,
              ]}
            />
            <ReferenceLine
              x={historyTicks}
              stroke="#8b5cf6"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            <ReferenceLine y={startPrice} stroke="#2a2a3a" strokeDasharray="5 5" />
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#grad-${selectedAsset})`}
              connectNulls={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        ) : (
          <ComposedChart data={data as any[]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#141420" />
            <XAxis
              dataKey="tick"
              stroke="#2a2a3a"
              tick={{ fontSize: 9, fill: '#4a4a5a' }}
              tickLine={false}
            />
            <YAxis
              stroke="#2a2a3a"
              tick={{ fontSize: 9, fill: '#4a4a5a' }}
              tickLine={false}
              domain={[minPrice, maxPrice]}
              tickFormatter={formatPrice}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #2a2a3e',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'monospace',
              }}
              formatter={(_: any, __: any, props: any) => {
                const d = props.payload;
                if (!d) return [];
                const fmt = (v: number) => v >= 1000 ? `$${v.toFixed(0)}` : `$${v.toFixed(2)}`;
                return [
                  `O: ${fmt(d.open)} H: ${fmt(d.high)} L: ${fmt(d.low)} C: ${fmt(d.close)}`,
                  'OHLC',
                ];
              }}
            />
            <ReferenceLine
              x={historyTicks}
              stroke="#8b5cf6"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            <Bar dataKey="body" isAnimationActive={false} barSize={6}>
              {(data as any[]).map((entry: any, index: number) => (
                <Cell
                  key={index}
                  fill={entry.isUp ? '#10b981' : '#ef4444'}
                  stroke={entry.isUp ? '#10b981' : '#ef4444'}
                />
              ))}
            </Bar>
          </ComposedChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
