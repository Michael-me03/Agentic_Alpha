# ============================================================================
# SECTION: Retail Noise Agent
# ============================================================================

"""
Emotional retail trader that overreacts to price moves.

- Strong up move   → buys large (FOMO)
- Strong down move → panic sells large
- Moderate move    → small random trades
- No risk management whatsoever

This agent introduces instability and realism.
"""

import numpy as np

from agents.base_agent import BaseAgent
from core.state import MarketState
from config import (
    RETAIL_STRONG_MOVE,
    RETAIL_TRADE_SIZE_SMALL,
    RETAIL_TRADE_SIZE_LARGE,
)


class RetailNoiseAgent(BaseAgent):
    """
    Emotional retail participant with no discipline.

    Args:
        name:             Agent identifier.
        strong_move:      Return threshold for 'strong' move detection.
        trade_size_small: Size for moderate reactions.
        trade_size_large: Size for strong reactions (FOMO/panic).
        rng:              NumPy random generator for noise.
    """

    def __init__(
        self,
        name: str = "Retail",
        strong_move: float = RETAIL_STRONG_MOVE,
        trade_size_small: int = RETAIL_TRADE_SIZE_SMALL,
        trade_size_large: int = RETAIL_TRADE_SIZE_LARGE,
        rng: np.random.Generator | None = None,
    ) -> None:
        super().__init__(name)
        self.strong_move = strong_move
        self.trade_size_small = trade_size_small
        self.trade_size_large = trade_size_large
        self.rng = rng or np.random.default_rng()

    def decide(self, state: MarketState) -> int:
        """
        React emotionally to the most recent price move.

        Args:
            state: Current market state.

        Returns:
            Signed trade size.
        """
        returns = state.recent_returns(1)
        if not returns:
            return 0

        last_return = returns[-1]

        # Strong up → FOMO buy
        if last_return > self.strong_move:
            return self.trade_size_large

        # Strong down → panic sell
        if last_return < -self.strong_move:
            return -self.trade_size_large

        # Otherwise → small random noise
        return int(self.rng.choice([-self.trade_size_small, 0, self.trade_size_small]))
