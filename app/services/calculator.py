import math
from datetime import datetime


def parse_datetime(dt_str: str) -> datetime:
    """Parse datetime string.
    Supported formats:
      - YYYY-MM-DD HH:MM:SS.ffffff  (with microseconds)
      - YYYY-MM-DD HH:MM:SS.fff     (with milliseconds)
      - YYYY-MM-DD HH:MM:SS         (with seconds)
      - YYYY-MM-DD HH:MM            (minutes only)
    """
    dt_str = dt_str.strip()
    for fmt in (
        "%Y-%m-%d %H:%M:%S.%f",   # microseconds / milliseconds
        "%Y-%m-%d %H:%M:%S",      # seconds
        "%Y-%m-%d %H:%M",         # minutes
    ):
        try:
            return datetime.strptime(dt_str, fmt)
        except ValueError:
            continue
    raise ValueError(f"Invalid datetime format: {dt_str}")


def calculate_ceiling(amount: float) -> float:
    """Round up to next multiple of 100."""
    if amount <= 0:
        return 0.0
    return math.ceil(amount / 100) * 100.0


def calculate_remanent(amount: float, ceiling: float) -> float:
    """Difference between ceiling and amount."""
    return ceiling - amount
