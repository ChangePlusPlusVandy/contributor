from pydantic import BaseModel, Field
from datetime import date
from typing import Literal

#app to supabase
class SignupRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    name: str
    dob: date

class LoginRequest(BaseModel):
    email: str
    password: str

class MongoUser(BaseModel):
    supabase_id: str
    email: str
    name: str
    date_of_birth: str  # ISO format so like Year/Month/Day
    role: Literal["vendor", "admin"] #can either be vendor/admin
