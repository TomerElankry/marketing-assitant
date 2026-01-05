from sqlalchemy import Column, String, DateTime, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum
from app.db.base import Base

class JobStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    RESEARCHING = "researching"
    ANALYZING = "analyzing"
    CONSENSUS = "consensus"
    COMPLETED = "completed"
    FAILED = "failed"

class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status = Column(String, default=JobStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    project_metadata = Column(JSON, nullable=True) # Store basic info like brand name, etc.
