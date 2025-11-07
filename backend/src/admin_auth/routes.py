import os
from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel
from dotenv import load_dotenv
from src.config.database import get_admin_collection, supabase
from src.config.logger import get_logger

load_dotenv()

router = APIRouter(prefix="/admin", tags=["admin_auth"])

logger = get_logger(__name__)

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
    except Exception as e:
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
async def admin_register(body: RegisterBody):
    try:
        collection = get_admin_collection()
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

        # insert admin data to MongoDB
        admin_data = {
            "_id": supabase_id,
            "email": email,
            "name": body.name,
            "dob": body.dob,
        }
        collection.update_one({"_id": supabase_id}, {"$set": admin_data}, upsert=True)

        logger.info(f"Admin registered successfully: {email}")
        return {"status": "ok", "id": supabase_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during admin registration: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


# login
@router.post("/login")
async def admin_login(request: Request):
    try:
        collection = get_admin_collection()
        supabase_id, _email = _get_authenticated_user(request)
        admin = collection.find_one({"_id": supabase_id})
        if not admin:
            logger.warning(f"Admin login failed — no record found for ID: {supabase_id}")
            raise HTTPException(status_code=403, detail="Admin not registered")

        logger.info(f"Admin login successful for ID: {supabase_id}")
        return {"status": "ok", "id": supabase_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during admin login: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")
