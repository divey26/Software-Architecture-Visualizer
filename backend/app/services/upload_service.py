from __future__ import annotations

from pathlib import Path

from fastapi import UploadFile

from app.models.schemas import ProjectAnalysis
from app.services.analyzer_service import AnalyzerService
from app.utils.zip_utils import extracted_zip, validate_zip_upload


class UploadService:
    def __init__(self) -> None:
        self.analyzer = AnalyzerService()

    async def analyze_upload(self, file: UploadFile) -> ProjectAnalysis:
        data = await validate_zip_upload(file)
        project_name = Path(file.filename or "Uploaded Project").stem
        with extracted_zip(data) as root:
            return self.analyzer.analyze(root, project_name)
