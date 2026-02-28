# ============================================================================
# SECTION: Market State
# ============================================================================

"""
MarketState holds the complete observable state of the market at each tick.

Agents read from this state. The simulation loop writes to it.
"""

from dataclasses import dataclass, field


@dataclass
class MarketState:
    """
    Snapshot of the market at the current tick.

    Attributes:
        tick:           Current time step.
        price:          Current asset price.
        price_history:  List of all past prices (including current).
        net_order_flow: Sum of signed trade sizes this tick.
    """

    tick: int = 0
    price: float = 100.0
    price_history: list[float] = field(default_factory=lambda: [100.0])
    net_order_flow: float = 0.0

    def recent_prices(self, n: int) -> list[float]:
        """
        Return the last n prices from history.

        Args:
            n: Number of recent prices to return.

        Returns:
            List of up to n most recent prices.
        """
        return self.price_history[-n:]

    def recent_returns(self, n: int) -> list[float]:
        """
        Compute the last n log-returns from price history.

        Args:
            n: Number of recent returns to compute.

        Returns:
            List of recent returns (may be shorter than n if not enough history).
        """
        prices = self.price_history[-(n + 1):]
        if len(prices) < 2:
            return []
        return [
            (prices[i] - prices[i - 1]) / prices[i - 1]
            for i in range(1, len(prices))
        ]
