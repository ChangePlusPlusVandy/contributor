from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from supabase_auth.errors import AuthApiError
from src.schemas.user import VendorLoginRequest, VendorChangePasswordRequest, VendorLocationRequest
from src.vendor.middleware import get_current_user
from src.config.database import get_vendor_users_collection, supabase, supabase_admin

router = APIRouter(prefix="/auth", tags=["Vendors"])
vendor_public_router = APIRouter(prefix="/vendors", tags=["Vendors"])


def _generate_internal_email(vendor_id: str) -> str:
    return f"v{vendor_id}@internal.contributor"


@router.post("/login", status_code=status.HTTP_200_OK)
async def vendor_login(data: VendorLoginRequest):
    vendors = get_vendor_users_collection()
    vendor = await vendors.find_one({"vendor_id": data.vendor_id}, {"_id": 0})

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor ID not found")

    internal_email = _generate_internal_email(data.vendor_id)

    try:
        auth_response = supabase.auth.sign_in_with_password({"email": internal_email, "password": data.password})
    except AuthApiError:
        raise HTTPException(status_code=401, detail="Invalid Vendor ID or password")

    return {
        "access_token": auth_response.session.access_token,
        "refresh_token": auth_response.session.refresh_token,
        "user": {
            "id": auth_response.user.id,
            "vendor_id": data.vendor_id,
            "name": vendor.get("name"),
            "role": "vendor"
        }
    }


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_vendor_password(data: VendorChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    supabase_admin.auth.admin.update_user_by_id(current_user["supabase_id"], {"password": data.password})

    internal_email = _generate_internal_email(current_user["vendor_id"])
    login = supabase.auth.sign_in_with_password({"email": internal_email, "password": data.password})

    return {
        "access_token": login.session.access_token,
        "refresh_token": login.session.refresh_token,
        "user": {
            "id": current_user["supabase_id"],
            "vendor_id": current_user["vendor_id"],
            "name": current_user.get("name"),
            "role": "vendor"
        }
    }


@router.get("/me", status_code=status.HTTP_200_OK)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    return {"user": current_user}


@router.post("/clock-in", status_code=status.HTTP_200_OK)
async def clock_in_vendor(current_user: dict = Depends(get_current_user)):
    vendors = get_vendor_users_collection()
    supabase_id = current_user.get("supabase_id")
    clocked_in_time = current_user.get("clocked_in_at")

    if clocked_in_time:
        hours_clocked_in = (datetime.now() - clocked_in_time).total_seconds() / 3600
        if hours_clocked_in >= 4:
            await vendors.update_one(
                {"supabase_id": supabase_id},
                {"$set": {"is_clocked_in": False}, "$unset": {"clocked_in_at": ""}}
            )
            return {"message": "Auto clocked out after 4 hours", "auto_clocked_out": True}

    if not current_user.get("location"):
        raise HTTPException(status_code=400, detail="Location required to clock in")

    now = datetime.now()
    await vendors.update_one(
        {"supabase_id": supabase_id},
        {"$set": {"is_clocked_in": True, "clocked_in_at": now}}
    )
    return {"message": "Clocked in", "clocked_in_at": now}


@router.post("/clock-out", status_code=status.HTTP_200_OK)
async def clock_out_vendor(current_user: dict = Depends(get_current_user)):
    vendors = get_vendor_users_collection()
    await vendors.update_one(
        {"supabase_id": current_user.get("supabase_id")},
        {"$set": {"is_clocked_in": False}, "$unset": {"clocked_in_at": ""}}
    )
    return {"message": "Clocked out"}


@router.patch("/location", status_code=status.HTTP_200_OK)
async def set_vendor_location(data: VendorLocationRequest, user: dict = Depends(get_current_user)):
    vendors = get_vendor_users_collection()
    await vendors.update_one(
        {"supabase_id": user.get("supabase_id")},
        {"$set": {"location": {"latitude": data.latitude, "longitude": data.longitude}}}
    )
    return {"message": "Location updated"}


@router.post("/debug/reset-password/{vendor_id}", status_code=status.HTTP_200_OK)
async def debug_reset_vendor_password(vendor_id: str, data: VendorChangePasswordRequest):
    """Debug endpoint to reset a vendor's password using service account (no auth required)"""
    return {}
    vendors = get_vendor_users_collection()
    vendor = await vendors.find_one({"vendor_id": vendor_id}, {"_id": 0})
    
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    supabase_id = vendor.get("supabase_id")
    
    try:
        supabase_admin.auth.admin.update_user_by_id(supabase_id, {"password": data.password})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset password: {str(e)}")
    
    return {"message": "Password reset successfully", "vendor_id": vendor_id}


async def get_active_vendors():
    vendors = get_vendor_users_collection()
    active = await vendors.find(
        {"is_clocked_in": True, "location": {"$ne": None}},
        {"_id": 0, "vendor_id": 1, "name": 1, "location": 1}
    ).to_list(length=None)
    return {"vendors": active}
