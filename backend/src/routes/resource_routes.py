import os
import sys
from fastapi import APIRouter, HTTPException, Request

from typing import List

# Add the backend directory to sys.path so 'src' module can be found
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from src.schemas.resource import Resource
from src.controllers.resource_controller import (
    get_resources,
    create_resource,
    get_resource,
    update_resource,
    seed_db,
    receive_form,
    approve_submission,
    deny_submission
)
from src.config.database import get_resources_collection, get_pending_collection
from src.config.logger import get_logger

router = APIRouter(prefix="/resources", tags=["Resources"])
logger = get_logger(__name__)

@router.get("/")
async def route_get_resources(active: bool = True):
    """
    Retrieve resources from MongoDB.

    Args:
        active: True if only "active" resources are to be fetched, False if all resources are to be fetched

    Example: 
        GET /resources?active=false

    Returns:
        JSON object containing:
            - success: whether the request succeeded
            - active: the filter applied
            - resources: list of resources 
    """
    logger.info("Fetching all active resources...")
    try:
        collection = get_resources_collection()
        resources = await get_resources(collection, active)
        logger.info(f"Successfully retrieved {len(resources.get('resources', []))} {'active ' if active else ''} resources.")
        return resources
    except Exception as e:
        logger.error(f"Error retrieving resources: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve resources")

@router.post("/")
async def route_create_resource(resource: Resource):
    """
    Create a new resource and add it to database.

    Returns the dict for the resource.
    """
    logger.info(f"Attempting to create new resource with name='{resource.name}'")
    try:
        collection = get_resources_collection()
        new_resource = await create_resource(resource, collection)
        logger.info(f"Successfully created resource with ID={new_resource.get('resource', {}).get('_id', 'N/A')}")
        return new_resource
    except Exception as e:
        logger.error(f"Error creating resource: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create resource")


@router.get("/{identifier}")
async def route_get_resource(identifier: str, search_by: str = "id"):
    """
    Get a resource by its ID or org_name.

    Args:
        identifier: Either a MongoDB ObjectId string or an org_name
        search_by: Either "id" (default) or "org_name" to specify search field

    Returns the resource document or None if not found.

    Examples:
        GET /resources/507f1f77bcf86cd799439011?search_by=id
        GET /resources/Acme%20Foundation?search_by=org_name
    """
    logger.info(f"Getting resource with {search_by}={identifier}")
    try:
        collection = get_resources_collection()
        resource = await get_resource(identifier, collection, search_by)

        if resource.get("resource"):
            logger.info(f"Successfully retrieved resource with {search_by}={identifier}")
        else:
            logger.warning(f"No resource found with {search_by}={identifier}")

        return resource
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving resource with {search_by}={identifier}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve resource")


@router.patch("/{resource_id}")
async def route_update_resource(resource_id: str, updates: dict):
    """
    Update a resource with the provided fields.

    Args:
        resource_id: MongoDB ObjectId as a string
        updates: Dictionary of fields to update

    Returns success status and update information.

    Example request body:
        {"removed": true}
        {"email": "newemail@example.com", "phone": 1234567890}
    """
    logger.info(f"Updating resource {resource_id} with fields: {list(updates.keys())}")
    try:
        collection = get_resources_collection()
        result = await update_resource(resource_id, updates, collection)

        logger.info(f"Successfully updated resource {resource_id}. Modified {result.get('modified_count', 0)} field(s)")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating resource {resource_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update resource")


@router.post("/seed")
async def route_seed_db(resources: List[dict]):
    """
    Seed MongoDB database with Google Sheets resource info.
    Returns a list of dicts that indicate the status of adding/updating each resource.
    """
    logger.info(f"Seeding {len(resources)} resources from Google Sheets into MongoDB")
    try:
        collection = get_resources_collection()
        result = await seed_db(resources, collection)

        # updated vs inserted for logging
        updated_count = sum(1 for r in result['results'] if r['status'] == 'updated')
        inserted_count = sum(1 for r in result['results'] if r['status'] == 'inserted')

        logger.info(f"Successfully seeded database: {updated_count} updated, {inserted_count} inserted")
        return result
    except Exception as e:
        logger.error(f"Error seeding database: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to seed database from sheets")

@router.post("/form")
async def route_receive_form(request: Request):
    """Receive a form submission and convert to JSON."""
    logger.info(f"Receiving form submission")
    try:
        pend_col = get_pending_collection()
        res_col = get_resources_collection()

        resource = await receive_form(request, pend_col, res_col)
        logger.info("Successfully received submission from form")
        return resource

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error receiving form submission: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to receive form submission")


@router.post("/pending/{submission_id}/approve")
async def route_approve_submission(submission_id: str):
    """
    Approve a pending submission.

    Args:
        submission_id: MongoDB ObjectId of the pending submission

    Returns success status and action taken (created or updated).
    """
    logger.info(f"Approving submission {submission_id}")
    try:
        pend_col = get_pending_collection()
        res_col = get_resources_collection()

        result = await approve_submission(submission_id, pend_col, res_col)

        logger.info(f"Successfully approved submission {submission_id}. Action: {result.get('action')}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving submission {submission_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to approve submission")


@router.post("/pending/{submission_id}/deny")
async def route_deny_submission(submission_id: str):
    """
    Deny a pending submission.

    Args:
        submission_id: MongoDB ObjectId of the pending submission

    Returns success status.
    """
    logger.info(f"Denying submission {submission_id}")
    try:
        pend_col = get_pending_collection()

        result = await deny_submission(submission_id, pend_col)

        logger.info(f"Successfully denied submission {submission_id}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error denying submission {submission_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to deny submission")
