# import requests
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorCollection
from fastapi import HTTPException
from src.schemas.resource import Resource
from bson import ObjectId

# get all resources in the database where "removed" is false
async def get_all_resources(collection: AsyncIOMotorCollection):
    try:
        resources = []
        
        # query for Resources where the field "removed" is false
        cursor = collection.find({"removed": False})
        
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
async def create_resource(resource: Resource, collection: AsyncIOMotorCollection):
    try:
        resource_dict = resource.model_dump()
    
        # add necessary fields
        resource_dict["removed"] = False
        resource_dict["created_at"] = datetime.now(timezone.utc)

        # insert resource into mongoDB
        result = await collection.insert_one(resource_dict)

        # return result with id for client use
        resource_dict["_id"] = str(result.inserted_id)

        return {"success": True, "resource": resource_dict}
    except Exception as e:
        print(f"Error in create_resource controller: {e}")
        raise HTTPException(status_code = 500, detail = "Internal server error.")
    

async def set_removed(resource_id: str, collection: AsyncIOMotorCollection):
    try:
        await collection.update_one(
            {"_id": ObjectId(resource_id)},
            {"$set": {"removed": True}}
        )

        return {"success": True, "message": "Resource set as removed."}
    except Exception as e:
        print(f"Error in set_removed controller: {e}")
        raise HTTPException(status_code = 500, detail = "Internal server error.")