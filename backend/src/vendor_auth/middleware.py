import os
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from config.database import get_vendor_users_collection, supabase

load_dotenv()

# fastapi bearer token scheme
bearer_scheme = HTTPBearer()

# Takes bearer_scheme, and extracts the token from it, verifiying it with supabase
# then returning the user's supabase obj associated with the token
async def verify_token(credentials = Depends(bearer_scheme)):
    token = credentials.credentials

    try:
        user_response = supabase.auth.get_user(token)

        if not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )

        return user_response.user

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}"
        )

# Here for use in protected routes. Returns user's data in MongoDB using
# their verified supabase user from the verify_token method
async def get_current_user(
    supabase_user = Depends(verify_token),
    collection = Depends(get_vendor_users_collection)
):
    try:
        user = await collection.find_one(
            {"supabase_id": supabase_user.id},
            {"_id": 0}  # Not needed & causes issues since its not JSON
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found in database"
            )

        return user

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching user: {str(e)}"
        )
