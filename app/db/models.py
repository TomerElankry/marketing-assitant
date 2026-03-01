from sqlalchemy import Column, String, DateTime, Enum, JSON, Index
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
    COMPLETED = "completed"
    FAILED = "failed"


class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status = Column(String, default=JobStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    project_metadata = Column(JSON, nullable=True)

    # Diagnostic fields — populated when a job fails
    failed_step = Column(String, nullable=True)
    error_message = Column(String, nullable=True)

    __table_args__ = (
        Index("ix_jobs_status", "status"),
        Index("ix_jobs_created_at", "created_at"),
    )
