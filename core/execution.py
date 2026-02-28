# ============================================================================
# SECTION: Execution Engine
# ============================================================================

"""
Simplified execution engine.

- Market orders only
- Immediate fill at current price
- Linear price impact (applied via price_process)
- No orderbook
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from agents.base_agent import BaseAgent

from core.state import MarketState


def execute_trade(agent: BaseAgent, trade_size: int, state: MarketState) -> None:
    """
    Execute a market order for an agent.

    Positive trade_size = BUY, negative = SELL.

    Args:
        agent:      The agent executing the trade.
        trade_size: Signed number of units to trade.
        state:      Current market state (price used for fill).
    """
    if trade_size == 0:
        return

    cost = trade_size * state.price
    agent.position += trade_size
    agent.cash -= cost
    state.net_order_flow += trade_size


def compute_pnl(agent: BaseAgent, current_price: float) -> float:
    """
    Compute mark-to-market PnL for an agent.

    Args:
        agent:         The agent to compute PnL for.
        current_price: Current market price.

    Returns:
        Total PnL (unrealized + realized).
    """
    return agent.position * current_price + agent.cash - agent.initial_cash
