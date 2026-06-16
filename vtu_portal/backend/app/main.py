from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.limiter import limiter
from app.api.v1.auth import router as auth_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup lifecycle hooks (e.g. database connect, redis check)
    yield
    # Shutdown hooks

app = FastAPI(
    title="VTU SmartPrep AI API",
    version="0.1.0",
    lifespan=lifespan
)

# Bind slowapi Limiter instance to app state and exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS to allow Next.js communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Authentication Routing under prefix /api/v1
app.include_router(auth_router, prefix="/api/v1", tags=["Authentication"])

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "version": "0.1.0"
    }
