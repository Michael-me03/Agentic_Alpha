# ============================================================================
# SECTION: Risk Controller Agent (Multi-Asset)
# ============================================================================

"""
Reduces exposure during periods of high volatility.

Scans all assets:
- Measures recent return standard deviation per asset
- If vol > threshold on any held asset → reduce that position
- Acts as a stabilizer in the market
"""

import math

from agents.base_agent import BaseAgent, TradeDecision
from core.state import MarketState
from config import ASSET_SYMBOLS, RISK_VOL_LOOKBACK, RISK_VOL_THRESHOLD, RISK_REDUCE_FRACTION


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

    def decide(self, state: MarketState) -> TradeDecision:
        """
        Reduce the most volatile position if vol exceeds threshold.

        Args:
            state: Current market state.

        Returns:
            TradeDecision (always reduces exposure toward zero).
        """
        worst_asset = ""
        worst_vol = 0.0

        for symbol in ASSET_SYMBOLS:
            pos = self.positions.get(symbol, 0)
            if pos == 0:
                continue

            returns = state.recent_returns(symbol, self.vol_lookback)
            if len(returns) < 2:
                continue

            mean_r = sum(returns) / len(returns)
            variance = sum((r - mean_r) ** 2 for r in returns) / len(returns)
            vol = math.sqrt(variance)

            if vol > self.vol_threshold and vol > worst_vol:
                worst_vol = vol
                worst_asset = symbol

        if not worst_asset:
            return TradeDecision()

        pos = self.positions[worst_asset]
        reduce_amount = int(abs(pos) * self.reduce_fraction)
        if reduce_amount == 0:
            reduce_amount = 1

        # Sell if long, buy if short
        trade_size = -reduce_amount if pos > 0 else reduce_amount
        return TradeDecision(asset=worst_asset, trade_size=trade_size)
