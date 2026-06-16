from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import timedelta

from app.core.database import get_db
from app.core.limiter import limiter
from app.core.config import settings
from app.services import auth_service
from app.schemas.auth import UserCreate, UserResponse, TokenResponse
from app.models.user import User, UserRole
from app.api.v1.deps import get_current_active_user

router = APIRouter()

# Cookie config variables
REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_PATH = "/api/v1/auth"

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(
    request: Request,
    response: Response,
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Registers a new student user.
    Enforces email uniqueness, hashes password, sets httpOnly refresh token cookie, and returns access token.
    Throttled to 5 requests/minute.
    """
    # Check if email is already registered
    result = await db.execute(select(User).filter_by(email=user_in.email))
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    # Create the user object (role defaults to student)
    hashed_password = auth_service.hash_password(user_in.password)
    user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=UserRole.STUDENT,
        university=user_in.university,
        is_active=True
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Generate tokens
    payload = {"sub": user.email}
    access_token = auth_service.create_access_token(payload)
    refresh_token = auth_service.create_refresh_token(payload)
    
    # Securely set refresh token cookie
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        max_age=7 * 24 * 60 * 60, # 7 days
        path=REFRESH_COOKIE_PATH,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax"
    )
    
    return {"access_token": access_token}

@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    OAuth2 standard login endpoint.
    Accepts form-urlencoded credentials, verifies password, sets refresh cookie, and returns access token.
    Throttled to 5 requests/minute.
    """
    # Fetch user
    result = await db.execute(select(User).filter_by(email=form_data.username))
    user = result.scalars().first()
    
    # Validate credentials
    if not user or not auth_service.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
        
    # Generate tokens
    payload = {"sub": user.email}
    access_token = auth_service.create_access_token(payload)
    refresh_token = auth_service.create_refresh_token(payload)
    
    # Securely set refresh token cookie
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        max_age=7 * 24 * 60 * 60, # 7 days
        path=REFRESH_COOKIE_PATH,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax"
    )
    
    return {"access_token": access_token}

@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Refreshes expired access tokens.
    Extracts HttpOnly refresh token cookie, validates it, and generates a new access token.
    """
    refresh_token = request.cookies.get(REFRESH_COOKIE_NAME)
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing"
        )
        
    payload = auth_service.decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
        
    email: str = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token payload"
        )
        
    result = await db.execute(select(User).filter_by(email=email))
    user = result.scalars().first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
        
    # Issue fresh access token
    new_access_token = auth_service.create_access_token({"sub": user.email})
    return {"access_token": new_access_token}

@router.post("/logout")
async def logout(response: Response):
    """
    Clears the HttpOnly refresh token cookie to log out the user.
    """
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path=REFRESH_COOKIE_PATH
    )
    return {"message": "logged out"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    """
    Returns the user profile of the currently authenticated active user.
    Protected route.
    """
    return current_user
