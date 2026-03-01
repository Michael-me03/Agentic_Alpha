# ============================================================================
# SECTION: News Events — Market-Moving Headlines for the Simulation
# ============================================================================

"""
Pool of realistic market-moving news events that get injected into the
simulation. Agents receive these as breaking news and must react.
Events are modeled after real-world catalysts that move financial markets.
"""

import random
from dataclasses import dataclass, asdict


# ============================================================================
# SECTION: Data Model
# ============================================================================

@dataclass
class NewsEvent:
    """A market-moving news event injected at a specific simulation tick."""

    tick: int
    headline: str
    category: str       # GEOPOLITICAL, MONETARY, EARNINGS, MACRO, CRYPTO, SHOCK
    severity: str       # LOW, MEDIUM, HIGH, CRITICAL


# ============================================================================
# SECTION: Event Pool — Realistic Finance Headlines
# ============================================================================

EVENT_POOL: list[dict] = [
    # ── Geopolitical ────────────────────────────────────────────────────────
    {
        "headline": "BREAKING: US launches military strikes in the Middle East — oil prices spike",
        "category": "GEOPOLITICAL",
        "severity": "CRITICAL",
    },
    {
        "headline": "China announces trade embargo on US tech exports — semiconductor stocks plunge",
        "category": "GEOPOLITICAL",
        "severity": "CRITICAL",
    },
    {
        "headline": "Russia halts natural gas supply to Europe — energy crisis fears mount",
        "category": "GEOPOLITICAL",
        "severity": "HIGH",
    },
    {
        "headline": "North Korea conducts nuclear test — global markets sell off sharply",
        "category": "GEOPOLITICAL",
        "severity": "CRITICAL",
    },
    {
        "headline": "US-China trade deal reached — markets rally on reduced tariff fears",
        "category": "GEOPOLITICAL",
        "severity": "HIGH",
    },

    # ── Monetary Policy ─────────────────────────────────────────────────────
    {
        "headline": "Federal Reserve raises interest rates by 75bps — hawkish surprise stuns markets",
        "category": "MONETARY",
        "severity": "HIGH",
    },
    {
        "headline": "ECB announces emergency rate cut — recession fears grow in Europe",
        "category": "MONETARY",
        "severity": "HIGH",
    },
    {
        "headline": "Fed Chair signals aggressive rate hikes ahead — bond yields soar to 5.2%",
        "category": "MONETARY",
        "severity": "MEDIUM",
    },
    {
        "headline": "Bank of Japan abandons yield curve control — yen surges, carry trade unwinds",
        "category": "MONETARY",
        "severity": "HIGH",
    },
    {
        "headline": "Federal Reserve announces surprise rate cut — pivot confirmed, risk assets rally",
        "category": "MONETARY",
        "severity": "HIGH",
    },

    # ── Macro / Economic ────────────────────────────────────────────────────
    {
        "headline": "US unemployment spikes to 7.2% — worst jobs report in 3 years triggers recession alarm",
        "category": "MACRO",
        "severity": "HIGH",
    },
    {
        "headline": "US CPI comes in at 8.6% — inflation running far hotter than expected",
        "category": "MACRO",
        "severity": "MEDIUM",
    },
    {
        "headline": "Major US bank collapses — contagion fears spread across financial sector",
        "category": "MACRO",
        "severity": "CRITICAL",
    },
    {
        "headline": "US GDP growth beats expectations at 4.1% — soft landing narrative strengthens",
        "category": "MACRO",
        "severity": "MEDIUM",
    },
    {
        "headline": "Chinese property giant defaults on $300B in debt — Asian markets in freefall",
        "category": "MACRO",
        "severity": "CRITICAL",
    },

    # ── Corporate / Earnings ────────────────────────────────────────────────
    {
        "headline": "NVIDIA reports blowout earnings — AI demand sends revenue up 200% YoY",
        "category": "EARNINGS",
        "severity": "MEDIUM",
    },
    {
        "headline": "Apple warns of iPhone demand weakness — guides revenue 15% below estimates",
        "category": "EARNINGS",
        "severity": "MEDIUM",
    },
    {
        "headline": "Tesla announces massive layoffs — 30% workforce reduction, stock crashes",
        "category": "EARNINGS",
        "severity": "HIGH",
    },
    {
        "headline": "Microsoft acquires major AI startup for $50B — tech sector rotation begins",
        "category": "EARNINGS",
        "severity": "MEDIUM",
    },

    # ── Crypto Specific ─────────────────────────────────────────────────────
    {
        "headline": "SEC approves spot Ethereum ETF — crypto market surges on institutional access",
        "category": "CRYPTO",
        "severity": "HIGH",
    },
    {
        "headline": "Major crypto exchange hacked — $2B stolen, Bitcoin drops 15% in minutes",
        "category": "CRYPTO",
        "severity": "CRITICAL",
    },
    {
        "headline": "US government announces plans to create a strategic Bitcoin reserve",
        "category": "CRYPTO",
        "severity": "HIGH",
    },
    {
        "headline": "Largest stablecoin loses peg — mass liquidations across DeFi protocols",
        "category": "CRYPTO",
        "severity": "CRITICAL",
    },

    # ── Market Shocks ───────────────────────────────────────────────────────
    {
        "headline": "Flash crash: S&P 500 drops 7% in 30 minutes — circuit breakers triggered",
        "category": "SHOCK",
        "severity": "CRITICAL",
    },
    {
        "headline": "VIX spikes above 40 — extreme fear grips Wall Street",
        "category": "SHOCK",
        "severity": "HIGH",
    },
    {
        "headline": "Global supply chain disruption — Suez Canal blocked again, shipping costs surge 300%",
        "category": "SHOCK",
        "severity": "MEDIUM",
    },
    {
        "headline": "Massive short squeeze in progress — hedge funds face billions in losses",
        "category": "SHOCK",
        "severity": "HIGH",
    },
]


