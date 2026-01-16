import os

from dotenv import load_dotenv
from pymongo import AsyncMongoClient
from pymongo.server_api import ServerApi
from supabase import create_client, Client

load_dotenv()
mongo_key = os.getenv("MONGODB_URI")

# Supabase initialization
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")

if not supabase_url or not supabase_key:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_KEY")

# Regular client for user auth operations
supabase: Client = create_client(supabase_url, supabase_key)

# Admin client for admin operations (Deleting users)
# Uses regular key if service key's not in the .env
supabase_admin: Client = create_client(
    supabase_url,
    supabase_service_key or supabase_key
)

class MongoDB:
    # client variable
    client: AsyncMongoClient | None = None

    # MongoDB class methods
    @classmethod
    async def connect_db(cls):
        """Connect to MongoDB database and initialize "client" variable."""
        try:
            cls.client = AsyncMongoClient(mongo_key, server_api = ServerApi('1'))

            # Test connection
            await cls.client.admin.command('ping')
            print("MongoDB connected successfully!")
        except Exception as e:
            print(f"Error connecting to MongoDB: {e}")
            raise
    
    @classmethod
    async def close_db(cls):
        """Close MongoDB connection."""
        if cls.client:
            await cls.client.close()
            cls.client = None
            print("MongoDB connection closed.")

    @classmethod
    def get_client(cls) -> AsyncMongoClient:
        """Returns the client connected to MongoDB."""
        if cls.client is None:
            raise Exception("MongoDB not connected.")
        return cls.client
        
    @classmethod
    def _get_database(cls, name: str = "the-contributor"): # TODO: change default if needed
        """
        Get a specific database in MongoDB.

        Args:
            - name (str): name of the desired database. Set to "the-contributor" by default.
        """
        return cls.get_client()[name]
    
    @classmethod
    def get_collection(cls, col_name: str, db_name: str = "the-contributor"):
        """
        Get a specific collection in a specific database.
        
        Args:
            - col_name (str): name of the desired collection
            - db_name (str): name of desired database. Set to "the-contributor" by default.
        """
        return cls._get_database(db_name)[col_name]
    
# methods for getting certain collections
def get_resources_collection():
    """Get the "resources" collection in the "the-contributor" database."""
    return MongoDB.get_collection("resources", "the-contributor")

def get_vendor_users_collection():
    """Get the "vendors" collection in the "the-contributor" database."""
    return MongoDB.get_collection("vendors", "the-contributor")

def get_admin_collection():
    """Get the "admins" collection in the "the-contributor" database."""
    return MongoDB.get_collection("admins", "the-contributor")

def get_pending_collection():
    """Get the "pending" collection in the "the-contributor" database."""
    return MongoDB.get_collection("pending", "the-contributor")