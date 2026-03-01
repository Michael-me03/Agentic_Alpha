# ============================================================================
# SECTION: Execution Engine (Multi-Asset)
# ============================================================================

"""
Simplified multi-asset execution engine.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from agents.base_agent import BaseAgent

from core.state import MarketState


def execute_trade(
    agent: BaseAgent,
    asset: str,
    trade_size: int,
    state: MarketState,
) -> None:
    """
    Execute a market order for a specific asset.

    Args:
        agent:      The agent executing the trade.
        asset:      Asset symbol (e.g. "BTC").
        trade_size: Signed number of units.
        state:      Current market state.
    """
    if trade_size == 0:
        return

    price = state.prices[asset]
    cost = trade_size * price
    agent.positions[asset] = agent.positions.get(asset, 0) + trade_size
    agent.cash -= cost
    state.net_order_flows[asset] = state.net_order_flows.get(asset, 0.0) + trade_size
