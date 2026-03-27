from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer
from src.config.database import get_admin_collection, supabase
from src.config.logger import get_logger

logger = get_logger(__name__)

# fastapi bearer token scheme
bearer_scheme = HTTPBearer()

async def verify_token(credentials=Depends(bearer_scheme)):
    """
    Takes and verifies token with Supabase, returning Supabase user obj
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


async def get_current_admin(supabase_user=Depends(verify_token)):
    """
    Uses Supabase user to find admin's data in MongoDB. Ensures @thecontributor.org
    """
    try:
        email = (supabase_user.email or "").lower()

        # Enforce admin email
        if not email.endswith("@thecontributor.org"):
            logger.warning(f"Unauthorized email domain attempted admin access: {email}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized email domain"
            )

        collection = get_admin_collection()
        admin = await collection.find_one(
            {"supabase_id": supabase_user.id},
            {"_id": 0}
        )

        if not admin:
            logger.warning(f"Admin not found in database: {supabase_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Admin not found in database"
            )

        return admin

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching admin: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching admin"
        )
