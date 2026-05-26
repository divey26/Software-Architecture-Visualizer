# Software Architecture Visualizer API

FastAPI backend for static analysis of uploaded backend project ZIP files.

## Features

- Validates `.zip` uploads and enforces a 25 MB upload limit.
- Safely extracts archives into a temporary folder and prevents path traversal.
- Scans Python, Java, JSON, YAML, and properties files while ignoring build and dependency folders.
- Detects FastAPI routers/endpoints, Pydantic models, service/repository conventions, and Spring Boot annotations.
- Returns summary metrics, graph nodes/edges, endpoint rows, and scanned file metadata.
- Never executes uploaded source code.

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`.

## Endpoints

- `GET /api/health`
- `GET /api/supported-frameworks`
- `POST /api/projects/upload`

## Notes

The MVP uses static Python AST parsing and Java regex/annotation detection. Dependency edges are best-effort and based on imports, references, and naming conventions.
