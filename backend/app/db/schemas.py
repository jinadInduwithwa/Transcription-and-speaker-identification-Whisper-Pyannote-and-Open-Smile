"""
Pydantic schemas for API request validation and response serialization.
Keeps API types separate from database models.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ─── Meeting ───────────────────────────────────────────────────────

class MeetingCreate(BaseModel):
    name: str
    mode: str = "instant"
    scheduled_at: Optional[str] = None


class MeetingResponse(BaseModel):
    id: str
    passcode: str
    creator: str
    mode: str
    created_at: datetime
    scheduled_at: Optional[datetime]

    model_config = {"from_attributes": True}


# ─── Chat ──────────────────────────────────────────────────────────

class ChatMessageResponse(BaseModel):
    id: int
    meeting_id: str
    sender: str
    text: str
    timestamp: datetime

    model_config = {"from_attributes": True}


# ─── Transcript ────────────────────────────────────────────────────

class TranscriptEntryResponse(BaseModel):
    id: int
    meeting_id: str
    speaker_name: str
    text: str
    created_at: datetime

    model_config = {"from_attributes": True}
