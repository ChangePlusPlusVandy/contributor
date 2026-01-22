import json
from bson import ObjectId
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from src.schemas.message import MessageCreate, MessageResponse, WebSocketMessage
from src.schemas.conversation import ConversationCreate, ConversationResponse
from src.config.database import MongoDB
from src.config.logger import get_logger
from src.messaging.connection_manager import manager

logger = get_logger(__name__)
router = APIRouter(prefix="/api/messages", tags=["messages"])


def get_messages_collection():
    """Get the messages collection"""
    return MongoDB.get_collection("messages", "the-contributor")


def get_conversations_collection():
    """Get the conversations collection"""
    return MongoDB.get_collection("conversations", "the-contributor")


# Conversation Management Endpoints

@router.post("/conversations")
async def create_conversation(conv_data: ConversationCreate, user_id: str = Query(...)):
    """Create a new conversation (one-on-one or group)"""
    try:
        conversations_col = get_conversations_collection()
        
        # For direct conversations, ensure both users exist and create if needed
        if conv_data.type == "direct":
            if len(conv_data.participants) != 2:
                raise HTTPException(status_code=400, detail="Direct conversation must have exactly 2 participants")
            
            # Check if conversation already exists
            existing = await conversations_col.find_one({
                "type": "direct",
                "participants": {"$all": conv_data.participants}
            })
            
            if existing:
                return ConversationResponse(
                    id=str(existing["_id"]),
                    type=existing["type"],
                    participants=existing["participants"],
                    name=existing.get("name"),
                    created_at=existing["created_at"],
                    created_by=existing["created_by"],
                    last_message=existing.get("last_message"),
                    last_message_timestamp=existing.get("last_message_timestamp"),
                    last_message_sender=existing.get("last_message_sender"),
                    is_archived=existing.get("is_archived", False)
                )
        
        # Create new conversation
        conversation_doc = {
            "type": conv_data.type,
            "participants": conv_data.participants,
            "name": conv_data.name,
            "created_at": datetime.now(),
            "created_by": user_id,
            "is_archived": False,
            "last_message": None,
            "last_message_timestamp": None,
            "last_message_sender": None
        }
        
        result = await conversations_col.insert_one(conversation_doc)
        conversation_doc["_id"] = result.inserted_id
        
        return ConversationResponse(
            id=str(result.inserted_id),
            type=conversation_doc["type"],
            participants=conversation_doc["participants"],
            name=conversation_doc.get("name"),
            created_at=conversation_doc["created_at"],
            created_by=conversation_doc["created_by"],
            is_archived=conversation_doc["is_archived"]
        )
        
    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        raise HTTPException(status_code=500, detail="Error creating conversation")


@router.get("/conversations")
async def get_conversations(user_id: str = Query(...)):
    """Get all conversations for a user"""
    try:
        conversations_col = get_conversations_collection()
        
        # Get all conversations where user is a participant
        conversations = await conversations_col.find({
            "participants": user_id,
            "is_archived": False
        }).sort("last_message_timestamp", -1).to_list(None)
        
        result = []
        for conv in conversations:
            # Count unread messages
            messages_col = get_messages_collection()
            unread_count = await messages_col.count_documents({
                "conversation_id": str(conv["_id"]),
                f"read_by.{user_id}": None
            })
            
            result.append(ConversationResponse(
                id=str(conv["_id"]),
                type=conv["type"],
                participants=conv["participants"],
                name=conv.get("name"),
                created_at=conv["created_at"],
                created_by=conv["created_by"],
                last_message=conv.get("last_message"),
                last_message_timestamp=conv.get("last_message_timestamp"),
                last_message_sender=conv.get("last_message_sender"),
                unread_count=unread_count,
                is_archived=conv.get("is_archived", False)
            ))
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting conversations: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving conversations")


@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str, user_id: str = Query(...)):
    """Get details of a specific conversation"""
    try:
        conversations_col = get_conversations_collection()
        
        conv = await conversations_col.find_one({"_id": ObjectId(conversation_id)})
        
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Check if user is a participant
        if user_id not in conv["participants"]:
            raise HTTPException(status_code=403, detail="Not a participant in this conversation")
        
        # Count unread messages
        messages_col = get_messages_collection()
        unread_count = await messages_col.count_documents({
            "conversation_id": conversation_id,
            f"read_by.{user_id}": None
        })
        
        return ConversationResponse(
            id=str(conv["_id"]),
            type=conv["type"],
            participants=conv["participants"],
            name=conv.get("name"),
            created_at=conv["created_at"],
            created_by=conv["created_by"],
            last_message=conv.get("last_message"),
            last_message_timestamp=conv.get("last_message_timestamp"),
            last_message_sender=conv.get("last_message_sender"),
            unread_count=unread_count,
            is_archived=conv.get("is_archived", False)
        )
        
    except Exception as e:
        logger.error(f"Error getting conversation: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving conversation")


# Message History Endpoint

