import os
import sys
from fastapi import APIRouter, HTTPException
from typing import List

# Add the backend directory to sys.path so 'src' module can be found
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from src.schemas.resource import Resource
from src.controllers.resource_controller import (
    get_all_active, 
    create_resource,  
    seed_db
)
from src.config.database import get_resources_collection
from src.config.logger import get_logger

router = APIRouter(prefix="/resources", tags=["Resources"])
logger = get_logger(__name__)

@router.get("/")
async def route_get_resources():
    """
    Retrieve all active resources.

    Returns all resources where "removed" is False.
    """
    logger.info("Fetching all active resources...")
    try:
        collection = get_resources_collection()
        resources = await get_all_active(collection)
        logger.info(f"Successfully retrieved {len(resources.get('resources', []))} active resources.")
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
