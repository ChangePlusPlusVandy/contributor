from pydantic import BaseModel

# define class schemas

# schema for resource
class Resource(BaseModel): 
    name: str
    email: str
    phone: int
    org_name: str
    lattitude: float | None = None
    longitude: float | None = None
