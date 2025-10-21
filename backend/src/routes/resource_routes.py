import os

from fastapi import APIRouter
from src.schemas.resource import Resource
from src.controllers.resource_controller import get_all_resources, create_resource

router = APIRouter()

@router.get("/resources")
async def route_get_resources():
    return await get_all_resources()

@router.post("/resource")
async def route_create_resource(resource: Resource):
    return await create_resource(resource)

# resources will be a list of dicts
# add latitute and longitute 
