import os
import sys

# Add the backend directory to sys.path so 'src' module can be found
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import HTTPException, APIRouter
from src.controllers.resource_controller import (
    set_removed,
    get_resource
)
from src.config.database import get_resources_collection
from src.config.logger import get_logger

router = APIRouter(prefix="/resources", tags=["Resources"])
logger = get_logger(__name__)


@router.get("/{resource_id}")
async def route_get_resource(resource_id: str):
    """Returns the a resource given its id."""

    logger.info(f"Getting resource with resource_id={resource_id}")
    try:
        collection = get_resources_collection()
        resource = await get_resource(resource_id, collection)
        logger.info(f"Successfully retrieved resource with resource_id={resource_id}")
        return resource
    except Exception as e:
        logger.error(f"Error retrieving resource with resource_id={resource_id}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve resource")


@router.patch("/{resource_id}")
async def route_set_removed(resource_id: str):
    """
    Set a given resource's field "removed" to True.
    
    Returns the resource's id.  
    """
    logger.info(f"Setting 'removed' field to True for resource_id={resource_id}")
    try:
        collection = get_resources_collection()
        updated = await set_removed(resource_id, collection)
        logger.info(f"Successfully marked resource as removed: resource_id={resource_id}")
        return updated
    except Exception as e:
        logger.error(f"Error removing resource_id={resource_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to mark resource as removed")

