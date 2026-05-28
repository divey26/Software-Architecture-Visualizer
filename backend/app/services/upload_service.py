from __future__ import annotations

from io import BytesIO
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen
import zipfile

from fastapi import HTTPException, UploadFile, status

from app.models.schemas import ProjectAnalysis
from app.services.analyzer_service import AnalyzerService
from app.utils.zip_utils import MAX_UPLOAD_SIZE, extracted_zip, validate_zip_upload


GITHUB_DOWNLOAD_TIMEOUT_SECONDS = 20


class UploadService:
    def __init__(self) -> None:
        self.analyzer = AnalyzerService()

    async def analyze_upload(self, file: UploadFile) -> ProjectAnalysis:
        data = await validate_zip_upload(file)
        project_name = Path(file.filename or "Uploaded Project").stem
        with extracted_zip(data) as root:
            return self.analyzer.analyze(root, project_name)

    async def analyze_github(self, repo_url: str) -> ProjectAnalysis:
        owner, repo = self._parse_github_url(repo_url)
        default_branch = self._github_default_branch(owner, repo)
        data = self._download_github_zip(owner, repo, default_branch)
        with extracted_zip(data) as root:
            return self.analyzer.analyze(root, repo)

    def _parse_github_url(self, repo_url: str) -> tuple[str, str]:
        parsed = urlparse(repo_url.strip())
        if parsed.scheme not in {"http", "https"} or parsed.netloc.lower() != "github.com":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only public github.com repository URLs are supported.",
            )
        parts = [part for part in parsed.path.strip("/").split("/") if part]
        if len(parts) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GitHub URL must include an owner and repository name.",
            )
        owner, repo = parts[0], parts[1].removesuffix(".git")
        if not owner or not repo or any(part in {"..", ""} for part in (owner, repo)):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid GitHub repository URL.")
        return owner, repo

    def _github_default_branch(self, owner: str, repo: str) -> str:
        api_url = f"https://api.github.com/repos/{owner}/{repo}"
        try:
            with urlopen(self._request(api_url), timeout=GITHUB_DOWNLOAD_TIMEOUT_SECONDS) as response:
                import json

                payload = json.loads(response.read(MAX_UPLOAD_SIZE).decode("utf-8", errors="ignore"))
                branch = payload.get("default_branch")
                return branch if isinstance(branch, str) and branch else "main"
        except HTTPError as exc:
            if exc.code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="GitHub repository was not found or is not public.",
                ) from exc
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="GitHub repository lookup failed.") from exc
        except (URLError, TimeoutError) as exc:
            raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="GitHub repository lookup timed out.") from exc

    def _download_github_zip(self, owner: str, repo: str, branch: str) -> bytes:
        zip_url = f"https://codeload.github.com/{owner}/{repo}/zip/refs/heads/{branch}"
        try:
            with urlopen(self._request(zip_url), timeout=GITHUB_DOWNLOAD_TIMEOUT_SECONDS) as response:
                data = response.read(MAX_UPLOAD_SIZE + 1)
        except HTTPError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="GitHub repository ZIP download failed.",
            ) from exc
        except (URLError, TimeoutError) as exc:
            raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="GitHub ZIP download timed out.") from exc

        if len(data) > MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Repository ZIP exceeds the 25 MB download limit.",
            )
        if not data or not BytesIO(data).getbuffer().nbytes:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="GitHub returned an empty ZIP archive.")
        if not zipfile.is_zipfile(BytesIO(data)):
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="GitHub did not return a valid ZIP archive.")
        return data

    def _request(self, url: str) -> Request:
        return Request(url, headers={"User-Agent": "software-architecture-visualizer"})
