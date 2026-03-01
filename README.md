<div align="center">

<img src="frontend/public/logo.png" alt="Agentic Alpha" width="280" />

<br /><br />

### AI Agent Trading Arena

**Design custom AI traders with natural language. Watch them compete in real markets.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-agenticalpha.fun-8b5cf6?style=for-the-badge&logo=googlechrome&logoColor=white)](https://agenticalpha.fun)

<br />

[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Mistral AI](https://img.shields.io/badge/Mistral%20AI-Powered-ff7000?logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0id2hpdGUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iMiIgeT0iMiIgd2lkdGg9IjMiIGhlaWdodD0iMyIvPjxyZWN0IHg9IjExIiB5PSIyIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIi8+PHJlY3QgeD0iNiIgeT0iNiIgd2lkdGg9IjQiIGhlaWdodD0iNCIvPjxyZWN0IHg9IjIiIHk9IjExIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIi8+PHJlY3QgeD0iMTEiIHk9IjExIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIi8+PC9zdmc+)](https://mistral.ai)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

<br />

**Built for the [Mistral AI Global Online Hackathon 2026](https://mistral.ai)**

</div>

---

## What is Agentic Alpha?

Agentic Alpha is an **interactive AI trading simulation platform** where users design custom trading agents using natural language system prompts. Each agent is powered by **Mistral AI** and makes autonomous trading decisions based on real market data, portfolio state, and breaking news events.

**This is not a trading bot.** It's a multi-agent simulation that demonstrates how different AI personalities react to real-world market conditions.

### Key Features

- **Custom AI Agents** — Define trading strategies in plain English. Create 2-4 agents with unique personalities.
- **Any Asset** — Trade any stock, crypto, or ETF on Yahoo Finance (NVDA, BTC, AAPL, SPY, etc.) with real historical prices.
- **Breaking News** — Market-moving headlines (Fed rate hikes, geopolitical crises, earnings) inject mid-simulation. Agents react in real-time.
- **Live Reasoning** — See exactly *why* each agent makes every trade. Full Mistral AI reasoning transparency.
- **Bloomberg-Style Dashboard** — Portfolio cards, price charts, PnL tracking, allocation bars, global agent network map.
- **Performance Analytics** — Sharpe ratio, max drawdown, win rate, alpha vs. benchmark.

---

## How It Works

```
1. DESIGN          2. CONFIGURE         3. COMPETE           4. ANALYZE
┌──────────┐      ┌──────────┐        ┌──────────┐        ┌──────────┐
│ Write    │      │ Pick any │        │ Agents   │        │ Winner   │
│ system   │ ──►  │ stocks,  │  ──►   │ trade    │  ──►   │ crowned, │
│ prompts  │      │ crypto,  │        │ live w/  │        │ Sharpe,  │
│ for 2-4  │      │ ETFs +   │        │ breaking │        │ alpha,   │
│ agents   │      │ schedule │        │ news     │        │ drawdown │
│          │      │ news     │        │ events   │        │ compared │
└──────────┘      └──────────┘        └──────────┘        └──────────┘
```

### Agent Decision Pipeline

```
Market State ──► Prompt Builder ──► Mistral AI ──► JSON Parser ──► Trade Execution
     ↑                ↑                                                ↓
  Prices,          System              {"asset": "BTC",           Execute trade,
  Portfolio,       Prompt +             "action": "BUY",          update portfolio,
  Volatility       Breaking             "size": "large",          record reasoning
                   News                  "reason": "..."}
```

### Breaking News System

During simulation, market-moving events fire automatically:

> **[CRITICAL]** *Major US bank collapses — contagion fears spread across financial sector*
>
> **[HIGH]** *Federal Reserve announces surprise rate cut — pivot confirmed, risk assets rally*
>
> **[MEDIUM]** *NVIDIA reports blowout earnings — AI demand sends revenue up 200% YoY*

26 realistic headlines across 6 categories. Users can also schedule custom events.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND  React 18 · TypeScript · Vite · Tailwind · Recharts│
│  Setup Lobby → Live Arena → Performance Analytics            │
├─────────────────────────────────────────────────────────────┤
│  API LAYER  FastAPI                                          │
│  POST /api/simulate · GET /api/presets · GET /api/search     │
├─────────────────────────────────────────────────────────────┤
│  SIMULATION ENGINE                                           │
│  GBM Price Model · Custom Agents · Mistral LLM · News Events│
├─────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                  │
│  Yahoo Finance (365d history) → GBM calibration → Simulation │
└─────────────────────────────────────────────────────────────┘
```

<details>
<summary><b>Full Project Structure</b></summary>

```
AgenticAlpha/
├── api.py                          # FastAPI REST API
├── config.py                       # Global configuration
├── Dockerfile                      # Production container
├── docker-compose.yml              # Docker orchestration
│
├── agents/
│   ├── base_agent.py               # Abstract agent with portfolio tracking
│   ├── custom_agent.py             # LLM-only agent (user-defined prompt)
│   ├── momentum_agent.py           # Preset: aggressive trend chaser
│   ├── market_maker.py             # Preset: liquidity provider
│   ├── risk_controller.py          # Preset: capital preserver
│   └── retail_noise_agent.py       # Preset: emotional FOMO trader
│
├── core/
│   ├── state.py                    # MarketState dataclass
│   ├── price_process.py            # GBM + order flow price impact
│   ├── execution.py                # Trade execution engine
│   ├── historical_prices.py        # Yahoo Finance fetcher + cache
│   └── news_events.py              # 26 breaking news headlines + generator
│
├── llm/
│   ├── mistral_client.py           # Mistral AI API client
│   └── decision_layer.py           # Prompt builder + JSON response parser
│
├── simulation/
│   ├── simulator.py                # Main tick-by-tick simulation loop
│   └── event_log.py                # Event recording system
│
└── frontend/src/
    ├── App.tsx                     # Two-view app (Setup → Arena)
    ├── types.ts                    # TypeScript interfaces
    ├── api.ts                      # API client
    ├── agentMeta.ts                # Dynamic agent metadata
    └── components/
        ├── SetupView.tsx           # Agent builder + asset search + news
        ├── PortfolioCards.tsx       # Fund manager dashboard cards
        ├── BreakingNews.tsx        # Breaking news banner with severity
        ├── PriceChart.tsx          # Line / candlestick chart
        ├── PnLChart.tsx            # Multi-agent PnL comparison
        ├── GeoMap.tsx              # Global agent network SVG map
        ├── ReasoningPanel.tsx      # Mistral AI reasoning feed
        ├── PerformanceAnalytics.tsx # Sharpe, drawdown, alpha metrics
        ├── ActivityFeed.tsx        # Trade + reasoning event log
        ├── AgentPositions.tsx      # Position bars per agent
        ├── AgentIcon.tsx           # Lucide SVG icon renderer
        ├── MarketTicker.tsx        # Top bar price ticker
        └── Controls.tsx            # New round / back to setup
```

</details>

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **LLM** | Mistral AI (mistral-small-latest) | Agent trading decisions + reasoning |
| **Backend** | Python 3.12, FastAPI, uvicorn | REST API, simulation engine |
| **Frontend** | React 18, TypeScript, Vite | Interactive arena UI |
| **Styling** | Tailwind CSS | Dark Bloomberg-style theme |
| **Charts** | Recharts + custom SVG | Price charts, PnL, geo map |
| **Icons** | Lucide React | Professional SVG icons |
| **Data** | yfinance | Real historical prices (any ticker) |
| **Deployment** | Docker, Caddy | Containerized with auto-SSL |

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- [Mistral AI API key](https://console.mistral.ai/)

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

# API server
cd .. && uvicorn api:app --reload --port 8080
```

### Docker (Production)

```bash
cp .env.example .env  # Add MISTRAL_API_KEY
docker compose up -d --build
# → http://localhost:8080
```

---

## Live Demo

<div align="center">

### [agenticalpha.fun](https://agenticalpha.fun)

</div>

---

## License

MIT
