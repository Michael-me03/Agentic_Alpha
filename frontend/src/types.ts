// ============================================================================
// SECTION: Types
// ============================================================================

export interface AgentConfig {
  name: string;
  color: string;
  system_prompt: string;
  icon: string;
  city: string;
}

export interface AgentSnapshot {
  name: string;
  positions: Record<string, number>;
  cash: number;
  pnl: number;
}

export interface EventRecord {
  tick: number;
  agent_name: string;
  action: string;
  detail: string;
}

export interface ReasoningEntry {
  tick: number;
  action: string;
  asset?: string;
  reason: string;
}

export interface NewsEvent {
  tick: number;
  headline: string;
  category: string;
  severity: string;
}

export interface SimulationResponse {
  price_histories: Record<string, number[]>;
  pnl_history: Record<string, number[]>;
  position_history: Record<string, Record<string, number[]>>;
  agents: AgentSnapshot[];
  events: EventRecord[];
  reasoning: Record<string, ReasoningEntry[]>;
  news_events: NewsEvent[];
  num_ticks: number;
  history_ticks: number;
  asset_info: Record<string, { name: string; symbol: string }>;
  agent_configs: AgentConfig[];
}

export interface SimulationRequest {
  num_ticks: number;
  seed: number;
  agents: AgentConfig[];
  assets: string[];
  custom_news?: { tick: number; headline: string }[];
}

export const ASSET_SYMBOLS = ['BTC-USD', 'ETH-USD', 'SOL-USD'] as const;
export type AssetSymbol = (typeof ASSET_SYMBOLS)[number];

// Well-known asset colors — fallback to generated color for unknown tickers
const KNOWN_ASSET_COLORS: Record<string, string> = {
  'BTC-USD': '#f7931a', 'BTC': '#f7931a',
  'ETH-USD': '#627eea', 'ETH': '#627eea',
  'SOL-USD': '#9945ff', 'SOL': '#9945ff',
  'NVDA': '#76b900', 'AAPL': '#a2aaad', 'TSLA': '#cc0000',
  'MSFT': '#00a4ef', 'GOOGL': '#4285f4', 'AMZN': '#ff9900',
  'META': '#0668e1', 'SPY': '#0072c6', 'QQQ': '#8dc63f',
  'DOGE-USD': '#c2a633', 'XRP-USD': '#346aa9',
};

const PALETTE = [
  '#f7931a', '#627eea', '#9945ff', '#ef4444', '#10b981',
  '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6',
];

export function getAssetColor(symbol: string): string {
  if (KNOWN_ASSET_COLORS[symbol]) return KNOWN_ASSET_COLORS[symbol];
  // Hash-based color from palette
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = ((hash << 5) - hash + symbol.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

// Backwards-compatible ASSET_COLORS proxy
export const ASSET_COLORS: Record<string, string> = new Proxy(
  KNOWN_ASSET_COLORS,
  { get: (target, prop: string) => target[prop] ?? getAssetColor(prop) },
);

// ----------------------------------------------------------------------------
// Sub-section: Search Result
// ----------------------------------------------------------------------------

export interface AssetSearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

/**
 * Display-friendly symbol: strips "-USD" suffix from crypto tickers.
 * "BTC-USD" → "BTC", "NVDA" → "NVDA"
 */
export function displaySymbol(symbol: string): string {
  return symbol.replace(/-USD$/, '');
}

// ----------------------------------------------------------------------------
// Sub-section: Agent Config Defaults
// ----------------------------------------------------------------------------

export const DEFAULT_AGENT_COLORS = [
  '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#ec4899',
] as const;

export const CITY_OPTIONS = [
  'New York', 'London', 'Zurich', 'Tokyo', 'Singapore', 'Hong Kong',
] as const;

export const ICON_OPTIONS = [
  'trending-up', 'landmark', 'shield', 'dice', 'brain',
  'rocket', 'zap', 'target', 'eye', 'flame',
] as const;
