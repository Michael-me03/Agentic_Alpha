// ============================================================================
// SECTION: Setup View (Agent Arena Lobby)
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import type { AgentConfig, AssetSearchResult } from '../types';
import { DEFAULT_AGENT_COLORS, CITY_OPTIONS, ICON_OPTIONS, getAssetColor } from '../types';
import { fetchPresets, searchAssets, type PresetTemplate } from '../api';
import AgentIcon from './AgentIcon';

// ── Which agent card has its icon picker open (null = none) ────────────────
// Tracked at module level so only one picker is open at a time

// ── Display helper: "BTC-USD" → "BTC", "NVDA" stays "NVDA" ──────────────
function displaySymbol(symbol: string): string {
  return symbol.replace(/-USD$/, '');
}

// ── Popular quick-pick assets ────────────────────────────────────────────
const POPULAR_ASSETS: AssetSearchResult[] = [
  { symbol: 'BTC-USD', name: 'Bitcoin', type: 'CRYPTOCURRENCY', exchange: '' },
  { symbol: 'ETH-USD', name: 'Ethereum', type: 'CRYPTOCURRENCY', exchange: '' },
  { symbol: 'SOL-USD', name: 'Solana', type: 'CRYPTOCURRENCY', exchange: '' },
  { symbol: 'NVDA', name: 'NVIDIA Corp', type: 'EQUITY', exchange: 'NMS' },
  { symbol: 'AAPL', name: 'Apple Inc', type: 'EQUITY', exchange: 'NMS' },
  { symbol: 'TSLA', name: 'Tesla Inc', type: 'EQUITY', exchange: 'NMS' },
  { symbol: 'MSFT', name: 'Microsoft', type: 'EQUITY', exchange: 'NMS' },
  { symbol: 'GOOGL', name: 'Alphabet', type: 'EQUITY', exchange: 'NMS' },
  { symbol: 'SPY', name: 'S&P 500 ETF', type: 'ETF', exchange: 'PCX' },
];

const TYPE_LABELS: Record<string, string> = {
  EQUITY: 'Stock',
  CRYPTOCURRENCY: 'Crypto',
  ETF: 'ETF',
  INDEX: 'Index',
};

interface SelectedAsset {
  symbol: string;
  name: string;
  type: string;
}

export interface CustomNewsInput {
  tick: number;
  headline: string;
}

interface Props {
  onStart: (configs: AgentConfig[], numTicks: number, selectedAssets: string[], customNews: CustomNewsInput[]) => void;
  isLoading: boolean;
}

