# rhesis/backend/app/schemas/document_upload_response.py
from pydantic import BaseModel

class DocumentUploadResponse(BaseModel):
    path: str
