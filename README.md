# Software Architecture Visualizer

A senior-level MVP for visualizing backend architecture from uploaded project ZIP files.

## Apps

- `backend/`: FastAPI static analyzer for FastAPI and Spring Boot projects.
- `frontend/`: React UI with upload flow, summary dashboard, endpoint table, file browser, and interactive architecture diagram.

## Quick Start

Terminal 1:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Terminal 2:

```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173` and upload a ZIP file.

## MVP Security

- Only `.zip` files are accepted.
- Uploads are limited to 25 MB.
- ZIP entries are checked for path traversal before extraction.
- Extracted files are deleted after analysis.
- Uploaded code is never executed.