@router.get("/conversations/{conversation_id}/messages")
async def get_message_history(
    conversation_id: str,
    user_id: str = Query(...),
    limit: int = Query(50, ge=1, le=200)
):
    """Get message history for a conversation"""
    try:
        messages_col = get_messages_collection()
        conversations_col = get_conversations_collection()
        
        # Verify user is in the conversation
        conv = await conversations_col.find_one({"_id": ObjectId(conversation_id)})
        if not conv or user_id not in conv["participants"]:
            raise HTTPException(status_code=403, detail="Not a participant in this conversation")
        
        # Get messages
        messages = await messages_col.find({
            "conversation_id": conversation_id
        }).sort("timestamp", -1).limit(limit).to_list(limit)
        
        # Mark messages as read for this user
        await messages_col.update_many(
            {"conversation_id": conversation_id},
            {"$set": {f"read_by.{user_id}": datetime.now()}}
        )
        
        # Reverse to get chronological order
        messages.reverse()
        
        result = []
        for msg in messages:
            result.append(MessageResponse(
                id=str(msg.get("_id")),
                conversation_id=msg["conversation_id"],
                sender_id=msg["sender_id"],
                sender_name=msg["sender_name"],
                content=msg["content"],
                timestamp=msg["timestamp"],
                read_by=msg.get("read_by", {})
            ))
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting message history: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving message history")


# WebSocket Endpoint

@router.websocket("/ws/{user_id}/{user_name}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, user_name: str):
    """WebSocket endpoint for real-time messaging"""
    await manager.connect(user_id, websocket, user_name)
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Route message based on type
            if message_data.get("type") == "message":
                await handle_message(user_id, user_name, message_data)
            elif message_data.get("type") == "typing":
                await handle_typing_status(user_id, user_name, message_data)
            elif message_data.get("type") == "read":
                await handle_read_status(user_id, message_data)
                
    except WebSocketDisconnect:
        await manager.disconnect(user_id, websocket)
        logger.info(f"User {user_id} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        await manager.disconnect(user_id, websocket)


async def handle_message(sender_id: str, sender_name: str, message_data: dict):
    """Handle incoming message"""
    try:
        conversation_id = message_data.get("conversation_id")
        content = message_data.get("content")
        
        if not conversation_id or not content:
            logger.warning("Invalid message data")
            return
        
        # Verify conversation exists and user is a participant
        conversations_col = get_conversations_collection()
        conv = await conversations_col.find_one({"_id": ObjectId(conversation_id)})
        
        if not conv:
            logger.warning(f"Conversation {conversation_id} not found")
            return
        
        if sender_id not in conv["participants"]:
            logger.warning(f"User {sender_id} not a participant in conversation {conversation_id}")
            return
        
        # Create read_by dict with all participants
        read_by = {participant: None for participant in conv["participants"]}
        read_by[sender_id] = datetime.now()  # Mark as read for sender
        
        # Save to database
        messages_col = get_messages_collection()
        message_doc = {
            "conversation_id": conversation_id,
            "sender_id": sender_id,
            "sender_name": sender_name,
            "content": content,
            "timestamp": datetime.now(),
            "read_by": read_by
        }
        
        result = await messages_col.insert_one(message_doc)
        message_doc["_id"] = result.inserted_id
        
        # Update conversation's last message
        await conversations_col.update_one(
            {"_id": ObjectId(conversation_id)},
            {
                "$set": {
                    "last_message": content,
                    "last_message_timestamp": message_doc["timestamp"],
                    "last_message_sender": sender_name
                }
            }
        )
        
        # Send to all participants in the conversation
        response = {
            "type": "message",
            "id": str(result.inserted_id),
            "conversation_id": conversation_id,
            "sender_id": sender_id,
            "sender_name": sender_name,
            "content": content,
            "timestamp": message_doc["timestamp"].isoformat(),
            "read_by": {uid: ts.isoformat() if ts else None for uid, ts in read_by.items()}
        }
        
        await manager.broadcast_to_conversation(
            conversation_id,
            json.dumps(response),
            conv["participants"]
        )
        
        logger.info(f"Message in conversation {conversation_id} from {sender_id}")
        
    except Exception as e:
        logger.error(f"Error handling message: {e}")


async def handle_typing_status(sender_id: str, sender_name: str, message_data: dict):
    """Handle typing indicator"""
    try:
        conversation_id = message_data.get("conversation_id")
        
        if not conversation_id:
            return
        
        response = {
            "type": "typing",
            "sender_id": sender_id,
            "sender_name": sender_name,
            "conversation_id": conversation_id
        }
        
        # Get conversation participants
        conversations_col = get_conversations_collection()
        conv = await conversations_col.find_one({"_id": ObjectId(conversation_id)})
        
        if conv:
            await manager.broadcast_to_conversation(
                conversation_id,
                json.dumps(response),
                conv["participants"]
            )
        
    except Exception as e:
        logger.error(f"Error handling typing status: {e}")


async def handle_read_status(user_id: str, message_data: dict):
    """Handle read receipt"""
    try:
        message_id = message_data.get("message_id")
        
        if not message_id:
            return
        
        # Update message to mark as read by this user
        messages_col = get_messages_collection()
        await messages_col.update_one(
            {"_id": ObjectId(message_id)},
            {"$set": {f"read_by.{user_id}": datetime.now()}}
        )
        
    except Exception as e:
        logger.error(f"Error handling read status: {e}")
