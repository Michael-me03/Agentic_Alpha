# AGENTIC ALPHA
## Autonomous Multi-Agent Market Microstructure Simulator

---

# 1. Vision

Agentic Alpha is a multi-agent financial ecosystem simulator that models heterogeneous market participants interacting in a simplified financial market.

The system demonstrates emergent dynamics such as:

- Momentum amplification
- Volatility clustering
- Retail-driven bubbles and crashes
- Liquidity stabilization via market makers
- Risk-off cascades

This is NOT a trading bot.
This is a system-level simulation of market microstructure under AI-driven agents.

---

# 2. Project Scope (Hackathon-Constrained)

This project must be:

- Buildable in 2 days
- Visually impressive
- Architecturally clean
- Not overengineered
- Based on Mistral API (no fine-tuning)

We focus on clarity > complexity.

---

# 3. System Overview

The system consists of:

1. Market Engine (deterministic core)
2. Agent Layer (heterogeneous strategies)
3. LLM Decision Layer (optional reasoning via Mistral API)
4. Execution Engine (simplified matching)
5. Simulation Loop
6. Streamlit UI

---

# 4. Market Model

We simulate:

- 1 asset
- Discrete time steps (ticks)
- Base price process using Geometric Brownian Motion
- Price impact based on net order flow

## Price Update Formula

P(t+1) = P(t) * exp(drift * dt + vol * shock) + impact * net_order_flow

Where:
- drift = constant
- vol = volatility
- shock = random normal variable
- impact = linear coefficient
- net_order_flow = sum of signed orders

---

# 5. Agents

We simulate heterogeneous participants.

Each agent has:

- Position
- Cash
- PnL tracking
- Decision logic
- Optional LLM reasoning layer

---

## 5.1 Momentum Agent

Behavior:
- Trades based on recent returns
- Amplifies trends

Decision rule:
- If recent_return > threshold → BUY
- If recent_return < -threshold → SELL

---

## 5.2 Market Maker

Behavior:
- Provides liquidity
- Earns spread
- Controls inventory risk

Decision rule:
- Quotes bid/ask around mid price
- Adjusts spread based on volatility

Simplified: trades small opposing positions to net flow.

---

## 5.3 Risk Controller

Behavior:
- Reduces exposure during high volatility
- Acts as stabilizer

Decision rule:
- If volatility > threshold → reduce position

---

## 5.4 Retail Noise Agent

Behavior:
- Overreacts to price moves
- Emotional trading
- No risk management

Decision rule:
- If price_up_strong → buy large
- If price_down_strong → panic sell

This agent introduces instability and realism.

---

# 6. Execution Engine

Simplified execution:

- Market orders only
- Immediate fill
- Linear price impact
- No real orderbook

Position update:
position += trade_size
cash -= trade_size * price

PnL = position * current_price + cash

---

# 7. Simulation Loop

For each tick:

1. Update base price (GBM)
2. Agents observe state
3. Agents decide action
4. Execute trades
5. Update price impact
6. Update PnL
7. Log events
8. Refresh UI

---

# 8. LLM Integration (Mistral API)

LLM used for:

- Decision reasoning
- Generating structured action outputs

Prompt format:

Return strictly JSON:

{
  "action": "BUY | SELL | HOLD",
  "size": "small | medium | large",
  "reason": "short explanation"
}

We always parse JSON only.

If parsing fails → fallback to deterministic rule.

LLM is optional layer, not core dependency.

---

# 9. UI (Streamlit)

Layout:

-------------------------------------------------
| Price Chart (live updating)                  |
-------------------------------------------------
| Agent Positions | Agent PnL | Volatility     |
-------------------------------------------------
| Event Log                                     |
-------------------------------------------------

Features:

- Live updating line chart
- Trade markers
- Color-coded PnL
- Shock highlight
- Scrollable event log

---

# 10. MVP (Must Have)

- Deterministic price simulation
- 3–4 agents
- Position & PnL tracking
- Streamlit dashboard
- Event log
- Mistral API integration

---

# 11. Stretch Goals

- Shock events (volatility spike)
- Regulator agent
- Adjustable parameters
- Agent thoughts panel
- Replay simulation

---

# 12. Architecture Principles

- Keep logic modular
- No global state chaos
- No unnecessary abstractions
- Clean separation: market / agents / UI
- Avoid premature optimization

---

# 13. Development Phases

Phase 1:
Core simulation without LLM.

Phase 2:
Integrate Mistral API for decision layer.

Phase 3:
UI polish + demo stabilization.

---

# 14. Final Deliverable

A live interactive simulation where heterogeneous AI agents interact, producing emergent market behavior.
