# ============================================================================
# SECTION: Main Entry Point
# ============================================================================

"""
Console-based runner for Agentic Alpha.

Wires up all agents, runs the simulation, and prints a summary.
"""

from agents.momentum_agent import MomentumAgent
from agents.market_maker import MarketMaker
from agents.risk_controller import RiskController
from agents.retail_noise_agent import RetailNoiseAgent
from simulation.simulator import Simulator
from config import NUM_TICKS, RANDOM_SEED


def main() -> None:
    """
    Run the Agentic Alpha simulation and print results to console.
    """
    # ── Initialize agents ─────────────────────────────────────────────────
    agents = [
        MomentumAgent(),
        MarketMaker(),
        RiskController(),
        RetailNoiseAgent(rng=None),  # will create its own RNG
    ]

    # ── Run simulation ────────────────────────────────────────────────────
    sim = Simulator(agents=agents, num_ticks=NUM_TICKS, seed=RANDOM_SEED)

    print("=" * 60)
    print("  AGENTIC ALPHA — Market Microstructure Simulator")
    print("=" * 60)
    print(f"  Ticks: {NUM_TICKS} | Seed: {RANDOM_SEED}")
    print(f"  Agents: {', '.join(a.name for a in agents)}")
    print("=" * 60)
    print()

    sim.run()

    # ── Final Summary ─────────────────────────────────────────────────────
    final_price = sim.state.price
    print(f"Final Price: {final_price:.2f}")
    print(f"Price Range: {min(sim.price_history):.2f} – {max(sim.price_history):.2f}")
    print()

    print("Agent Summary:")
    print("-" * 60)
    print(f"{'Name':<20} {'Position':>10} {'Cash':>12} {'PnL':>12}")
    print("-" * 60)
    for agent in agents:
        pnl = agent.pnl(final_price)
        print(f"{agent.name:<20} {agent.position:>10} {agent.cash:>12,.0f} {pnl:>+12,.2f}")
    print("-" * 60)
    print()

    # ── Recent events ─────────────────────────────────────────────────────
    print("Last 15 Events:")
    print("-" * 60)
    for event in sim.event_log.recent(15):
        print(f"  [t={event.tick:>3}] {event.agent_name:<15} {event.action:<14} {event.detail}")
    print("-" * 60)
    print()
    print(f"Total events logged: {len(sim.event_log)}")


if __name__ == "__main__":
    main()
