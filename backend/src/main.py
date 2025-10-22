import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from contextlib import asynccontextmanager
from config.database import MongoDB
from vendor_auth.vendor_auth_routes import router
from utils.util_routes import router as util_routes
from .admin_auth.admin_auth_routes import router as admin_router
from routes.resource_routes import router as resource_router

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

