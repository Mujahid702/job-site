import pytest
from httpx import AsyncClient
from fastapi import status

@pytest.mark.asyncio
async def test_registration_success(client: AsyncClient):
    """Verifies that registration completes successfully and returns tokens."""
    payload = {
        "email": "student@vtu.ac.in",
        "password": "securepassword123",
        "full_name": "Test Student",
        "university": "VTU"
    }
    
    response = await client.post("/api/v1/register", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    
    # Assert HttpOnly refresh token cookie is set
    assert "refresh_token" in response.cookies

@pytest.mark.asyncio
async def test_registration_duplicate_email(client: AsyncClient):
    """Enforces email uniqueness constraint and duplicate rejection."""
    payload = {
        "email": "duplicate@vtu.ac.in",
        "password": "password123",
        "full_name": "First User"
    }
    
    # Register first user
    r1 = await client.post("/api/v1/register", json=payload)
    assert r1.status_code == status.HTTP_201_CREATED
    
    # Register second user with same email
    r2 = await client.post("/api/v1/register", json=payload)
    assert r2.status_code == status.HTTP_400_BAD_REQUEST
    assert r2.json()["detail"] == "Email already registered"

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """Verifies that login succeeds with correct credentials."""
    # Register first
    reg_payload = {
        "email": "login@vtu.ac.in",
        "password": "mypassword123",
        "full_name": "Login User"
    }
    await client.post("/api/v1/register", json=reg_payload)
    
    # Login via standard Form-Urlencoded request
    login_data = {
        "username": "login@vtu.ac.in",
        "password": "mypassword123"
    }
    response = await client.post("/api/v1/login", data=login_data)
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in response.cookies

@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    """Verifies that wrong passwords return 401 Unauthorized."""
    # Register first
    reg_payload = {
        "email": "wrongpass@vtu.ac.in",
        "password": "secretpassword",
        "full_name": "Secret User"
    }
    await client.post("/api/v1/register", json=reg_payload)
    
    # Login with incorrect password
    login_data = {
        "username": "wrongpass@vtu.ac.in",
        "password": "incorrectpassword"
    }
    response = await client.post("/api/v1/login", data=login_data)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "Incorrect email or password"

@pytest.mark.asyncio
async def test_me_unauthorized(client: AsyncClient):
    """Verifies that protected routes reject calls lacking token headers with 401."""
    response = await client.get("/api/v1/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "Not authenticated"

@pytest.mark.asyncio
async def test_me_authorized_success(client: AsyncClient):
    """Verifies that protected routes return correct profile details with valid token."""
    # Register
    reg_payload = {
        "email": "me@vtu.ac.in",
        "password": "supersecurepassword",
        "full_name": "Me User",
        "university": "VTU"
    }
    await client.post("/api/v1/register", json=reg_payload)
    
    # Login to get token
    login_data = {
        "username": "me@vtu.ac.in",
        "password": "supersecurepassword"
    }
    login_res = await client.post("/api/v1/login", data=login_data)
    token = login_res.json()["access_token"]
    
    # Access profile with token header
    headers = {"Authorization": f"Bearer {token}"}
    response = await client.get("/api/v1/me", headers=headers)
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["email"] == "me@vtu.ac.in"
    assert data["full_name"] == "Me User"
    assert data["university"] == "VTU"
    assert data["role"] == "student"
