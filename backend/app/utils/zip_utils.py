from __future__ import annotations

import shutil
import tempfile
import zipfile
from io import BytesIO
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from fastapi import HTTPException, UploadFile, status


MAX_UPLOAD_SIZE = 25 * 1024 * 1024


async def validate_zip_upload(file: UploadFile) -> bytes:
    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .zip uploads are supported.",
        )

    data = await file.read()
    if len(data) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Upload exceeds the 25 MB limit.",
        )
    if not zipfile.is_zipfile(BytesIO(data)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is not a valid ZIP archive.",
        )
    return data


@contextmanager
def extracted_zip(data: bytes) -> Iterator[Path]:
    temp_dir = Path(tempfile.mkdtemp(prefix="architecture-visualizer-"))
    try:
        archive_path = temp_dir / "upload.zip"
        archive_path.write_bytes(data)
        extract_dir = temp_dir / "project"
        extract_dir.mkdir()

        with zipfile.ZipFile(archive_path) as archive:
            for member in archive.infolist():
                target = (extract_dir / member.filename).resolve()
                if not str(target).startswith(str(extract_dir.resolve())):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Unsafe ZIP path detected.",
                    )
            archive.extractall(extract_dir)

        yield extract_dir
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
