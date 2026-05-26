# Software Architecture Visualizer Frontend

React, TypeScript, Tailwind CSS, Ant Design, Axios, and React Flow frontend for the Software Architecture Visualizer.

## Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Backend URL

By default the app calls `http://localhost:8000`. Override it with:

```bash
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

## Pages

- Home
- Upload
- Dashboard / Summary
- Architecture Diagram
- API Endpoints
- Project Files

Use the `Load Sample` button to test the UI without running the backend.
