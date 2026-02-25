# Test type: Unit Test + Integration Test
# Validation:  /transactions:parse — ceiling and remanent calculation
# Command: pytest test/test_parse.py -v

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.calculator import parse_datetime

client = TestClient(app)

PDF_EXPENSES = [
    {"date": "2023-10-12 20:15:30", "amount": 250},
    {"date": "2023-02-28 15:49:20", "amount": 375},
    {"date": "2023-07-01 21:59:00", "amount": 620},
    {"date": "2023-12-17 08:09:45", "amount": 480},
]


def test_parse_pdf_example():
    """PDF example: 4 expenses with known ceiling/remanent values."""
    resp = client.post("/blackrock/challenge/v1/transactions:parse", json=PDF_EXPENSES)
    assert resp.status_code == 200
    data = resp.json()
    assert data[0] == {"date": "2023-10-12 20:15:30", "amount": 250.0, "ceiling": 300.0, "remanent": 50.0}
    assert data[1] == {"date": "2023-02-28 15:49:20", "amount": 375.0, "ceiling": 400.0, "remanent": 25.0}
    assert data[2] == {"date": "2023-07-01 21:59:00", "amount": 620.0, "ceiling": 700.0, "remanent": 80.0}
    assert data[3] == {"date": "2023-12-17 08:09:45", "amount": 480.0, "ceiling": 500.0, "remanent": 20.0}


def test_parse_exact_multiple_of_100():
    """Amount already a multiple of 100 → remanent = 0."""
    resp = client.post("/blackrock/challenge/v1/transactions:parse", json=[
        {"date": "2023-01-01 10:00:00", "amount": 500}
    ])
    assert resp.status_code == 200
    data = resp.json()
    assert data[0]["ceiling"] == 500.0
    assert data[0]["remanent"] == 0.0


def test_parse_amount_zero():
    """Amount = 0 → ceiling = 0, remanent = 0."""
    resp = client.post("/blackrock/challenge/v1/transactions:parse", json=[
        {"date": "2023-01-01 10:00:00", "amount": 0}
    ])
    assert resp.status_code == 200
    data = resp.json()
    assert data[0]["ceiling"] == 0.0
    assert data[0]["remanent"] == 0.0


def test_parse_amount_99():
    """Amount = 99 → ceiling = 100, remanent = 1."""
    resp = client.post("/blackrock/challenge/v1/transactions:parse", json=[
        {"date": "2023-01-01 10:00:00", "amount": 99}
    ])
    assert resp.status_code == 200
    data = resp.json()
    assert data[0]["ceiling"] == 100.0
    assert data[0]["remanent"] == 1.0


def test_parse_empty_list():
    """Empty list → empty response."""
    resp = client.post("/blackrock/challenge/v1/transactions:parse", json=[])
    assert resp.status_code == 200
    assert resp.json() == []


def test_health_endpoint():
    """GET / returns ok status."""
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_invalid_body_triggers_validation_handler():
    """Sending wrong types triggers the custom 422 handler."""
    resp = client.post(
        "/blackrock/challenge/v1/transactions:parse",
        json=[{"date": "2023-01-01 10:00:00", "amount": "not-a-number"}],
    )
    assert resp.status_code == 422
    data = resp.json()
    assert "detail" in data
    assert data["message"] == "Invalid request body"


def test_parse_datetime_invalid_format():
    """parse_datetime raises ValueError on unrecognised format."""
    with pytest.raises(ValueError, match="Invalid datetime format"):
        parse_datetime("not-a-date")
