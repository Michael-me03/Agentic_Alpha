# ============================================================================
# SECTION: Base Agent
# ============================================================================

"""
Abstract base class for all market agents.

Every agent has:
- Position, cash, initial_cash
- A name for identification
- A decide() method that returns a signed trade size
"""

from abc import ABC, abstractmethod

from core.state import MarketState
from config import AGENT_INITIAL_CASH


class BaseAgent(ABC):
    """
    Abstract market participant.

    Attributes:
        name:         Human-readable agent identifier.
        position:     Current number of units held (can be negative = short).
        cash:         Current cash balance.
        initial_cash: Starting cash (used for PnL calculation).
    """

    def __init__(self, name: str, cash: float = AGENT_INITIAL_CASH) -> None:
        self.name: str = name
        self.position: int = 0
        self.cash: float = cash
        self.initial_cash: float = cash

    @abstractmethod
    def decide(self, state: MarketState) -> int:
        """
        Decide on a trade given the current market state.

        Args:
            state: Current market state snapshot.

        Returns:
            Signed trade size: positive = BUY, negative = SELL, 0 = HOLD.
        """
        ...

    def pnl(self, current_price: float) -> float:
        """
        Compute mark-to-market PnL.

        Args:
            current_price: Current asset price.

        Returns:
            Total PnL.
        """
        return self.position * current_price + self.cash - self.initial_cash

    def __repr__(self) -> str:
        return f"{self.name}(pos={self.position}, cash={self.cash:,.0f})"
