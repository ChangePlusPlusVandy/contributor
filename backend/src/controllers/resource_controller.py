# import requests
import os

from datetime import datetime, timezone
from fastapi import HTTPException
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import HTTPException
from src.schemas.resource import Resource
from bson import ObjectId

# loading env for MongoDB key
load_dotenv()
mongo_key = os.getenv("MONGODB_URI")

# connect to mongoDB
try:
    mongo_client = AsyncIOMotorClient(mongo_key)
    db = mongo_client["the-contributor"]
    resources_col = db["resources"]

    print("MongoDB connected successfully!")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    raise


# get all resources in the database where "removed" is false
async def get_all_resources():
    try:
        resources = []
        
        # query for Resources where the field "removed" is false
        cursor = resources_col.find({"removed": False})
        
        # add all valid queries into list
        async for document in cursor:
            # convert ObjectId to json
            document["_id"] = str(document["_id"])
            resources.append(document)
        
        # return success message and resources as a list of dicts
        return {"success": True, "resources": resources}
    except Exception as e:
        print(f"Error in get_all_resources controller: {e}")
        raise HTTPException(status_code = 500, detail = "Internal server error.")
    

# create a new resource and add to database
async def create_resource(resource: Resource):
    try:
        resource_dict = resource.model_dump()
    
        # add necessary fields
        resource_dict["removed"] = False
        resource_dict["created_at"] = datetime.now(timezone.utc)

        # insert resource into mongoDB
        result = await resources_col.insert_one(resource_dict)

        # return result with id for client use
        resource_dict["_id"] = str(result.inserted_id)

        return {"success": True, "resource": resource_dict}
    except Exception as e:
        print(f"Error in create_resource controller: {e}")
        raise HTTPException(status_code = 500, detail = "Internal server error.")
    

async def set_removed(resource_id: str):
    try:
        await resources_col.update_one(
            {"_id": ObjectId(resource_id)},
            {"$set": {"removed": True}}
        )

        return {"success": True, "message": "Resource set as removed."}
    except Exception as e:
        print(f"Error in set_removed controller: {e}")
        raise HTTPException(status_code = 500, detail = "Internal server error.")