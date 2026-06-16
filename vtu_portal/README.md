# VTU SmartPrep AI 🚀

VTU SmartPrep AI is an advanced, AI-grounded exam preparation platform specifically tailored for Visvesvaraya Technological University (VTU) engineering students. The platform leverages previous years' question papers (PYQs), extracts question intelligence, groups similar questions, and provides precise, syllabus-mapped study aids.

---

## 🏗️ Monorepo Architecture

```text
vtu-smartprep/
├── backend/          # Python 3.11+ FastAPI (API layer, ORM models, schemas, background tasks)
├── frontend/         # Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui
├── workers/          # Celery background jobs sharing code with backend (Redis broker)
├── shared/           # Shared types, data schemas, and static utilities
├── infra/            # Docker Compose setup, volumes, and environment templates
└── docs/             # Technical architecture and decision records
```

---

## 🗺️ Project Roadmap

### Phase 1 — Foundation (Current)
- Scaffolding backend (FastAPI), frontend (Next.js 14), and worker environments.
- Core relational database models (User, Subject, Module, PYQPaper, Question, ImportanceScore).
- Secure JWT authentication using HttpOnly cookies (access + refresh tokens).
- PYQ PDF processing pipeline: fitz, pdfplumber, Tesseract OCR, and Spacy classifier.
- Importance Scoring Engine: composite formula combining Frequency, Recency, Marks, and Module Coverage.
- Front-end question intelligence dashboard with filters, ranking metrics, and manual admin upload flow.

### Phase 2 — RAG Core
- Clean open-access textbook content ingestion (NPTEL, MIT OCW, Wikipedia) under strict license compliance.
- Vector database collection namespaces (ChromaDB + sentence-transformers embeddings) ensuring strict tenant isolation.
- Core RAG Answer Pipeline using Claude Sonnet with strict citation tracking and hallucination safeguards.
- Interative Answer UI with streaming tokens, visual references, and follow-up support.

### Phase 3 — Intelligence & Diagrams
- Diagram extraction and AI vision-based caption generation pipeline.
- Personalised progress dashboards, module coverage radar charts, and smart revision recommendations.
- Last-day revision mode, auto-generated formulas, and notification workflows.

### Phase 4 — Scale & High Availability
- Production hardening targeting 10k concurrent users (Redis cache layers, EXPLAIN ANALYZE index optimization).
- Structured logging, Prometheus metrics, and slowapi rate limits.
- Dynamic multi-university parsing and dynamic multi-branding.

---

## ⚡ Quick Start

### Prerequisites
Make sure you have [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.

### Environment Setup
Create the local development environment file from the template:
```bash
cp infra/.env.example infra/.env
```

### Running the Stack
Launch all components (FastAPI Backend, Next.js Frontend, Redis, PostgreSQL Database, and Celery Worker):
```bash
docker-compose -f infra/docker-compose.yml up --build
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Backend Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
