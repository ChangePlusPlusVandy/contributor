from fastapi import APIRouter, HTTPException
from src.config.logger import get_logger
from pydantic import BaseModel
from typing import Literal
from src.config.database import MongoDB

logger = get_logger(__name__)
router = APIRouter(prefix="/api/analytics", tags=["analytics"])
db = MongoDB.get_collection("analytics")

class EventBody(BaseModel):
    id: str
    event: Literal[
        "device_registered",
        "app_entered"
    ]

@router.post("/event")
async def event(body: EventBody):
    try:
        await db.update_one({ "id": body.id }, { "$push": { "events": body.event }}, upsert=True)
        return { "status": "success" }
    except Exception as e:
        logger.error(f"Failed to update events for {body.id}: {str(e)}")
        raise HTTPException(500, "Failed to post event.")