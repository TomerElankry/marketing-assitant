from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, JSON, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
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


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    google_id = Column(String, unique=True, nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)

    # Canva OAuth
    canva_access_token = Column(String, nullable=True)
    canva_refresh_token = Column(String, nullable=True)
    canva_token_expires_at = Column(DateTime, nullable=True)
    canva_oauth_verifier = Column(String, nullable=True)  # Temp PKCE verifier during OAuth flow

    jobs = relationship("Job", back_populates="owner")
    clients = relationship("Client", back_populates="owner")


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

    # Owner — nullable so existing jobs without a user still work
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    owner = relationship("User", back_populates="jobs")
    chat_messages = relationship("ChatMessage", back_populates="job", order_by="ChatMessage.created_at")

    # Client — nullable so existing jobs without a client still work
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=True, index=True)
    client = relationship("Client", back_populates="campaigns")

    __table_args__ = (
        Index("ix_jobs_status", "status"),
        Index("ix_jobs_created_at", "created_at"),
    )


class Client(Base):
    __tablename__ = "clients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Section 1 — Project Metadata
    brand_name = Column(String, nullable=False)
    website_url = Column(String, nullable=False)
    target_country = Column(String, nullable=False)
    industry = Column(String, nullable=False)

    # Section 2 — Product Definition
    product_description = Column(String, nullable=False)
    core_problem_solved = Column(String, nullable=False)
    unique_selling_proposition = Column(String, nullable=False)

    # Section 3 — Target Audience
    demographics = Column(String, nullable=False)
    psychographics = Column(String, nullable=False)
    cultural_nuances = Column(String, nullable=True)

    # Section 4 — Market Context
    main_competitors = Column(JSON, nullable=False)  # List[str]
    current_marketing_efforts = Column(String, nullable=True)
    known_customer_objections = Column(String, nullable=True)

    owner = relationship("User", back_populates="clients")
    campaigns = relationship("Job", back_populates="client")

    # Client-level chat messages
    chat_messages = relationship("ChatMessage", back_populates="client", order_by="ChatMessage.created_at",
                                  primaryjoin="ChatMessage.client_id == Client.id")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Exactly one of job_id or client_id must be set (job-level vs client-level chat)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=True, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=True, index=True)
    role = Column(String, nullable=False)  # "user" or "assistant"
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    job = relationship("Job", back_populates="chat_messages")
    client = relationship("Client", back_populates="chat_messages",
                          primaryjoin="ChatMessage.client_id == Client.id")
