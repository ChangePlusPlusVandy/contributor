import json
from bson import ObjectId
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Query, Depends
from src.schemas.conversation import ConversationCreate
from src.config.database import MongoDB
from src.messaging.connection_manager import manager
from src.vendor_auth.middleware import verify_token

router = APIRouter(prefix="/messages", tags=["messages"])


def get_messages_col():
    return MongoDB.get_collection("messages", "the-contributor")


def get_conversations_col():
    return MongoDB.get_collection("conversations", "the-contributor")


@router.post("/conversations", status_code=201)
async def create_conversation(data: ConversationCreate, supabase_user=Depends(verify_token)):
    try:
        user_id = supabase_user.id
        col = get_conversations_col()

        if user_id not in data.participants:
            raise HTTPException(status_code=400, detail="You must include yourself in the conversation")

        if data.type == "direct":
            if len(data.participants) != 2:
                raise HTTPException(status_code=400, detail="Direct conversation needs exactly 2 participants")
            existing = await col.find_one({"type": "direct", "participants": {"$all": data.participants}})
            if existing:
                return {"id": str(existing["_id"]), "already_exists": True}

        doc = {
            "type": data.type,
            "participants": data.participants,
            "name": data.name,
            "created_at": datetime.now(),
            "created_by": user_id,
            "last_message": None,
            "last_message_at": None
        }
        result = await col.insert_one(doc)
        return {"id": str(result.inserted_id)}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/conversations")
async def get_conversations(supabase_user=Depends(verify_token)):
    try:
        user_id = supabase_user.id
        col = get_conversations_col()
        convs = await col.find({"participants": user_id}).sort("last_message_at", -1).to_list(None)
        return [
            {
                "id": str(c["_id"]),
                "type": c["type"],
                "participants": c["participants"],
                "name": c.get("name"),
                "created_at": c["created_at"],
                "last_message": c.get("last_message"),
                "last_message_at": c.get("last_message_at")
            }
            for c in convs
        ]
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str, supabase_user=Depends(verify_token)):
    try:
        user_id = supabase_user.id
        conv = await get_conversations_col().find_one({"_id": ObjectId(conversation_id)})
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        if user_id not in conv["participants"]:
            raise HTTPException(status_code=403, detail="Not a participant")

        messages = await get_messages_col().find(
            {"conversation_id": conversation_id}
        ).sort("timestamp", 1).to_list(100)

        return [
            {
                "id": str(m["_id"]),
                "conversation_id": m["conversation_id"],
                "sender_id": m["sender_id"],
                "sender_name": m["sender_name"],
                "content": m["content"],
                "timestamp": m["timestamp"]
            }
            for m in messages
        ]
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.websocket("/ws/{user_id}/{user_name}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, user_name: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            conversation_id = msg.get("conversation_id")
            content = msg.get("content", "").strip()

            if not conversation_id or not content:
                continue

            conv = await get_conversations_col().find_one({"_id": ObjectId(conversation_id)})
            if not conv or user_id not in conv["participants"]:
                continue

            now = datetime.now()
            doc = {
                "conversation_id": conversation_id,
                "sender_id": user_id,
                "sender_name": user_name,
                "content": content,
                "timestamp": now
            }
            result = await get_messages_col().insert_one(doc)

            await get_conversations_col().update_one(
                {"_id": ObjectId(conversation_id)},
                {"$set": {"last_message": content, "last_message_at": now}}
            )

            message = json.dumps({
                "id": str(result.inserted_id),
                "conversation_id": conversation_id,
                "sender_id": user_id,
                "sender_name": user_name,
                "content": content,
                "timestamp": now.isoformat()
            })
            await manager.broadcast(conv["participants"], message)

    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception:
        manager.disconnect(user_id)
