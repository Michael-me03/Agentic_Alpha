# ============================================================================
# SECTION: Base Agent (Multi-Asset)
# ============================================================================

"""
Abstract base class for all market agents — supports multiple assets.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass

from core.state import MarketState
from config import AGENT_INITIAL_CASH, ASSET_SYMBOLS


@dataclass
class TradeDecision:
    """
    An agent's trade decision.

    Attributes:
        asset:      Which asset to trade (e.g. "BTC"), or "" for HOLD.
        trade_size: Signed trade size (positive=BUY, negative=SELL, 0=HOLD).
    """

    asset: str = ""
    trade_size: int = 0


class BaseAgent(ABC):
    """
    Abstract market participant with multi-asset portfolio.

    Attributes:
        name:         Agent identifier.
        positions:    Position per asset {"BTC": 5, "ETH": -3, ...}.
        cash:         Current cash balance.
        initial_cash: Starting cash.
    """

    def __init__(self, name: str, cash: float = AGENT_INITIAL_CASH) -> None:
        self.name: str = name
        self.positions: dict[str, int] = {s: 0 for s in ASSET_SYMBOLS}
        self.cash: float = cash
        self.initial_cash: float = cash

    @abstractmethod
    def decide(self, state: MarketState) -> TradeDecision:
        """
        Decide on a trade given the current market state.

        Args:
            state: Current market state snapshot.

        Returns:
            TradeDecision with asset and signed trade size.
        """
        ...

    def portfolio_value(self, prices: dict[str, float]) -> float:
        """
        Compute total portfolio value (cash + holdings).

        Args:
            prices: Current prices per asset.

        Returns:
            Total portfolio value.
        """
        holdings = sum(
            self.positions.get(s, 0) * prices.get(s, 0)
            for s in ASSET_SYMBOLS
        )
        return self.cash + holdings

    def pnl(self, prices: dict[str, float]) -> float:
        """
        Compute mark-to-market PnL.

        Args:
            prices: Current prices per asset.

        Returns:
            Total PnL.
        """
        return self.portfolio_value(prices) - self.initial_cash

    def __repr__(self) -> str:
        pos_str = ", ".join(f"{k}={v}" for k, v in self.positions.items() if v != 0)
        return f"{self.name}({pos_str or 'flat'}, cash={self.cash:,.0f})"
