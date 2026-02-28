# ============================================================================
# SECTION: Simulation Loop
# ============================================================================

"""
Main simulation loop.

For each tick:
1. Update base price (GBM)
2. Reset net order flow
3. Agents observe state and decide
4. Execute trades
5. Apply price impact
6. Log events
7. Record state
"""

import numpy as np

from agents.base_agent import BaseAgent
from core.state import MarketState
from core.price_process import update_price
from core.execution import execute_trade
from simulation.event_log import EventLog
from config import NUM_TICKS, RANDOM_SEED, INITIAL_PRICE


class Simulator:
    """
    Orchestrates the simulation loop.

    Args:
        agents:    List of market agents.
        num_ticks: Number of simulation steps.
        seed:      Random seed for reproducibility.
    """

    def __init__(
        self,
        agents: list[BaseAgent],
        num_ticks: int = NUM_TICKS,
        seed: int = RANDOM_SEED,
    ) -> None:
        self.agents = agents
        self.num_ticks = num_ticks
        self.rng = np.random.default_rng(seed)

        self.state = MarketState(
            tick=0,
            price=INITIAL_PRICE,
            price_history=[INITIAL_PRICE],
            net_order_flow=0.0,
        )
        self.event_log = EventLog()

        # History tracking for analysis / UI
        self.price_history: list[float] = [INITIAL_PRICE]
        self.pnl_history: dict[str, list[float]] = {a.name: [0.0] for a in agents}
        self.position_history: dict[str, list[int]] = {a.name: [0] for a in agents}

    def run(self) -> None:
        """
        Execute the full simulation loop.
        """
        for tick in range(1, self.num_ticks + 1):
            self._step(tick)

    def _step(self, tick: int) -> None:
        """
        Execute a single simulation tick.

        Args:
            tick: Current tick number.
        """
        # ── Reset order flow for this tick ────────────────────────────────
        self.state.net_order_flow = 0.0
        self.state.tick = tick

        # ── Agents decide and execute ─────────────────────────────────────
        for agent in self.agents:
            trade_size = agent.decide(self.state)

            if trade_size != 0:
                execute_trade(agent, trade_size, self.state)
                action = "BUY" if trade_size > 0 else "SELL"
                self.event_log.record(
                    tick=tick,
                    agent_name=agent.name,
                    action=action,
                    detail=f"size={abs(trade_size)}, price={self.state.price:.2f}",
                )

        # ── Update price (GBM + impact from this tick's flow) ─────────────
        new_price = update_price(self.state, self.rng)
        self.state.price = new_price
        self.state.price_history.append(new_price)
        self.price_history.append(new_price)

        self.event_log.record(
            tick=tick,
            agent_name="MARKET",
            action="PRICE_UPDATE",
            detail=f"price={new_price:.2f}, flow={self.state.net_order_flow:+.0f}",
        )

        # ── Record agent states ───────────────────────────────────────────
        for agent in self.agents:
            self.pnl_history[agent.name].append(agent.pnl(new_price))
            self.position_history[agent.name].append(agent.position)
