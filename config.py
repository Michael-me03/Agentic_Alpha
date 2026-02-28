# ============================================================================
# SECTION: Simulation Configuration
# ============================================================================

"""
Global configuration constants for Agentic Alpha.

All simulation parameters live here — no magic numbers elsewhere.
"""

# ----------------------------------------------------------------------------
# Sub-section: Market Parameters
# ----------------------------------------------------------------------------

INITIAL_PRICE: float = 100.0
DRIFT: float = 0.0001
VOLATILITY: float = 0.02
PRICE_IMPACT: float = 0.001
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
