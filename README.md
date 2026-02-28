# Agentic Alpha

**Autonomous Multi-Agent Market Microstructure Simulator**

Built for the [MistralAI Global Hackathon 2026](https://mistral.ai).

---

## What Is This?

Agentic Alpha simulates a simplified financial market where heterogeneous AI-driven agents interact in real time. It produces emergent dynamics like momentum amplification, volatility clustering, retail-driven bubbles, and risk-off cascades.

**This is NOT a trading bot.** It's a system-level simulation of market microstructure.

---

## Agents

| Agent | Behavior |
|---|---|
| **Momentum** | Trend-following — buys into upward momentum, sells into downward |
| **Market Maker** | Provides liquidity — trades against net order flow |
| **Risk Controller** | De-risks during high volatility — stabilizes the market |
| **Retail Noise** | Emotional trading — FOMO buys, panic sells, random noise |

---

## Architecture

```
agentic-alpha/
├── core/                  # Market engine
│   ├── state.py           # MarketState dataclass
│   ├── price_process.py   # GBM + price impact
│   └── execution.py       # Trade execution
├── agents/                # Agent implementations
│   ├── base_agent.py      # Abstract base class
│   ├── momentum_agent.py
│   ├── market_maker.py
│   ├── risk_controller.py
│   └── retail_noise_agent.py
├── llm/                   # Mistral API integration
│   ├── mistral_client.py
│   └── decision_layer.py
├── simulation/            # Simulation loop & logging
│   ├── simulator.py
│   └── event_log.py
├── ui/                    # Streamlit dashboard
│   └── dashboard.py
├── config.py              # All parameters in one place
├── main.py                # Entry point
└── requirements.txt
```

---

## Installation

### Prerequisites

- Python 3.11+
- pip

### Local Setup

```bash
# Clone the repo
git clone https://github.com/Michael-me03/Agentic_Alpha.git
cd Agentic_Alpha

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Run the Simulation (Console)

```bash
python3 main.py
```

### Run the Dashboard (coming soon)

```bash
streamlit run ui/dashboard.py
```

---

## VPS Deployment

### 1. Server Setup (Ubuntu)

```bash
sudo apt update && sudo apt install -y python3 python3-pip python3-venv git nginx
```

### 2. Clone & Install

```bash
cd /opt
sudo git clone https://github.com/Michael-me03/Agentic_Alpha.git
cd Agentic_Alpha
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Run with Systemd

Create `/etc/systemd/system/agentic-alpha.service`:

```ini
[Unit]
Description=Agentic Alpha Streamlit
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/Agentic_Alpha
ExecStart=/opt/Agentic_Alpha/venv/bin/streamlit run ui/dashboard.py --server.port 8501 --server.address 0.0.0.0
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable agentic-alpha
sudo systemctl start agentic-alpha
```

### 4. Nginx Reverse Proxy

Add to `/etc/nginx/sites-available/agentic-alpha`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8501;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/agentic-alpha /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

### 5. SSL (Optional)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Roadmap

- [x] Deterministic market core (GBM + price impact)
- [x] 4 heterogeneous agents
- [x] Position & PnL tracking
- [x] Event logging
- [ ] Streamlit live dashboard
- [ ] Mistral API integration (LLM decision layer)
- [ ] Shock events (volatility spikes)
- [ ] VPS deployment with custom domain

---

## Tech Stack

- **Python 3.11+**
- **NumPy** — price simulation
- **Streamlit** — interactive dashboard
- **Plotly** — live charts
- **Mistral API** — LLM-powered agent reasoning

---

## License

MIT
