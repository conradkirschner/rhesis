from typing import List, Optional, Literal, Union, Annotated, Dict
from pydantic import BaseModel, ConfigDict, Field
from rhesis.backend.app.schemas.json_value import Json

class _AuthBase(BaseModel):
    type: str
    model_config = ConfigDict(extra="forbid")  # keep strict; relax if you must

class NoneAuth(_AuthBase):
    type: Literal["none"]

class BearerAuth(_AuthBase):
    type: Literal["bearer"]
    # optional, you also have auth_token column; keep for completeness
    token: Optional[str] = None

class ApiKeyAuth(_AuthBase):
    type: Literal["api_key"]
    location: Literal["header", "query", "cookie"] = "header"
    name: str
    value: str

class BasicAuth(_AuthBase):
    type: Literal["basic"]
    username: str
    password: str

class OAuth2ClientCredentials(_AuthBase):
    type: Literal["oauth2_client_credentials"]
    token_url: str
    client_id: str
    client_secret: str
    scopes: List[str] = []
    audience: Optional[str] = None
    extra_payload: Optional[dict[str, Json]] = None

AuthConfig = Annotated[
    Union[NoneAuth, BearerAuth, ApiKeyAuth, BasicAuth, OAuth2ClientCredentials],
    Field(discriminator="type"),
]
