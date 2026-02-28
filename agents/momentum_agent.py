# ============================================================================
# SECTION: Momentum Agent
# ============================================================================

"""
Trades based on recent returns — amplifies existing trends.

- If average recent return > threshold  → BUY
- If average recent return < -threshold → SELL
- Otherwise                             → HOLD
"""

from agents.base_agent import BaseAgent
from core.state import MarketState
from config import MOMENTUM_LOOKBACK, MOMENTUM_THRESHOLD, MOMENTUM_TRADE_SIZE


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

    def decide(self, state: MarketState) -> int:
        """
        Decide trade based on average recent return.

        Args:
            state: Current market state.

        Returns:
            Signed trade size.
        """
        returns = state.recent_returns(self.lookback)
        if not returns:
            return 0

        avg_return = sum(returns) / len(returns)

        if avg_return > self.threshold:
            return self.trade_size
        elif avg_return < -self.threshold:
            return -self.trade_size
        return 0
