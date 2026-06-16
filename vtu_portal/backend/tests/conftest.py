import pytest
import asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.database import get_db
from app.models.base import Base

# Isolated, in-memory async SQLite engine for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

@pytest.fixture(scope="session")
def event_loop():
    """Create a session-scoped event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="function")
async def db() -> AsyncGenerator[AsyncSession, None]:
    """
    Creates and drops tables dynamically for each individual test case,
    guaranteeing complete database state isolation.
    """
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with TestingSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
            
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture(scope="function")
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Overrides the application get_db dependency and returns an HTTPX AsyncClient
    configured to handle ASGIAccessor routing dynamically.
    """
    async def _get_test_db():
        yield db
            
    # Override database dependency in FastAPI
    app.dependency_overrides[get_db] = _get_test_db
    
    # Disable SlowAPI rate limiting during tests
    if hasattr(app.state, "limiter"):
        app.state.limiter.enabled = False
    
    # Configure async testing transport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
        
    # Re-enable limiter and clear overrides after test completion
    if hasattr(app.state, "limiter"):
        app.state.limiter.enabled = True
    app.dependency_overrides.clear()
