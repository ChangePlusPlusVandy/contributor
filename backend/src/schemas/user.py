from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime

class VendorLoginRequest(BaseModel):
    vendor_id: str = Field(..., min_length=4, max_length=4)
    password: str


class VendorChangePasswordRequest(BaseModel):
    password: str = Field(..., min_length=6)


class VendorCreateRequest(BaseModel):
    vendor_id: str = Field(..., min_length=4, max_length=4)
    name: str


class VendorLocationRequest(BaseModel):
    latitude: float
    longitude: float





class AdminRegisterRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    name: str | None = None


class AdminLoginRequest(BaseModel):
    email: str
    password: str


class MongoVendor(BaseModel):
    supabase_id: str
    vendor_id: str
    name: str
    role: Literal["vendor"] = "vendor"
    is_clocked_in: bool = False


class MongoAdmin(BaseModel):
    supabase_id: str
    email: str
    name: str | None = None
    role: Literal["admin"] = "admin"
