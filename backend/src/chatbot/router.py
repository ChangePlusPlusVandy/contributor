from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from .service import chat_completion

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@router.post("/", response_model=ChatResponse)
def chatbot_endpoint(payload: ChatRequest):
    try:
        reply = chat_completion(payload.message)
        return ChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
