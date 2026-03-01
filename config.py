# ============================================================================
# SECTION: Simulation Configuration
# ============================================================================

"""
Global configuration constants for Agentic Alpha.

All simulation parameters live here — no magic numbers elsewhere.
"""

# ----------------------------------------------------------------------------
# Sub-section: Asset Definitions (3 Crypto Currencies)
# ----------------------------------------------------------------------------

ASSETS = {
    "BTC": {"name": "Bitcoin",  "initial_price": 62_500.0, "drift": 0.0002, "volatility": 0.025},
    "ETH": {"name": "Ethereum", "initial_price": 3_200.0,  "drift": 0.0003, "volatility": 0.030},
    "SOL": {"name": "Solana",   "initial_price": 145.0,    "drift": 0.0004, "volatility": 0.040},
}

ASSET_SYMBOLS = list(ASSETS.keys())  # ["BTC", "ETH", "SOL"]

# ----------------------------------------------------------------------------
# Sub-section: Market Parameters
# ----------------------------------------------------------------------------

PRICE_IMPACT: float = 0.0001
DT: float = 1.0

# ----------------------------------------------------------------------------
# Sub-section: Simulation Parameters
# ----------------------------------------------------------------------------

NUM_TICKS: int = 200
RANDOM_SEED: int = 42

# ----------------------------------------------------------------------------
# Sub-section: Agent Parameters
# ----------------------------------------------------------------------------

AGENT_INITIAL_CASH: float = 100_000.0

# Momentum Agent
MOMENTUM_LOOKBACK: int = 5
MOMENTUM_THRESHOLD: float = 0.005
MOMENTUM_TRADE_SIZE: int = 10

# Market Maker
MARKET_MAKER_TRADE_SIZE: int = 5
MARKET_MAKER_MAX_INVENTORY: int = 50

# Risk Controller
RISK_VOL_LOOKBACK: int = 10
RISK_VOL_THRESHOLD: float = 0.03
RISK_REDUCE_FRACTION: float = 0.5

# Retail Noise Agent
RETAIL_STRONG_MOVE: float = 0.01
RETAIL_TRADE_SIZE_SMALL: int = 5
RETAIL_TRADE_SIZE_LARGE: int = 20
