# import requests
import os
import sys
from datetime import datetime, timezone
from fastapi import HTTPException
from bson import ObjectId
from typing import List

# Add the backend directory to sys.path so 'src' module can be found
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from src.schemas.resource import Resource


async def get_all_active(collection):
    """
    Retrieve all resources from the database where "removed" is false.

    Args:
        collection: MongoDB collection instance ("resources")

    Returns:
        dict: Contains:
            - 'success' (bool): True if active resources successfully fetched
            - 'resources' (list of dicts): a list of Resource documents
    """
    try:
        resources = []
        
        # query for Resources where the field "removed" is false
        cursor = collection.find({"removed": False})
        
        # add all valid queries into list
        for document in cursor:
            # convert ObjectId to json
            document["_id"] = str(document["_id"])
            resources.append(document)
        
        # return success message and resources as a list of dicts
        return {"success": True, "resources": resources}
    except Exception as e:
        print(f"Error in get_all_resources controller: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")
    

# create a new resource and add to database
async def create_resource(resource: Resource, collection):
    """
    Create a resource and add it to the database. Before adding, set "removed" to false, add time
    created, and geolocation information.

    Args:
        resource (Resource): Pydantic Resource model
        collection: MongoDB collection instance ("resources")

    Returns:
        dict: Contains:
            - 'success' (bool): True if resource successfully created
            - 'resource' (dict): Resource dict with added fields (described above)
    """
    try:
        resource_dict = resource.model_dump()
    
        # add necessary fields
        resource_dict["removed"] = False
        resource_dict["created_at"] = datetime.now(timezone.utc)

        # insert resource into mongoDB
        result = collection.insert_one(resource_dict)

        # return result with id for client use
        resource_dict["_id"] = str(result.inserted_id)

        return {"success": True, "resource": resource_dict}
    except Exception as e:
        print(f"Error in create_resource controller: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")
    

async def set_removed(resource_id: str, collection):
    """
    Set a selected resource's "removed" field to True. The resource remains in the database.

    Args:
        resource_id (str): MongoDB ObjectId as a string
        collection: MongoDB collection instance ("resources")

    Returns:
        dict: Contains:
            - 'success' (bool): True if resource found and updated
            - 'message' (string): message describing successful removal
            - 'resource_id' (dict): Id of the resource to be updated
    """
    try:
        collection.update_one(
            {"_id": ObjectId(resource_id)},
            {"$set": {"removed": True}}
        )

        return {"success": True, "message": "Resource set as removed.", "resource_id": resource_id}
    except Exception as e:
        print(f"Error in set_removed controller: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")
    

async def seed_db(resources: List, collection):
    """
    Seed MongoDB database with Google Sheet info, keeping in mind duplicates, 
    old resources, etc.

    Returns a list of dicts, where each dict is a resource and status that indicates whether
    the resource was updated or newly inserted into MongoDB.
    """

    try:
        # output list 
        results = []

        # given: resources
        for resource in resources:
            result = await collection.update_one(
                {"org_name": resource["org_name"]},
                {"$set": resource},
                upsert = True
            )

            if result.matched_count > 0:
                results.append({"org_name": resource["org_name"], "status": "updated"})
            else:
                results.append({"org_name": resource["org_name"], "status": "inserted"})

        return {"success": True, "results": results}
    except Exception as e:
        print(f"Error in seed_db_from_sheets controller: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")