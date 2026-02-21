# Test type: Integration Test
# Validation: /performance — response structure and valid field types
# Command: pytest test/test_performance.py -v

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

BASE_URL = "/blackrock/challenge/v1/performance"


def test_performance_returns_200():
    """Performance endpoint returns HTTP 200."""
    resp = client.get(BASE_URL)
    assert resp.status_code == 200


def test_performance_has_required_fields():
    """Response contains time, memory, and threads fields."""
    resp = client.get(BASE_URL)
    data = resp.json()
    assert "time" in data
    assert "memory" in data
    assert "threads" in data


def test_performance_time_format():
    """Time field follows HH:MM:SS.mmm format."""
    resp = client.get(BASE_URL)
    time_str = resp.json()["time"]
    parts = time_str.split(":")
    assert len(parts) == 3
    assert parts[2].count(".") == 1  # seconds.milliseconds


def test_performance_memory_is_positive():
    """Memory usage is a positive number in MB."""
    resp = client.get(BASE_URL)
    memory_str = resp.json()["memory"]
    mem_val = float(memory_str.replace(" MB", ""))
    assert mem_val > 0


def test_performance_threads_positive_int():
    """Thread count is a positive integer."""
    resp = client.get(BASE_URL)
    threads = resp.json()["threads"]
    assert isinstance(threads, int)
    assert threads > 0
