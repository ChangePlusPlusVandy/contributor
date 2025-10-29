from pydantic import BaseModel

# schema for resource
class Resource(BaseModel): 
    name: str
    email: str
    phone: int
    org_name: str
    latitude: float | None = None
    longitude: float | None = None
