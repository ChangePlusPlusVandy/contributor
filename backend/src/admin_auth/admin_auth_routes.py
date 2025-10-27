import os
from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel
import requests
from src.config.logger import get_logger
from pymongo import MongoClient
from supabase import create_client, Client
from dotenv import load_dotenv
from src.config.supabase import supabase
from src.config.database import admins_col
from src.models.admin_auth import RegisterBody
load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
mongo_key = os.getenv("MONGODB_URI")

logger = get_logger(__name__)

if not supabase_url or not supabase_key:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_KEY")
if not mongo_key:
    raise RuntimeError("Missing MONGODB_URI")

supabase: Client = create_client(supabase_url, supabase_key)
router = APIRouter(prefix="/admin", tags=["admin_auth"])

# MongoDB client
mongo_client = MongoClient(mongo_key)
try:
    db = mongo_client.get_default_database()
except Exception:
    db = mongo_client["the-contributor"]

admins_col = db["admins"]

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
            logger.warning("Supabase user retrieval failed: No user object returned")
            return None
        return {"id": user.id, "email": user.email}
    except Exception:
        logger.error(f"Error retrieving Supabase user: {e}", exc_info=True)
        return None


# helper to get bearer token
def _get_bearer_token(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        logger.warning("Missing or malformed Bearer token")
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    return auth.split(" ", 1)[1]


def _get_authenticated_user(request: Request):
    token = _get_bearer_token(request)
    user = get_supabase_user(token)
    if not user:
        logger.warning("Invalid access token provided")
        raise HTTPException(status_code=401, detail="Invalid access token")
    supabase_id = user.get("id")
    email = (user.get("email") or "").lower()
    if not email.endswith("@thecontributor.org"):
        logger.warning(f"Unauthorized email domain: {email}")
        raise HTTPException(status_code=403, detail="Unauthorized email domain")
    return (supabase_id, email)



@router.post("/register")
def admin_register(body: RegisterBody):
    try:
        auth_response = supabase.auth.sign_up({"email": body.email, "password": body.password})
        user = getattr(auth_response, "user", None)
        if not user:
            logger.error("Supabase returned no user object during signup")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Supabase creation failure")

        supabase_id = user.id
        email = (user.email or "").lower()

        # Check authorized email domain
        if os.getenv("ALLOW_ANY_EMAIL") != "1" and not email.endswith("@thecontributor.org"):
            logger.warning(f"Unauthorized email domain during registration: {email}")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized email domain")

        admin_data = {"_id": supabase_id, "email": email, "name": body.name, "dob": body.dob}
        admins_col.update_one({"_id": supabase_id}, {"$set": admin_data}, upsert=True)

        logger.info(f"Admin registered successfully: {email}")
        return {"status": "ok", "id": supabase_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during admin registration: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


# login
@router.post("/login")
def admin_login(request: Request):
    try:
        supabase_id, _email = _get_authenticated_user(request)
        admin = admins_col.find_one({"_id": supabase_id})
        if not admin:
            logger.warning(f"Admin login failed — no record found for ID: {supabase_id}")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin not registered")

        logger.info(f"Admin login successful for ID: {supabase_id}")
        return {"status": "ok", "id": supabase_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during admin login: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")