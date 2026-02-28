# ============================================================================
# SECTION: Risk Controller Agent
# ============================================================================

"""
Reduces exposure during periods of high volatility.

- Measures recent return standard deviation
- If vol > threshold → reduce position by a fraction
- Acts as a stabilizer in the market
"""

import math

from agents.base_agent import BaseAgent
from core.state import MarketState
from config import RISK_VOL_LOOKBACK, RISK_VOL_THRESHOLD, RISK_REDUCE_FRACTION


class RiskController(BaseAgent):
    """
    Volatility-sensitive agent that de-risks when markets get turbulent.

    Args:
        name:            Agent identifier.
        vol_lookback:    Number of ticks for volatility estimation.
        vol_threshold:   Volatility level that triggers de-risking.
        reduce_fraction: Fraction of position to close when triggered.
    """

    def __init__(
        self,
        name: str = "RiskController",
        vol_lookback: int = RISK_VOL_LOOKBACK,
        vol_threshold: float = RISK_VOL_THRESHOLD,
        reduce_fraction: float = RISK_REDUCE_FRACTION,
    ) -> None:
        super().__init__(name)
        self.vol_lookback = vol_lookback
        self.vol_threshold = vol_threshold
        self.reduce_fraction = reduce_fraction

    def decide(self, state: MarketState) -> int:
        """
        Reduce position if recent volatility exceeds threshold.

        Args:
            state: Current market state.

        Returns:
            Signed trade size (always reduces exposure toward zero).
        """
        returns = state.recent_returns(self.vol_lookback)
        if len(returns) < 2:
            return 0

        # Compute realized volatility (std of returns)
        mean_r = sum(returns) / len(returns)
        variance = sum((r - mean_r) ** 2 for r in returns) / len(returns)
        vol = math.sqrt(variance)

        if vol > self.vol_threshold and self.position != 0:
            reduce_amount = int(abs(self.position) * self.reduce_fraction)
            if reduce_amount == 0:
                reduce_amount = 1
            # Sell if long, buy if short
            return -reduce_amount if self.position > 0 else reduce_amount

        return 0
