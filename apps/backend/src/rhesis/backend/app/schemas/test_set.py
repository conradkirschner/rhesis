from typing import Dict, List, Optional, Literal
from typing_extensions import TypedDict
from pydantic import UUID4, BaseModel, ConfigDict, Field, field_validator

from rhesis.backend.app.schemas import Base
from rhesis.backend.app.schemas.tag import Tag
from rhesis.backend.app.schemas.json_value import Json


class SourceItem(TypedDict, total=False):
    name: Optional[str]
    document: Optional[str]
    description: Optional[str]


# ------- Attributes models -------

class TestSetLabelBuckets(BaseModel):
    """Human-readable label buckets (NOT UUIDs)."""
    categories: Optional[List[str]] = None
    topics: Optional[List[str]] = None
    behaviors: Optional[List[str]] = None
    sources: Optional[List[SourceItem]] = None


class TestSetAttributes(BaseModel):
    """Structured attributes as seen in the payload."""
    categories: Optional[List[UUID4]] = None
    topics: Optional[List[UUID4]] = None
    behaviors: Optional[List[UUID4]] = None
    use_cases: Optional[List[UUID4]] = None
    sources: Optional[List[SourceItem]] = None
    total_tests: Optional[int] = None
    # Label-like metadata (strings such as "Jailbreak", "Harmless", ...)
    metadata: Optional[TestSetLabelBuckets] = None


# ------- TestSet schemas -------

class TestSetBase(Base):
    name: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    slug: Optional[str] = None
    status_id: Optional[UUID4] = None
    tags: List[Tag] = Field(default_factory=list)  # avoid mutable default
    license_type_id: Optional[UUID4] = None

    # IMPORTANT: attributes is a single structured object, not dict[str, ...]
    attributes: Optional[TestSetAttributes] = None

    user_id: Optional[UUID4] = None
    owner_id: Optional[UUID4] = None
    assignee_id: Optional[UUID4] = None
    priority: int = 0
    is_published: bool = False
    organization_id: Optional[UUID4] = None
    visibility: Optional[str] = None


class TestSetCreate(TestSetBase):
    pass


class TestSetUpdate(TestSetBase):
    # make name optional on update
    name: Optional[str] = None


class TestSet(TestSetBase):
    pass


# ------- Bulk creation models -------

class TestPrompt(BaseModel):
    content: str
    language_code: str = "en"
    demographic: Optional[str] = None
    dimension: Optional[str] = None
    expected_response: Optional[str] = None


class TestData(BaseModel):
    prompt: TestPrompt
    behavior: str
    category: str
    topic: str
    test_configuration: Optional[Dict[str, Json]] = None
    assignee_id: Optional[UUID4] = None
    owner_id: Optional[UUID4] = None
    status: Optional[str] = None
    priority: Optional[int] = None
    metadata: Dict[str, Json] = Field(default_factory=dict)

    @field_validator("assignee_id", "owner_id", mode="before")
    @classmethod
    def validate_uuid(cls, v):
        if v is None:
            return None
        if isinstance(v, str) and v.strip() == "":
            return None
        return v


class TestSetBulkCreate(BaseModel):
    name: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    owner_id: Optional[UUID4] = None
    assignee_id: Optional[UUID4] = None
    priority: Optional[int] = None
    tests: List[TestData]
    metadata: Optional[Dict[str, Json]] = None

    @field_validator("owner_id", "assignee_id", mode="before")
    @classmethod
    def validate_uuid_fields(cls, v):
        if v is None:
            return None
        if isinstance(v, str) and v.strip() == "":
            return None
        return v


class TestSetBulkResponse(BaseModel):
    id: UUID4
    name: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    status_id: Optional[UUID4] = None
    license_type_id: Optional[UUID4] = None
    user_id: Optional[UUID4] = None
    organization_id: Optional[UUID4] = None
    visibility: Optional[str] = None
    attributes: Optional[Dict[str, Json]] = None  # bulk payload stays generic
    model_config = ConfigDict(from_attributes=True)


class TestSetBulkAssociateRequest(BaseModel):
    test_ids: List[UUID4]


class TestSetBulkAssociateResponse(BaseModel):
    success: bool
    total_tests: int
    message: str
    metadata: Dict[str, Json] = Field(
        default_factory=lambda: {
            "new_associations": None,
            "existing_associations": None,
            "invalid_associations": None,
            "existing_test_ids": None,
            "invalid_test_ids": None,
        }
    )
    model_config = ConfigDict(from_attributes=True)


class TestSetBulkDisassociateRequest(BaseModel):
    test_ids: List[UUID4]


class TestSetBulkDisassociateResponse(BaseModel):
    success: bool
    total_tests: int
    removed_associations: int
    message: str


class TestSetExecutionRequest(BaseModel):
    """Request model for test set execution."""
    execution_mode: Literal["Parallel", "Sequential"] = "Parallel"
