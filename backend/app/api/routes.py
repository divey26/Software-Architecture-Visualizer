from __future__ import annotations

from fastapi import APIRouter, File, UploadFile

from app.models.schemas import HealthResponse, ProjectAnalysis, SupportedFrameworksResponse
from app.services.upload_service import UploadService
from app.utils.file_utils import IGNORED_DIRS, SUPPORTED_EXTENSIONS

router = APIRouter(prefix="/api")
upload_service = UploadService()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="Software Architecture Visualizer API")


@router.get("/supported-frameworks", response_model=SupportedFrameworksResponse)
def supported_frameworks() -> SupportedFrameworksResponse:
    return SupportedFrameworksResponse(
        frameworks=["Python FastAPI", "Java Spring Boot"],
        fileTypes=sorted(SUPPORTED_EXTENSIONS),
        ignoredFolders=sorted(IGNORED_DIRS),
    )


@router.post("/projects/upload", response_model=ProjectAnalysis)
async def upload_project(file: UploadFile = File(...)) -> ProjectAnalysis:
    return await upload_service.analyze_upload(file)
