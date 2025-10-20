from fastapi import FastAPI
from .admin_auth.admin_auth_routes import router as admin_router

app = FastAPI()
app.include_router(admin_router)

@app.get("/")
def root():
    return {"message": "Hello, World!"}


