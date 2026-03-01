# ============================================================================
# SECTION: Market State (Multi-Asset)
# ============================================================================

"""
MarketState holds the complete observable state for all assets at each tick.
"""

from dataclasses import dataclass, field
from config import ASSET_SYMBOLS


@dataclass
class MarketState:
    """
    Snapshot of the market at the current tick — supports multiple assets.

    Attributes:
        tick:             Current time step.
        prices:           Current price per asset {"BTC": 62500, ...}.
        price_histories:  Price history per asset {"BTC": [...], ...}.
        net_order_flows:  Net order flow per asset this tick.
    """

    tick: int = 0
    prices: dict[str, float] = field(default_factory=dict)
    price_histories: dict[str, list[float]] = field(default_factory=dict)
    net_order_flows: dict[str, float] = field(default_factory=dict)

    def recent_prices(self, asset: str, n: int) -> list[float]:
        """
        Return the last n prices for a given asset.

        Args:
            asset: Asset symbol (e.g. "BTC").
            n:     Number of recent prices.

        Returns:
            List of up to n most recent prices.
        """
        return self.price_histories.get(asset, [])[-n:]

    def recent_returns(self, asset: str, n: int) -> list[float]:
        """
        Compute the last n returns for a given asset.

        Args:
            asset: Asset symbol.
            n:     Number of recent returns.

        Returns:
            List of recent returns.
        """
        prices = self.price_histories.get(asset, [])[-(n + 1):]
        if len(prices) < 2:
            return []
        return [
            (prices[i] - prices[i - 1]) / prices[i - 1]
            for i in range(1, len(prices))
        ]
