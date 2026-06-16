FROM python:3.11-slim

WORKDIR /workspace

# Install essential system packages (useful for compiling postgres/asyncpg client libraries)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Pre-install dependencies to utilize Docker layer caching
COPY pyproject.toml .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir .

# Copy the rest of the application files
COPY . .

# Expose FastAPI's server port
EXPOSE 8000

# Run in unbuffered mode to streaming stdout/stderr directly to container output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Default command launches Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
