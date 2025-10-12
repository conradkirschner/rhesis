from typing import Optional
from pydantic import BaseModel, model_validator, field_validator

class Document(BaseModel):
    name: str
    description: str
    path: Optional[str] = None
    content: Optional[str] = None

    @field_validator("path")
    @classmethod
    def strip_path(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        s = v.strip()
        if not s:
            raise ValueError("path cannot be empty")
        return s

    @model_validator(mode="after")
    def validate_document(self):
        # Require at least one of path or content
        if not self.path and not self.content:
            raise ValueError("Either path or content must be provided")
        return self