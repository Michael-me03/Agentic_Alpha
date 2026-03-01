# ============================================================================
# SECTION: Market Maker Agent (Multi-Asset)
# ============================================================================

"""
Provides liquidity by trading against the net order flow.

Scans all assets and picks the one with highest flow imbalance:
- If net flow is positive (buying pressure) → SELL small amount
- If net flow is negative (selling pressure) → BUY small amount
- Respects per-asset inventory limits
"""

from agents.base_agent import BaseAgent, TradeDecision
from core.state import MarketState
from config import ASSET_SYMBOLS, MARKET_MAKER_TRADE_SIZE, MARKET_MAKER_MAX_INVENTORY


class MarketMaker(BaseAgent):
    """
    Liquidity-providing agent that trades against the crowd.

    Args:
        name:          Agent identifier.
        trade_size:    Fixed size per market-making trade.
        max_inventory: Absolute position limit per asset.
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

    def decide(self, state: MarketState) -> TradeDecision:
        """
        Trade against the largest net order flow, respecting inventory limits.

        Args:
            state: Current market state.

        Returns:
            TradeDecision with asset and signed trade size.
        """
        best_asset = ""
        best_flow = 0.0

        for symbol in ASSET_SYMBOLS:
            flow = state.net_order_flows.get(symbol, 0.0)
            pos = self.positions.get(symbol, 0)

            if abs(flow) > abs(best_flow):
                # Check inventory limits before selecting
                if flow > 0 and pos > -self.max_inventory:
                    best_flow = flow
                    best_asset = symbol
                elif flow < 0 and pos < self.max_inventory:
                    best_flow = flow
                    best_asset = symbol

        if not best_asset:
            return TradeDecision()

        if best_flow > 0:
            return TradeDecision(asset=best_asset, trade_size=-self.trade_size)
        elif best_flow < 0:
            return TradeDecision(asset=best_asset, trade_size=self.trade_size)

        return TradeDecision()
