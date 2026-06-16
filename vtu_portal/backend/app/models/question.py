import uuid
import enum
from typing import List, Optional
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, Integer, Float, Text, Enum, DateTime, Index, func
from datetime import datetime
from app.models.base import Base

class SemesterType(str, enum.Enum):
    JUNE = "june"
    DECEMBER = "december"

class ProcessingStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class PYQPaper(Base):
    __tablename__ = "pyq_papers"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, 
        default=uuid.uuid4,
        nullable=False
    )
    subject_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("subjects.id", ondelete="CASCADE"), 
        nullable=False
    )
    year: Mapped[int] = mapped_column(
        Integer, 
        nullable=False
    )
    semester_type: Mapped[SemesterType] = mapped_column(
        Enum(SemesterType, name="semester_type_enum"), 
        nullable=False
    )
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), 
        nullable=True
    )
    storage_url: Mapped[str] = mapped_column(
        String(500), 
        nullable=False
    )
    processing_status: Mapped[ProcessingStatus] = mapped_column(
        Enum(ProcessingStatus, name="processing_status_enum"), 
        default=ProcessingStatus.PENDING, 
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=func.now(), 
        server_default=func.now(),
        nullable=False
    )

    # Relationships
    subject: Mapped["Subject"] = relationship(
        back_populates="pyq_papers"
    )
    uploader: Mapped[Optional["User"]] = relationship()
    questions: Mapped[List["Question"]] = relationship(
        back_populates="pyq_paper", 
        cascade="all, delete-orphan"
    )

class Question(Base):
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, 
        default=uuid.uuid4,
        nullable=False
    )
    text: Mapped[str] = mapped_column(
        Text, 
        nullable=False
    )
    normalized_text: Mapped[str] = mapped_column(
        Text, 
        nullable=False
    )
    marks: Mapped[int] = mapped_column(
        Integer, 
        nullable=False
    ) # 2, 5, 10, etc.
    subject_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("subjects.id", ondelete="CASCADE"), 
        nullable=False
    )
    module_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("modules.id", ondelete="SET NULL"), 
        nullable=True
    )
    pyq_paper_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("pyq_papers.id", ondelete="CASCADE"), 
        nullable=False
    )
    cluster_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("question_clusters.id", ondelete="SET NULL"), 
        nullable=True
    )
    year: Mapped[int] = mapped_column(
        Integer, 
        nullable=False
    )
    semester_type: Mapped[SemesterType] = mapped_column(
        Enum(SemesterType, name="semester_type_enum"), 
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=func.now(), 
        server_default=func.now(),
        nullable=False
    )

    # Relationships
    subject: Mapped["Subject"] = relationship(
        back_populates="questions"
    )
    module: Mapped[Optional["Module"]] = relationship(
        back_populates="questions"
    )
    pyq_paper: Mapped["PYQPaper"] = relationship(
        back_populates="questions"
    )
    cluster: Mapped[Optional["QuestionCluster"]] = relationship(
        back_populates="questions"
    )
    importance_score: Mapped[Optional["QuestionImportanceScore"]] = relationship(
        back_populates="question", 
        cascade="all, delete-orphan"
    )

class QuestionImportanceScore(Base):
    __tablename__ = "question_importance_scores"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, 
        default=uuid.uuid4,
        nullable=False
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"), 
        unique=True, 
        nullable=False
    )
    frequency_score: Mapped[float] = mapped_column(
        Float, 
        nullable=False
    )
    recency_score: Mapped[float] = mapped_column(
        Float, 
        nullable=False
    )
    marks_weight: Mapped[float] = mapped_column(
        Float, 
        nullable=False
    )
    module_coverage_score: Mapped[float] = mapped_column(
        Float, 
        nullable=False
    )
    composite_score: Mapped[float] = mapped_column(
        Float, 
        nullable=False
    )
    rank_in_subject: Mapped[int] = mapped_column(
        Integer, 
        nullable=False
    )
    computed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=func.now(), 
        server_default=func.now(),
        nullable=False
    )

    # Relationships
    question: Mapped["Question"] = relationship(
        back_populates="importance_score"
    )

    # Indexes
    __table_args__ = (
        Index("ix_question_importance_scores_composite_score", "composite_score"),
    )

class QuestionCluster(Base):
    __tablename__ = "question_clusters"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, 
        default=uuid.uuid4,
        nullable=False
    )
    subject_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("subjects.id", ondelete="CASCADE"), 
        nullable=False
    )
    representative_text: Mapped[str] = mapped_column(
        Text, 
        nullable=False
    )
    question_count: Mapped[int] = mapped_column(
        Integer, 
        default=1, 
        nullable=False
    )
    avg_composite_score: Mapped[float] = mapped_column(
        Float, 
        default=0.0, 
        nullable=False
    )

    # Relationships
    questions: Mapped[List["Question"]] = relationship(
        back_populates="cluster"
    )
