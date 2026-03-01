# ============================================================================
# SECTION: Main Entry Point (Multi-Asset)
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
from config import NUM_TICKS, RANDOM_SEED, ASSET_SYMBOLS


def main() -> None:
    """
    Run the Agentic Alpha multi-asset simulation and print results to console.
    """
    # ── Initialize agents ─────────────────────────────────────────────────
    agents = [
        MomentumAgent(),
        MarketMaker(),
        RiskController(),
        RetailNoiseAgent(rng=None),
    ]

    # ── Run simulation ────────────────────────────────────────────────────
    sim = Simulator(agents=agents, num_ticks=NUM_TICKS, seed=RANDOM_SEED)

    print("=" * 72)
    print("  AGENTIC ALPHA — Multi-Asset Market Microstructure Simulator")
    print("=" * 72)
    print(f"  Ticks: {NUM_TICKS} | Seed: {RANDOM_SEED}")
    print(f"  Assets: {', '.join(ASSET_SYMBOLS)}")
    print(f"  Agents: {', '.join(a.name for a in agents)}")
    print("=" * 72)
    print()

    sim.run()

    # ── Final Summary ─────────────────────────────────────────────────────
    final_prices = sim.state.prices
    print("Final Prices:")
    for s in ASSET_SYMBOLS:
        print(f"  {s}: ${final_prices[s]:,.2f}")
    print()

    print("Agent Summary:")
    print("-" * 72)
    header = f"{'Name':<15} {'Cash':>10}"
    for s in ASSET_SYMBOLS:
        header += f" {s:>8}"
    header += f" {'PnL':>12}"
    print(header)
    print("-" * 72)
    for agent in agents:
        row = f"{agent.name:<15} {agent.cash:>10,.0f}"
        for s in ASSET_SYMBOLS:
            row += f" {agent.positions.get(s, 0):>8}"
        row += f" {agent.pnl(final_prices):>+12,.2f}"
        print(row)
    print("-" * 72)
    print()

    # ── Recent events ─────────────────────────────────────────────────────
    print("Last 15 Events:")
    print("-" * 72)
    for event in sim.event_log.recent(15):
        print(f"  [t={event.tick:>3}] {event.agent_name:<15} {event.action:<14} {event.detail}")
    print("-" * 72)
    print()
    print(f"Total events logged: {len(sim.event_log)}")


if __name__ == "__main__":
    main()
