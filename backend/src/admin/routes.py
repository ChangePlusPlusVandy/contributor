import os
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from supabase_auth.errors import AuthApiError
from src.schemas.user import AdminRegisterRequest, AdminLoginRequest, AdminChangePasswordRequest, VendorCreateRequest, VendorChangePasswordRequest
from src.admin.middleware import get_current_admin
from src.config.database import get_admin_collection, get_vendor_users_collection, supabase, supabase_admin
from src.config.logger import get_logger

VENDOR_TEMP_PASSWORD = os.getenv("VENDOR_TEMP_PASSWORD")

router = APIRouter(prefix="/admin", tags=["Admins"])
logger = get_logger(__name__)


@router.post("/register", status_code=status.HTTP_200_OK)
async def admin_register(body: AdminRegisterRequest):
    email = body.email.lower()
    logger.info(f"Admin registration attempt for {email}")
    if not email.endswith("@thecontributor.org"):
        logger.warning(f"Rejected admin registration: unauthorized email domain for {email}")
        raise HTTPException(status_code=403, detail="Unauthorized email domain")

    try:
        auth_response = supabase.auth.sign_up({"email": body.email, "password": body.password})
    except AuthApiError as e:
        logger.error(f"Supabase sign-up failed for {email}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    if not auth_response.user:
        logger.error(f"Supabase sign-up returned no user for {email}")
        raise HTTPException(status_code=400, detail="Supabase creation failure")

    supabase_id = auth_response.user.id

    await get_admin_collection().update_one(
        {"supabase_id": supabase_id},
        {"$set": {"supabase_id": supabase_id, "email": email, "name": body.name, "role": "admin"}},
        upsert=True
    )

    logger.info(f"Successfully registered admin {email} (id={supabase_id})")
    return {"status": "ok", "id": supabase_id}


@router.post("/login", status_code=status.HTTP_200_OK)
async def admin_login(body: AdminLoginRequest):
    email = body.email.lower()
    logger.info(f"Admin login attempt for {email}")
    if not email.endswith("@thecontributor.org"):
        logger.warning(f"Rejected admin login: unauthorized email domain for {email}")
        raise HTTPException(status_code=403, detail="Unauthorized email domain")

    try:
        auth_response = supabase.auth.sign_in_with_password({"email": email, "password": body.password})
    except AuthApiError:
        logger.warning(f"Failed admin login for {email}: invalid credentials")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    admin = await get_admin_collection().find_one({"supabase_id": auth_response.user.id}, {"_id": 0})
    if not admin:
        logger.warning(f"Admin {email} authenticated but has no database record")
        raise HTTPException(status_code=404, detail="Admin not found in database")

    logger.info(f"Successful admin login for {email}")
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


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def admin_change_password(body: AdminChangePasswordRequest, current_admin: dict = Depends(get_current_admin)):
    supabase_id = current_admin["supabase_id"]
    logger.info(f"Admin {current_admin.get('email')} changing password")
    try:
        supabase_admin.auth.admin.update_user_by_id(supabase_id, {"password": body.password})
    except AuthApiError as e:
        logger.error(f"Password change failed for admin {current_admin.get('email')}: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    auth_response = supabase.auth.sign_in_with_password({"email": current_admin["email"], "password": body.password})
    logger.info(f"Successfully changed password for admin {current_admin.get('email')}")
    return {"access_token": auth_response.session.access_token, "refresh_token": auth_response.session.refresh_token}


@router.post("/vendors", status_code=status.HTTP_201_CREATED)
async def create_vendor(data: VendorCreateRequest, current_admin: dict = Depends(get_current_admin)):
    logger.info(f"Admin {current_admin.get('email')} creating vendor {data.vendor_id}")
    vendors = get_vendor_users_collection()
    if await vendors.find_one({"vendor_id": data.vendor_id}):
        logger.warning(f"Vendor creation rejected: vendor_id {data.vendor_id} already exists")
        raise HTTPException(status_code=400, detail="Vendor ID already exists")

    internal_email = f"v{data.vendor_id}@internal.contributor"
    try:
        auth_response = supabase.auth.sign_up({"email": internal_email, "password": VENDOR_TEMP_PASSWORD})
        supabase_id = auth_response.user.id
    except AuthApiError as e:
        logger.error(f"Supabase sign-up failed for vendor {data.vendor_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    try:
        await vendors.insert_one({
            "vendor_id": data.vendor_id,
            "name": data.name,
            "supabase_id": supabase_id,
            "role": "vendor"
        })
    except Exception as e:
        logger.error(f"Vendor {data.vendor_id} insert failed, rolling back Supabase user: {e}", exc_info=True)
        supabase_admin.auth.admin.delete_user(supabase_id)
        raise HTTPException(status_code=500, detail="Vendor creation failed")

    logger.info(f"Successfully created vendor {data.vendor_id}")
    return {"message": "Vendor created successfully", "vendor": {"vendor_id": data.vendor_id, "name": data.name}}


@router.get("/vendors", status_code=status.HTTP_200_OK)
async def get_all_vendors(current_admin: dict = Depends(get_current_admin)):
    logger.info(f"Admin {current_admin.get('email')} fetching all vendors...")
    vendors = get_vendor_users_collection()
    all_vendors = await vendors.find({}, {"_id": 0}).to_list(length=None)
    logger.info(f"Successfully retrieved {len(all_vendors)} vendors.")
    return {"vendors": all_vendors, "count": len(all_vendors)}


@router.get("/users/{user_id}", status_code=status.HTTP_200_OK)
async def get_admin_by_id(user_id: str, current_admin: dict = Depends(get_current_admin)):
    logger.info(f"Admin {current_admin.get('email')} fetching admin {user_id}")
    admin = await get_admin_collection().find_one({"supabase_id": user_id}, {"_id": 0})
    if not admin:
        logger.warning(f"No admin found with id={user_id}")
        raise HTTPException(status_code=404, detail="Admin not found")
    return {"admin": admin}

@router.get("/vendors/{vendor_id}", status_code=status.HTTP_200_OK)
async def get_vendor_by_id(vendor_id: str, current_admin: dict = Depends(get_current_admin)):
    logger.info(f"Admin {current_admin.get('email')} fetching vendor {vendor_id}")
    vendors = get_vendor_users_collection()
    vendor = await vendors.find_one({"vendor_id": vendor_id}, {"_id": 0})
    if not vendor:
        logger.warning(f"No vendor found with vendor_id={vendor_id}")
        raise HTTPException(status_code=404, detail="Vendor not found")
    return {"vendor": vendor}


@router.delete("/vendors/{vendor_id}", status_code=status.HTTP_200_OK)
async def delete_vendor(vendor_id: str, current_admin: dict = Depends(get_current_admin)):
    logger.info(f"Admin {current_admin.get('email')} deleting vendor {vendor_id}")
    vendors = get_vendor_users_collection()
    vendor = await vendors.find_one({"vendor_id": vendor_id})
    if not vendor:
        logger.warning(f"Vendor deletion failed: no vendor with vendor_id={vendor_id}")
        raise HTTPException(status_code=404, detail="Vendor not found")

    if vendor.get("supabase_id"):
        supabase_admin.auth.admin.delete_user(vendor["supabase_id"])

    await vendors.delete_one({"vendor_id": vendor_id})
    logger.info(f"Successfully deleted vendor {vendor_id}")
    return {"message": "Vendor deleted successfully"}


@router.post("/vendors/{vendor_id}/reset-password", status_code=status.HTTP_200_OK)
async def reset_vendor_password(
    vendor_id: str,
    data: VendorChangePasswordRequest,
    current_admin: dict = Depends(get_current_admin)
):
    logger.info(f"Admin {current_admin.get('email')} resetting password for vendor {vendor_id}")
    vendors = get_vendor_users_collection()
    vendor = await vendors.find_one({"vendor_id": vendor_id})
    if not vendor:
        logger.warning(f"Password reset failed: no vendor with vendor_id={vendor_id}")
        raise HTTPException(status_code=404, detail="Vendor not found")

    supabase_id = vendor.get("supabase_id")
    if not supabase_id:
        logger.error(f"Vendor {vendor_id} has no linked Supabase account")
        raise HTTPException(status_code=500, detail="Vendor has no linked auth account")

    try:
        supabase_admin.auth.admin.update_user_by_id(supabase_id, {"password": data.password})
    except AuthApiError as e:
        logger.error(f"Password reset failed for vendor {vendor_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    logger.info(f"Successfully reset password for vendor {vendor_id}")
    return {"message": "Password reset successfully", "vendor_id": vendor_id}
