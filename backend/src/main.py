from fastapi import FastAPI
import sys
import os

# Add the backend directory to sys.path so 'src' module can be found
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from src.vendor_auth.vendor_auth_routes import router
from src.utils.util_routes import router as util_routes
from src.admin_auth.admin_auth_routes import router as admin_router
from src.routes.resource_routes import router as resource_router


app = FastAPI()
app.include_router(admin_router)

app.include_router(router)
app.include_router(util_routes)
app.include_router(resource_router)

@app.get("/")
def root():
    return {"message": "Hello, World!"}

