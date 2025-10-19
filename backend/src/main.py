from fastapi import FastAPI
from utils.util_routes import router as util_routes

app = FastAPI()

app.include_router(util_routes)

@app.get("/")
def root():
    return {"message": "Hello, World!"}


