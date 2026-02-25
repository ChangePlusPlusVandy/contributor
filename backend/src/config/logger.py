# src/config/logger.py
import logging

LOG_LEVEL = logging.INFO  # Change to DEBUG for local debugging

logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

logger = logging.getLogger("backend")

# silence noisy third-party loggers by raising their level to WARNING
for ns in ("httpx", "uvicorn", "pyiceberg", "urllib3"):
    logging.getLogger(ns).setLevel(logging.WARNING)

# If later you want to see debug for a specific module, you can adjust here

def get_logger(name: str):
    return logging.getLogger(f"backend.{name}")
