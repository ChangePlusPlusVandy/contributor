# import requests
import os
import sys
from fastapi import HTTPException, Request
from bson import ObjectId
from typing import List
from datetime import datetime, timezone

# Add the backend directory to sys.path so 'src' module can be found
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from src.schemas.resource import Resource
from src.utils.utils import prepare_default_fields
from src.utils.email_notifications import send_submission_status_email 


async def get_resources(collection, active: bool):
    """
    Retrieve all resources from the database where "removed" is false.

    Args:
        collection: MongoDB collection instance ("resources")
        active: True if only "active" resources are to be fetched, False if all resources are to be fetched

    Returns:
        dict: Contains:
            - 'success' (bool): True if resources successfully fetched
            - 'active' (bool): True if only active resources fetched, False if all resources fetched
            - 'resources' (list of dicts): a list of Resource documents
    """
    try:
        resources = []
        
        # find active/all resources depending on "active" boolean parameter
        query = {"removed": False} if active else {}
        cursor = collection.find(query)
        
        # add all valid queries into list
        async for document in cursor:
            # convert ObjectId to json
            document["_id"] = str(document["_id"])
            resources.append(document)
        
        # return success message and resources as a list of dicts
        return {
            "success": True, 
            "active": active,
            "resources": resources
        }
    except Exception as e:
        print(f"Error in get_all_resources controller: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")
    

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

        # only geocode if we have a street address (not just city/state/zip)
        if resource_dict.get("address"):
            # combine address fields into a single geocodable string
            address_parts = [
                resource_dict.get("address"),
                resource_dict.get("city"),
                resource_dict.get("state"),
                resource_dict.get("zip_code")
            ]
            # filter out None/empty values and join with commas
            address_str = ", ".join(filter(None, address_parts))
        else:
            # no street address provided - don't geocode to avoid incorrect coords
            address_str = None
        print(address_str)

        # add necessary fields
        resource_dict.update(prepare_default_fields(address_str))

        # insert resource into mongoDB
        result = await collection.insert_one(resource_dict)

        # return result with id for client use
        resource_dict["_id"] = str(result.inserted_id)

        return {"success": True, "resource": resource_dict}
    except Exception as e:
        print(f"Error in create_resource controller: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")
    

async def get_resource(identifier: str, collection, search_by: str = "id"):
    """
    Get a resource based on its id or org_name.

    Args:
        identifier (str): Either a MongoDB ObjectId string or an org_name
        collection: MongoDB collection instance ("resources")
        search_by (str): Either "id" or "org_name" to specify search field

    Returns:
        dict: Contains:
            - 'success' (bool): True if resource found
            - 'resource' (dict or None): Resource document or None if not found
    """
    try:
        if search_by == "id":
            # search by ObjectId
            object_id = ObjectId(identifier)
            resource = await collection.find_one({"_id": object_id})
        elif search_by == "org_name":
            # search by org_name
            resource = await collection.find_one({"org_name": identifier})
        else:
            raise HTTPException(status_code=400, detail="search_by must be 'id' or 'org_name'")

        if resource:
            resource["_id"] = str(resource["_id"])

        return {"success": True, "resource": resource}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_resource controller: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")
    

