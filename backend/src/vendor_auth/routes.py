import os
import ssl
import certifi
from fastapi import APIRouter, HTTPException, status, Depends
from dotenv import load_dotenv
import sys
from src.config.supabase import supabase
from src.config.database import users_collection
from src.models.vendor_auth import SignupRequest, LoginRequest
from src.config.logger import get_logger

# Add the backend directory to sys.path so 'src' module can be found
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from src.schemas.user import SignupRequest, LoginRequest, MongoUser
from src.vendor_auth.middleware import get_current_user
from src.config.database import get_vendor_users_collection, supabase

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = get_logger(__name__)


# POST: Handles submitted signup form info for vendors
@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(
    data: SignupRequest,
    collection = Depends(get_vendor_users_collection)
):
    try:
        # Sign up with Supabase
        auth_response = supabase.auth.sign_up({
            "email": data.email,
            "password": data.password
        })

        if not auth_response.user:
            logger.error("Supabase returned no user object during vendor signup.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supabase creation failure"
            )

        supabase_id = auth_response.user.id

        # Store vendor info in MongoDB
        vendor_data = {
            "supabase_id": supabase_id,
            "email": data.email,
            "name": data.name,
            "dob": data.dob.isoformat(),
            "role": "vendor"
        }

        result = await collection.insert_one(mongo_create_vendor)

        logger.info(f"Vendor registered successfully: {data.email}")
        return {"supabase_id": supabase_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during vendor signup: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
    

# POST: Handles vendor login ONLY - admins use separate route
@router.post("/login", status_code=status.HTTP_200_OK)
async def vendor_login(
    data: LoginRequest,
    collection = Depends(get_vendor_users_collection)
):
    try:
        # Authenticate via Supabase
        auth_response = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password
        })

        if not auth_response.user or not auth_response.session:
            logger.warning(f"Vendor login failed — invalid credentials: {data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Checks if person logging in is a vendor
        user = await collection.find_one(
            {"supabase_id": auth_response.user.id},
            {"_id": 0}
        )

        if not user:
            logger.warning(f"Vendor login failed — user not found in DB: {data.email}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found in database"
            )

        if user.get("role") != "vendor":
            logger.warning(f"Unauthorized role login attempt by: {data.email}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This login is for vendors only. Admins use a different portal."
            )

        logger.info(f"Vendor login successful: {data.email}")

        return {
            "access_token": auth_response.session.access_token,
            "refresh_token": auth_response.session.refresh_token,
            "user": {
                "id": auth_response.user.id,
                "email": auth_response.user.email,
                "role": user["role"]
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during vendor login: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


# PROTECTED GET: Returns current logged-in user info. JWT Protected.
@router.get("/me", status_code=status.HTTP_200_OK)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    try:
        if not current_user:
            logger.warning("Attempt to access /me with missing current_user context.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or missing user session"
            )

        logger.info(f"Profile fetched for vendor: {current_user.get('email')}")
        return {"user": current_user}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching current vendor profile: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


# PROTECTED GET: Get a specific user via supabase id
@router.get("/users/{user_id}", status_code=status.HTTP_200_OK)
async def get_user_profile(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    collection = Depends(get_vendor_users_collection)
):
    try:
        user = await collection.find_one(
            {"supabase_id": user_id},
            {"_id": 0}
        )

        if not user:
            logger.warning(f"User not found with ID: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        logger.info(f"Fetched user profile for ID: {user_id}")

        return {
            "user": {
                "supabase_id": user["supabase_id"],
                "email": user["email"],
                "name": user["name"],
                "role": user["role"]
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user profile for {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


# GET: Returns ALL users. For testing: will remove later / protect route
@router.get("/users")
async def get_all_users(collection = Depends(get_vendor_users_collection)):
    try:
        users = await collection.find({}, {"_id": 0}).to_list(length=None)
        logger.info(f"Fetched {len(users)} total users.")
        return {"users": users}
    except Exception as e:
        logger.error(f"Error fetching all users: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )