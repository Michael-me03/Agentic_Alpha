# ============================================================================
# SECTION: Market Maker Agent
# ============================================================================

"""
Provides liquidity by trading against the net order flow.

- If net flow is positive (buying pressure) → SELL small amount
- If net flow is negative (selling pressure) → BUY small amount
- Respects inventory limits to avoid excessive directional risk
"""

from agents.base_agent import BaseAgent
from core.state import MarketState
from config import MARKET_MAKER_TRADE_SIZE, MARKET_MAKER_MAX_INVENTORY


class MarketMaker(BaseAgent):
    """
    Liquidity-providing agent that trades against the crowd.

    Args:
        name:          Agent identifier.
        trade_size:    Fixed size per market-making trade.
        max_inventory: Absolute position limit before refusing to trade.
    """

    def __init__(
        self,
        name: str = "MarketMaker",
        trade_size: int = MARKET_MAKER_TRADE_SIZE,
        max_inventory: int = MARKET_MAKER_MAX_INVENTORY,
    ) -> None:
        super().__init__(name)
        self.trade_size = trade_size
        self.max_inventory = max_inventory

    def decide(self, state: MarketState) -> int:
        """
        Trade against net order flow, respecting inventory limits.

        Args:
            state: Current market state.

        Returns:
            Signed trade size.
        """
        flow = state.net_order_flow

        if flow > 0 and self.position > -self.max_inventory:
            return -self.trade_size
        elif flow < 0 and self.position < self.max_inventory:
            return self.trade_size
        return 0
