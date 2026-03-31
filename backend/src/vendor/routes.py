from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer
from supabase_auth.errors import AuthApiError
from src.schemas.user import VendorLoginRequest, VendorSetPasswordRequest, VendorLocationRequest
from src.vendor.middleware import get_current_user
from src.config.database import get_vendor_users_collection, supabase, supabase_admin

router = APIRouter(prefix="/auth", tags=["Vendors"])
vendor_public_router = APIRouter(prefix="/vendors", tags=["Vendors"])


def _generate_internal_email(vendor_id: str) -> str:
    """creates an internal, hidden email from Vendor ID for Supabase auth"""
    return f"v{vendor_id}@internal.contributor"


@router.post("/login", status_code=status.HTTP_200_OK)
async def vendor_login(data: VendorLoginRequest):
    vendors = get_vendor_users_collection()
    vendor = await vendors.find_one({"vendor_id": data.vendor_id}, {"_id": 0})

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor ID not found")

    if not vendor.get("password_set", False):
        if data.password == "":
            return {"password_required": True, "message": "Please set your password", "name": vendor.get("name")}
        else:
            raise HTTPException(status_code=401, detail="Password not set. Please set your password first.")

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


@router.post("/set-password", status_code=status.HTTP_201_CREATED)
async def set_vendor_password(data: VendorSetPasswordRequest, credentials=Depends(HTTPBearer(auto_error=False))):
    vendors = get_vendor_users_collection()

    if credentials:
        user_response = supabase.auth.get_user(credentials.credentials)
        vendor = await vendors.find_one({"supabase_id": user_response.user.id}, {"_id": 0})
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")
    else:
        if not data.vendor_id:
            raise HTTPException(status_code=400, detail="vendor_id required for first-time setup")
        vendor = await vendors.find_one({"vendor_id": data.vendor_id}, {"_id": 0})
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor ID not found")
        if vendor.get("password_set"):
            raise HTTPException(status_code=403, detail="Please log in to change your password")

    internal_email = _generate_internal_email(vendor["vendor_id"])
    supabase_id = vendor.get("supabase_id")

    if vendor.get("password_set") and supabase_id:
        supabase_admin.auth.admin.update_user_by_id(supabase_id, {"password": data.password})
    else:
        try:
            auth_response = supabase.auth.sign_up({"email": internal_email, "password": data.password})
            if not auth_response.user:
                raise HTTPException(status_code=400, detail="Failed to create account")
            supabase_id = auth_response.user.id
        except AuthApiError as e:
            if "User already registered" in str(e):
                sign_in = supabase.auth.sign_in_with_password({"email": internal_email, "password": data.password})
                supabase_id = sign_in.user.id
            else:
                raise HTTPException(status_code=400, detail=str(e))

    await vendors.update_one(
        {"vendor_id": vendor["vendor_id"]},
        {"$set": {"supabase_id": supabase_id, "password_set": True}}
    )

    login = supabase.auth.sign_in_with_password({"email": internal_email, "password": data.password})

    return {
        "message": "Password set successfully",
        "access_token": login.session.access_token,
        "refresh_token": login.session.refresh_token,
        "user": {
            "id": supabase_id,
            "vendor_id": vendor["vendor_id"],
            "name": vendor.get("name"),
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


@vendor_public_router.get("/active", status_code=status.HTTP_200_OK)
async def get_active_vendors():
    vendors = get_vendor_users_collection()
    active = await vendors.find(
        {"is_clocked_in": True, "location": {"$ne": None}},
        {"_id": 0, "vendor_id": 1, "name": 1, "location": 1}
    ).to_list(length=None)
    return {"vendors": active}
