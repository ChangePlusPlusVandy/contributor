import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()
mongo_key = os.getenv("MONGODB_URI")

class MongoDB:
    # client variable 
    client: AsyncIOMotorClient | None = None

    # methods
    @classmethod
    async def connect_db(cls):
        try:
            cls.client = AsyncIOMotorClient(mongo_key)
            
            # await cls.client.admin.command('ping')
            print("MongoDB connected successfully!")
        except Exception as e:
            print(f"Error connecting to MongoDB: {e}")
            raise
    
    @classmethod
    async def close_db(cls):
        if cls.client:
            cls.client.close()
            cls.client = None
            print("MongoDB connection closed.")

    @classmethod
    def get_client(cls) -> AsyncIOMotorClient:
        if cls.client is None:
            raise Exception("MongoDB not connected.")
        return cls.client
        
    @classmethod
    def _get_database(cls, name: str = "the-contributor"): # TODO: change default if needed
        return cls.get_client()[name]
    
    @classmethod
    def get_collection(cls, col_name: str, db_name: str = "the-contributor"):
        return cls._get_database(db_name)[col_name]
    
async def get_resources_collection() -> AsyncIOMotorClient:
    return MongoDB.get_collection("resources", "the-contributor")