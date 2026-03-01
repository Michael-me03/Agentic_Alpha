# ============================================================================
# SECTION: FastAPI API (Agent Arena)
# ============================================================================

"""
REST API for the Agentic Alpha Agent Arena.

Users create custom LLM-powered agents via system prompts.
All agents are powered by Mistral AI and can trade any asset (stocks, crypto, ETFs).
"""

import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from agents.custom_agent import CustomAgent
from simulation.simulator import Simulator
from config import RANDOM_SEED

logger = logging.getLogger(__name__)

# ============================================================================
# SECTION: App Setup
# ============================================================================

app = FastAPI(title="Agentic Alpha — Agent Arena API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Frontend static files (production) ────────────────────────────────────
FRONTEND_DIR = Path(__file__).parent / "frontend" / "dist"


# ============================================================================
# SECTION: Request / Response Models
# ============================================================================

class AgentConfigModel(BaseModel):
    """User-defined agent configuration."""

    name: str
    color: str
    system_prompt: str
    icon: str = "🤖"
    city: str = "New York"


class SimulationRequest(BaseModel):
    """Parameters for a simulation run."""

    num_ticks: int = 40
    seed: int = RANDOM_SEED
    agents: list[AgentConfigModel] = []
    assets: list[str] = ["BTC-USD", "ETH-USD", "SOL-USD"]


class AgentSnapshot(BaseModel):
    """Final state of an agent after simulation."""

    name: str
    positions: dict[str, int]
    cash: float
    pnl: float


class EventRecord(BaseModel):
    """A single simulation event."""

    tick: int
    agent_name: str
    action: str
    detail: str


class ReasoningEntry(BaseModel):
    """A single LLM reasoning record."""

    tick: int
    action: str
    asset: str = ""
    reason: str


class SimulationResponse(BaseModel):
    """Full simulation result with all history data."""

    price_histories: dict[str, list[float]]
    pnl_history: dict[str, list[float]]
    position_history: dict[str, dict[str, list[int]]]
    agents: list[AgentSnapshot]
    events: list[EventRecord]
    reasoning: dict[str, list[ReasoningEntry]]
    num_ticks: int
    history_ticks: int
    asset_info: dict[str, dict[str, str]]
    agent_configs: list[AgentConfigModel]


# ============================================================================
# SECTION: Endpoints
# ============================================================================

@app.get("/api/health")
async def health() -> dict[str, str]:
    """Health check."""
    return {"status": "ok"}


@app.get("/api/search-assets")
async def search_assets_endpoint(q: str = Query(..., min_length=1)) -> list[dict]:
    """
    Search Yahoo Finance for matching tickers.

    Args:
        q: Search query (e.g. "nvidia", "bitcoin", "SPY").

    Returns:
        List of matching assets with symbol, name, type, exchange.
    """
    try:
        from core.historical_prices import search_assets
        return search_assets(q)
    except Exception as e:
        logger.warning(f"Asset search failed: {e}")
        return []


@app.get("/api/presets")
async def get_presets() -> list[dict]:
    """
    Return available agent personality presets for the Setup view.

    Returns:
        List of preset agent configs with name, system_prompt, icon, color, city.
    """
    from llm.decision_layer import PERSONALITIES

    preset_meta = {
        "Momentum": {
            "icon": "trending-up",
            "color": "#8b5cf6",
            "city": "New York",
            "description": "Aggressive trend chaser — buys into pumps, shorts dumps",
        },
        "MarketMaker": {
            "icon": "landmark",
            "color": "#06b6d4",
            "city": "London",
            "description": "Calm liquidity provider — always trades against the crowd",
        },
        "RiskController": {
            "icon": "shield",
            "color": "#f59e0b",
            "city": "Zurich",
            "description": "Cautious capital preserver — cuts risk when volatility spikes",
        },
        "Retail": {
            "icon": "dice",
            "color": "#ef4444",
            "city": "Tokyo",
            "description": "Emotional FOMO trader — no discipline, pure feelings",
        },
    }

    return [
        {
            "name": name,
            "system_prompt": prompt,
            **preset_meta.get(name, {"icon": "brain", "color": "#888", "city": "NYC", "description": ""}),
        }
        for name, prompt in PERSONALITIES.items()
    ]


@app.post("/api/simulate", response_model=SimulationResponse)
async def simulate(request: SimulationRequest) -> SimulationResponse:
    """
    Run the Mistral-powered multi-asset simulation with custom agents.

    Supports any Yahoo Finance ticker (stocks, crypto, ETFs).

    Args:
        request: Simulation parameters including user-defined agents and assets.

    Returns:
        Complete simulation results for the Arena view.
    """
    from core.historical_prices import get_multi_asset_history, build_asset_params

    # ── Validate agents ───────────────────────────────────────────────────
    if len(request.agents) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 agents")
    if len(request.agents) > 4:
        raise HTTPException(status_code=400, detail="Maximum 4 agents")

    names = [a.name for a in request.agents]
    if len(names) != len(set(names)):
        raise HTTPException(status_code=400, detail="Agent names must be unique")

    # ── Validate assets ────────────────────────────────────────────────────
    if not request.assets or len(request.assets) < 1:
        raise HTTPException(status_code=400, detail="Select at least 1 asset")
    if len(request.assets) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 assets")

    # ── Fetch historical prices for all selected assets ───────────────────
    price_histories = get_multi_asset_history(request.assets)

    if not price_histories:
        raise HTTPException(
            status_code=400,
            detail="Could not fetch price data for any of the selected assets",
        )

    # Only use assets that we successfully fetched
    selected_assets = list(price_histories.keys())
    history_ticks = len(next(iter(price_histories.values()))) - 1

    # ── Compute GBM parameters from historical data ───────────────────────
    asset_params = build_asset_params(price_histories)

    # Start prices = last price from history
    start_prices = {s: prices[-1] for s, prices in price_histories.items()}

    # ── Create custom agents ──────────────────────────────────────────────
    agents = [
        CustomAgent(name=cfg.name, system_prompt=cfg.system_prompt)
        for cfg in request.agents
    ]

    # ── Run simulation (LLM every 5 ticks) ────────────────────────────────
    sim = Simulator(
        agents=agents,
        num_ticks=request.num_ticks,
        seed=request.seed,
        llm_interval=5,
        history_ticks=0,
        start_prices=start_prices,
        asset_symbols=selected_assets,
        asset_params=asset_params,
    )
    sim.run()

    # ── Build response ────────────────────────────────────────────────────
    final_prices = sim.state.prices

    # Merge pre-history + simulation prices
    merged_price_histories: dict[str, list[float]] = {}
    for s in selected_assets:
        merged_price_histories[s] = [
            round(p, 4) for p in price_histories[s]
        ] + [
            round(p, 4) for p in sim.price_histories[s][1:]
        ]

    # Merge position/pnl histories with pre-history zeros
    first_asset = selected_assets[0]
    merged_pnl: dict[str, list[float]] = {}
    merged_positions: dict[str, dict[str, list[int]]] = {}
    for a in agents:
        pre_zeros = [0.0] * len(price_histories[first_asset])
        merged_pnl[a.name] = pre_zeros + [
            round(v, 2) for v in sim.pnl_history[a.name][1:]
        ]
        merged_positions[a.name] = {}
        for s in selected_assets:
            pre_pos = [0] * len(price_histories[first_asset])
            merged_positions[a.name][s] = pre_pos + sim.position_history[a.name][s][1:]

    agent_snapshots = [
        AgentSnapshot(
            name=a.name,
            positions={s: a.positions.get(s, 0) for s in selected_assets},
            cash=round(a.cash, 2),
            pnl=round(a.pnl(final_prices), 2),
        )
        for a in agents
    ]

    events = [
        EventRecord(
            tick=e.tick,
            agent_name=e.agent_name,
            action=e.action,
            detail=e.detail,
        )
        for e in sim.event_log.events
    ]

    reasoning = {
        name: [ReasoningEntry(**entry) for entry in entries]
        for name, entries in sim.reasoning_history.items()
    }

    return SimulationResponse(
        price_histories=merged_price_histories,
        pnl_history=merged_pnl,
        position_history=merged_positions,
        agents=agent_snapshots,
        events=events,
        reasoning=reasoning,
        num_ticks=request.num_ticks,
        history_ticks=history_ticks,
        asset_info={
            s: {"name": asset_params[s].get("name", s), "symbol": s}
            for s in selected_assets
        },
        agent_configs=[
            AgentConfigModel(**cfg.model_dump()) for cfg in request.agents
        ],
    )


# ============================================================================
# SECTION: SPA Static File Serving (must be AFTER all API routes)
# ============================================================================

if FRONTEND_DIR.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="assets")

    @app.get("/logo.png")
    async def serve_logo() -> FileResponse:
        """Serve the logo from frontend dist."""
        return FileResponse(FRONTEND_DIR / "logo.png")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str) -> FileResponse:
        """Serve the SPA — all non-API routes return index.html."""
        file_path = FRONTEND_DIR / full_path
        if full_path and file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIR / "index.html")
