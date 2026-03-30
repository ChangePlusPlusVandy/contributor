from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer
from supabase_auth.errors import AuthApiError
from src.config.database import get_admin_collection, supabase

bearer_scheme = HTTPBearer()


async def verify_token(credentials=Depends(bearer_scheme)):
    try:
        user_response = supabase.auth.get_user(credentials.credentials)
    except AuthApiError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if not user_response.user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return user_response.user


async def get_current_admin(supabase_user=Depends(verify_token)):
    email = (supabase_user.email or "").lower()

    if not email.endswith("@thecontributor.org"):
        raise HTTPException(status_code=403, detail="Unauthorized email domain")

    admin = await get_admin_collection().find_one({"supabase_id": supabase_user.id}, {"_id": 0})

    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    return admin
