from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from supabase_auth.errors import AuthApiError
from src.schemas.user import AdminRegisterRequest, AdminLoginRequest, VendorCreateRequest
from src.admin.middleware import get_current_admin
from src.config.database import get_admin_collection, get_vendor_users_collection, supabase, supabase_admin

router = APIRouter(prefix="/admin", tags=["Admins"])


@router.post("/register", status_code=status.HTTP_200_OK)
async def admin_register(body: AdminRegisterRequest):
    email = body.email.lower()
    if not email.endswith("@thecontributor.org"):
        raise HTTPException(status_code=403, detail="Unauthorized email domain")

    try:
        auth_response = supabase.auth.sign_up({"email": body.email, "password": body.password})
    except AuthApiError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not auth_response.user:
        raise HTTPException(status_code=400, detail="Supabase creation failure")

    supabase_id = auth_response.user.id

    await get_admin_collection().update_one(
        {"supabase_id": supabase_id},
        {"$set": {"supabase_id": supabase_id, "email": email, "name": body.name, "role": "admin"}},
        upsert=True
    )

    return {"status": "ok", "id": supabase_id}


@router.post("/login", status_code=status.HTTP_200_OK)
async def admin_login(body: AdminLoginRequest):
    email = body.email.lower()
    if not email.endswith("@thecontributor.org"):
        raise HTTPException(status_code=403, detail="Unauthorized email domain")

    try:
        auth_response = supabase.auth.sign_in_with_password({"email": email, "password": body.password})
    except AuthApiError:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    admin = await get_admin_collection().find_one({"supabase_id": auth_response.user.id}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found in database")

    return {
        "access_token": auth_response.session.access_token,
        "refresh_token": auth_response.session.refresh_token,
        "admin": {
            "id": auth_response.user.id,
            "email": email,
            "name": admin.get("name"),
            "role": "admin"
        }
    }


@router.get("/me", status_code=status.HTTP_200_OK)
async def get_current_admin_profile(current_admin: dict = Depends(get_current_admin)):
    return {"admin": current_admin}



@router.post("/vendors", status_code=status.HTTP_201_CREATED)
async def create_vendor(data: VendorCreateRequest, current_admin: dict = Depends(get_current_admin)):
    vendors = get_vendor_users_collection()
    if await vendors.find_one({"vendor_id": data.vendor_id}):
        raise HTTPException(status_code=400, detail="Vendor ID already exists")

    await vendors.insert_one({
        "vendor_id": data.vendor_id,
        "name": data.name,
        "supabase_id": None,
        "password_set": False,
        "role": "vendor"
    })

    return {"message": "Vendor created successfully", "vendor": {"vendor_id": data.vendor_id, "name": data.name}}


@router.get("/vendors", status_code=status.HTTP_200_OK)
async def get_all_vendors(current_admin: dict = Depends(get_current_admin)):
    vendors = get_vendor_users_collection()
    all_vendors = await vendors.find({}, {"_id": 0}).to_list(length=None)
    return {"vendors": all_vendors, "count": len(all_vendors)}


@router.get("/users/{user_id}", status_code=status.HTTP_200_OK)
async def get_admin_by_id(user_id: str, current_admin: dict = Depends(get_current_admin)):
    admin = await get_admin_collection().find_one({"supabase_id": user_id}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    return {"admin": admin}

@router.get("/vendors/{vendor_id}", status_code=status.HTTP_200_OK)
async def get_vendor_by_id(vendor_id: str, current_admin: dict = Depends(get_current_admin)):
    vendors = get_vendor_users_collection()
    vendor = await vendors.find_one({"vendor_id": vendor_id}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return {"vendor": vendor}


@router.delete("/vendors/{vendor_id}", status_code=status.HTTP_200_OK)
async def delete_vendor(vendor_id: str, current_admin: dict = Depends(get_current_admin)):
    vendors = get_vendor_users_collection()
    vendor = await vendors.find_one({"vendor_id": vendor_id})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    if vendor.get("supabase_id"):
        supabase_admin.auth.admin.delete_user(vendor["supabase_id"])

    await vendors.delete_one({"vendor_id": vendor_id})
    return {"message": "Vendor deleted successfully"}
