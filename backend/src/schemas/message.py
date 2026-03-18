from pydantic import BaseModel
from datetime import datetime


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    sender_name: str
    content: str
    timestamp: datetime
