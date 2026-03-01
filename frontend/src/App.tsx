import { useState, useRef, useCallback, useMemo } from 'react';
import type { SimulationResponse, AgentConfig } from './types';
import { runSimulation } from './api';
import { buildAgentMetaMap, buildAgentColorMap } from './agentMeta';
import SetupView from './components/SetupView';
import MarketTicker from './components/MarketTicker';
import PriceChart from './components/PriceChart';
import PnLChart from './components/PnLChart';
import GeoMap from './components/GeoMap';
import PortfolioCards from './components/PortfolioCards';
import ActivityFeed from './components/ActivityFeed';
import AgentPositions from './components/AgentPositions';
import Controls from './components/Controls';
import ReasoningPanel from './components/ReasoningPanel';
import PerformanceAnalytics from './components/PerformanceAnalytics';
import AgentIcon from './components/AgentIcon';

const PLAYBACK_SPEED = 2; // ticks per second (fixed)

export default function App() {
  // ── View state ─────────────────────────────────────────────────────────
  const [view, setView] = useState<'setup' | 'arena'>('setup');
  const [agentConfigs, setAgentConfigs] = useState<AgentConfig[]>([]);
  const [numTicks, setNumTicks] = useState(40);
  const [selectedAssets, setSelectedAssets] = useState<string[]>(['BTC', 'ETH', 'SOL']);

  // ── Arena state ────────────────────────────────────────────────────────
  const [data, setData] = useState<SimulationResponse | null>(null);
  const [currentTick, setCurrentTick] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simComplete, setSimComplete] = useState(false);

  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Derived agent metadata ─────────────────────────────────────────────
  const agentMeta = useMemo(() => buildAgentMetaMap(agentConfigs), [agentConfigs]);
  const agentColors = useMemo(() => buildAgentColorMap(agentConfigs), [agentConfigs]);

  // ── Playback controls ──────────────────────────────────────────────────
  const stopPlayback = useCallback(() => {
    if (animRef.current) {
      clearInterval(animRef.current);
      animRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const startPlayback = useCallback(
    (simData: SimulationResponse) => {
      setIsRunning(true);
      setSimComplete(false);
      let tick = 0;

      animRef.current = setInterval(() => {
        tick += 1;
        if (tick > simData.num_ticks) {
          if (animRef.current) {
            clearInterval(animRef.current);
            animRef.current = null;
          }
          setIsRunning(false);
          setSimComplete(true);
          return;
        }
        setCurrentTick(tick);
      }, 1000 / PLAYBACK_SPEED);
    },
    []
  );

  // ── Launch simulation from setup ───────────────────────────────────────
  const handleStart = async (configs: AgentConfig[], ticks: number, assets: string[]) => {
    setAgentConfigs(configs);
    setNumTicks(ticks);
    setSelectedAssets(assets);
    setError(null);
    setIsLoading(true);
    setSimComplete(false);
    setView('arena');

    try {
      const seed = Math.floor(Math.random() * 9999) + 1;
      const result = await runSimulation({
        num_ticks: ticks,
        seed,
        agents: configs,
        assets,
      });
      setData(result);
      setCurrentTick(0);
      setIsLoading(false);
      startPlayback(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setIsLoading(false);
    }
  };

  // ── New round with same agents ─────────────────────────────────────────
  const handleNewRound = async () => {
    setError(null);
    setIsLoading(true);
    setSimComplete(false);
    stopPlayback();

    try {
      const seed = Math.floor(Math.random() * 9999) + 1;
      const result = await runSimulation({
        num_ticks: numTicks,
        seed,
        agents: agentConfigs,
        assets: selectedAssets,
      });
      setData(result);
      setCurrentTick(0);
      setIsLoading(false);
      startPlayback(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setIsLoading(false);
    }
  };

  // ── Back to setup ──────────────────────────────────────────────────────
  const handleBackToSetup = () => {
    stopPlayback();
    setData(null);
    setCurrentTick(0);
    setSimComplete(false);
    setError(null);
    setView('setup');
  };

  // ── Setup view ─────────────────────────────────────────────────────────
  if (view === 'setup') {
    return <SetupView onStart={handleStart} isLoading={isLoading} />;
  }

  // ── Arena view ─────────────────────────────────────────────────────────
  const hasReasoning =
    data && Object.values(data.reasoning).some((arr) => arr.length > 0);

  const ht = data?.history_ticks ?? 0;
  const dataIndex = ht + currentTick;

  // Find winner when simulation is complete
  const winner = simComplete && data
    ? [...data.agents].sort((a, b) => b.pnl - a.pnl)[0]
    : null;

  return (
    <div className="h-screen bg-[#08080d] flex flex-col overflow-hidden">
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 border-b border-[#1a1a2a] bg-[#0a0a12] shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <img src="/logo.png" alt="AgenticAlpha" className="h-5 md:h-6 invert" />
          <div className="w-px h-4 bg-[#1e1e2e] hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                isLoading ? 'bg-amber-400 animate-pulse'
                : isRunning ? 'bg-emerald-400 animate-pulse'
                : simComplete ? 'bg-violet-400'
                : 'bg-gray-600'
              }`}
            />
            <span className="text-[10px] text-gray-500 font-mono">
              {isLoading ? 'QUERYING MISTRAL'
                : isRunning ? `LIVE t=${currentTick}`
                : simComplete ? `DONE`
                : 'READY'}
            </span>
          </div>
        </div>

        {/* Market ticker — hidden on very small screens */}
        <div className="hidden sm:block">
          <MarketTicker
            priceHistories={data?.price_histories ?? {}}
            currentTick={dataIndex}
            assets={selectedAssets}
          />
        </div>

        <span className="text-[9px] text-gray-600 font-mono hidden md:block">
          POWERED BY MISTRAL AI
        </span>
      </div>

      {/* ── Mobile Controls Bar ───────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1a1a2a] bg-[#0a0a12] shrink-0 lg:hidden">
        <Controls
          isRunning={isRunning}
          isLoading={isLoading}
          onNewRound={handleNewRound}
          onBackToSetup={handleBackToSetup}
        />
        {/* Mobile market ticker */}
        <div className="sm:hidden overflow-x-auto">
          <MarketTicker
            priceHistories={data?.price_histories ?? {}}
            currentTick={dataIndex}
            assets={selectedAssets}
          />
        </div>
      </div>

      {/* ── Winner Banner ───────────────────────────────────────────────── */}
      {winner && (
        <div className="mx-3 md:mx-4 mt-2 p-2 md:p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 shrink-0">
          <div className="flex items-center justify-center gap-2 md:gap-3">
            <AgentIcon icon={agentMeta[winner.name]?.icon ?? 'trending-up'} size={24} color={agentMeta[winner.name]?.color ?? '#10b981'} />
            <div className="text-center">
              <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-widest">
                ARENA WINNER
              </span>
              <div className="flex items-center gap-2 justify-center mt-0.5">
                <span
                  className="text-sm font-bold font-mono"
                  style={{ color: agentMeta[winner.name]?.color ?? '#10b981' }}
                >
                  {winner.name}
                </span>
                <span className="text-emerald-400 text-sm font-bold font-mono">
                  +${winner.pnl.toFixed(0)}
                </span>
              </div>
            </div>
            <span className="text-base md:text-lg">🏆</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mx-3 md:mx-4 mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs font-mono shrink-0">
          {error}
        </div>
      )}

      {/* ── Main Layout ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar: Activity Feed — desktop only */}
        <div className="hidden lg:block w-56 shrink-0 border-r border-[#1a1a2a] p-2 overflow-hidden">
          <ActivityFeed
            events={data?.events ?? []}
            reasoning={data?.reasoning ?? {}}
            currentTick={currentTick}
            agentMeta={agentMeta}
          />
        </div>

        {/* Center — scrollable on all screens */}
        <div className="flex-1 p-2 md:p-3 space-y-3 overflow-y-auto">
          <PortfolioCards
            pnlHistory={data?.pnl_history ?? {}}
            positionHistory={data?.position_history ?? {}}
            priceHistories={data?.price_histories ?? {}}
            currentTick={dataIndex}
            agentMeta={agentMeta}
            assets={selectedAssets}
          />

          <PriceChart
            priceHistories={data?.price_histories ?? {}}
            currentTick={currentTick}
            historyTicks={ht}
            assets={selectedAssets}
          />

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-3">
            <div className="xl:col-span-3">
              <GeoMap
                events={data?.events ?? []}
                currentTick={currentTick}
                pnlHistory={data?.pnl_history}
                dataIndex={dataIndex}
                agentConfigs={agentConfigs}
              />
            </div>
            <div className="xl:col-span-2">
              <PnLChart
                pnlHistory={data?.pnl_history ?? {}}
                priceHistories={data?.price_histories}
                currentTick={dataIndex}
                historyTicks={ht}
                agentColors={agentColors}
                assets={selectedAssets}
              />
            </div>
          </div>

          {/* AgentPositions — inline on mobile (since sidebar is hidden) */}
          <div className="lg:hidden">
            <AgentPositions
              positionHistory={data?.position_history ?? {}}
              pnlHistory={data?.pnl_history ?? {}}
              currentTick={dataIndex}
              agentMeta={agentMeta}
              assets={selectedAssets}
            />
          </div>

          {hasReasoning && (
            <ReasoningPanel
              reasoning={data!.reasoning}
              currentTick={currentTick}
              agentMeta={agentMeta}
            />
          )}

          {/* Activity Feed — inline on mobile */}
          <div className="lg:hidden">
            <ActivityFeed
              events={data?.events ?? []}
              reasoning={data?.reasoning ?? {}}
              currentTick={currentTick}
              agentMeta={agentMeta}
            />
          </div>

          {data && data.num_ticks > 0 && (
            <PerformanceAnalytics
              agents={data.agents}
              events={data.events}
              pnlHistory={data.pnl_history}
              priceHistories={data.price_histories}
              currentTick={dataIndex}
              historyTicks={ht}
              agentMeta={agentMeta}
              assets={selectedAssets}
            />
          )}
        </div>

        {/* Right Sidebar — desktop only */}
        <div className="hidden lg:block w-52 shrink-0 border-l border-[#1a1a2a] p-2 space-y-2 overflow-y-auto">
          <Controls
            isRunning={isRunning}
            isLoading={isLoading}
            onNewRound={handleNewRound}
            onBackToSetup={handleBackToSetup}
          />
          <AgentPositions
            positionHistory={data?.position_history ?? {}}
            pnlHistory={data?.pnl_history ?? {}}
            currentTick={dataIndex}
            agentMeta={agentMeta}
            assets={selectedAssets}
          />
        </div>
      </div>
    </div>
  );
}