# ============================================================================
# SECTION: Event Generation
# ============================================================================

def generate_random_events(
    num_ticks: int,
    count: int = 3,
    seed: int | None = None,
) -> list[NewsEvent]:
    """
    Generate random news events spread across the simulation timeline.

    Events are spaced out so they don't cluster too close together.
    The first event happens no earlier than tick 3 and the last no later
    than tick num_ticks - 2.

    Args:
        num_ticks:  Total simulation ticks.
        count:      Number of events to generate (default 3).
        seed:       Random seed for reproducibility.

    Returns:
        List of NewsEvent objects sorted by tick.
    """
    rng = random.Random(seed)

    if num_ticks < 8:
        count = min(count, 1)
    if num_ticks < 5:
        return []

    # Pick random events from pool (no duplicates)
    pool = list(EVENT_POOL)
    rng.shuffle(pool)
    selected = pool[:count]

    # Spread ticks evenly with jitter
    margin_start = max(3, num_ticks // 8)
    margin_end = max(2, num_ticks // 8)
    usable_range = num_ticks - margin_start - margin_end

    if usable_range < count:
        ticks = sorted(rng.sample(range(margin_start, num_ticks - 1), min(count, num_ticks - margin_start - 1)))
    else:
        spacing = usable_range / count
        ticks = []
        for i in range(count):
            center = margin_start + int(spacing * (i + 0.5))
            jitter = int(spacing * 0.3)
            tick = center + rng.randint(-jitter, jitter)
            tick = max(margin_start, min(num_ticks - margin_end, tick))
            ticks.append(tick)
        ticks.sort()

    events = []
    for tick, evt_data in zip(ticks, selected):
        events.append(NewsEvent(
            tick=tick,
            headline=evt_data["headline"],
            category=evt_data["category"],
            severity=evt_data["severity"],
        ))

    return events


def merge_custom_events(
    random_events: list[NewsEvent],
    custom_events: list[dict],
) -> list[NewsEvent]:
    """
    Merge user-defined custom events with randomly generated ones.

    Args:
        random_events:  Auto-generated events.
        custom_events:  User-defined events as dicts with tick + headline.

    Returns:
        Combined list sorted by tick.
    """
    all_events = list(random_events)

    for ce in custom_events:
        all_events.append(NewsEvent(
            tick=ce.get("tick", 1),
            headline=ce.get("headline", "Breaking news event"),
            category=ce.get("category", "CUSTOM"),
            severity=ce.get("severity", "HIGH"),
        ))

    all_events.sort(key=lambda e: e.tick)
    return all_events


def events_to_dicts(events: list[NewsEvent]) -> list[dict]:
    """Convert list of NewsEvent to serializable dicts."""
    return [asdict(e) for e in events]
