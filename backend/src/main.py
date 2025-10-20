from fastapi import FastAPI
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from vendor_auth.vendor_auth_routes import router
from utils.util_routes import router as util_routes
from .admin_auth.admin_auth_routes import router as admin_router


app = FastAPI()
app.include_router(admin_router)

app.include_router(router)
app.include_router(util_routes)

@app.get("/")
def root():
    return {"message": "Hello, World!"}

