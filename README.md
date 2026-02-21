# BlackRock Self-Saving Retirement API

REST API backend for automated retirement savings through expense-based micro-investments.

## What It Does

Every expense is rounded up to the next multiple of 100. The difference ("remanent") is saved for retirement. The system applies temporal rules (fixed overrides, extra additions, evaluation windows) and calculates inflation-adjusted investment returns for NPS and Index Fund instruments.

---

## Requirements

- Python 3.11+
- Docker (for containerized deployment)

---

## Run Locally

```bash
# 1. Create and activate environment
conda create -n blackrock python=3.11 -y
conda activate blackrock

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the server
uvicorn app.main:app --host 0.0.0.0 --port 5477
```

API docs available at: `http://localhost:5477/docs`

---

## Run with Docker

```bash
# Build the image
docker build -t blk-hacking-ind-aditya-kumar .

# Run the container
docker run -d -p 5477:5477 blk-hacking-ind-aditya-kumar
```

---

## Run Tests

```bash
pytest test/ -v
```

---

## API Endpoints

All endpoints run on port **5477**.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/blackrock/challenge/v1/transactions:parse` | Calculate ceiling and remanent for each expense |
| POST | `/blackrock/challenge/v1/transactions:validator` | Validate transactions (negatives, duplicates, wrong values) |
| POST | `/blackrock/challenge/v1/transactions:filter` | Apply q/p/k temporal period rules |
| POST | `/blackrock/challenge/v1/returns:nps` | Calculate NPS investment returns with tax benefit |
| POST | `/blackrock/challenge/v1/returns:index` | Calculate Index Fund (NIFTY 50) investment returns |
| GET  | `/blackrock/challenge/v1/performance` | System metrics (uptime, memory, threads) |

---

## Business Rules Summary

- **Ceiling**: Round expense up to next multiple of 100
- **Remanent**: `ceiling - amount` → the amount saved per expense
- **q periods**: Override remanent with a fixed value (latest-start wins if multiple match)
- **p periods**: Add extra to remanent (all matching periods stack)
- **k periods**: Evaluation windows — sum remanents within each date range
- **NPS**: 7.11% annually, tax benefit = `Tax(income) - Tax(income - min(invested, 10%*income, 2L))`
- **Index Fund**: 14.49% annually, no tax benefit
- **Inflation adjustment**: `real_value = A / (1 + inflation)^years`

---

## Project Structure

```
app/
├── main.py              # FastAPI app entry point
├── models.py            # Pydantic request/response schemas
├── routers/
│   ├── transactions.py  # EP1, EP2, EP3
│   ├── returns.py       # EP4 (NPS + Index)
│   └── performance.py   # EP5
└── services/
    ├── calculator.py    # Ceiling/remanent math
    ├── period_engine.py # q/p/k period logic
    └── tax.py           # Indian tax slab calculation
test/
├── test_parse.py
├── test_validator.py
├── test_filter.py
├── test_returns.py
└── test_performance.py
```
