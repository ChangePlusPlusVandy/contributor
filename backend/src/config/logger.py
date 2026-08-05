# src/config/logger.py
import logging
from pathlib import Path

LOG_LEVEL = logging.INFO  # Change to DEBUG for local debugging

LOG_FILE = Path(__file__).resolve().parents[2] / "backend.log"

logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
    ],
)

# httpx logs every outbound request URL at INFO, which exposes the Supabase
# project URL and query params (and request headers at DEBUG)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)

logger = logging.getLogger("backend")

def get_logger(name: str):
    return logging.getLogger(f"backend.{name}")
