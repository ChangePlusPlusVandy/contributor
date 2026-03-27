from pydantic import BaseModel


class AnnouncementCreate(BaseModel):
    content: str
