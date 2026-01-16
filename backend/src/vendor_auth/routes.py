from fastapi import APIRouter, HTTPException, status, Depends
from supabase_auth.errors import AuthApiError
from src.schemas.user import VendorLoginRequest, VendorSetPasswordRequest
from src.vendor_auth.middleware import get_current_user
from src.config.database import get_vendor_users_collection, supabase
from src.config.logger import get_logger

router = APIRouter(prefix="/auth", tags=["Vendor Authentication"])
logger = get_logger(__name__)


def _generate_internal_email(vendor_id: str) -> str:
    """creates an internal, hidden email from Vendor ID for Supabase auth"""
    return f"v{vendor_id}@internal.contributor"


@router.post("/login", status_code=status.HTTP_200_OK)
async def vendor_login(data: VendorLoginRequest):
    """
    Vendor login with Vendor ID and pass.
    If password_set is false and password is blank, returns password_required flag.
    This flag is used to decide to redirect to set password page.
    """
    try:
        collection = get_vendor_users_collection()

        # Look up vendor by Vendor ID
        vendor = await collection.find_one({"vendor_id": data.vendor_id}, {"_id": 0})

        if not vendor:
            logger.warning(f"Vendor login failed. Vendor ID not found: {data.vendor_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor ID not found"
            )

        # Check if password needs to be set
        if not vendor.get("password_set", False):
            if data.password == "":
                # If password is blank, make them set pass
                logger.info(f"Vendor {data.vendor_id} needs to set password")
                return {
                    "password_required": True,
                    "message": "Please set your password",
                    "name": vendor.get("name")
                }
            else:
                # They gave a password but haven't set one yet
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Password not set. Please set your password first."
                )

        # Password is set. authenticate with Supabase
        internal_email = _generate_internal_email(data.vendor_id)

        auth_response = supabase.auth.sign_in_with_password({
            "email": internal_email,
            "password": data.password
        })

        if not auth_response.user or not auth_response.session:
            logger.warning(f"Vendor login failed — invalid credentials: {data.vendor_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Vendor ID or password"
            )

        logger.info(f"Vendor login successful: {data.vendor_id}")

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

    except HTTPException:
        raise
    except AuthApiError as e:
        logger.warning(f"Vendor login failed — invalid credentials: {data.vendor_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Vendor ID or password"
        )
    except Exception as e:
        logger.error(f"Unexpected error during vendor login: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/set-password", status_code=status.HTTP_201_CREATED)
async def set_vendor_password(data: VendorSetPasswordRequest):
    """
    Set password for first-time vendor login.
    Creates Supabase account and updates mongo.
    """
    try:
        collection = get_vendor_users_collection()

        vendor = await collection.find_one({"vendor_id": data.vendor_id}, {"_id": 0})

        if not vendor:
            logger.warning(f"Set password failed — Vendor ID not found: {data.vendor_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor ID not found"
            )

        # Check if password already set
        if vendor.get("password_set", False):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password already set. Use login instead."
            )

        # Create Supabase account with internal email
        internal_email = _generate_internal_email(data.vendor_id)
        supabase_id = None

        try:
            auth_response = supabase.auth.sign_up({
                "email": internal_email,
                "password": data.password
            })

            if not auth_response.user:
                logger.error(f"Supabase signup failed for Vendor ID: {data.vendor_id}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to create account"
                )

            supabase_id = auth_response.user.id

        except AuthApiError as e:
            # for case where Supabase user already exists
            if "User already registered" in str(e):
                logger.info(f"Supabase user already exists for {data.vendor_id}, attempting sign-in")
                # Try to sign in. doesn't break if password matches
                try:
                    login_response = supabase.auth.sign_in_with_password({
                        "email": internal_email,
                        "password": data.password
                    })
                    supabase_id = login_response.user.id
                except AuthApiError:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Account exists but password doesn't match. Contact support."
                    )
            else:
                raise

        # Update MongoDB with supabase_id and password_set flag
        await collection.update_one(
            {"vendor_id": data.vendor_id},
            {"$set": {"supabase_id": supabase_id, "password_set": True}}
        )

        logger.info(f"Vendor password set successfully: {data.vendor_id}")

        # Auto-login after setting password
        login_response = supabase.auth.sign_in_with_password({
            "email": internal_email,
            "password": data.password
        })

        return {
            "message": "Password set successfully",
            "access_token": login_response.session.access_token,
            "refresh_token": login_response.session.refresh_token,
            "user": {
                "id": supabase_id,
                "vendor_id": data.vendor_id,
                "name": vendor.get("name"),
                "role": "vendor"
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting vendor password: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/me", status_code=status.HTTP_200_OK)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Get the current logged-in vendor's profile. JWT Protected.
    """
    try:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or missing user session"
            )

        logger.info(f"Profile fetched for vendor: {current_user.get('vendor_id')}")
        return {"user": current_user}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching current vendor profile: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/users/{vendor_id}", status_code=status.HTTP_200_OK)
async def get_user_by_vendor_id(
    vendor_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific vendor by their Vendor ID. JWT Protected.
    """
    try:
        collection = get_vendor_users_collection()
        user = await collection.find_one(
            {"vendor_id": vendor_id},
            {"_id": 0}
        )

        if not user:
            logger.warning(f"User not found with Vendor ID: {vendor_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        logger.info(f"Fetched user profile for Vendor ID: {vendor_id}")

        return {
            "user": {
                "vendor_id": user["vendor_id"],
                "name": user["name"],
                "role": user["role"]
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user profile for {vendor_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/users", status_code=status.HTTP_200_OK)
async def get_all_users(current_user: dict = Depends(get_current_user)):
    """
    Get all vendors. JWT Protected.
    """
    try:
        collection = get_vendor_users_collection()
        cursor = collection.find({}, {"_id": 0, "supabase_id": 0})
        users = await cursor.to_list(length=None)

        logger.info(f"Fetched {len(users)} total vendors")
        return {"users": users}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching all users: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
