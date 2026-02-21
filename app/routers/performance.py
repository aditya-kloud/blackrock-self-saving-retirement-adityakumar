import threading
import time
import psutil
import os
from fastapi import APIRouter
from app.models import PerformanceResponse

router = APIRouter(prefix="/blackrock/challenge/v1")

# Track server start time for uptime reporting
_start_time = time.time()


# Returns system execution metrics: uptime, memory usage, active thread count.

@router.get("/performance", response_model=PerformanceResponse)
def performance():
    # Elapsed time since server started
    elapsed_seconds = time.time() - _start_time
    hours, remainder = divmod(int(elapsed_seconds), 3600)
    minutes, seconds = divmod(remainder, 60)
    millis = int((elapsed_seconds % 1) * 1000)
    time_str = f"{hours:02d}:{minutes:02d}:{seconds:02d}.{millis:03d}"

    # Memory used by this process in MB
    process = psutil.Process(os.getpid())
    mem_mb = process.memory_info().rss / (1024 * 1024)
    memory_str = f"{mem_mb:.2f} MB"

    # Active thread count
    thread_count = threading.active_count()

    return PerformanceResponse(
        time=time_str,
        memory=memory_str,
        threads=thread_count,
    )
