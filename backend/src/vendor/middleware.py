from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer
from src.config.database import get_vendor_users_collection, supabase
from src.config.logger import get_logger

logger = get_logger(__name__)

# FastAPI bearer token scheme
bearer_scheme = HTTPBearer()


async def verify_token(credentials=Depends(bearer_scheme)):
    """
    Verifies the Bearer token with Supabase.
    Returns the Supabase user object if valid.
    """
    token = credentials.credentials

    try:
        user_response = supabase.auth.get_user(token)

        if not user_response.user:
            logger.warning("Token verification failed: no user returned")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )

        return user_response.user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token verification error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed"
        )


async def get_current_user(supabase_user=Depends(verify_token)):
    """
    Returns the vendor's data from MongoDB using their verified Supabase user.
    Looks up by supabase_id and returns vendor info.
    """
    try:
        collection = get_vendor_users_collection()
        user = await collection.find_one(
            {"supabase_id": supabase_user.id},
            {"_id": 0}
        )

        if not user:
            logger.warning(f"Vendor not found in database: {supabase_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found in database"
            )

        return user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching vendor: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching user"
        )
