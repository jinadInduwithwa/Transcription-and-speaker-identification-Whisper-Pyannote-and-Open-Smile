"""
SQLAlchemy ORM models — each class maps to a database table.
"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


class Meeting(Base):
    """Represents a meeting room."""
    __tablename__ = "meetings"

    id          = Column(String(6), primary_key=True, index=True)   # e.g. "XCLK4Z"
    passcode    = Column(String(10), nullable=False)
    creator     = Column(String(100), nullable=False, default="Anonymous")
    mode        = Column(String(20), nullable=False, default="instant")  # instant | scheduled
    created_at  = Column(DateTime, default=datetime.utcnow, nullable=False)
    scheduled_at= Column(DateTime, nullable=True)

    # Relationships (lazy-loaded lists)
    chats       = relationship("ChatMessage", back_populates="meeting", cascade="all, delete-orphan")
    transcripts = relationship("TranscriptEntry", back_populates="meeting", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Meeting id={self.id} creator={self.creator}>"


class ChatMessage(Base):
    """A single chat message sent inside a meeting."""
    __tablename__ = "chat_messages"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id  = Column(String(6), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    sender      = Column(String(100), nullable=False)
    text        = Column(Text, nullable=False)
    timestamp   = Column(DateTime, default=datetime.utcnow, nullable=False)

    meeting     = relationship("Meeting", back_populates="chats")

    def __repr__(self):
        return f"<ChatMessage id={self.id} sender={self.sender}>"


class TranscriptEntry(Base):
    """A single transcribed sentence from a meeting."""
    __tablename__ = "transcriptions"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id  = Column(String(6), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    speaker_name= Column(String(100), nullable=False)
    text        = Column(Text, nullable=False)
    created_at  = Column(DateTime, default=datetime.utcnow, nullable=False)

    meeting     = relationship("Meeting", back_populates="transcripts")

    def __repr__(self):
        return f"<TranscriptEntry id={self.id} speaker={self.speaker_name}>"