async def update_resource(resource_id: str, updates: dict, collection):
    """
    Update a resource with the provided fields.

    Args:
        resource_id (str): MongoDB ObjectId as a string
        updates (dict): Dictionary of fields to update (e.g., {"removed": True, "email": "new@email.com"})
        collection: MongoDB collection instance ("resources")

    Returns:
        dict: Contains:
            - 'success' (bool): True if resource found and updated
            - 'message' (str): Success message
            - 'resource_id' (str): Id of the updated resource
            - 'modified_count' (int): Number of documents modified
    """
    try:
        if not updates:
            raise HTTPException(status_code=400, detail="No updates provided")

        result = await collection.update_one(
            {"_id": ObjectId(resource_id)},
            {"$set": updates}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Resource not found")

        return {
            "success": True,
            "message": "Resource updated successfully.",
            "resource_id": resource_id,
            "modified_count": result.modified_count
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in update_resource controller: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")
    

async def seed_db(resources: List[dict], collection):
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
                {
                    "$set": resource,
                    "$setOnInsert": prepare_default_fields() # TODO: see slack notes on seed_db
                 },
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
    

async def receive_form(request: Request, pending_collection, resource_collection):
    """Receives a form submission."""
    try:  
        res = await request.json()

        # create resource with form data
        new_resource = Resource(
            **res,
            submitted_at=datetime.now(timezone.utc),
            submitted_by=res.get("name")
        )

        if new_resource.add:
            # simply add to the pending collection
            await pending_collection.insert_one(new_resource.model_dump())
        else:
            # find the existing resource - search by name
            existing = await resource_collection.find_one({"org_name": new_resource.org_name})

            if existing:
                updated_resource = Resource(
                    **res,
                    original_resource_id=str(existing["_id"]),
                    submitted_at=datetime.now(timezone.utc),
                    submitted_by=res.get("name")
                )
                await pending_collection.insert_one(updated_resource.model_dump())
            else:
                raise HTTPException(status_code=422, detail=f"Cannot update: No existing resource with org_name='{new_resource.org_name}'")

        return {
            "success": True,
            "resource": new_resource.model_dump()
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in receive_form controller: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")
    

async def approve_submission(submission_id: str, pending_collection, resource_collection):
    """
    Approve a pending submission and move it to the resources collection.

    Args:
        submission_id (str): MongoDB ObjectId of the pending submission
        pending_collection: MongoDB pending_resources collection
        resource_collection: MongoDB resources collection

    Returns:
        dict: Contains:
            - 'success' (bool): True if submission approved successfully
            - 'message' (str): Success message
            - 'action' (str): Either 'created' or 'updated'
    """
    try:
        # get pending submission
        pending = await pending_collection.find_one({"_id": ObjectId(submission_id)})

        if not pending:
            raise HTTPException(status_code=404, detail="Pending submission not found")
        
        # extract data for email notification
        to_email = pending.get("email")
        org_name = pending.get("org_name")

        # remove metadata fields before creating/updating resource
        resource_data = {k: v for k, v in pending.items()
                        if k not in ["_id", "original_resource_id"]}

        if pending.get("add"):
            # new resource - create with all default fields
            resource = Resource(**resource_data)
            result = await create_resource(resource, resource_collection)
            action = "created"
        else:
            # update existing resource
            original_id = pending.get("original_resource_id")
            if not original_id:
                raise HTTPException(status_code=400, detail="No original_resource_id for update")

            # remove 'add' field from updates
            updates = {k: v for k, v in resource_data.items() if k != "add"}
            result = await update_resource(original_id, updates, resource_collection)
            action = "updated"

        # remove from pending collection
        await pending_collection.delete_one({"_id": ObjectId(submission_id)})

        # send update email
        if to_email:
            await send_submission_status_email(
                to_email=to_email,
                org_name=org_name,
                status="approved",
                extra_message=None,
            )

        return {
            "success": True,
            "message": f"Submission approved and resource {action}",
            "action": action,
            "result": result
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in approve_submission controller: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")


async def deny_submission(submission_id: str, pending_collection):
    """
    Deny a pending submission and remove it from the pending collection.

    Args:
        submission_id (str): MongoDB ObjectId of the pending submission
        pending_collection: MongoDB pending_resources collection

    Returns:
        dict: Contains:
            - 'success' (bool): True if submission denied successfully
            - 'message' (str): Success message
    """
    try:
        # check if submission exists
        pending = await pending_collection.find_one({"_id": ObjectId(submission_id)})

        if not pending:
            raise HTTPException(status_code=404, detail="Pending submission not found")
        
        # extract data for email notification
        to_email = pending.get("email")
        org_name = pending.get("org_name")

        # remove from pending collection
        result = await pending_collection.delete_one({"_id": ObjectId(submission_id)})

        if result.deleted_count == 0:
            raise HTTPException(status_code=500, detail="Failed to delete submission")
        
        # send update email
        if to_email:
         await send_submission_status_email(
             to_email=to_email,
             org_name=org_name,
             status="denied",
             extra_message=None,
         )

        return {
            "success": True,
            "message": "Submission denied and removed from pending"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in deny_submission controller: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")