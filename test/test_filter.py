# Test type: Integration Test
# Validation: /transactions:filter — q override, p addition, k grouping
# Command: pytest test/test_filter.py -v

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

BASE_URL = "/blackrock/challenge/v1/transactions:filter"

# Full PDF example payload
PDF_PAYLOAD = {
    "q": [{"fixed": 0, "start": "2023-07-01 00:00:00", "end": "2023-07-31 23:59:59"}],
    "p": [{"extra": 25, "start": "2023-10-01 08:00:00", "end": "2023-12-31 19:59:59"}],
    "k": [
        {"start": "2023-03-01 00:00:00", "end": "2023-11-30 23:59:59"},
        {"start": "2023-01-01 00:00:00", "end": "2023-12-31 23:59:59"},
    ],
    "wage": 50000,
    "transactions": [
        {"date": "2023-10-12 20:15:30", "amount": 250},
        {"date": "2023-02-28 15:49:20", "amount": 375},
        {"date": "2023-07-01 21:59:00", "amount": 620},
        {"date": "2023-12-17 08:09:45", "amount": 480},
    ]
}


def test_filter_pdf_example_remanents():
    """PDF example: verify remanent values after q and p rules applied."""
    resp = client.post(BASE_URL, json=PDF_PAYLOAD)
    assert resp.status_code == 200
    data = resp.json()
    valid = {t["date"]: t for t in data["valid"]}

    # 250 (Oct 12): base=50, p adds 25 → 75
    assert valid["2023-10-12 20:15:30"]["remanent"] == 75.0
    # 375 (Feb 28): no q/p → 25
    assert valid["2023-02-28 15:49:20"]["remanent"] == 25.0
    # 620 (Jul 1):  q overrides to 0 → 0
    assert valid["2023-07-01 21:59:00"]["remanent"] == 0.0
    # 480 (Dec 17): base=20, p adds 25 → 45
    assert valid["2023-12-17 08:09:45"]["remanent"] == 45.0


def test_filter_no_invalid_in_pdf_example():
    """PDF example has no invalid transactions."""
    resp = client.post(BASE_URL, json=PDF_PAYLOAD)
    assert resp.status_code == 200
    assert resp.json()["invalid"] == []


def test_filter_negative_amount_rejected():
    """Negative amounts are caught as invalid even in filter endpoint."""
    payload = {
        "q": [], "p": [], "k": [],
        "wage": 50000,
        "transactions": [{"date": "2023-01-01 10:00:00", "amount": -100}]
    }
    resp = client.post(BASE_URL, json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["invalid"]) == 1
    assert data["invalid"][0]["message"] == "Negative amounts are not allowed"


def test_filter_duplicate_rejected():
    """Duplicate timestamps caught as invalid."""
    payload = {
        "q": [], "p": [], "k": [],
        "wage": 50000,
        "transactions": [
            {"date": "2023-05-01 10:00:00", "amount": 300},
            {"date": "2023-05-01 10:00:00", "amount": 300},
        ]
    }
    resp = client.post(BASE_URL, json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["valid"]) == 1
    assert len(data["invalid"]) == 1
    assert data["invalid"][0]["message"] == "Duplicate transaction"


def test_filter_p_periods_stack():
    """Multiple p periods that overlap should all add their extras."""
    payload = {
        "q": [],
        "p": [
            {"extra": 10, "start": "2023-06-01 00:00:00", "end": "2023-06-30 23:59:59"},
            {"extra": 20, "start": "2023-06-01 00:00:00", "end": "2023-06-30 23:59:59"},
        ],
        "k": [],
        "wage": 50000,
        "transactions": [{"date": "2023-06-15 10:00:00", "amount": 250}]
    }
    resp = client.post(BASE_URL, json=payload)
    assert resp.status_code == 200
    # base remanent = 50, p1 adds 10, p2 adds 20 → 80
    assert resp.json()["valid"][0]["remanent"] == 80.0
