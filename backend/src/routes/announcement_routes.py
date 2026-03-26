from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from bson import ObjectId

from src.config.database import get_announcements_collection
from src.admin_auth.middleware import get_current_admin
from src.schemas.announcement import AnnouncementCreate

router = APIRouter(prefix="/announcements")

@router.get("/getAll", status_code=status.HTTP_200_OK)
async def get_announcements():
    try:
        announcements = get_announcements_collection()
        all_announcements = []
        async for announcement in announcements.find().sort("created_at", 1):
            announcement["id"] = str(announcement.pop("_id"))
            all_announcements.append(announcement)
        return {"announcements": all_announcements}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_announcement(data: AnnouncementCreate, current_admin: dict = Depends(get_current_admin)):
    try:
        announcements = get_announcements_collection()
        new_announcement = {"content": data.content, "created_at": datetime.now()}
        result = await announcements.insert_one(new_announcement)
        return {"id": str(result.inserted_id), "created_at": new_announcement["created_at"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{announcement_id}", status_code=status.HTTP_200_OK)
async def delete_announcement(announcement_id: str, current_admin: dict = Depends(get_current_admin)):
    try:
        announcements = get_announcements_collection()
        deleted = await announcements.delete_one({"_id": ObjectId(announcement_id)})
        if deleted.deleted_count == 0:
            raise HTTPException(status_code=404, detail="No announcement deleted: not found")
        return {"message": "Announcement deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
