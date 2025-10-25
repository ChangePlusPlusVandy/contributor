import sys
import os

# Add the backend directory to sys.path so 'src' module can be found
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)


from fastapi import FastAPI
from contextlib import asynccontextmanager
from src.config.database import MongoDB

from src.vendor_auth.routes import router
from src.utils.util_routes import router as util_routes
from src.admin_auth.routes import router as admin_router
from src.routes.resource_routes import router as resource_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # connect to MongoDB, initialize client
    await MongoDB.connect_db()

    # stop here until server shuts down
    yield

    # close connection, set client to null
    await MongoDB.close_db()

app = FastAPI(lifespan = lifespan)

app.include_router(admin_router)
app.include_router(router)
app.include_router(util_routes)
app.include_router(resource_router)

@app.get("/")
def root():
    return {"message": "Hello, World!"}

