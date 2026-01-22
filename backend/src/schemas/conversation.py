from pydantic import BaseModel, Field
from datetime import datetime
from typing import Literal, Optional


class ConversationCreate(BaseModel):
    """Schema for creating a new conversation"""
    type: Literal["direct", "group"]
    participants: list[str]  # List of user IDs
    name: Optional[str] = None  # For group conversations


class ConversationResponse(BaseModel):
    """Schema for returning conversation info"""
    id: Optional[str] = None
    type: Literal["direct", "group"]
    participants: list[str]
    name: Optional[str] = None
    created_at: datetime
    created_by: str
    last_message: Optional[str] = None
    last_message_timestamp: Optional[datetime] = None
    last_message_sender: Optional[str] = None
    unread_count: int = 0
    is_archived: bool = False


class ConversationWithParticipants(BaseModel):
    """Conversation response with participant names"""
    id: Optional[str] = None
    type: Literal["direct", "group"]
    participants: list[dict]  # [{user_id: str, name: str}, ...]
    name: Optional[str] = None
    created_at: datetime
    created_by: str
    last_message: Optional[str] = None
    last_message_timestamp: Optional[datetime] = None
    last_message_sender: Optional[str] = None
    unread_count: int = 0
    is_archived: bool = False
