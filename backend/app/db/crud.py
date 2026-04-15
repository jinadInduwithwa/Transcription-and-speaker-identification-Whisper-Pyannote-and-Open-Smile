"""
CRUD operations — all database read/write logic lives here.
Server code calls these functions; it never touches SQLAlchemy directly.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from . import models


# ─── Meeting CRUD ──────────────────────────────────────────────────

def create_meeting(
    db: Session,
    meeting_id: str,
    passcode: str,
    creator: str,
    mode: str = "instant",
    scheduled_at: Optional[datetime] = None,
) -> models.Meeting:
    """Create and persist a new meeting room."""
    meeting = models.Meeting(
        id=meeting_id,
        passcode=passcode,
        creator=creator,
        mode=mode,
        scheduled_at=scheduled_at,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


def get_meeting(db: Session, meeting_id: str) -> Optional[models.Meeting]:
    """Return a meeting by its ID, or None if not found."""
    return db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()


def get_all_meetings(db: Session) -> list[models.Meeting]:
    """Return all meetings, ordered by creation date (newest first)."""
    return db.query(models.Meeting).order_by(models.Meeting.created_at.desc()).all()


# ─── Chat CRUD ─────────────────────────────────────────────────────

def save_chat_message(
    db: Session,
    meeting_id: str,
    sender: str,
    text: str,
) -> models.ChatMessage:
    """Persist a single chat message to the database."""
    msg = models.ChatMessage(
        meeting_id=meeting_id,
        sender=sender,
        text=text,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def get_chat_history(
    db: Session,
    meeting_id: str,
    limit: int = 100,
) -> list[models.ChatMessage]:
    """Return the last `limit` chat messages for a meeting (oldest first)."""
    return (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.meeting_id == meeting_id)
        .order_by(models.ChatMessage.timestamp.asc())
        .limit(limit)
        .all()
    )


# ─── Transcript CRUD ───────────────────────────────────────────────

def save_transcript_entry(
    db: Session,
    meeting_id: str,
    speaker_name: str,
    text: str,
) -> models.TranscriptEntry:
    """Persist a single transcribed sentence to the database."""
    entry = models.TranscriptEntry(
        meeting_id=meeting_id,
        speaker_name=speaker_name,
        text=text,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_transcript(
    db: Session,
    meeting_id: str,
) -> list[models.TranscriptEntry]:
    """Return all transcript entries for a meeting in chronological order."""
    return (
        db.query(models.TranscriptEntry)
        .filter(models.TranscriptEntry.meeting_id == meeting_id)
        .order_by(models.TranscriptEntry.created_at.asc())
        .all()
    )