export default function SetupView({ onStart, isLoading }: Props) {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [presets, setPresets] = useState<PresetTemplate[]>([]);
  const [numTicks, setNumTicks] = useState(40);
  const [selectedAssets, setSelectedAssets] = useState<SelectedAsset[]>([
    { symbol: 'BTC-USD', name: 'Bitcoin', type: 'CRYPTOCURRENCY' },
    { symbol: 'ETH-USD', name: 'Ethereum', type: 'CRYPTOCURRENCY' },
    { symbol: 'SOL-USD', name: 'Solana', type: 'CRYPTOCURRENCY' },
  ]);
  const [started, setStarted] = useState(false);
  const [openIconPicker, setOpenIconPicker] = useState<number | null>(null);
  const [customNews, setCustomNews] = useState<CustomNewsInput[]>([]);
  const [newsHeadline, setNewsHeadline] = useState('');
  const [newsTick, setNewsTick] = useState(10);

  // ── Asset search state ─────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AssetSearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Load presets on mount ──────────────────────────────────────────────
  useEffect(() => {
    fetchPresets()
      .then(setPresets)
      .catch(() => {});
  }, []);

  // ── Close dropdowns on outside click ───────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      // Close icon picker if clicking outside it
      const target = e.target as HTMLElement;
      if (!target.closest('[data-icon-picker]')) {
        setOpenIconPicker(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Debounced search ───────────────────────────────────────────────────
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    debounceRef.current = setTimeout(async () => {
      const results = await searchAssets(value);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);
  }, []);

  const addAsset = (asset: AssetSearchResult) => {
    if (selectedAssets.length >= 5) return;
    if (selectedAssets.some((a) => a.symbol === asset.symbol)) return;
    setSelectedAssets([...selectedAssets, { symbol: asset.symbol, name: asset.name, type: asset.type }]);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const removeAsset = (symbol: string) => {
    if (selectedAssets.length <= 1) return;
    setSelectedAssets(selectedAssets.filter((a) => a.symbol !== symbol));
  };

  // ── Welcome screen ────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="h-screen bg-[#08080d] flex items-center justify-center">
        <div className="text-center max-w-2xl px-10">
          <img src="/logo.png" alt="AgenticAlpha" className="h-24 mx-auto mb-10 invert" />
          <p className="text-gray-300 text-2xl mb-4 font-mono font-bold tracking-wide">
            AI Agent Trading Arena
          </p>
          <p className="text-gray-500 text-base mb-12 leading-relaxed max-w-xl mx-auto">
            Design custom AI traders with natural language prompts.
            Pick any stocks, crypto, or ETFs. Watch your agents compete in real markets.
            Powered by Mistral AI.
          </p>
          <button
            onClick={() => setStarted(true)}
            className="px-12 py-4 bg-violet-600 hover:bg-violet-500 text-white font-mono font-bold rounded-xl text-lg tracking-widest transition-all hover:scale-105"
          >
            ENTER ARENA
          </button>
          <p className="text-gray-700 text-xs font-mono mt-10">
            Mistral AI Global Hackathon 2026
          </p>
        </div>
      </div>
    );
  }

  // ── Agent management ──────────────────────────────────────────────────
  const addAgent = (preset?: PresetTemplate) => {
    if (agents.length >= 4) return;
    const idx = agents.length;
    const newAgent: AgentConfig = preset
      ? {
          name: preset.name,
          color: preset.color,
          system_prompt: preset.system_prompt,
          icon: preset.icon,
          city: preset.city,
        }
      : {
          name: `Agent ${idx + 1}`,
          color: DEFAULT_AGENT_COLORS[idx % DEFAULT_AGENT_COLORS.length],
          system_prompt: '',
          icon: ICON_OPTIONS[idx % ICON_OPTIONS.length],
          city: CITY_OPTIONS[idx % CITY_OPTIONS.length],
        };
    setAgents([...agents, newAgent]);
  };

  const updateAgent = (index: number, updates: Partial<AgentConfig>) => {
    setAgents(agents.map((a, i) => (i === index ? { ...a, ...updates } : a)));
  };

  const removeAgent = (index: number) => {
    setAgents(agents.filter((_, i) => i !== index));
    setOpenIconPicker(null);
  };

  const canLaunch = agents.length >= 2 && agents.every((a) => a.name.trim() && a.system_prompt.trim()) && selectedAssets.length >= 1;

  return (
    <div className="h-screen bg-[#08080d] flex flex-col overflow-hidden">
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a2a] bg-[#0a0a12] shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="AgenticAlpha" className="h-8 invert" />
          <div className="w-px h-5 bg-[#1e1e2e]" />
          <span className="text-xs text-gray-500 font-mono">SETUP</span>
        </div>
        <span className="text-[11px] text-gray-600 font-mono">
          POWERED BY MISTRAL AI
        </span>
      </div>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white font-mono mb-3">
              Design Your AI Traders
            </h2>
            <p className="text-gray-500 text-sm font-mono">
              Create 2-4 agents with custom system prompts. Pick any stocks, crypto, or ETFs to trade.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ── Left: Agent Cards ─────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest font-mono">
                  Your Agents ({agents.length}/4)
                </span>
              </div>

              {agents.map((agent, idx) => (
                <div
                  key={idx}
                  className={`bg-[#0d0d14] rounded-xl border border-[#1e1e2e] p-4 sm:p-5 relative ${
                    openIconPicker === idx ? 'z-50' : 'z-0'
                  }`}
                >
                  {/* Delete button — always visible, top right */}
                  <button
                    onClick={() => removeAgent(idx)}
                    className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg bg-[#111118] border border-[#1e1e2e] text-gray-600 hover:text-red-400 hover:border-red-500/30 text-sm transition-colors z-10"
                    title="Remove agent"
                  >
                    ✕
                  </button>

                  {/* Agent Header — wraps on mobile */}
                  <div className="flex flex-wrap items-center gap-3 mb-4 pr-10">
                    {/* Icon selector — click-based */}
                    <div className="relative" data-icon-picker>
                      <button
                        onClick={() => setOpenIconPicker(openIconPicker === idx ? null : idx)}
                        className="w-12 h-12 rounded-xl bg-[#111118] border border-[#1e1e2e] flex items-center justify-center hover:border-[#3a3a4a] transition-colors"
                      >
                        <AgentIcon icon={agent.icon} size={24} color={agent.color} />
                      </button>
                      {openIconPicker === idx && (
                        <div className="absolute left-0 top-14 z-[100] grid grid-cols-5 gap-1.5 p-3 bg-[#111118] border border-[#2a2a3a] rounded-xl shadow-2xl min-w-[230px]">
                          {ICON_OPTIONS.map((icon) => (
                            <button
                              key={icon}
                              onClick={() => {
                                updateAgent(idx, { icon });
                                setOpenIconPicker(null);
                              }}
                              className={`w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#1e1e2e] ${
                                agent.icon === icon ? 'bg-violet-500/20 border border-violet-500/40' : ''
                              }`}
                            >
                              <AgentIcon icon={icon} size={20} color="#9ca3af" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Name input */}
                    <input
                      type="text"
                      value={agent.name}
                      onChange={(e) => updateAgent(idx, { name: e.target.value })}
                      maxLength={20}
                      className="flex-1 min-w-[120px] bg-[#111118] border border-[#1e1e2e] rounded-lg px-4 py-3 text-white text-base font-mono font-bold focus:border-[#3a3a4a] focus:outline-none"
                      placeholder="Agent name..."
                    />

                    {/* Color picker */}
                    <div className="flex gap-1.5">
                      {DEFAULT_AGENT_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => updateAgent(idx, { color: c })}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${
                            agent.color === c ? 'border-white scale-110' : 'border-transparent hover:border-gray-600'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>

                    {/* City */}
                    <select
                      value={agent.city}
                      onChange={(e) => updateAgent(idx, { city: e.target.value })}
                      className="bg-[#111118] border border-[#1e1e2e] rounded-lg px-3 py-3 text-gray-400 text-xs font-mono focus:outline-none"
                    >
                      {CITY_OPTIONS.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  {/* System Prompt */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-gray-600 font-mono uppercase">
                        System Prompt — defines how this agent thinks & trades
                      </span>
                      <span className="text-[11px] text-gray-700 font-mono">
                        {agent.system_prompt.length} chars
                      </span>
                    </div>
                    <textarea
                      value={agent.system_prompt}
                      onChange={(e) => updateAgent(idx, { system_prompt: e.target.value })}
                      rows={5}
                      className="w-full bg-[#08080d] border border-[#1e1e2e] rounded-xl px-4 py-3 text-gray-300 text-sm font-mono leading-relaxed resize-none focus:border-violet-500/50 focus:outline-none placeholder-gray-700"
                      placeholder="Describe this agent's personality, strategy, and trading style..."
                    />
                  </div>
                </div>
              ))}

              {/* Add Agent Button */}
              {agents.length < 4 && (
                <button
                  onClick={() => addAgent()}
                  className="w-full py-4 border border-dashed border-[#2a2a3a] rounded-xl text-gray-600 hover:text-gray-400 hover:border-[#3a3a4a] text-sm font-mono transition-colors"
                >
                  + Add Agent
                </button>
              )}
            </div>

            {/* ── Right: Presets + Config ───────────────────────────────── */}
            <div className="space-y-5">
              {/* Preset Templates */}
              <div className="bg-[#0d0d14] rounded-xl border border-[#1e1e2e] p-5">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest font-mono block mb-4">
                  Preset Templates
                </span>
                <p className="text-[11px] text-gray-700 font-mono mb-4">
                  Click to add a pre-configured agent. You can edit everything after.
                </p>
                <div className="space-y-2.5">
                  {presets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => addAgent(preset)}
                      disabled={agents.length >= 4}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#1e1e2e] hover:border-[#3a3a4a] bg-[#08080d] transition-colors text-left disabled:opacity-30"
                    >
                      <AgentIcon icon={preset.icon} size={22} color={preset.color} />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold text-white block font-mono">
                          {preset.name}
                        </span>
                        <span className="text-[11px] text-gray-600 block truncate">
                          {preset.description}
                        </span>
                      </div>
                      <span className="text-xs text-gray-700">+</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Market Config */}
              <div className="bg-[#0d0d14] rounded-xl border border-[#1e1e2e] p-5">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest font-mono block mb-4">
                  Market
                </span>

                {/* ── Asset Search ─────────────────────────────────────── */}
                <div className="mb-4">
                  <label className="text-[11px] text-gray-600 font-mono block mb-2">
                    ASSETS (1-5) — Search any stock, crypto, or ETF
                  </label>

                  {/* Selected assets as chips */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedAssets.map((asset) => {
                      const color = getAssetColor(asset.symbol);
                      return (
                        <div
                          key={asset.symbol}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold"
                          style={{
                            color,
                            backgroundColor: color + '15',
                            border: `1px solid ${color}40`,
                          }}
                        >
                          <span>{displaySymbol(asset.symbol)}</span>
                          <span className="text-[10px] font-normal opacity-60">{TYPE_LABELS[asset.type] || asset.type}</span>
                          {selectedAssets.length > 1 && (
                            <button
                              onClick={() => removeAsset(asset.symbol)}
                              className="ml-1 opacity-50 hover:opacity-100"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Search input */}
                  {selectedAssets.length < 5 && (
                    <div ref={searchRef} className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onFocus={() => { if (searchQuery) setShowDropdown(true); }}
                        className="w-full bg-[#111118] border border-[#1e1e2e] rounded-xl px-4 py-3 text-white text-sm font-mono focus:border-violet-500/50 focus:outline-none placeholder-gray-600"
                        placeholder="Search: NVDA, Bitcoin, SPY..."
                      />

                      {/* Dropdown results */}
                      {showDropdown && (
                        <div className="absolute z-30 w-full mt-1 bg-[#111118] border border-[#2a2a3a] rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                          {isSearching && (
                            <div className="px-4 py-3 text-xs text-gray-500 font-mono">
                              Searching...
                            </div>
                          )}
                          {!isSearching && searchResults.length === 0 && searchQuery.length > 0 && (
                            <div className="px-4 py-3 text-xs text-gray-600 font-mono">
                              No results found
                            </div>
                          )}
                          {searchResults
                            .filter((r) => !selectedAssets.some((a) => a.symbol === r.symbol))
                            .map((result) => (
                              <button
                                key={result.symbol}
                                onClick={() => addAsset(result)}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1a1a2a] text-left transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <span
                                    className="text-sm font-bold font-mono"
                                    style={{ color: getAssetColor(result.symbol) }}
                                  >
                                    {displaySymbol(result.symbol)}
                                  </span>
                                  <span className="text-xs text-gray-400 truncate max-w-[140px]">
                                    {result.name}
                                  </span>
                                </div>
                                <span className="text-[10px] text-gray-600 font-mono">
                                  {TYPE_LABELS[result.type] || result.type}
                                </span>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick-pick popular assets */}
                  <div className="mt-3">
                    <span className="text-[10px] text-gray-700 font-mono block mb-1.5">Popular:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_ASSETS
                        .filter((a) => !selectedAssets.some((s) => s.symbol === a.symbol))
                        .slice(0, 6)
                        .map((asset) => (
                          <button
                            key={asset.symbol}
                            onClick={() => addAsset(asset)}
                            disabled={selectedAssets.length >= 5}
                            className="px-2.5 py-1 rounded-lg border border-[#1e1e2e] text-[11px] font-mono text-gray-500 hover:text-white hover:border-[#3a3a4a] transition-colors disabled:opacity-30"
                          >
                            {displaySymbol(asset.symbol)}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-gray-600 font-mono block mb-2">
                      SIMULATION DAYS
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={numTicks}
                      onChange={(e) => setNumTicks(Number(e.target.value))}
                      className="w-full accent-violet-500"
                    />
                    <div className="flex justify-between text-[11px] text-gray-600 font-mono">
                      <span>10</span>
                      <span className="text-white font-bold">{numTicks} days</span>
                      <span>100</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Custom News Events ─────────────────────────────────── */}
              <div className="bg-[#0d0d14] rounded-xl border border-[#1e1e2e] p-5">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest font-mono block mb-2">
                  News Events (optional)
                </span>
                <p className="text-[10px] text-gray-700 font-mono mb-4">
                  Inject custom breaking news. Agents will react to these headlines. Random events also fire automatically.
                </p>

                {/* Existing custom news */}
                {customNews.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {customNews.map((n, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-[#08080d] border border-[#1a1a2a]">
                        <span className="text-[10px] text-amber-400 font-mono font-bold shrink-0">t={n.tick}</span>
                        <span className="text-[10px] text-gray-300 font-mono flex-1 truncate">{n.headline}</span>
                        <button
                          onClick={() => setCustomNews(customNews.filter((_, j) => j !== i))}
                          className="text-gray-600 hover:text-red-400 text-xs shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new event */}
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    max={numTicks}
                    value={newsTick}
                    onChange={(e) => setNewsTick(Number(e.target.value))}
                    className="w-16 bg-[#111118] border border-[#1e1e2e] rounded-lg px-2 py-2 text-white text-xs font-mono text-center focus:outline-none focus:border-amber-500/50"
                    placeholder="Tick"
                  />
                  <input
                    type="text"
                    value={newsHeadline}
                    onChange={(e) => setNewsHeadline(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newsHeadline.trim()) {
                        setCustomNews([...customNews, { tick: newsTick, headline: newsHeadline.trim() }]);
                        setNewsHeadline('');
                      }
                    }}
                    className="flex-1 bg-[#111118] border border-[#1e1e2e] rounded-lg px-3 py-2 text-gray-300 text-xs font-mono focus:outline-none focus:border-amber-500/50 placeholder-gray-700"
                    placeholder="e.g. Fed raises rates by 75bps..."
                  />
                  <button
                    onClick={() => {
                      if (newsHeadline.trim()) {
                        setCustomNews([...customNews, { tick: newsTick, headline: newsHeadline.trim() }]);
                        setNewsHeadline('');
                      }
                    }}
                    className="px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-xs font-mono font-bold hover:bg-amber-500/20 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Launch Button */}
              <button
                onClick={() => onStart(agents, numTicks, selectedAssets.map((a) => a.symbol), customNews)}
                disabled={!canLaunch || isLoading}
                className={`w-full py-5 rounded-xl font-mono font-bold text-base tracking-wider transition-all ${
                  canLaunch && !isLoading
                    ? 'bg-violet-600 hover:bg-violet-500 text-white hover:scale-[1.02]'
                    : 'bg-[#1e1e2e] text-gray-600 cursor-not-allowed'
                }`}
              >
                {isLoading ? 'QUERYING MISTRAL...' : `LAUNCH ARENA (${agents.length} agents, ${selectedAssets.length} assets)`}
              </button>

              {!canLaunch && agents.length < 2 && (
                <p className="text-[11px] text-amber-500/60 font-mono text-center">
                  Add at least 2 agents to start
                </p>
              )}
              {!canLaunch && agents.length >= 2 && (
                <p className="text-[11px] text-amber-500/60 font-mono text-center">
                  All agents need a name and system prompt
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
