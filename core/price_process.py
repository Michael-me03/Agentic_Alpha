# ============================================================================
# SECTION: Price Process (GBM + Impact)
# ============================================================================

"""
Geometric Brownian Motion price process with linear price impact.

Formula:
    P(t+1) = P(t) * exp(drift * dt + vol * shock) + impact * net_order_flow
"""

import math
import numpy as np

from core.state import MarketState
from config import DRIFT, VOLATILITY, PRICE_IMPACT, DT


def update_price(state: MarketState, rng: np.random.Generator) -> float:
    """
    Compute the next price using GBM + linear price impact.

    Args:
        state: Current market state.
        rng:   NumPy random generator for reproducibility.

    Returns:
        The updated price for the next tick.
    """
    shock = rng.normal()
    gbm_factor = math.exp(DRIFT * DT + VOLATILITY * math.sqrt(DT) * shock)
    new_price = state.price * gbm_factor + PRICE_IMPACT * state.net_order_flow

    # Price floor — asset can't go to zero or negative
    return max(new_price, 0.01)
