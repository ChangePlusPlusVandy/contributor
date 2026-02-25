import sys
import os

# Add the backend directory to sys.path so 'src' module can be found
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI
from contextlib import asynccontextmanager
from src.config.database import MongoDB
from src.config.logger import get_logger

from src.vendor_auth.routes import router
from src.utils.util_routes import router as util_routes
from src.admin_auth.routes import router as admin_router
from src.routes.resource_routes import router as resource_router
from src.routes.resource_helper_routes import router as resource_helper_router
from src.routes.messaging_routes import router as messaging_router

logger = get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # connect to MongoDB, initialize client
    await MongoDB.connect_db()

    # perform an initial sync from the Google Sheet so the database is
    # populated before the first request arrives.  If the sheet is down or
    # the seed fails we log an error but allow the server to start anyway.
    try:
        from src.utils.util_routes import sync_and_seed

        logger.info("Running startup sync_and_seed")
        await sync_and_seed()
        logger.info("Startup sync_and_seed completed")
    except Exception as e:  # pragma: no cover - best effort only
        logger.error(f"Startup sync/seed failed: {e}", exc_info=True)

    # stop here until server shuts down
    yield

    # close connection, set client to null
    await MongoDB.close_db()

app = FastAPI(lifespan = lifespan)

app.include_router(admin_router)
app.include_router(router)
app.include_router(util_routes)
app.include_router(resource_router)
app.include_router(messaging_router)
app.include_router(resource_helper_router)

@app.get("/")
def root():
    return {"message": "Hello, World!"}

