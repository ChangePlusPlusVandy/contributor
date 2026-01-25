from pydantic import BaseModel, Field
from typing import Literal


# VENDOR SCHEMAS

class VendorLoginRequest(BaseModel):
    vendor_id: str = Field(..., min_length=4, max_length=4)
    password: str = ""  # Empty allowed for account creation. Admins will just create id
                        # NEW vendors log in with BLANK pass, set their own after
                        # CHECKS IF PASSWORD IS BLANK, WILL REDIRECT TO SET PASS PAGE


class VendorSetPasswordRequest(BaseModel):
    vendor_id: str = Field(..., min_length=4, max_length=4)
    password: str = Field(..., min_length=6)


class VendorCreateRequest(BaseModel):
    """Used by admin to pre-register a vendor"""
    vendor_id: str = Field(..., min_length=4, max_length=4)
    name: str


# ADMIN SCHEMAS

class AdminRegisterRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    name: str | None = None


class AdminLoginRequest(BaseModel):
    email: str
    password: str


# MONGO SCHEMAS

class MongoVendor(BaseModel):
    supabase_id: str | None = None
    vendor_id: str
    name: str
    role: Literal["vendor"] = "vendor"
    password_set: bool = False


class MongoAdmin(BaseModel):
    supabase_id: str
    email: str
    name: str | None = None
    role: Literal["admin"] = "admin"
