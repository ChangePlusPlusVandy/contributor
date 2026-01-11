from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# schema for resource
class Resource(BaseModel): 
    # required
    name: str
    email: str
    phone: int
    org_name: str
    add: bool

    # optional
    updated_name: Optional[str] = None
    page: Optional[int] = None
    category: Optional[str] = None
    bus_line: Optional[str] = None
    
    hours: Optional[str] = None
    services: Optional[str] = None
    requirements: Optional[str] = None
    app_process: Optional[str] = None
    other: Optional[str] = None

    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    website: Optional[str] = None
    org_phones: Optional[str] = None
    org_email: Optional[str] = None

    # metadata for pending_resources collection
    original_resource_id: Optional[str] = None
    submitted_at: Optional[datetime] = None
    submitted_by: Optional[str] = None
