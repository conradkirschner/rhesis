from typing import Dict, List, Union, Optional
from pydantic import BaseModel, ConfigDict
from rhesis.backend.app.schemas.json_value import Json


class OpenAPISpecModel(BaseModel):
    # Common OAS fields (both 3.x and 2.0-ish), but allow extras
    openapi: Optional[str] = None            # e.g. "3.0.3"
    swagger: Optional[str] = None            # for OAS 2.0
    info: Optional[dict[str, Json]] = None
    paths: Optional[Dict[str, Dict[str, Json]]] = None
    components: Optional[dict[str, Json]] = None
    definitions: Optional[dict[str, Json]] = None  # OAS 2.0
    servers: Optional[List[Dict[str, Json]]] = None
    security: Optional[List[Dict[str, List[str]]]] = None
    tags: Optional[List[Dict[str, Json]]] = None
    externalDocs: Optional[dict[str, Json]] = None

    model_config = ConfigDict(extra="forbid")  # keep vendor extensions like x-*

