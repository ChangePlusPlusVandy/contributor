import os
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
import requests
from dotenv import load_dotenv
from config.database import get_admin_collection, supabase

load_dotenv()

router = APIRouter(prefix="/admin", tags=["admin_auth"])

class RegisterBody(BaseModel):
    name: str | None = None
    dob: str | None = None
    email: str
    password: str

# helper to get Supabase user from access token
def get_supabase_user(access_token: str):
    try:
        res = supabase.auth.get_user(access_token)
        user = getattr(res, "user", None)
        if not user:
            return None
        return {"id": user.id, "email": user.email}
    except Exception:
        return None


# helper to get bearer token
def _get_bearer_token(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    return auth.split(" ", 1)[1]


def _get_authenticated_user(request: Request):
    token = _get_bearer_token(request)
    user = get_supabase_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid access token")
    supabase_id = user.get("id")
    email = (user.get("email") or "").lower()
    if not email.endswith("@thecontributor.org"):
        raise HTTPException(status_code=403, detail="Unauthorized email domain")
    return (supabase_id, email)



@router.post("/register")
async def admin_register(
    body: RegisterBody,
    collection = Depends(get_admin_collection)
):
    try:
        auth_response = supabase.auth.sign_up({"email": body.email, "password": body.password})
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Supabase signup error: {str(e)}")

    user = getattr(auth_response, "user", None)
    if not user:
        raise HTTPException(status_code=400, detail="Supabase creation failure")

    supabase_id = user.id
    email = (user.email or "").lower()

    # check email domain
    if os.getenv("ALLOW_ANY_EMAIL") != "1" and not email.endswith("@thecontributor.org"):
        raise HTTPException(status_code=403, detail="Unauthorized email domain")

    # insert admin data to MongoDB
    admin_data = {
        "_id": supabase_id,
        "email": email,
        "name": body.name,
        "dob": body.dob,
    }
    await collection.update_one({"_id": supabase_id}, {"$set": admin_data}, upsert=True)

    return {"status": "ok", "id": supabase_id}

# login
@router.post("/login")
async def admin_login(
    request: Request,
    collection = Depends(get_admin_collection)
):
    supabase_id, _email = _get_authenticated_user(request)
    admin = await collection.find_one({"_id": supabase_id})
    if not admin:
        raise HTTPException(status_code=403, detail="Admin not registered")
    return {"status": "ok", "id": supabase_id}
