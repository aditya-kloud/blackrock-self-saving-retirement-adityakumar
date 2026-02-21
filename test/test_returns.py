# Test type: Integration Test
# Validation:  /returns:nps and /returns:index — compound interest, tax benefit, inflation
# Command: pytest test/test_returns.py -v

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

NPS_URL   = "/blackrock/challenge/v1/returns:nps"
INDEX_URL = "/blackrock/challenge/v1/returns:index"

PDF_PAYLOAD = {
    "age": 29,
    "wage": 50000,
    "inflation": 5.5,
    "q": [{"fixed": 0, "start": "2023-07-01 00:00:00", "end": "2023-07-31 23:59:59"}],
    "p": [{"extra": 25, "start": "2023-10-01 08:00:00", "end": "2023-12-31 19:59:59"}],
    "k": [
        {"start": "2023-01-01 00:00:00", "end": "2023-12-31 23:59:59"},
        {"start": "2023-03-01 00:00:00", "end": "2023-11-30 23:59:59"},
    ],
    "transactions": [
        {"date": "2023-10-12 20:15:30", "amount": 250},
        {"date": "2023-02-28 15:49:20", "amount": 375},
        {"date": "2023-07-01 21:59:00", "amount": 620},
        {"date": "2023-12-17 08:09:45", "amount": 480},
    ]
}


def test_nps_pdf_totals():
    """NPS: total amount and ceiling match PDF example."""
    resp = client.post(NPS_URL, json=PDF_PAYLOAD)
    assert resp.status_code == 200
    data = resp.json()
    assert data["totalTransactionAmount"] == 1725.0
    assert data["totalCeiling"] == 1900.0


def test_nps_pdf_savings_by_dates():
    """NPS: k-period amounts and profits match PDF (86.88 and 44.94)."""
    resp = client.post(NPS_URL, json=PDF_PAYLOAD)
    assert resp.status_code == 200
    savings = {s["start"]: s for s in resp.json()["savingsByDates"]}

    k1 = savings["2023-01-01 00:00:00"]
    assert k1["amount"] == 145.0
    assert k1["profit"] == 86.88
    assert k1["taxBenefit"] == 0.0  # income 6L < 7L threshold

    k2 = savings["2023-03-01 00:00:00"]
    assert k2["amount"] == 75.0
    assert k2["profit"] == 44.94


def test_index_pdf_totals():
    """Index: total amount and ceiling match PDF example."""
    resp = client.post(INDEX_URL, json=PDF_PAYLOAD)
    assert resp.status_code == 200
    data = resp.json()
    assert data["totalTransactionAmount"] == 1725.0
    assert data["totalCeiling"] == 1900.0


def test_index_tax_benefit_always_zero():
    """Index fund: taxBenefit must always be 0."""
    resp = client.post(INDEX_URL, json=PDF_PAYLOAD)
    assert resp.status_code == 200
    for s in resp.json()["savingsByDates"]:
        assert s["taxBenefit"] == 0.0


def test_index_higher_profit_than_nps():
    """Index fund nominal profit (14.49%, no inflation adj) > NPS real profit (7.11%, inflation adj)."""
    nps_resp   = client.post(NPS_URL,   json=PDF_PAYLOAD).json()
    index_resp = client.post(INDEX_URL, json=PDF_PAYLOAD).json()

    nps_profit   = nps_resp["savingsByDates"][0]["profit"]
    index_profit = index_resp["savingsByDates"][0]["profit"]
    assert index_profit > nps_profit


def test_index_profit_is_inflation_adjusted():
    """Index profit = inflation-adjusted real value - invested. Should be ~1684 for 145 over 31 years."""
    resp = client.post(INDEX_URL, json=PDF_PAYLOAD)
    assert resp.status_code == 200
    k1 = resp.json()["savingsByDates"][0]
    # 145 * (1.1449)^31 / (1.055)^31 - 145 ≈ 1684
    assert 1600 < k1["profit"] < 1800


def test_nps_tax_benefit_with_high_income():
    """NPS: tax benefit > 0 for income above 7L."""
    payload = {**PDF_PAYLOAD, "wage": 100000}  # 12L annual — in tax slab
    resp = client.post(NPS_URL, json=payload)
    assert resp.status_code == 200
    # At 12L income, tax benefit should be > 0
    k1 = resp.json()["savingsByDates"][0]
    assert k1["taxBenefit"] > 0.0
