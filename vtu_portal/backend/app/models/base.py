from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, func
from datetime import datetime

class Base(DeclarativeBase):
    """
    SQLAlchemy Base class for modern Declarative models.
    Registers all schema tables automatically in the metadata registry.
    """
    pass

class TimestampMixin:
    """
    Mixin class to automatically manage creation and update times of records.
    Uses database-side triggers/defaults (server_default) as well as client-side fallbacks.
    """
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=func.now(), 
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=func.now(), 
        onupdate=func.now(), 
        server_default=func.now(),
        nullable=False
    )
