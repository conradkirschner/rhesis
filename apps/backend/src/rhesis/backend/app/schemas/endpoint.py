from datetime import datetime
from typing import Dict, List, Optional
from rhesis.backend.app.schemas.auth import AuthConfig  # NEW import

from pydantic import UUID4

from rhesis.backend.app.models.enums import (
    EndpointAuthType,
    EndpointConfigSource,
    EndpointEnvironment,
    EndpointProtocol,
    EndpointResponseFormat,
)
from rhesis.backend.app.schemas import Base
from rhesis.backend.app.schemas.openapi import OpenAPISpecModel
from rhesis.backend.app.schemas.json_value import Json
from rhesis.backend.app.schemas.llm_suggestions import LLMSuggestionsModel

# Endpoint schemas
class EndpointBase(Base):
    name: str
    description: Optional[str] = None
    protocol: EndpointProtocol
    url: str
    auth: Optional[AuthConfig] = None
    environment: EndpointEnvironment = EndpointEnvironment.DEVELOPMENT

    # Configuration Source
    config_source: EndpointConfigSource = EndpointConfigSource.MANUAL
    openapi_spec_url: Optional[str] = None
    openapi_spec: Optional[OpenAPISpecModel] = None
    llm_suggestions: Optional[LLMSuggestionsModel] = None

    # Request Structure
    method: Optional[str] = None
    endpoint_path: Optional[str] = None
    request_headers: Optional[Dict[str, str]] = None
    query_params: Optional[dict[str, Json]] = None
    request_body_template: Optional[dict[str, Json]] = None
    input_mappings: Optional[dict[str, Json]] = None

    # Response Handling
    response_format: EndpointResponseFormat = EndpointResponseFormat.JSON
    response_mappings: Optional[Dict[str, str]] = None
    validation_rules: Optional[dict[str, Json]] = None

    project_id: Optional[UUID4] = None
    status_id: Optional[UUID4] = None
    user_id: Optional[UUID4] = None
    organization_id: Optional[UUID4] = None

    auth_type: Optional[EndpointAuthType] = None
    auth_token: Optional[str] = None
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    token_url: Optional[str] = None
    scopes: Optional[List[str]] = None
    audience: Optional[str] = None
    extra_payload: Optional[dict[str, Json]] = None
    last_token: Optional[str] = None
    last_token_expires_at: Optional[datetime] = None


class EndpointCreate(EndpointBase):
    pass


class EndpointUpdate(EndpointBase):
    name: Optional[str] = None
    protocol: Optional[EndpointProtocol] = None
    url: Optional[str] = None


class Endpoint(EndpointBase):
    id: UUID4
