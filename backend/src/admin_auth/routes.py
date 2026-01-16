from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from supabase_auth.errors import AuthApiError
from src.schemas.user import AdminRegisterRequest, AdminLoginRequest, VendorCreateRequest
from src.admin_auth.middleware import get_current_admin, verify_token
from src.config.database import get_admin_collection, get_vendor_users_collection, supabase, supabase_admin
from src.config.logger import get_logger

router = APIRouter(prefix="/admin", tags=["Admin Authentication"])
logger = get_logger(__name__)


@router.post("/register", status_code=status.HTTP_200_OK)
async def admin_register(body: AdminRegisterRequest):
    """
    Register a new admin, only allowing @thecontributor.org emails.
    """
    try:
        # Check email domain before Supabase signup
        email = body.email.lower()
        if not email.endswith("@thecontributor.org"):
            logger.warning(f"Unauthorized email domain during registration: {email}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized email domain"
            )

        collection = get_admin_collection()

        # Sign up with Supabase
        auth_response = supabase.auth.sign_up({
            "email": body.email,
            "password": body.password
        })

        if not auth_response.user:
            logger.error("Supabase returned no user object during admin signup")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supabase creation failure"
            )

        supabase_id = auth_response.user.id
        email = (auth_response.user.email or "").lower()

        # Store admin info in MongoDB
        admin_data = {
            "supabase_id": supabase_id,
            "email": email,
            "name": body.name,
            "role": "admin"
        }

        # UPSERT: handles re-registration
        await collection.update_one(
            {"supabase_id": supabase_id},
            {"$set": admin_data},
            upsert=True
        )

        logger.info(f"Admin registered successfully: {email}")
        return {"status": "ok", "id": supabase_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during admin registration: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/login", status_code=status.HTTP_200_OK)
async def admin_login(body: AdminLoginRequest):
    """
    Admin login with email and password. Returns JWT tokens.
    Only allows @thecontributor.org emails.
    """
    try:
        email = body.email.lower()

        # Enforce admin email domain
        if not email.endswith("@thecontributor.org"):
            logger.warning(f"Unauthorized email domain during login: {email}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized email domain"
            )

        # Auth with Supabase
        auth_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": body.password
        })

        if not auth_response.user or not auth_response.session:
            logger.warning(f"Admin login failed — invalid credentials: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Verify admin exists in MongoDB
        collection = get_admin_collection()
        admin = await collection.find_one(
            {"supabase_id": auth_response.user.id},
            {"_id": 0}
        )

        if not admin:
            logger.warning(f"Admin not found in database: {auth_response.user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Admin not found in database"
            )

        logger.info(f"Admin login successful: {email}")

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

    except HTTPException:
        raise
    except AuthApiError as e:
        logger.warning(f"Admin login failed. Invalid credentials: {body.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    except Exception as e:
        logger.error(f"Unexpected error during admin login: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/me", status_code=status.HTTP_200_OK)
async def get_current_admin_profile(current_admin: dict = Depends(get_current_admin)):
    """
    Get the current logged-in admin's profile. JWT Protected.
    """
    try:
        logger.info(f"Profile fetched for admin: {current_admin.get('email')}")
        return {"admin": current_admin}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching admin profile: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/users/{user_id}", status_code=status.HTTP_200_OK)
async def get_admin_by_id(
    user_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    """
    Finds admin by their Supabase id.
    """
    try:
        collection = get_admin_collection()
        admin = await collection.find_one(
            {"supabase_id": user_id},
            {"_id": 0}
        )

        if not admin:
            logger.warning(f"Admin not found with ID: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Admin not found"
            )

        logger.info(f"Fetched admin profile for ID: {user_id}")
        return {"admin": admin}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching admin profile for {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


# ENDPOINTS TO MANAGE VENDORS

@router.post("/vendors", status_code=status.HTTP_201_CREATED)
async def create_vendor(
    data: VendorCreateRequest,
    current_admin: dict = Depends(get_current_admin)
):
    """
    Create a new vendor with Vendor ID and name. Admin only.
    """
    try:
        collection = get_vendor_users_collection()

        # Check if Vendor ID already exists
        existing = await collection.find_one({"vendor_id": data.vendor_id})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vendor ID already exists"
            )

        # Create vendor document
        vendor_data = {
            "vendor_id": data.vendor_id,
            "name": data.name,
            "supabase_id": None,
            "password_set": False,
            "role": "vendor"
        }

        await collection.insert_one(vendor_data)

        logger.info(f"Vendor created by admin: Vendor ID {data.vendor_id}, Name: {data.name}")
        return {
            "message": "Vendor created successfully",
            "vendor": {"vendor_id": data.vendor_id, "name": data.name}
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating vendor: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

# Used to initially import all current vendor info
@router.post("/vendors/bulk", status_code=status.HTTP_201_CREATED)
async def create_vendors_bulk(
    vendors: List[VendorCreateRequest],
    current_admin: dict = Depends(get_current_admin)
):
    """
    Create multiple vendors at once. Admin only.
    Useful for importing from Excel.
    """
    try:
        collection = get_vendor_users_collection()

        # Check for dupes in bulk list
        vendor_ids = [v.vendor_id for v in vendors]
        if len(vendor_ids) != len(set(vendor_ids)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Duplicate Vendor IDs in request"
            )

        existing = await collection.find(
            {"vendor_id": {"$in": vendor_ids}},
            {"vendor_id": 1}
        ).to_list(length=None)

        # Check for dupes for already existing vendors
        if existing:
            existing_ids = [v["vendor_id"] for v in existing]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Vendor IDs already exist: {existing_ids}"
            )

        # Create vendor documents
        vendor_docs = [
            {
                "vendor_id": v.vendor_id,
                "name": v.name,
                "supabase_id": None,
                "password_set": False,
                "role": "vendor"
            }
            for v in vendors
        ]

        result = await collection.insert_many(vendor_docs)

        logger.info(f"Bulk created {len(result.inserted_ids)} vendors by admin")
        return {
            "message": f"Created {len(result.inserted_ids)} vendors",
            "count": len(result.inserted_ids)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error bulk creating vendors: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/vendors", status_code=status.HTTP_200_OK)
async def get_all_vendors(current_admin: dict = Depends(get_current_admin)):
    """
    Get all vendors. Admin only.
    """
    try:
        collection = get_vendor_users_collection()
        cursor = collection.find({}, {"_id": 0})
        vendors = await cursor.to_list(length=None)

        logger.info(f"Admin fetched {len(vendors)} vendors")
        return {"vendors": vendors, "count": len(vendors)}

    except Exception as e:
        logger.error(f"Error fetching vendors: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/vendors/{vendor_id}", status_code=status.HTTP_200_OK)
async def get_vendor_by_id(
    vendor_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    """
    Get a specific vendor by Vendor ID. Admin only.
    """
    try:
        collection = get_vendor_users_collection()
        vendor = await collection.find_one({"vendor_id": vendor_id}, {"_id": 0})

        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor not found"
            )

        return {"vendor": vendor}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching vendor {vendor_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.delete("/vendors/{vendor_id}", status_code=status.HTTP_200_OK)
async def delete_vendor(
    vendor_id: str,
    current_admin: dict = Depends(get_current_admin)
):
    """
    Delete a vendor by Vendor ID. Admin only.
    Removes from both MongoDB and Supabase.
    """
    try:
        collection = get_vendor_users_collection()

        # Check if vendor exists
        vendor = await collection.find_one({"vendor_id": vendor_id})
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor not found"
            )

        # Delete from Supabase if they have an account
        supabase_id = vendor.get("supabase_id")
        if supabase_id:
            try:
                supabase_admin.auth.admin.delete_user(supabase_id)
                logger.info(f"Deleted Supabase user for vendor: {vendor_id}")
            except Exception as e:
                logger.warning(f"Failed to delete Supabase user for {vendor_id}: {e}")

        # Delete from MongoDB
        await collection.delete_one({"vendor_id": vendor_id})

        logger.info(f"Admin deleted vendor: Vendor ID {vendor_id}")
        return {"message": "Vendor deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting vendor {vendor_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
