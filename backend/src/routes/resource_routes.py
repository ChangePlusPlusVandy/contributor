from fastapi import APIRouter
from src.schemas.resource import Resource
from src.controllers.resource_controller import get_all_resources, create_resource, set_removed

router = APIRouter(prefix="/resources", tags=["Resources"])

@router.get("/")
async def route_get_resources():
    return await get_all_resources()

@router.post("/")
async def route_create_resource(resource: Resource):
    return await create_resource(resource)

@router.patch("/{resource_id}")
async def route_set_removed(resource_id: str):
    return await set_removed(resource_id)
