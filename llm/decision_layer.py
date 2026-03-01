# ============================================================================
# SECTION: LLM Decision Layer (Multi-Asset)
# ============================================================================

"""
Translates market state into LLM prompts, calls Mistral, and parses decisions.

Each agent type has a unique personality prompt.
The LLM returns JSON: {"asset": "BTC|ETH|SOL", "action": "BUY|SELL|HOLD", "size": "small|medium|large", "reason": "..."}
If parsing fails → returns None (caller falls back to deterministic).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from agents.base_agent import BaseAgent

from core.state import MarketState
from llm.mistral_client import MistralClient
from config import ASSET_SYMBOLS

logger = logging.getLogger(__name__)

# ============================================================================
# SECTION: Agent Personalities
# ============================================================================

PERSONALITIES: dict[str, str] = {
    "Momentum": (
        "You are an aggressive momentum trader. You chase trends relentlessly. "
        "When prices go up, you buy more — you believe trends continue. "
        "When prices go down, you short aggressively. "
        "You are confident, fast, and never hesitate. "
        "You speak in short, punchy sentences."
    ),
    "MarketMaker": (
        "You are a calm, methodical market maker. You provide liquidity. "
        "You always trade AGAINST the crowd — when everyone buys, you sell. "
        "When everyone sells, you buy. You keep positions small and manage risk tightly. "
        "You earn from the spread, not from directional bets. "
        "You are analytical and emotionless."
    ),
    "RiskController": (
        "You are a cautious risk manager. Your only job is capital preservation. "
        "When volatility spikes, you cut exposure immediately. "
        "You would rather miss a profit than take a loss. "
        "You only trade to REDUCE risk, never to speculate. "
        "You are careful, measured, and conservative."
    ),
    "Retail": (
        "You are an emotional retail trader with zero discipline. "
        "When prices pump, you FOMO buy hard — you don't want to miss out. "
        "When prices dump, you panic sell everything. "
        "You overreact to every move. You have no strategy, just feelings. "
        "You speak emotionally with exclamation marks."
    ),
}

# ----------------------------------------------------------------------------
# Sub-section: Size Mapping
# ----------------------------------------------------------------------------

SIZE_MAP: dict[str, int] = {
    "small": 5,
    "medium": 10,
    "large": 20,
}


# ============================================================================
# SECTION: Decision Data
# ============================================================================

@dataclass
class LLMDecision:
    """
    Parsed decision from the LLM.

    Attributes:
        asset:      Which asset to trade (e.g. "BTC").
        action:     BUY, SELL, or HOLD.
        size:       small, medium, or large.
        trade_size: Signed integer trade size.
        reason:     LLM reasoning string.
    """

    asset: str
    action: str
    size: str
    trade_size: int
    reason: str


# ============================================================================
# SECTION: Core Decision Function
# ============================================================================

def _build_market_prompt(
    agent: BaseAgent,
    state: MarketState,
    active_news: list | None = None,
) -> str:
    """
    Build the user prompt with current multi-asset market context.

    Args:
        agent:       The agent making the decision.
        state:       Current market state.
        active_news: Breaking news events happening this tick.

    Returns:
        Formatted market context string.
    """
    active_assets = list(state.prices.keys())
    lines = [f"MARKET STATE (tick {state.tick}):"]

    # ── Breaking news injection ───────────────────────────────────────────
    if active_news:
        lines.append("")
        lines.append("⚡ BREAKING NEWS — REACT TO THIS:")
        for news in active_news:
            severity_tag = f"[{news.severity}]" if hasattr(news, 'severity') else ""
            lines.append(f"  {severity_tag} {news.headline}")
        lines.append("")
        lines.append("This news just broke. Factor it into your trading decision. How does this affect the assets you trade?")
        lines.append("")
    lines.append(f"Available assets: {', '.join(active_assets)}")
    lines.append("")

    for symbol in active_assets:
        price = state.prices.get(symbol, 0)
        recent_prices = state.recent_prices(symbol, 10)
        recent_returns = state.recent_returns(symbol, 5)
        flow = state.net_order_flows.get(symbol, 0.0)

        vol = 0.0
        if len(recent_returns) >= 2:
            mean_r = sum(recent_returns) / len(recent_returns)
            vol = (sum((r - mean_r) ** 2 for r in recent_returns) / len(recent_returns)) ** 0.5

        avg_ret = sum(recent_returns) / len(recent_returns) if recent_returns else 0.0

        lines.append(f"--- {symbol} ---")
        lines.append(f"  Price: ${price:,.2f}")
        lines.append(f"  Recent prices: {[round(p, 2) for p in recent_prices]}")
        lines.append(f"  Recent returns: {[round(r, 4) for r in recent_returns]}")
        lines.append(f"  Avg return: {avg_ret:.4f} | Vol: {vol:.4f}")
        lines.append(f"  Net flow: {flow:+.0f}")
        lines.append("")

    # Agent portfolio state
    lines.append("YOUR PORTFOLIO:")
    lines.append(f"  Cash: ${agent.cash:,.0f}")
    for symbol in active_assets:
        pos = agent.positions.get(symbol, 0)
        price = state.prices.get(symbol, 0)
        value = pos * price
        lines.append(f"  {symbol}: {pos} units (${value:,.0f})")
    lines.append(f"  Total PnL: ${agent.pnl(state.prices):+,.2f}")
    lines.append("")

    asset_options = '" or "'.join(active_assets)
    lines.append(
        "Choose ONE asset to trade (or HOLD). Return strictly JSON:\n"
        f'{{"asset": "{asset_options}", "action": "BUY" or "SELL" or "HOLD", '
        '"size": "small" or "medium" or "large", "reason": "1-2 sentences max"}'
    )

    return "\n".join(lines)


def get_llm_decision(
    client: MistralClient,
    agent: BaseAgent,
    state: MarketState,
    active_news: list | None = None,
) -> LLMDecision | None:
    """
    Ask Mistral for an agent's trading decision.

    Args:
        client:      Mistral API client.
        agent:       The agent making the decision.
        state:       Current market state.
        active_news: Breaking news events happening this tick.

    Returns:
        Parsed LLMDecision, or None if the call/parsing fails.
    """
    personality = getattr(agent, "system_prompt", None) or PERSONALITIES.get(agent.name, "You are a financial trader.")
    user_prompt = _build_market_prompt(agent, state, active_news=active_news)

    result = client.chat_json(
        system_prompt=personality,
        user_prompt=user_prompt,
    )

    if result is None:
        return None

    # ── Parse response ────────────────────────────────────────────────────
    asset = str(result.get("asset", "")).upper().strip()
    action = str(result.get("action", "HOLD")).upper().strip()
    size = str(result.get("size", "small")).lower().strip()
    reason = str(result.get("reason", ""))[:200]

    if action not in ("BUY", "SELL", "HOLD"):
        logger.warning(f"Invalid action from LLM: {action}")
        return None

    active_assets = list(state.prices.keys())
    if asset not in active_assets and action != "HOLD":
        logger.warning(f"Invalid asset from LLM: {asset}")
        return None

    trade_units = SIZE_MAP.get(size, 5)

    if action == "BUY":
        trade_size = trade_units
    elif action == "SELL":
        trade_size = -trade_units
    else:
        trade_size = 0
        asset = ""

    return LLMDecision(
        asset=asset,
        action=action,
        size=size,
        trade_size=trade_size,
        reason=reason,
    )
