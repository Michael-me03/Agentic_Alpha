# ============================================================================
# SECTION: Historical Prices (Any Asset via yfinance)
# ============================================================================

"""
Fetches historical prices for any stock, crypto, or ETF via Yahoo Finance.

Supports:
- Stocks: NVDA, AAPL, TSLA, MSFT, etc.
- Crypto: BTC-USD, ETH-USD, SOL-USD, etc.
- ETFs:   SPY, QQQ, etc.

Caches results per symbol in data/price_cache/ to avoid repeated API calls.
"""

import json
import logging
import time
import math
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)

# ----------------------------------------------------------------------------
# Sub-section: Configuration
# ----------------------------------------------------------------------------

CACHE_DIR = Path(__file__).parent.parent / "data" / "price_cache"
CACHE_MAX_AGE_HOURS = 12


# ============================================================================
# SECTION: Search Assets
# ============================================================================

def search_assets(query: str, max_results: int = 8) -> list[dict]:
    """
    Search Yahoo Finance for matching tickers.

    Args:
        query:       Search query (e.g. "nvidia", "bitcoin", "SPY").
        max_results: Maximum number of results.

    Returns:
        List of dicts with symbol, name, type, exchange.
    """
    import ssl
    import urllib.request

    url = (
        f"https://query2.finance.yahoo.com/v1/finance/search"
        f"?q={query}&quotesCount={max_results}&newsCount=0&listsCount=0"
    )

    ctx = ssl.create_default_context()
    try:
        import certifi
        ctx.load_verify_locations(certifi.where())
    except ImportError:
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
    })

    with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
        data = json.loads(resp.read())

    results = []
    valid_types = {"EQUITY", "CRYPTOCURRENCY", "ETF", "INDEX"}

    for q in data.get("quotes", []):
        qtype = q.get("quoteType", "")
        if qtype not in valid_types:
            continue
        results.append({
            "symbol": q["symbol"],
            "name": q.get("shortname", q.get("longname", q["symbol"])),
            "type": qtype,
            "exchange": q.get("exchange", ""),
        })

    return results[:max_results]


# ============================================================================
# SECTION: Fetch Historical Prices
# ============================================================================

def _load_symbol_cache(symbol: str) -> list[float] | None:
    """
    Load cached prices for a single symbol.

    Args:
        symbol: Ticker symbol.

    Returns:
        List of prices, or None if cache is stale/missing.
    """
    safe_name = symbol.replace("/", "_").replace("^", "_")
    cache_file = CACHE_DIR / f"{safe_name}.json"

    if not cache_file.exists():
        return None

    try:
        cached = json.loads(cache_file.read_text())
        age_hours = (time.time() - cached.get("ts", 0)) / 3600
        if age_hours > CACHE_MAX_AGE_HOURS:
            return None
        return cached.get("prices")
    except Exception:
        return None


def _save_symbol_cache(symbol: str, prices: list[float]) -> None:
    """
    Save prices for a single symbol to cache.

    Args:
        symbol: Ticker symbol.
        prices: List of daily close prices.
    """
    try:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        safe_name = symbol.replace("/", "_").replace("^", "_")
        cache_file = CACHE_DIR / f"{safe_name}.json"
        cache_file.write_text(json.dumps({"ts": time.time(), "prices": prices}))
    except Exception as e:
        logger.warning(f"Failed to cache prices for {symbol}: {e}")


def get_asset_history(symbol: str, days: int = 365) -> list[float] | None:
    """
    Get historical daily close prices for any Yahoo Finance symbol.

    Args:
        symbol: Ticker symbol (e.g. "NVDA", "BTC-USD", "SPY").
        days:   Number of days of history.

    Returns:
        List of daily close prices (USD), or None on failure.
    """
    # Try cache first
    cached = _load_symbol_cache(symbol)
    if cached and len(cached) >= 30:
        logger.info(f"  {symbol}: Using cached prices ({len(cached)} days)")
        return cached

    # Fetch via yfinance
    try:
        import yfinance as yf

        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=f"{days}d")

        if hist.empty or len(hist) < 30:
            logger.warning(f"  {symbol}: Not enough data ({len(hist)} points)")
            return None

        prices = [round(float(p), 4) for p in hist["Close"].tolist()]
        logger.info(f"  {symbol}: Fetched {len(prices)} prices via yfinance")

        _save_symbol_cache(symbol, prices)
        return prices

    except Exception as e:
        logger.warning(f"  {symbol}: yfinance fetch failed — {e}")
        return None


def get_multi_asset_history(
    symbols: list[str],
    days: int = 365,
) -> dict[str, list[float]]:
    """
    Get historical prices for multiple symbols.

    Args:
        symbols: List of ticker symbols.
        days:    Number of days of history.

    Returns:
        Dict of price lists per symbol. Only includes symbols that succeeded.
    """
    logger.info(f"Fetching historical prices for {symbols}...")
    result: dict[str, list[float]] = {}

    for symbol in symbols:
        prices = get_asset_history(symbol, days)
        if prices:
            result[symbol] = prices

    # Align lengths — trim all to the shortest available
    if result:
        min_len = min(len(p) for p in result.values())
        result = {s: prices[-min_len:] for s, prices in result.items()}

    return result


# ============================================================================
# SECTION: Compute GBM Parameters from Historical Data
# ============================================================================

def compute_gbm_params(prices: list[float]) -> dict[str, float]:
    """
    Compute drift and volatility from historical prices for GBM simulation.

    Args:
        prices: List of daily close prices.

    Returns:
        Dict with 'drift', 'volatility', 'initial_price', 'name'.
    """
    log_returns = np.diff(np.log(prices))
    dt = 1.0  # daily

    volatility = float(np.std(log_returns) * math.sqrt(1 / dt))
    drift = float(np.mean(log_returns) / dt)

    return {
        "drift": drift,
        "volatility": volatility,
        "initial_price": prices[-1],
    }


def build_asset_params(
    price_histories: dict[str, list[float]],
) -> dict[str, dict]:
    """
    Build ASSETS-style param dict from historical price data.

    Args:
        price_histories: Dict of symbol → price list.

    Returns:
        Dict of symbol → {name, initial_price, drift, volatility}.
    """
    params: dict[str, dict] = {}

    for symbol, prices in price_histories.items():
        gbm = compute_gbm_params(prices)
        params[symbol] = {
            "name": symbol,
            "initial_price": prices[-1],
            "drift": gbm["drift"],
            "volatility": gbm["volatility"],
        }

    return params
