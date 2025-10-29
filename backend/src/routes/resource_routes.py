from fastapi import APIRouter, Depends, HTTPException
from schemas.resource import Resource
from controllers.resource_controller import get_all_active, create_resource, set_removed, seed_db
from src.config.database import get_resources_collection
from src.config.logger import get_logger
from typing import List

router = APIRouter(prefix="/resources", tags=["Resources"])
logger = get_logger(__name__)

# test

@router.get("/")
async def route_get_resources(collection = Depends(get_resources_collection)):
    """
    Retrieve all active resources.

    Returns all resources where "removed" is False.
    """
    logger.info("Fetching all active resources...")
    try:
        resources = await get_all_active(collection)
        logger.info(f"Successfully retrieved {len(resources)} active resources.")
        return resources
    except Exception as e:
        logger.error(f"Error retrieving resources: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve resources")

@router.post("/")
async def route_create_resource(
    resource: Resource,
    collection = Depends(get_resources_collection)
):
    """
    Create a new resource and add it to database.

    Returns the dict for the resource.
    """
    logger.info(f"Attempting to create new resource with name='{resource.name}'")
    try:
        new_resource = await create_resource(resource, collection)
        logger.info(f"Successfully created resource with ID={new_resource.get('_id', 'N/A')}")
        return new_resource
    except Exception as e:
        logger.error(f"Error creating resource: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create resource")

@router.patch("/{resource_id}")
async def route_set_removed(
    resource_id: str,
    collection = Depends(get_resources_collection)
):
    """
    Set a given resource's field "removed" to True.
    
    Returns the resource's id.  
    """
    logger.info(f"Setting 'removed' field to True for resource_id={resource_id}")
    try:
        updated = await set_removed(resource_id, collection)
        logger.info(f"Successfully marked resource as removed: resource_id={resource_id}")
        return updated["resource_id"]
    except Exception as e:
        logger.error(f"Error removing resource_id={resource_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to mark resource as removed")
    
@router.post("/seed")
async def route_seed_db(
    resources: List,
    collection = Depends(get_resources_collection)
):
    """
    Seed MongoDB database with Google Sheets resource info. 

    Returns a list of dicts that indicate the status of adding/updating each resource.
    """
    logger.info(f"Seeding {len(resources)} resources from Google Sheets into MongoDB")
    try:
        result = await seed_db(resources, collection)

        # updated vs inserted for logging
        updated_count = sum(1 for r in result['results'] if r['status'] == 'updated')
        inserted_count = sum(1 for r in result['results'] if r['status'] == 'inserted')
        
        logger.info(f"Successfully seeded database: {updated_count} updated, {inserted_count} inserted")
        return result
    except Exception as e:
        logger.error(f"Error seeding database: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to seed database from sheets")

