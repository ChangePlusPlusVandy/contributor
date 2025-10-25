import os

from dotenv import load_dotenv
from pymongo import AsyncMongoClient
from pymongo.server_api import ServerApi
from pymongo.asynchronous.collection import AsyncCollection

load_dotenv()
mongo_key = os.getenv("MONGODB_URI")

class MongoDB:
    # client variable 
    client: AsyncMongoClient | None = None

    # MongoDB class methods
    @classmethod
    async def connect_db(cls):
        """Connect to MongoDB database and initialize "client" variable."""
        try:
            cls.client = AsyncMongoClient(mongo_key, server_api = ServerApi('1'))
            
            # await cls.client.admin.command('ping')
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
async def get_resources_collection() -> AsyncCollection:
    """Connect to the "resources" collection in the "the-contributor" database."""
    return MongoDB.get_collection("resources", "the-contributor")