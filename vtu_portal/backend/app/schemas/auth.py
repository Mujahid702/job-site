import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from app.models.user import UserRole

class UserCreate(BaseModel):
    """Schema for validating new user registration requests."""
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters long")
    full_name: str = Field(..., min_length=1, max_length=100, description="Full name is required")
    university: Optional[str] = Field(None, max_length=150)

class UserLogin(BaseModel):
    """Schema for standard JSON login validation (if not using OAuth2 form data)."""
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    """Schema for serializing and returning user information in API responses."""
    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: UserRole
    university: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    # Enable seamless ORM object serialization
    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    """Schema for returning bearer JWT access tokens."""
    access_token: str
    token_type: str = "bearer"
