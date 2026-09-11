from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.sql import func
from database import Base

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    participant_name = Column(String, index=True)
    room_name = Column(String, index=True)
    status = Column(String, default="pending")  # pending, in-progress, completed
    transcript = Column(JSON, default=[])       # List of messages/transcripts
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
