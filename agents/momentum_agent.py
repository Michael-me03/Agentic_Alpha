# ============================================================================
# SECTION: Momentum Agent (Multi-Asset)
# ============================================================================

"""
Trades based on recent returns — amplifies existing trends.

Scans all assets and picks the one with the strongest signal:
- If average recent return > threshold  → BUY that asset
- If average recent return < -threshold → SELL that asset
- Otherwise                             → HOLD
"""

from agents.base_agent import BaseAgent, TradeDecision
from core.state import MarketState
from config import (
    ASSET_SYMBOLS,
    MOMENTUM_LOOKBACK,
    MOMENTUM_THRESHOLD,
    MOMENTUM_TRADE_SIZE,
)


class MomentumAgent(BaseAgent):
    """
    Trend-following agent that buys into upward momentum and sells into downward momentum.

    Args:
        name:       Agent identifier.
        lookback:   Number of ticks to compute average return over.
        threshold:  Minimum absolute return to trigger a trade.
        trade_size: Fixed trade size per decision.
    """

    def __init__(
        self,
        name: str = "Momentum",
        lookback: int = MOMENTUM_LOOKBACK,
        threshold: float = MOMENTUM_THRESHOLD,
        trade_size: int = MOMENTUM_TRADE_SIZE,
    ) -> None:
        super().__init__(name)
        self.lookback = lookback
        self.threshold = threshold
        self.trade_size = trade_size

    def decide(self, state: MarketState) -> TradeDecision:
        """
        Pick the asset with strongest momentum and trade it.

        Args:
            state: Current market state.

        Returns:
            TradeDecision with asset and signed trade size.
        """
        best_asset = ""
        best_signal = 0.0

        for symbol in ASSET_SYMBOLS:
            returns = state.recent_returns(symbol, self.lookback)
            if not returns:
                continue
            avg_return = sum(returns) / len(returns)

            if abs(avg_return) > abs(best_signal):
                best_signal = avg_return
                best_asset = symbol

        if not best_asset:
            return TradeDecision()

        if best_signal > self.threshold:
            return TradeDecision(asset=best_asset, trade_size=self.trade_size)
        elif best_signal < -self.threshold:
            return TradeDecision(asset=best_asset, trade_size=-self.trade_size)

        return TradeDecision()
