<div align="center">

# Agentic Alpha

### AI Agent Trading Arena

**Design custom AI traders with natural language. Watch them compete in real markets. Powered by Mistral AI.**

[![Live Demo](https://img.shields.io/badge/Live-agenticalpha.fun-8b5cf6?style=for-the-badge)](https://agenticalpha.fun)
[![Mistral AI](https://img.shields.io/badge/Powered%20by-Mistral%20AI-ff7000?style=for-the-badge)](https://mistral.ai)
[![Hackathon](https://img.shields.io/badge/MistralAI-Global%20Hackathon%202026-blue?style=for-the-badge)](https://mistral.ai)

</div>

---

## What is Agentic Alpha?

Agentic Alpha is an **interactive AI trading simulation platform** where users design custom trading agents using natural language system prompts. Each agent is powered by **Mistral AI** and makes autonomous trading decisions based on real market data, portfolio state, and breaking news events.

**This is not a trading bot.** It's a multi-agent simulation that demonstrates how different AI personalities react to real-world market conditions — from aggressive momentum traders to cautious risk managers.

### Key Features

- **Custom AI Agents** — Define trading strategies in plain English. Create 2-4 agents with unique personalities, icons, and colors.
- **Any Asset** — Trade any stock, crypto, or ETF available on Yahoo Finance (NVDA, BTC, AAPL, SPY, etc.) with real historical price data.
- **Breaking News Events** — Market-moving headlines (Fed rate hikes, geopolitical crises, earnings surprises) inject mid-simulation. Agents must react in real-time.
- **Live Reasoning** — See exactly *why* each agent makes every trade. Full Mistral AI reasoning transparency.
- **Bloomberg-Style Dashboard** — Dark-themed arena with live portfolio cards, price charts, PnL tracking, allocation bars, and a global agent network map.
- **Performance Analytics** — Sharpe ratio, max drawdown, win rate, alpha vs. benchmark, trade counts.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (React + TypeScript + Vite + Tailwind)            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  Setup   │ │Portfolio │ │  Price   │ │ Breaking │       │
│  │  Lobby   │ │  Cards   │ │  Charts  │ │   News   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Geo Map  │ │ PnL Chart│ │Reasoning │ │Analytics │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
├─────────────────────────────────────────────────────────────┤
│  API LAYER (FastAPI)                                         │
│  POST /api/simulate  GET /api/presets  GET /api/search-assets│
├─────────────────────────────────────────────────────────────┤
│  SIMULATION ENGINE                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  GBM +   │ │  Custom  │ │  Mistral │ │  News    │       │
│  │  Impact  │ │  Agents  │ │  LLM API │ │  Events  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
├─────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                  │
│  Yahoo Finance (real prices) + GBM simulation (future ticks) │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
AgenticAlpha/
├── api.py                     # FastAPI REST API
├── config.py                  # Global configuration
├── agents/
│   ├── base_agent.py          # Abstract agent with portfolio tracking
│   ├── custom_agent.py        # LLM-only agent (user-defined prompt)
│   ├── momentum_agent.py      # Preset: trend chaser
│   ├── market_maker.py        # Preset: liquidity provider
│   ├── risk_controller.py     # Preset: capital preserver
│   └── retail_noise_agent.py  # Preset: emotional FOMO trader
├── core/
│   ├── state.py               # MarketState dataclass
│   ├── price_process.py       # GBM + price impact model
│   ├── execution.py           # Trade execution engine
│   ├── historical_prices.py   # Yahoo Finance data fetcher
│   └── news_events.py         # Breaking news event pool & generator
├── llm/
│   ├── mistral_client.py      # Mistral AI API client
│   └── decision_layer.py      # Prompt builder + JSON response parser
├── simulation/
│   ├── simulator.py           # Main simulation loop
│   └── event_log.py           # Event recording
├── frontend/
│   └── src/
│       ├── App.tsx             # Two-view app (Setup → Arena)
│       ├── types.ts            # TypeScript interfaces
│       ├── api.ts              # API client
│       ├── agentMeta.ts        # Dynamic agent metadata
│       └── components/
│           ├── SetupView.tsx         # Agent builder + asset picker
│           ├── PortfolioCards.tsx     # Fund manager dashboard cards
│           ├── PriceChart.tsx        # Line/candlestick chart (Recharts)
│           ├── PnLChart.tsx          # Multi-agent PnL comparison
│           ├── GeoMap.tsx            # Global agent network SVG
│           ├── BreakingNews.tsx      # Breaking news banner
│           ├── ReasoningPanel.tsx    # Mistral AI reasoning feed
│           ├── PerformanceAnalytics.tsx  # Sharpe, drawdown, alpha
│           ├── AgentIcon.tsx         # Lucide SVG icon renderer
│           ├── ActivityFeed.tsx      # Trade + reasoning event log
│           ├── AgentPositions.tsx    # Position bars per agent
│           ├── MarketTicker.tsx      # Top bar price ticker
│           └── Controls.tsx          # New round / back to setup
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

---

## How It Works

### 1. Design Your Agents
Create 2-4 AI trading agents with custom system prompts:
> *"You are a contrarian value investor. When markets panic, you buy the dip. You look for assets trading below their 10-day moving average and accumulate positions. You never chase momentum."*

### 2. Pick Your Assets
Search and select any combination of stocks, crypto, or ETFs:
- **Crypto:** BTC, ETH, SOL
- **Stocks:** NVDA, AAPL, TSLA, MSFT
- **ETFs:** SPY, QQQ

### 3. Watch the Arena
- Simulation runs tick-by-tick with **real historical prices** (365 days via Yahoo Finance)
- Future price movements use **Geometric Brownian Motion** calibrated from historical volatility
- Every 5 ticks, agents query **Mistral AI** for trading decisions
- **Breaking news events** fire mid-simulation — agents must adapt their strategy
- Full reasoning transparency: see exactly why each agent buys, sells, or holds

### 4. Analyze Results
- Winner announcement with PnL ranking
- Performance analytics: Sharpe ratio, max drawdown, win rate, alpha vs. equal-weight benchmark
- Trade history and position evolution over time

---

## Simulation Engine

### Price Model
- **Historical data:** Real daily close prices from Yahoo Finance (past 365 days)
- **Future simulation:** GBM (Geometric Brownian Motion) with parameters calibrated from historical data
- **Price impact:** Agent order flow affects prices (market microstructure)

### Agent Decision Pipeline
```
Market State → Prompt Builder → Mistral AI → JSON Parser → Trade Execution
     ↑              ↑                                          ↓
  Prices,        System         {"asset": "BTC",          Execute trade,
  Portfolio,     Prompt +        "action": "BUY",         update portfolio,
  News Events    Breaking        "size": "large",         record reasoning
                 News            "reason": "..."}
```

### News Event System
- **26 realistic headlines** across 6 categories: Geopolitical, Monetary Policy, Macro, Earnings, Crypto, Market Shocks
- **3 random events per simulation**, spread across the timeline
- **Custom events** — users can schedule their own headlines at specific ticks
- Events force an LLM tick so agents must immediately react

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **LLM** | Mistral AI (mistral-small-latest) |
| **Backend** | Python 3.12, FastAPI, uvicorn |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Charts** | Recharts + custom SVG |
| **Icons** | Lucide React |
| **Data** | yfinance (Yahoo Finance API) |
| **Deployment** | Docker, Caddy (auto-SSL) |

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Mistral AI API key

### Local Development

```bash
# Clone
git clone https://github.com/Michael-me03/Agentic_Alpha.git
cd Agentic_Alpha

# Backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Add your MISTRAL_API_KEY

# Frontend
cd frontend && npm install && npm run dev

# Run API
cd .. && uvicorn api:app --reload --port 8080
```

### Docker Deployment

```bash
# Set MISTRAL_API_KEY in .env
docker compose up -d --build
# App runs on port 8080
```

---

## Live Demo

**[agenticalpha.fun](https://agenticalpha.fun)**

---

## Built For

**Mistral AI Global Online Hackathon 2026**

---

## License

MIT
