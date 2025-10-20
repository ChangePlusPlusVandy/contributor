import os
import ssl
import certifi
from fastapi import APIRouter, HTTPException, status, Depends
from supabase import create_client, Client
from pymongo import MongoClient
from dotenv import load_dotenv
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from schemas.user import SignupRequest, LoginRequest, MongoUser
from vendor_auth.auth_middleware import get_current_user

load_dotenv()

# Supabase init
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# MongoDB init
mongo_uri = os.getenv("MONGODB_URI")
mongo_client = MongoClient(mongo_uri)
db = mongo_client.vendor
users_collection = db.users

router = APIRouter(prefix="/auth", tags=["Authentication"])


# POST: Handles submitted signup form info (vendor only)
@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(data: SignupRequest):
    try:
        # Send to Supabase
        auth_response = supabase.auth.sign_up({
            "email": data.email,
            "password": data.password
        })

        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supabase creation failure"
            )

        supabase_id = auth_response.user.id

        # Create in Mongo
        mongo_create_vendor = {
            "supabase_id": supabase_id,
            "email": data.email,
            "name": data.name,
            "dob": data.dob.isoformat(),
            "role": "vendor"
        }

        result = users_collection.insert_one(mongo_create_vendor)

        return {"supabase_id": supabase_id}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during signup: {str(e)}"
        )
    

# POST: Handles vendor login ONLY - admins use separate route
@router.post("/login", status_code=status.HTTP_200_OK)
async def vendor_login(data: LoginRequest):
    try:
        # auth with Supabase
        auth_response = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password
        })

        if not auth_response.user or not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Checks if person logging in is a vendor
        user = users_collection.find_one(
            {"supabase_id": auth_response.user.id},
            {"_id": 0}
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found in database"
            )

        if user.get("role") != "vendor":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This login is for vendors only. Admins use a different portal."
            )

        # Return tokens
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
        # Check if it's an auth error
        if "Invalid login credentials" in str(e) or "Invalid" in str(e):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during login: {str(e)}"
        )


# PROTECTED GET: Returns current logged-in user info. JWT Protected.
@router.get("/me", status_code=status.HTTP_200_OK)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    return {
        "user": current_user
    }


# PROTECTED GET: Get a specific user via supabase id
@router.get("/users/{user_id}", status_code=status.HTTP_200_OK)
async def get_user_profile(user_id: str, current_user: dict = Depends(get_current_user)):
    try:
        user = users_collection.find_one(
            {"supabase_id": user_id},
            {"_id": 0}
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching user: {str(e)}"
        )


# GET: Returns ALL users. For testing: will remove later / protect route
@router.get("/users")
async def get_all_users():
    try:
        users = list(users_collection.find({}, {"_id": 0}))
        return {"users": users}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching users: {str(e)}"
        )