from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.connections: dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.connections[user_id] = websocket

    def disconnect(self, user_id: str):
        self.connections.pop(user_id, None)

    async def broadcast(self, user_ids: list[str], message: str):
        for user_id in user_ids:
            ws = self.connections.get(user_id)
            if ws:
                try:
                    await ws.send_text(message)
                except Exception:
                    self.disconnect(user_id)


manager = ConnectionManager()
