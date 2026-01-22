from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict


class Message(BaseModel):
    """Schema for individual messages"""
    conversation_id: str
    sender_id: str
    sender_name: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.now)
    read_by: Dict[str, Optional[datetime]] = Field(default_factory=dict)  # {user_id: read_timestamp or None}


class MessageCreate(BaseModel):
    """Schema for creating a new message"""
    conversation_id: str
    content: str = Field(..., min_length=1, max_length=5000)


class MessageResponse(BaseModel):
    """Schema for returning a message"""
    id: Optional[str] = None
    conversation_id: str
    sender_id: str
    sender_name: str
    content: str
    timestamp: datetime
    read_by: Dict[str, Optional[datetime]]


class WebSocketMessage(BaseModel):
    """Schema for WebSocket messages"""
    type: str  # "message", "typing", "read", "connected", "disconnected"
    sender_id: str
    sender_name: str
    conversation_id: Optional[str] = None
    content: Optional[str] = None
    message_id: Optional[str] = None
    timestamp: Optional[datetime] = None
