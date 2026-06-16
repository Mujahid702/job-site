from app.models.base import Base
from app.models.user import User, UserRole
from app.models.academic import University, Subject, Module, SyllabusTopic
from app.models.question import (
    PYQPaper, 
    Question, 
    QuestionImportanceScore, 
    QuestionCluster,
    SemesterType,
    ProcessingStatus
)

# Expose all models cleanly for Alembic declarative discovery
__all__ = [
    "Base",
    "User",
    "UserRole",
    "University",
    "Subject",
    "Module",
    "SyllabusTopic",
    "PYQPaper",
    "Question",
    "QuestionImportanceScore",
    "QuestionCluster",
    "SemesterType",
    "ProcessingStatus"
]
