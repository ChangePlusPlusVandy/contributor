from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

# Model for storing lat/long
class Coordinates(BaseModel):
    latitude: float
    longitude: float


# Enum for category choices
class CategoryChoices(str, Enum):
    URGENT = "Urgent Needs"
    HEALTH = "Health and Wellness"
    FAMILY_PETS = "Family and Pets"
    HELP = "Specialized Assistance and Help"
    WORK = "Find Work and Get Connected"


# schema for resource base
class ResourceBase(BaseModel): 
    """
    Shared fields for all resource types (both regular and pending)
    """
    # required
    name: str
    email: str
    phone: int
    org_name: str

    # optional
    page: int | None = None
    category: CategoryChoices
    bus_line: str | None = None
    hours: str | None = None
    services: str | None = None
    id_required: bool| None = False
    requirements: str | None = None
    app_process: str | None = None
    other: str | None = None

    address: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    website: str | None = None
    org_phones: str | None = None
    org_email: str | None = None


class Resource(ResourceBase):
    """
    Resource in the main 'resources' collection
    """
    removed: bool
    coordinates: Coordinates | None = None
    created_at: datetime


class PendingResource(ResourceBase):
    """
    Resources awaiting admin approval, in the 'pending' collection
    """
    # add vs. edit boolean required 
    add: bool

    updated_name: str | None = None
    page: str | None = None

    # metadata
    original_resource_id: str | None  = None
    submitted_at: datetime | None = None
