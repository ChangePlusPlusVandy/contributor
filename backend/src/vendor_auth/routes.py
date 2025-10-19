import os
import ssl
import certifi
from fastapi import APIRouter, HTTPException, status
from supabase import create_client, Client
from pymongo import MongoClient
from dotenv import load_dotenv
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from schemas.user import SignupRequest, MongoUser

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

mongo_uri = os.getenv("MONGODB_URI")
mongo_client = MongoClient(mongo_uri)

# Test connection immediately
try:
    mongo_client.admin.command('ping')
    print("MongoDB connected")
except Exception as e:
    print(f"MongoDB fail to connect: {e}")

db = mongo_client.vendor
users_collection = db.users

router = APIRouter(prefix="/auth", tags=["Authentication"])


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
            "date_of_birth": data.date_of_birth.isoformat(),
            "role": "vendor"
        }

        print(f"debug: pre-insert {mongo_create_vendor}")
        result = users_collection.insert_one(mongo_create_vendor)
        print(f"DEBUG: id of insert {result.inserted_id}")

        return {"supabase_id": supabase_id}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during signup: {str(e)}"
        )


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