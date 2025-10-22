from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorCollection
from src.schemas.resource import Resource
from src.controllers.resource_controller import get_all_resources, create_resource, set_removed
from config.database import get_resources_collection

router = APIRouter(prefix="/resources", tags=["Resources"])

@router.get("/")
async def route_get_resources(collection: AsyncIOMotorCollection = Depends(get_resources_collection)):
    return await get_all_resources(collection)

@router.post("/")
async def route_create_resource(resource: Resource, collection: AsyncIOMotorCollection = Depends(get_resources_collection)):
    return await create_resource(resource, collection)

@router.patch("/{resource_id}")
async def route_set_removed(resource_id: str, collection: AsyncIOMotorCollection = Depends(get_resources_collection)):
    return await set_removed(resource_id, collection)
