# ============================================================================
# SECTION: Price Process (Multi-Asset GBM + Impact)
# ============================================================================

"""
Geometric Brownian Motion price process for each asset independently.

Supports dynamic asset parameters — no longer limited to hardcoded assets.
"""

import math

import numpy as np

from core.state import MarketState
from config import ASSETS, PRICE_IMPACT, DT

# Module-level asset params override (set by Simulator before running)
_dynamic_asset_params: dict[str, dict] | None = None


def set_asset_params(params: dict[str, dict]) -> None:
    """
    Set dynamic asset parameters for the price process.

    Args:
        params: Dict of symbol → {drift, volatility, initial_price, name}.
    """
    global _dynamic_asset_params
    _dynamic_asset_params = params


def update_prices(state: MarketState, rng: np.random.Generator) -> dict[str, float]:
    """
    Compute next prices for all assets using GBM + linear price impact.

    Args:
        state: Current market state.
        rng:   NumPy random generator.

    Returns:
        Dict of updated prices per asset.
    """
    new_prices = {}
    params_source = _dynamic_asset_params or ASSETS

    for symbol in state.prices:
        params = params_source.get(symbol) or ASSETS.get(symbol)
        if not params:
            # Unknown asset — keep price unchanged
            new_prices[symbol] = state.prices[symbol]
            continue

        shock = rng.normal()
        drift = params.get("drift", 0.0002)
        vol = params.get("volatility", 0.025)
        flow = state.net_order_flows.get(symbol, 0.0)

        gbm_factor = math.exp(drift * DT + vol * math.sqrt(DT) * shock)
        new_price = state.prices[symbol] * gbm_factor + PRICE_IMPACT * flow
        new_prices[symbol] = max(new_price, 0.01)

    return new_prices
