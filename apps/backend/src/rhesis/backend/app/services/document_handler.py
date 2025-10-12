# rhesis/backend/app/services/document_handler.py
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, TypedDict

from fastapi import UploadFile
from rhesis.backend.app.services.storage_service import StorageService


class DocumentMetadata(TypedDict):
    file_size: int
    file_hash: str
    uploaded_at: str
    original_filename: str
    file_type: str
    path: str          # <— canonical key going forward
    # file_path?: str  # keep only during transition if you must


class DocumentHandler:
    """Handles persistent document storage with cloud/local backend."""

    def __init__(
        self,
        storage_service: Optional[StorageService] = None,
        max_size: int = 5 * 1024 * 1024,  # 5MB default
    ):
        self.storage_service = storage_service or StorageService()
        self.max_size = max_size

    async def save_document(
        self, document: UploadFile, organization_id: str, source_id: str
    ) -> DocumentMetadata:
        if not document.filename or not document.filename.strip():
            raise ValueError("Document has no name")

        content = await document.read()
        if len(content) > self.max_size:
            raise ValueError(f"Document size exceeds limit of {self.max_size} bytes")
        if len(content) == 0:
            raise ValueError("Document is empty")

        file_path = self.storage_service.get_file_path(
            organization_id, source_id, document.filename
        )
        await self.storage_service.save_file(content, file_path)

        return self._extract_metadata(content, document.filename, file_path)

    def _extract_metadata(self, content: bytes, filename: str, file_path: str) -> DocumentMetadata:
        return {
            "file_size": len(content),
            "file_hash": self._calculate_file_hash(content),
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "original_filename": filename,
            "file_type": self._get_mime_type(filename),
            "path": file_path,  # <— use canonical `path`
        }

    def _calculate_file_hash(self, content: bytes) -> str:
        import hashlib
        return hashlib.sha256(content).hexdigest()

    def _get_mime_type(self, filename: str) -> str:
        ext = Path(filename).suffix.lower()
        mime_types = {
            ".pdf": "application/pdf",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".txt": "text/plain",
            ".md": "text/markdown",
            ".html": "text/html",
            ".csv": "text/csv",
            ".json": "application/json",
            ".xml": "application/xml",
            ".zip": "application/zip",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".svg": "image/svg+xml",
            ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
        return mime_types.get(ext, "application/octet-stream")
