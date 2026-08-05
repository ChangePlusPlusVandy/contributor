from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from bson import ObjectId

from src.config.database import get_announcements_collection
from src.config.logger import get_logger
from src.admin.middleware import get_current_admin
from src.schemas.announcement import AnnouncementCreate

router = APIRouter(prefix="/announcements")
logger = get_logger(__name__)

@router.get("/getAll", status_code=status.HTTP_200_OK)
async def get_announcements():
    logger.info("Fetching announcements...")
    try:
        announcements = get_announcements_collection()
        all_announcements = []
        async for announcement in announcements.find().sort("created_at", 1):
            announcement["id"] = str(announcement.pop("_id"))
            all_announcements.append(announcement)
        logger.info(f"Successfully retrieved {len(all_announcements)} announcements.")
        return {"announcements": all_announcements}
    except Exception as e:
        logger.error(f"Error retrieving announcements: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve announcements")


@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_announcement(data: AnnouncementCreate, current_admin: dict = Depends(get_current_admin)):
    logger.info(f"Admin {current_admin.get('email')} creating announcement")
    try:
        announcements = get_announcements_collection()
        new_announcement = {"content": data.content, "created_at": datetime.now()}
        result = await announcements.insert_one(new_announcement)
        logger.info(f"Successfully created announcement {result.inserted_id}")
        return {"id": str(result.inserted_id), "created_at": new_announcement["created_at"]}
    except Exception as e:
        logger.error(f"Error creating announcement: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create announcement")


@router.delete("/{announcement_id}", status_code=status.HTTP_200_OK)
async def delete_announcement(announcement_id: str, current_admin: dict = Depends(get_current_admin)):
    logger.info(f"Admin {current_admin.get('email')} deleting announcement {announcement_id}")
    try:
        announcements = get_announcements_collection()
        deleted = await announcements.delete_one({"_id": ObjectId(announcement_id)})
        if deleted.deleted_count == 0:
            logger.warning(f"No announcement found with id={announcement_id}")
            raise HTTPException(status_code=404, detail="No announcement deleted: not found")
        logger.info(f"Successfully deleted announcement {announcement_id}")
        return {"message": "Announcement deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting announcement {announcement_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete announcement")
