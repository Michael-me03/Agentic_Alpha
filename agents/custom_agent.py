# ============================================================================
# SECTION: Custom Agent (User-Defined LLM Agent)
# ============================================================================

"""
Generic agent whose behavior is entirely defined by a user-provided system prompt.

The deterministic fallback between LLM ticks is HOLD — the prompt IS the strategy.
No hardcoded trading logic. Every decision comes from the LLM.
"""

from agents.base_agent import BaseAgent, TradeDecision
from core.state import MarketState
from config import AGENT_INITIAL_CASH


class CustomAgent(BaseAgent):
    """
    User-configured AI trading agent.

    Args:
        name:          User-chosen agent name.
        system_prompt: The LLM system prompt defining this agent's personality and strategy.
        cash:          Starting cash balance.
    """

    def __init__(
        self,
        name: str,
        system_prompt: str,
        cash: float = AGENT_INITIAL_CASH,
    ) -> None:
        super().__init__(name, cash)
        self.system_prompt: str = system_prompt

    def decide(self, state: MarketState) -> TradeDecision:
        """
        Deterministic fallback between LLM ticks — always HOLD.

        For custom agents, the entire strategy lives in the LLM system prompt.
        Between LLM ticks, the agent holds its position.

        Args:
            state: Current market state.

        Returns:
            TradeDecision with no trade (HOLD).
        """
        return TradeDecision()
