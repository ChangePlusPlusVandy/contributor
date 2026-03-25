from pydantic import BaseModel
from datetime import datetime
from typing import Literal


class ConversationCreate(BaseModel):
    type: Literal["direct", "group"]
    participants: list[str]
    name: str | None = None


class ConversationResponse(BaseModel):
    id: str
    type: str
    participants: list[str]
    name: str | None = None
    created_at: datetime
    last_message: str | None = None
    last_message_at: datetime | None = None
