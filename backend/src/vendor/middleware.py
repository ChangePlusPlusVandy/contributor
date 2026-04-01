from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer
from supabase_auth.errors import AuthApiError
from src.config.database import get_vendor_users_collection, supabase

bearer_scheme = HTTPBearer()


async def verify_token(credentials=Depends(bearer_scheme)):
    try:
        user_response = supabase.auth.get_user(credentials.credentials)
    except AuthApiError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if not user_response.user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return user_response.user


async def get_current_user(supabase_user=Depends(verify_token)):
    vendors = get_vendor_users_collection()
    user = await vendors.find_one({"supabase_id": supabase_user.id}, {"_id": 0})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user
