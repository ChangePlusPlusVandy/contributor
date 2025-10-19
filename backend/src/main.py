from fastapi import FastAPI
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from vendor_auth.routes import router

app = FastAPI()
app.include_router(router)

@app.get("/")
def root():
    return {"message": "Hello, World!"}

