# ============================================================================
# SECTION: Event Log
# ============================================================================

"""
Simple event logging for the simulation.

Records trades, price updates, and agent actions for later inspection / UI display.
"""

from dataclasses import dataclass, field


@dataclass
class Event:
    """
    A single simulation event.

    Attributes:
        tick:       Time step when the event occurred.
        agent_name: Name of the agent involved (or "MARKET").
        action:     Human-readable action description.
        detail:     Additional context (e.g., trade size, price).
    """

    tick: int
    agent_name: str
    action: str
    detail: str = ""


class EventLog:
    """
    Collects and stores simulation events.

    Attributes:
        events: Full list of recorded events.
    """

    def __init__(self) -> None:
        self.events: list[Event] = []

    def record(self, tick: int, agent_name: str, action: str, detail: str = "") -> None:
        """
        Record a new event.

        Args:
            tick:       Current simulation tick.
            agent_name: Name of the agent.
            action:     What happened.
            detail:     Extra info.
        """
        self.events.append(Event(tick, agent_name, action, detail))

    def recent(self, n: int = 10) -> list[Event]:
        """
        Return the last n events.

        Args:
            n: Number of recent events.

        Returns:
            List of most recent events.
        """
        return self.events[-n:]

    def __len__(self) -> int:
        return len(self.events)
