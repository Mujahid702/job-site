import uuid
from typing import List
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, ForeignKey, Integer, Float
from app.models.base import Base, TimestampMixin

class University(Base, TimestampMixin):
    __tablename__ = "universities"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, 
        default=uuid.uuid4,
        nullable=False
    )
    name: Mapped[str] = mapped_column(
        String(255), 
        nullable=False
    )
    short_code: Mapped[str] = mapped_column(
        String(50), 
        unique=True, 
        index=True, 
        nullable=False
    )
    website: Mapped[str | None] = mapped_column(
        String(255), 
        nullable=True
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, 
        default=True, 
        nullable=False
    )

    # Relationships
    subjects: Mapped[List["Subject"]] = relationship(
        back_populates="university", 
        cascade="all, delete-orphan"
    )

class Subject(Base, TimestampMixin):
    __tablename__ = "subjects"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, 
        default=uuid.uuid4,
        nullable=False
    )
    name: Mapped[str] = mapped_column(
        String(255), 
        nullable=False
    )
    code: Mapped[str] = mapped_column(
        String(50), 
        unique=True, 
        index=True, 
        nullable=False
    )
    university_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("universities.id", ondelete="CASCADE"), 
        nullable=False
    )
    semester: Mapped[int] = mapped_column(
        Integer, 
        nullable=False
    )
    branch: Mapped[str] = mapped_column(
        String(100), 
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, 
        default=True, 
        nullable=False
    )

    # Relationships
    university: Mapped["University"] = relationship(
        back_populates="subjects"
    )
    modules: Mapped[List["Module"]] = relationship(
        back_populates="subject", 
        cascade="all, delete-orphan"
    )
    pyq_papers: Mapped[List["PYQPaper"]] = relationship(
        back_populates="subject", 
        cascade="all, delete-orphan"
    )
    questions: Mapped[List["Question"]] = relationship(
        back_populates="subject", 
        cascade="all, delete-orphan"
    )

class Module(Base, TimestampMixin):
    __tablename__ = "modules"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, 
        default=uuid.uuid4,
        nullable=False
    )
    subject_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("subjects.id", ondelete="CASCADE"), 
        nullable=False
    )
    number: Mapped[int] = mapped_column(
        Integer, 
        nullable=False
    )
    name: Mapped[str] = mapped_column(
        String(255), 
        nullable=False
    )
    description: Mapped[str | None] = mapped_column(
        String(1000), 
        nullable=True
    )
    weightage_percent: Mapped[float] = mapped_column(
        Float, 
        default=20.0, 
        nullable=False
    )

    # Relationships
    subject: Mapped["Subject"] = relationship(
        back_populates="modules"
    )
    topics: Mapped[List["SyllabusTopic"]] = relationship(
        back_populates="module", 
        cascade="all, delete-orphan"
    )
    questions: Mapped[List["Question"]] = relationship(
        back_populates="module"
    )

class SyllabusTopic(Base, TimestampMixin):
    __tablename__ = "syllabus_topics"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, 
        default=uuid.uuid4,
        nullable=False
    )
    module_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("modules.id", ondelete="CASCADE"), 
        nullable=False
    )
    name: Mapped[str] = mapped_column(
        String(255), 
        nullable=False
    )
    description: Mapped[str | None] = mapped_column(
        String(1000), 
        nullable=True
    )
    order_index: Mapped[int] = mapped_column(
        Integer, 
        nullable=False
    )

    # Relationships
    module: Mapped["Module"] = relationship(
        back_populates="topics"
    )
