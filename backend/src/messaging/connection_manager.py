from fastapi import WebSocket
from typing import Dict, Set
from src.config.logger import get_logger

logger = get_logger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for user-to-user messaging"""
    
    def __init__(self):
        # Maps user_id to set of active WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Maps user_id to their user info (name, etc)
        self.user_info: Dict[str, Dict] = {}
        # Maps conversation_id to set of user_ids currently viewing it
        self.active_conversations: Dict[str, Set[str]] = {}

    async def connect(self, user_id: str, websocket: WebSocket, user_name: str):
        """Register a new WebSocket connection for a user"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        self.user_info[user_id] = {"name": user_name}
        
        logger.info(f"User {user_id} connected. Active connections: {user_id} -> {len(self.active_connections[user_id])}")

    async def disconnect(self, user_id: str, websocket: WebSocket):
        """Remove a WebSocket connection for a user"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            
            # Clean up if no more connections for this user
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                if user_id in self.user_info:
                    del self.user_info[user_id]
            
            logger.info(f"User {user_id} disconnected")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send a message to a specific WebSocket connection"""
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")

    async def broadcast_to_user(self, user_id: str, message: str):
        """Broadcast a message to all connections of a specific user"""
        if user_id in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to user {user_id}: {e}")
                    disconnected.add(connection)
            
            # Remove disconnected connections
            for connection in disconnected:
                self.active_connections[user_id].discard(connection)

    async def broadcast_to_conversation(self, conversation_id: str, message: str, participants: list[str]):
        """Broadcast a message to all users in a conversation"""
        for participant_id in participants:
            await self.broadcast_to_user(participant_id, message)

    def is_user_online(self, user_id: str) -> bool:
        """Check if a user has any active connections"""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

    def get_online_users(self) -> list:
        """Get list of all online user IDs"""
        return [user_id for user_id in self.active_connections if self.is_user_online(user_id)]

    def add_active_conversation(self, conversation_id: str, user_id: str):
        """Mark a user as actively viewing a conversation"""
        if conversation_id not in self.active_conversations:
            self.active_conversations[conversation_id] = set()
        self.active_conversations[conversation_id].add(user_id)

    def remove_active_conversation(self, conversation_id: str, user_id: str):
        """Mark a user as no longer viewing a conversation"""
        if conversation_id in self.active_conversations:
            self.active_conversations[conversation_id].discard(user_id)
            if not self.active_conversations[conversation_id]:
                del self.active_conversations[conversation_id]

    def get_active_viewers(self, conversation_id: str) -> Set[str]:
        """Get all users currently viewing a conversation"""
        return self.active_conversations.get(conversation_id, set())


# Global connection manager instance
manager = ConnectionManager()
