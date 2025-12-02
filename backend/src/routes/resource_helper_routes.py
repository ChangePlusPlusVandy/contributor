import os
import sys

# Add the backend directory to sys.path so 'src' module can be found
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import APIRouter
from src.config.logger import get_logger

router = APIRouter(prefix="/resources", tags=["Resources"])
logger = get_logger(__name__)

