# ============================================================================
# SECTION: Simulation Loop (Multi-Asset)
# ============================================================================

"""
Main simulation loop — all agents are LLM-powered via Mistral API.

For each tick:
1. Reset net order flows for all assets
2. Each agent queries Mistral for a decision (with deterministic fallback)
3. Execute trades per asset
4. Update prices (GBM + impact) for all assets
5. Log events + reasoning
6. Record per-agent per-asset state
"""

from __future__ import annotations

import logging
import math

import numpy as np

from agents.base_agent import BaseAgent, TradeDecision
from core.state import MarketState
from core.price_process import update_prices
from core.execution import execute_trade
from simulation.event_log import EventLog
from config import NUM_TICKS, RANDOM_SEED, ASSETS, ASSET_SYMBOLS, DT

logger = logging.getLogger(__name__)


class Simulator:
    """
    Orchestrates the multi-asset simulation loop with Mistral-powered agents.

    Args:
        agents:        List of market agents.
        num_ticks:     Number of simulation steps.
        seed:          Random seed for reproducibility.
        history_ticks: Number of pre-history ticks to generate.
        llm_interval:  Call LLM every N ticks.
        start_prices:  Dict of starting prices for continue mode.
    """

    def __init__(
        self,
        agents: list[BaseAgent],
        num_ticks: int = NUM_TICKS,
        seed: int = RANDOM_SEED,
        history_ticks: int = 250,
        llm_interval: int = 5,
        start_prices: dict[str, float] | None = None,
        asset_symbols: list[str] | None = None,
        asset_params: dict[str, dict] | None = None,
    ) -> None:
        self.agents = agents
        self.num_ticks = num_ticks
        self.rng = np.random.default_rng(seed)
        self.history_ticks = history_ticks
        self.llm_interval = max(1, llm_interval)
        self.asset_symbols = asset_symbols or ASSET_SYMBOLS
        self.asset_params = asset_params or ASSETS

        # ── Generate pre-history or start from given prices ─────────────
        if start_prices is not None:
            # Continue mode: no history
            pre_histories: dict[str, list[float]] = {
                s: [start_prices.get(s, self.asset_params.get(s, {}).get("initial_price", 100.0))]
                for s in self.asset_symbols
            }
            self.history_ticks = 0
        elif history_ticks > 0:
            pre_histories = self._generate_pre_history(history_ticks)
        else:
            pre_histories = {
                s: [self.asset_params.get(s, {}).get("initial_price", 100.0)]
                for s in self.asset_symbols
            }

        # Current prices
        current_prices = {s: pre_histories[s][-1] for s in self.asset_symbols}

        self.state = MarketState(
            tick=0,
            prices=dict(current_prices),
            price_histories={s: list(pre_histories[s]) for s in self.asset_symbols},
            net_order_flows={s: 0.0 for s in self.asset_symbols},
        )
        self.event_log = EventLog()

        # History tracking — includes pre-history
        self.price_histories: dict[str, list[float]] = {
            s: list(pre_histories[s]) for s in self.asset_symbols
        }
        first_asset = self.asset_symbols[0]
        self.pnl_history: dict[str, list[float]] = {
            a.name: [0.0] * len(pre_histories[first_asset]) for a in agents
        }
        # Per-agent per-asset position history
        self.position_history: dict[str, dict[str, list[int]]] = {
            a.name: {
                s: [0] * len(pre_histories[first_asset])
                for s in self.asset_symbols
            }
            for a in agents
        }

        # LLM reasoning history
        self.reasoning_history: dict[str, list[dict]] = {a.name: [] for a in agents}

        # LLM client (lazy init)
        self._llm_client = None

    def _generate_pre_history(self, ticks: int) -> dict[str, list[float]]:
        """
        Generate synthetic price history for all assets before the simulation starts.

        Args:
            ticks: Number of historical ticks to generate.

        Returns:
            Dict of price histories per asset.
        """
        hist_rng = np.random.default_rng(self.rng.integers(0, 2**31))
        histories: dict[str, list[float]] = {}

        for symbol in self.asset_symbols:
            params = self.asset_params.get(symbol, ASSETS.get(symbol, {}))
            price = params.get("initial_price", 100.0)
            prices = [price]
            drift = params.get("drift", 0.0002)
            vol = params.get("volatility", 0.025)

            for _ in range(ticks):
                shock = hist_rng.normal()
                price = price * math.exp(drift * DT + vol * math.sqrt(DT) * shock)
                price = max(price, 0.01)
                prices.append(price)

            histories[symbol] = prices

        return histories

    def _get_llm_client(self):
        """Lazy-initialize the Mistral client."""
        if self._llm_client is None:
            from llm.mistral_client import MistralClient
            self._llm_client = MistralClient()
        return self._llm_client

    def run(self) -> None:
        """
        Execute the full simulation loop.
        """
        # Set dynamic asset params for price process
        from core.price_process import set_asset_params
        set_asset_params(self.asset_params)

        for tick in range(1, self.num_ticks + 1):
            self._step(tick)

    def _step(self, tick: int) -> None:
        """
        Execute a single simulation tick.

        Args:
            tick: Current tick number.
        """
        # ── Reset order flows for all assets ────────────────────────────
        for s in self.asset_symbols:
            self.state.net_order_flows[s] = 0.0
        self.state.tick = tick

        # ── Agents decide and execute ───────────────────────────────────
        is_llm_tick = (tick % self.llm_interval == 0)

        for agent in self.agents:
            decision = TradeDecision()
            reason = ""

            if is_llm_tick:
                decision, reason = self._llm_decide(agent)

            # Deterministic between LLM ticks or on LLM failure
            if decision.trade_size == 0 and reason == "":
                decision = agent.decide(self.state)

            if decision.trade_size != 0 and decision.asset:
                execute_trade(agent, decision.asset, decision.trade_size, self.state)
                action = "BUY" if decision.trade_size > 0 else "SELL"
                price = self.state.prices[decision.asset]
                detail = f"{decision.asset} size={abs(decision.trade_size)}, price={price:,.2f}"
                if reason:
                    detail += f" | {reason}"
                self.event_log.record(
                    tick=tick,
                    agent_name=agent.name,
                    action=action,
                    detail=detail,
                )
            elif reason:
                self.event_log.record(
                    tick=tick,
                    agent_name=agent.name,
                    action="HOLD",
                    detail=reason,
                )

            # Store reasoning
            if reason and reason != "(deterministic fallback)":
                self.reasoning_history[agent.name].append({
                    "tick": tick,
                    "action": "BUY" if decision.trade_size > 0 else (
                        "SELL" if decision.trade_size < 0 else "HOLD"
                    ),
                    "asset": decision.asset,
                    "reason": reason,
                })

        # ── Update prices (GBM + impact from this tick's flow) ──────────
        new_prices = update_prices(self.state, self.rng)
        self.state.prices = new_prices

        for symbol in self.asset_symbols:
            self.state.price_histories[symbol].append(new_prices[symbol])
            self.price_histories[symbol].append(new_prices[symbol])

        prices_str = " | ".join(f"{s}={new_prices[s]:,.2f}" for s in self.asset_symbols)
        self.event_log.record(
            tick=tick,
            agent_name="MARKET",
            action="PRICE_UPDATE",
            detail=prices_str,
        )

        # ── Record agent states ─────────────────────────────────────────
        for agent in self.agents:
            self.pnl_history[agent.name].append(agent.pnl(new_prices))
            for symbol in self.asset_symbols:
                self.position_history[agent.name][symbol].append(
                    agent.positions.get(symbol, 0)
                )

    def _llm_decide(self, agent: BaseAgent) -> tuple[TradeDecision, str]:
        """
        Get a decision from the Mistral LLM.

        Args:
            agent: The agent requesting a decision.

        Returns:
            Tuple of (TradeDecision, reason string).
            Returns (TradeDecision(), "") on failure.
        """
        try:
            from llm.decision_layer import get_llm_decision

            client = self._get_llm_client()
            decision = get_llm_decision(client, agent, self.state)

            if decision is None:
                return TradeDecision(), ""

            return (
                TradeDecision(asset=decision.asset, trade_size=decision.trade_size),
                decision.reason,
            )

        except Exception as e:
            logger.warning(f"LLM decision failed for {agent.name}: {e}")
            return TradeDecision(), ""
