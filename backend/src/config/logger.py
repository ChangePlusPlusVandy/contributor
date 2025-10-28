# src/config/logger.py
import logging

LOG_LEVEL = logging.INFO  # Change to DEBUG for local debugging

logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

logger = logging.getLogger("backend")

def get_logger(name: str):
    return logging.getLogger(f"backend.{name}")
