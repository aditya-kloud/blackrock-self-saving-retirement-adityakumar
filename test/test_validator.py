# Test type: Unit Test + Integration Test
# Validation: /transactions:validator — negative, duplicate, wrong ceiling/remanent
# Command: pytest test/test_validator.py -v

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

BASE_URL = "/blackrock/challenge/v1/transactions:validator"


def test_valid_transactions():
    """All correct transactions pass through as valid."""
    payload = {
        "wage": 50000,
        "transactions": [
            {"date": "2023-01-15 10:30:00", "amount": 2000.0, "ceiling": 2000.0, "remanent": 0.0},
            {"date": "2023-03-20 14:45:00", "amount": 250.0,  "ceiling": 300.0,  "remanent": 50.0},
        ]
    }
    resp = client.post(BASE_URL, json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["valid"]) == 2
    assert len(data["invalid"]) == 0


def test_negative_amount_is_invalid():
    """Negative amount → invalid with correct message."""
    payload = {
        "wage": 50000,
        "transactions": [
            {"date": "2023-07-10 09:15:00", "amount": -250.0, "ceiling": 0.0, "remanent": 0.0}
        ]
    }
    resp = client.post(BASE_URL, json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["invalid"]) == 1
    assert data["invalid"][0]["message"] == "Negative amounts are not allowed"


def test_duplicate_date_is_invalid():
    """Second transaction with same timestamp → invalid as duplicate."""
    payload = {
        "wage": 50000,
        "transactions": [
            {"date": "2023-06-10 09:15:00", "amount": 250.0, "ceiling": 300.0, "remanent": 50.0},
            {"date": "2023-06-10 09:15:00", "amount": 250.0, "ceiling": 300.0, "remanent": 50.0},
        ]
    }
    resp = client.post(BASE_URL, json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["valid"]) == 1
    assert len(data["invalid"]) == 1
    assert data["invalid"][0]["message"] == "Duplicate transaction"


def test_wrong_ceiling_is_invalid():
    """Transaction with incorrect ceiling → invalid."""
    payload = {
        "wage": 50000,
        "transactions": [
            {"date": "2023-06-10 09:15:00", "amount": 250.0, "ceiling": 400.0, "remanent": 150.0}
        ]
    }
    resp = client.post(BASE_URL, json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["invalid"]) == 1
    assert "Invalid ceiling" in data["invalid"][0]["message"]


def test_amount_exceeds_max():
    """Amount >= 500000 → invalid."""
    payload = {
        "wage": 50000,
        "transactions": [
            {"date": "2023-01-01 10:00:00", "amount": 500000.0, "ceiling": 500000.0, "remanent": 0.0}
        ]
    }
    resp = client.post(BASE_URL, json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["invalid"]) == 1


def test_wrong_remanent_is_invalid():
    """Correct ceiling but wrong remanent → invalid."""
    payload = {
        "wage": 50000,
        "transactions": [
            {"date": "2023-06-10 09:15:00", "amount": 250.0, "ceiling": 300.0, "remanent": 99.0}
        ]
    }
    resp = client.post(BASE_URL, json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["invalid"]) == 1
    assert "Invalid remanent" in data["invalid"][0]["message"]
