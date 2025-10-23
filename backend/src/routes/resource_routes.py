from fastapi import APIRouter, Depends
from pymongo.asynchronous.collection import AsyncCollection
from schemas.resource import Resource
from controllers.resource_controller import get_all_active, create_resource, set_removed
from config.database import get_resources_collection

router = APIRouter(prefix="/resources", tags=["Resources"])

@router.get("/")
async def route_get_resources(collection: AsyncCollection = Depends(get_resources_collection)):
    """
    Retrieve all active resources. 
    
    Returns all resources where "removed" is False.
    """
    return await get_all_active(collection)

@router.post("/")
async def route_create_resource(
    resource: Resource, 
    collection: AsyncCollection = Depends(get_resources_collection)
):
    """
    Create a new resource and add it to database.
    
    Returns the dict for the resource.
    """
    return await create_resource(resource, collection)

@router.patch("/{resource_id}")
async def route_set_removed(
    resource_id: str, 
    collection: AsyncCollection = Depends(get_resources_collection)
):
    """
    Set a given resource's field "removed" to False.
    
    Returns the resource's id.  
    """
    return await set_removed(resource_id, collection)
